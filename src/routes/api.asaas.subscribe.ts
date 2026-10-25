import { createFileRoute } from "@tanstack/react-router";
import { privateNoStoreJson } from "@/lib/security.server";
import { z } from "zod";
import {
  asaasFetch,
  cancelAsaasSubscription,
  createAsaasSubscription,
  findOrCreateAsaasCustomer,
  getAsaasAdminSupabase,
  getAsaasPixQrCode,
  isAsaasConfigured,
} from "@/lib/asaas.server";
import { checkRateLimit, getClientIp, createRateLimitResponse } from "@/lib/security.server";

const subscribeSchema = z.object({
  planId: z.enum(["pro", "business"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  customerName: z.string().min(2, "Nome é obrigatório"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().min(10, "Telefone inválido"),
  customerCpfCnpj: z.string().min(11, "CPF ou CNPJ inválido"),
  customerPostalCode: z.string().min(8, "CEP é obrigatório"),
  customerAddressNumber: z.string().min(1, "Número do endereço é obrigatório"),
});

const planPrices = {
  pro: { monthly: 39.9, yearly: 478.8 },
  business: { monthly: 79.9, yearly: 958.8 },
} as const;

const dateAfterDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const Route = createFileRoute("/api/asaas/subscribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ipLimit = checkRateLimit(`subscribe-ip:${getClientIp(request)}`, 8, 60_000);
        if (!ipLimit.allowed) return createRateLimitResponse(ipLimit.resetSeconds);

        if (!isAsaasConfigured()) {
          return privateNoStoreJson(
            { error: "O serviço de pagamentos não está disponível no momento." },
            { status: 503 },
          );
        }

        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return privateNoStoreJson(
            { error: "Entre na sua conta para contratar um plano." },
            { status: 401 },
          );
        }

        const supabase = getAsaasAdminSupabase();
        const token = authorization.slice("Bearer ".length);
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (authError || !authData.user) {
          return privateNoStoreJson(
            { error: "Sua sessão expirou. Entre novamente." },
            { status: 401 },
          );
        }

        let input: z.infer<typeof subscribeSchema>;
        try {
          input = subscribeSchema.parse(await request.json());
        } catch (error) {
          const message =
            error instanceof z.ZodError ? error.errors[0]?.message : "Dados inválidos.";
          return privateNoStoreJson({ error: message }, { status: 400 });
        }

        const cleanCpfCnpj = input.customerCpfCnpj.replace(/\D/g, "");
        const cleanPhone = input.customerPhone.replace(/\D/g, "");
        const cleanPostalCode = input.customerPostalCode.replace(/\D/g, "");
        if (
          ![11, 14].includes(cleanCpfCnpj.length) ||
          cleanPhone.length < 10 ||
          cleanPostalCode.length !== 8
        ) {
          return privateNoStoreJson(
            { error: "Confira CPF/CNPJ, telefone e CEP." },
            { status: 400 },
          );
        }

        const { data: business, error: businessError } = await supabase
          .from("localhub_businesses")
          .select("id, name, owner_id, phone, onboarding_details")
          .eq("owner_id", authData.user.id)
          .maybeSingle();
        if (businessError || !business) {
          return privateNoStoreJson(
            { error: "Crie seu espaço na ELLO antes de contratar um plano." },
            { status: 409 },
          );
        }

        const { data: planState, error: stateError } = await supabase
          .from("localhub_plan_subscriptions")
          .select("*")
          .eq("business_id", business.id)
          .maybeSingle();
        if (stateError) {
          return privateNoStoreJson(
            { error: "Não foi possível verificar o plano atual. Tente novamente." },
            { status: 503 },
          );
        }
        if (planState?.status === "pending") {
          return privateNoStoreJson(
            {
              error:
                "Já existe um pagamento de plano aguardando confirmação. Conclua ou aguarde o vencimento antes de iniciar outra troca.",
            },
            { status: 409 },
          );
        }

        const { data: ownedOpenPayments, error: paymentsError } = await supabase
          .from("localhub_asaas_plan_payments")
          .select("asaas_payment_id")
          .eq("business_id", business.id)
          .in("status", ["pending", "overdue"]);
        if (paymentsError)
          return privateNoStoreJson(
            { error: "Não foi possível conferir cobranças anteriores." },
            { status: 503 },
          );

        let previousSubscriptionId = planState?.asaas_subscription_id as string | null | undefined;
        if (!previousSubscriptionId && ownedOpenPayments?.length) {
          for (const openPayment of ownedOpenPayments) {
            try {
              const payment = await asaasFetch<{
                id: string;
                subscription?: string;
                status: string;
              }>(`payments/${encodeURIComponent(openPayment.asaas_payment_id)}`);
              if (payment.subscription) previousSubscriptionId = payment.subscription;
              if (
                !previousSubscriptionId &&
                ["PENDING", "OVERDUE", "CONFIRMED"].includes(payment.status)
              ) {
                await asaasFetch(`payments/${encodeURIComponent(payment.id)}`, {
                  method: "DELETE",
                });
              }
            } catch (error) {
              console.error(
                "Não foi possível reconciliar uma cobrança anterior de assinatura.",
                error,
              );
              return privateNoStoreJson(
                {
                  error:
                    "Não foi possível reconciliar uma cobrança anterior. A troca foi interrompida para evitar cobranças duplicadas.",
                },
                { status: 409 },
              );
            }
          }
        }

        const previousPlan = planState?.plan as string | undefined;
        const upgrades = { free: 0, pro: 1, business: 2 } as const;
        const currentPlan =
          previousPlan === "pro" || previousPlan === "business" ? previousPlan : "free";
        if (
          currentPlan === input.planId &&
          planState?.status === "active" &&
          planState.billing_cycle === input.billingCycle
        ) {
          return privateNoStoreJson(
            { error: "Este plano já está ativo para o período selecionado." },
            { status: 409 },
          );
        }
        if (currentPlan === "business" && input.planId === "pro") {
          return privateNoStoreJson(
            {
              error:
                "Para mudar para o Pro, cancele o Business atual e aguarde a confirmação do cancelamento.",
            },
            { status: 409 },
          );
        }

        if (planState?.status === "canceled" && previousSubscriptionId) {
          return privateNoStoreJson(
            {
              error:
                "O cancelamento anterior ainda está em reconciliação. Entre em contato com o suporte antes de contratar novamente.",
            },
            { status: 409 },
          );
        }

        if (currentPlan !== "free" && !previousSubscriptionId && !ownedOpenPayments?.length) {
          return privateNoStoreJson(
            {
              error:
                "Não encontramos a assinatura atual para encerrá-la com segurança. Entre em contato com o suporte antes de trocar de plano.",
            },
            { status: 409 },
          );
        }

        const cleanName = input.customerName.trim();
        const reservation = await supabase.rpc("localhub_reserve_plan_change", {
          p_business_id: business.id,
          p_plan: input.planId,
          p_billing_cycle: input.billingCycle,
        });
        if (reservation.error || !reservation.data?.[0]?.acquired) {
          return privateNoStoreJson(
            { error: "Já existe uma troca de plano em andamento para este negócio." },
            { status: 409 },
          );
        }
        previousSubscriptionId = reservation.data[0].prior_subscription_id;
        let previousSubscriptionCanceled = false;
        try {
          const customerId =
            planState?.asaas_customer_id ||
            (await findOrCreateAsaasCustomer({
              name: cleanName,
              cpfCnpj: cleanCpfCnpj,
              phone: cleanPhone,
              email: input.customerEmail.trim(),
              postalCode: cleanPostalCode,
              addressNumber: input.customerAddressNumber.trim(),
            }));
          if (previousSubscriptionId) {
            await cancelAsaasSubscription(previousSubscriptionId);
            previousSubscriptionCanceled = true;
            const { error: closePriorPlanError } = await supabase
              .from("localhub_plan_subscriptions")
              .update({
                asaas_subscription_id: null,
                plan: "free",
                status: "free",
                billing_cycle: null,
                updated_at: new Date().toISOString(),
              })
              .eq("business_id", business.id);
            if (closePriorPlanError)
              throw new Error(
                "O plano anterior foi encerrado, mas não foi possível confirmar o estado local. Contate o suporte antes de uma nova cobrança.",
              );
            previousSubscriptionId = null;
          }
          const regularAmount = planPrices[input.planId][input.billingCycle];
          const amount = regularAmount;
          const cycle = input.billingCycle === "yearly" ? "YEARLY" : "MONTHLY";
          const subscription = await createAsaasSubscription({
            customerId,
            value: regularAmount,
            cycle,
            nextDueDate: dateAfterDays(1),
            description: `Assinatura ELLO ${input.planId === "pro" ? "Pro" : "Business"} - ${business.name}`,
            externalReference: `ello_${business.id}_${input.planId}_${crypto.randomUUID()}`,
          });

          let payment: {
            id: string;
            status: string;
            value: number;
            invoiceUrl?: string;
            bankSlipUrl?: string;
          };
          let pixData: { encodedImage: string; payload: string; expirationDate: string };
          try {
            const generatedPayments = await asaasFetch<{
              data: Array<{
                id: string;
                status: string;
                value: number;
                invoiceUrl?: string;
                bankSlipUrl?: string;
              }>;
            }>(`subscriptions/${encodeURIComponent(subscription.id)}/payments?limit=1`);
            const generatedPayment = generatedPayments.data?.[0];
            if (!generatedPayment?.id)
              throw new Error(
                "O pagamento inicial ainda não foi gerado. Tente novamente em instantes.",
              );
            payment = generatedPayment;
            pixData = await getAsaasPixQrCode(payment.id);
          } catch (error) {
            await cancelAsaasSubscription(subscription.id).catch((cancelError) => {
              console.error(
                "Falha ao reverter assinatura após erro no Pix; intervenção necessária.",
                cancelError,
              );
            });
            throw error;
          }

          const { error: paymentInsertError } = await supabase
            .from("localhub_asaas_plan_payments")
            .insert({
              asaas_payment_id: payment.id,
              asaas_subscription_id: subscription.id,
              business_id: business.id,
              requested_plan: input.planId,
              billing_cycle: input.billingCycle,
              amount_cents: Math.round(amount * 100),
            });
          if (paymentInsertError) {
            await asaasFetch(`payments/${encodeURIComponent(payment.id)}`, {
              method: "DELETE",
            }).catch(() => {});
            await cancelAsaasSubscription(subscription.id).catch(() => {});
            throw new Error(
              "Não foi possível registrar a assinatura com segurança. A tentativa foi cancelada.",
            );
          }

          const { error: pendingStateError } = await supabase
            .from("localhub_plan_subscriptions")
            .upsert(
              {
                business_id: business.id,
                asaas_subscription_id: subscription.id,
                asaas_customer_id: customerId,
                plan: "free",
                status: "pending",
                pending_plan: input.planId,
                pending_billing_cycle: input.billingCycle,
                pending_payment_id: payment.id,
                pending_subscription_id: subscription.id,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "business_id" },
            );
          if (pendingStateError) {
            await asaasFetch(`payments/${encodeURIComponent(payment.id)}`, {
              method: "DELETE",
            }).catch(() => {});
            await cancelAsaasSubscription(subscription.id).catch(() => {});
            throw new Error(
              "Não foi possível registrar o plano com segurança. A tentativa foi cancelada.",
            );
          }

          return privateNoStoreJson({
            success: true,
            paymentId: payment.id,
            status: payment.status,
            value: payment.value,
            invoiceUrl: payment.invoiceUrl,
            bankSlipUrl: payment.bankSlipUrl,
            pix: pixData,
          });
        } catch (error) {
          await supabase
            .from("localhub_plan_subscriptions")
            .update({
              asaas_subscription_id: previousSubscriptionCanceled
                ? null
                : (previousSubscriptionId ?? null),
              plan: previousSubscriptionCanceled ? "free" : currentPlan,
              billing_cycle: previousSubscriptionCanceled
                ? null
                : (planState?.billing_cycle ?? null),
              status: previousSubscriptionCanceled
                ? "free"
                : currentPlan === "free"
                  ? "free"
                  : "active",
              pending_plan: null,
              pending_billing_cycle: null,
              pending_payment_id: null,
              pending_subscription_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq("business_id", business.id);
          console.error("Falha ao iniciar assinatura ELLO.", error);
          const message =
            error instanceof Error ? error.message : "Não foi possível iniciar o plano.";
          return privateNoStoreJson({ error: message }, { status: 502 });
        }
      },
    },
  },
});
