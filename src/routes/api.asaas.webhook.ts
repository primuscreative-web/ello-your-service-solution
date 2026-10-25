import { createFileRoute } from "@tanstack/react-router";
import {
  cancelAsaasSubscription,
  getAsaasAdminSupabase,
  getAsaasReceivedSplit,
  verifyAsaasWebhookToken,
} from "@/lib/asaas.server";
import { sendWhatsAppMessage } from "@/lib/whatsapp.server";

type AsaasWebhookPayload = {
  event:
    | "PAYMENT_CREATED"
    | "PAYMENT_UPDATED"
    | "PAYMENT_CONFIRMED"
    | "PAYMENT_RECEIVED"
    | "PAYMENT_OVERDUE"
    | "PAYMENT_REFUNDED"
    | "PAYMENT_REVERSED"
    | "PAYMENT_DELETED"
    | "PAYMENT_SPLIT_DONE"
    | "TRANSFER_CREATED"
    | "TRANSFER_PENDING"
    | "TRANSFER_IN_BANK_PROCESSING"
    | "TRANSFER_BLOCKED"
    | "TRANSFER_DONE"
    | "TRANSFER_FAILED"
    | "TRANSFER_CANCELLED";
  payment?: {
    id: string;
    customer: string;
    value: number;
    netValue?: number;
    billingType: string;
    status: string;
    externalReference?: string;
    subscription?: string;
    confirmedDate?: string;
    paymentDate?: string;
    additionalInfo?: { splitId?: string };
  };
  additionalInfo?: { splitId?: string };
  transfer?: {
    id: string;
    value: number;
    netValue?: number;
    status: string;
    transferFee?: number;
    effectiveDate?: string;
    failReason?: string;
  };
};

export const Route = createFileRoute("/api/asaas/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const receivedToken = request.headers.get("asaas-access-token");
        if (!verifyAsaasWebhookToken(receivedToken)) {
          return Response.json({ error: "Token de webhook Asaas inválido." }, { status: 401 });
        }

        let body: AsaasWebhookPayload;
        try {
          body = (await request.json()) as AsaasWebhookPayload;
        } catch {
          return Response.json({ error: "Payload inválido." }, { status: 400 });
        }

        if (!body.event) {
          return Response.json({ error: "Evento não especificado." }, { status: 400 });
        }

        if (!body.payment?.id && !body.transfer?.id) {
          return Response.json(
            { error: "Evento sem identificador de pagamento ou transferência." },
            { status: 400 },
          );
        }

        const supabase = getAsaasAdminSupabase();
        const splitId = body.payment?.additionalInfo?.splitId || body.additionalInfo?.splitId;
        const entityId =
          body.event === "PAYMENT_SPLIT_DONE" && splitId && body.payment?.id
            ? `${body.payment.id}_${splitId}`
            : (body.payment?.id ?? body.transfer?.id ?? "unknown");
        const idempotencyId = `${body.event}_${entityId}`;

        // Reserva o evento antes dos efeitos para evitar processamentos concorrentes.
        const { error: claimError } = await supabase
          .from("localhub_asaas_webhook_events")
          .insert({ event_id: idempotencyId, event_type: body.event });
        if (claimError?.code === "23505") {
          return Response.json({ received: true, duplicate: true });
        }
        if (claimError) {
          console.error("Não foi possível reservar evento Asaas para processamento.", claimError);
          return Response.json(
            { error: "Evento temporariamente indisponível para processamento." },
            { status: 503 },
          );
        }

        try {
          // Trata eventos de transferência / saque
          if (body.transfer?.id) {
            const transferId = body.transfer.id;
            if (body.event === "TRANSFER_DONE") {
              await supabase
                .from("localhub_wallet_withdrawals")
                .update({
                  status: "completed",
                  completed_at: new Date().toISOString(),
                })
                .eq("provider_transfer_id", transferId);

              await supabase
                .from("localhub_wallet_transactions")
                .update({ status: "completed" })
                .eq("provider_transaction_id", transferId);
            } else if (body.event === "TRANSFER_FAILED" || body.event === "TRANSFER_CANCELLED") {
              await supabase
                .from("localhub_wallet_withdrawals")
                .update({
                  status: "failed",
                  failure_reason: body.transfer.failReason || "Falha na transferência bancária.",
                })
                .eq("provider_transfer_id", transferId);

              await supabase
                .from("localhub_wallet_transactions")
                .update({ status: "failed" })
                .eq("provider_transaction_id", transferId);
            }
          }

          // Trata eventos de pagamento
          if (body.payment?.id) {
            const paymentId = body.payment.id;
            const orderId = body.payment.externalReference;

            if (body.payment.subscription && body.event === "PAYMENT_CREATED") {
              const { data: recurringPlan, error: recurringPlanError } = await supabase
                .from("localhub_plan_subscriptions")
                .select("business_id, plan, billing_cycle, asaas_subscription_id, status")
                .eq("asaas_subscription_id", body.payment.subscription)
                .maybeSingle();
              if (recurringPlanError) throw recurringPlanError;
              if (recurringPlan?.status === "active") {
                await supabase.from("localhub_asaas_plan_payments").upsert(
                  {
                    asaas_payment_id: paymentId,
                    asaas_subscription_id: body.payment.subscription,
                    business_id: recurringPlan.business_id,
                    requested_plan: recurringPlan.plan,
                    billing_cycle: recurringPlan.billing_cycle,
                    amount_cents: Math.round(body.payment.value * 100),
                    status: "pending",
                  },
                  { onConflict: "asaas_payment_id", ignoreDuplicates: true },
                );
              }
            }

            const orderPaymentQuery = supabase
              .from("localhub_asaas_order_payments")
              .select("order_id, business_id, status, amount_cents, asaas_payment_id")
              .eq("asaas_payment_id", paymentId);

            let { data: orderPayment } = await orderPaymentQuery.maybeSingle();

            if (!orderPayment && orderId) {
              const fallbackQuery = await supabase
                .from("localhub_asaas_order_payments")
                .select("order_id, business_id, status, amount_cents, asaas_payment_id")
                .eq("order_id", orderId)
                .maybeSingle();
              orderPayment = fallbackQuery.data;
            }

            // Trata planos ELLO com referência persistida no servidor.
            const { data: planPayment } = await supabase
              .from("localhub_asaas_plan_payments")
              .select("business_id, requested_plan, billing_cycle, asaas_subscription_id, status")
              .eq("asaas_payment_id", paymentId)
              .maybeSingle();

            const isOrderReference = Boolean(
              orderId &&
              /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
                orderId,
              ),
            );
            if (
              !orderPayment &&
              isOrderReference &&
              ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_SPLIT_DONE"].includes(body.event)
            ) {
              throw new Error(
                "Pagamento de pedido ainda não foi persistido; o webhook será reenviado.",
              );
            }
            if (orderId?.startsWith("ello_") && !planPayment) {
              throw new Error(
                "Pagamento de assinatura ainda não foi persistido; o webhook será reenviado.",
              );
            }

            if (planPayment) {
              const paid = body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED";
              const failed = [
                "PAYMENT_OVERDUE",
                "PAYMENT_REFUNDED",
                "PAYMENT_REVERSED",
                "PAYMENT_DELETED",
              ].includes(body.event);
              if (paid) {
                const { data: state } = await supabase
                  .from("localhub_plan_subscriptions")
                  .select(
                    "pending_payment_id, pending_plan, pending_billing_cycle, pending_subscription_id",
                  )
                  .eq("business_id", planPayment.business_id)
                  .maybeSingle();
                if (
                  state?.pending_payment_id === paymentId &&
                  state.pending_subscription_id === planPayment.asaas_subscription_id
                ) {
                  const { error: planActivationError } = await supabase
                    .from("localhub_plan_subscriptions")
                    .update({
                      asaas_subscription_id: planPayment.asaas_subscription_id,
                      plan: planPayment.requested_plan,
                      billing_cycle: planPayment.billing_cycle,
                      status: "active",
                      pending_plan: null,
                      pending_billing_cycle: null,
                      pending_payment_id: null,
                      pending_subscription_id: null,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("business_id", planPayment.business_id);
                  if (planActivationError) throw planActivationError;
                  const { data: biz } = await supabase
                    .from("localhub_businesses")
                    .select("onboarding_details, phone, name")
                    .eq("id", planPayment.business_id)
                    .maybeSingle();
                  if (biz) {
                    const { error: businessPlanError } = await supabase
                      .from("localhub_businesses")
                      .update({
                        onboarding_details: {
                          ...(biz.onboarding_details || {}),
                          plan: planPayment.requested_plan,
                          planBillingCycle: planPayment.billing_cycle,
                          planActivatedAt: new Date().toISOString(),
                        },
                      })
                      .eq("id", planPayment.business_id);
                    if (businessPlanError) throw businessPlanError;
                    if (biz.phone)
                      void sendWhatsAppMessage({
                        phone: biz.phone,
                        text: `Parabéns, *${biz.name}*! Seu plano ${planPayment.requested_plan === "pro" ? "Pro" : "Business"} na ELLO foi ativado. Acesse https://ello.app.br/studio`,
                      }).catch(() => {});
                  }
                }
                const { error: planPaymentUpdateError } = await supabase
                  .from("localhub_asaas_plan_payments")
                  .update({
                    status: body.event === "PAYMENT_RECEIVED" ? "received" : "confirmed",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("asaas_payment_id", paymentId);
                if (planPaymentUpdateError) throw planPaymentUpdateError;
              } else if (failed) {
                const { error: failedPlanPaymentUpdateError } = await supabase
                  .from("localhub_asaas_plan_payments")
                  .update({
                    status:
                      body.event === "PAYMENT_OVERDUE"
                        ? "overdue"
                        : body.event === "PAYMENT_DELETED"
                          ? "cancelled"
                          : "refunded",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("asaas_payment_id", paymentId);
                if (failedPlanPaymentUpdateError) throw failedPlanPaymentUpdateError;
                const { data: state } = await supabase
                  .from("localhub_plan_subscriptions")
                  .select(
                    "pending_payment_id, pending_subscription_id, asaas_subscription_id, status",
                  )
                  .eq("business_id", planPayment.business_id)
                  .maybeSingle();
                if (
                  state?.pending_payment_id === paymentId ||
                  state?.pending_subscription_id === planPayment.asaas_subscription_id
                ) {
                  const pendingSubscription = state.pending_subscription_id;
                  if (pendingSubscription) {
                    await cancelAsaasSubscription(pendingSubscription).catch((cancelError) => {
                      console.error(
                        "Falha ao encerrar assinatura pendente após cobrança não paga.",
                        cancelError,
                      );
                    });
                  }
                  await supabase
                    .from("localhub_plan_subscriptions")
                    .update({
                      asaas_subscription_id: null,
                      status: "free",
                      plan: "free",
                      pending_plan: null,
                      pending_billing_cycle: null,
                      pending_payment_id: null,
                      pending_subscription_id: null,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("business_id", planPayment.business_id);
                  const { data: failedBusiness } = await supabase
                    .from("localhub_businesses")
                    .select("onboarding_details")
                    .eq("id", planPayment.business_id)
                    .maybeSingle();
                  if (failedBusiness)
                    await supabase
                      .from("localhub_businesses")
                      .update({
                        onboarding_details: {
                          ...(failedBusiness.onboarding_details ?? {}),
                          plan: "free",
                        },
                      })
                      .eq("id", planPayment.business_id);
                } else if (
                  state?.status === "active" &&
                  state.asaas_subscription_id === planPayment.asaas_subscription_id
                ) {
                  if (planPayment.asaas_subscription_id) {
                    await cancelAsaasSubscription(planPayment.asaas_subscription_id).catch(
                      (cancelError) => {
                        console.error(
                          "Falha ao encerrar recorrência após cobrança não paga.",
                          cancelError,
                        );
                      },
                    );
                  }
                  await supabase
                    .from("localhub_plan_subscriptions")
                    .update({
                      asaas_subscription_id: null,
                      plan: "free",
                      status: "past_due",
                      billing_cycle: null,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("business_id", planPayment.business_id);
                  const { data: unpaidBusiness } = await supabase
                    .from("localhub_businesses")
                    .select("onboarding_details")
                    .eq("id", planPayment.business_id)
                    .maybeSingle();
                  if (unpaidBusiness)
                    await supabase
                      .from("localhub_businesses")
                      .update({
                        onboarding_details: {
                          ...(unpaidBusiness.onboarding_details ?? {}),
                          plan: "free",
                        },
                      })
                      .eq("id", planPayment.business_id);
                }
              }
            }

            // Compatibilidade: somente referências legadas já registradas.
            if (orderId && orderId.startsWith("sub_")) {
              if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
                const parts = orderId.split("_");
                const subPlanId = parts[1];
                const subCycle = parts[2];
                const subBizId = parts[3];

                if (subBizId && subBizId !== "new") {
                  const { data: biz } = await supabase
                    .from("localhub_businesses")
                    .select("onboarding_details, phone, name")
                    .eq("id", subBizId)
                    .maybeSingle();

                  if (biz) {
                    await supabase
                      .from("localhub_businesses")
                      .update({
                        onboarding_details: {
                          ...(biz.onboarding_details || {}),
                          plan: subPlanId,
                          planBillingCycle: subCycle,
                          planActivatedAt: new Date().toISOString(),
                          lastPaymentId: paymentId,
                        },
                      })
                      .eq("id", subBizId);

                    if (biz.phone) {
                      void sendWhatsAppMessage({
                        phone: biz.phone,
                        text:
                          `Parabéns, *${biz.name}*! 🎉\n\n` +
                          `Sua assinatura do *Plano ${subPlanId === "pro" ? "Pro" : "Business"}* na ELLO foi confirmada com sucesso via Asaas!\n\n` +
                          `Todos os recursos de equipe, relatórios e taxa zero estão 100% liberados no seu painel:\n` +
                          `👉 https://ello.app.br/studio`,
                      }).catch(() => {});
                    }
                  }
                }
              }
            }

            if (orderPayment) {
              const targetOrderId = orderPayment.order_id;
              const businessId = orderPayment.business_id;

              // Confirmação de pagamento (Pix ou Cartão)
              if (body.event === "PAYMENT_RECEIVED" || body.event === "PAYMENT_CONFIRMED") {
                const { error: orderPaymentUpdateError } = await supabase
                  .from("localhub_asaas_order_payments")
                  .update({
                    status: body.event === "PAYMENT_RECEIVED" ? "received" : "confirmed",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("order_id", targetOrderId);
                if (orderPaymentUpdateError) throw orderPaymentUpdateError;

                const { data: updatedOrder, error: updatedOrderError } = await supabase
                  .from("localhub_orders")
                  .update({
                    payment_status: "paid",
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", targetOrderId)
                  .select(
                    "order_number, customer_phone, customer_name, total, public_tracking_token",
                  )
                  .single();
                if (updatedOrderError) throw updatedOrderError;

                // Notifica o cliente que o pagamento online foi confirmado com sucesso
                if (updatedOrder?.customer_phone) {
                  const trackingUrl = updatedOrder.public_tracking_token
                    ? `https://ello.app.br/pedido/${updatedOrder.public_tracking_token}`
                    : "https://ello.app.br";
                  void sendWhatsAppMessage({
                    phone: updatedOrder.customer_phone,
                    text:
                      `Olá, *${(updatedOrder.customer_name || "Cliente").trim()}*! 🎉\n\n` +
                      `Seu pagamento de *R$ ${Number(updatedOrder.total || 0)
                        .toFixed(2)
                        .replace(
                          ".",
                          ",",
                        )}* para o *Pedido #${updatedOrder.order_number}* foi *CONFIRMADO*!\n\n` +
                      `O estabelecimento já foi notificado e está cuidando do seu pedido.\n` +
                      `📱 Acompanhe em tempo real: ${trackingUrl}`,
                  }).catch(() => {});
                }
              }

              if (body.event === "PAYMENT_SPLIT_DONE") {
                const receivedSplitId = splitId;
                if (!receivedSplitId || orderPayment.asaas_payment_id !== paymentId) {
                  throw new Error("Split sem referência inequívoca ao pagamento persistido.");
                }

                const { data: account, error: accountError } = await supabase
                  .from("localhub_payment_accounts")
                  .select(
                    "provider, sales_enabled, onboarding_status, wallet_id, subaccount_api_key",
                  )
                  .eq("business_id", businessId)
                  .maybeSingle();
                if (
                  accountError ||
                  account?.provider !== "asaas" ||
                  !account.sales_enabled ||
                  account.onboarding_status !== "active" ||
                  !account.wallet_id ||
                  !account.subaccount_api_key
                ) {
                  throw new Error(
                    "Conta de recebimento não está validada para conciliação de split.",
                  );
                }

                const settledSplit = await getAsaasReceivedSplit(
                  receivedSplitId,
                  account.subaccount_api_key,
                );
                const settledAmountCents = Math.round(Number(settledSplit.totalValue) * 100);
                if (
                  settledSplit.id !== receivedSplitId ||
                  settledSplit.payment?.id !== paymentId ||
                  settledSplit.payment?.externalReference !== targetOrderId ||
                  settledSplit.walletId !== account.wallet_id ||
                  settledSplit.status !== "DONE" ||
                  !Number.isSafeInteger(settledAmountCents) ||
                  settledAmountCents <= 0 ||
                  settledAmountCents > orderPayment.amount_cents
                ) {
                  throw new Error("Split não corresponde ao negócio, pedido ou valor registrado.");
                }

                const { data: settledWalletRows, error: settleError } = await supabase
                  .from("localhub_wallet_transactions")
                  .update({
                    status: "available",
                    amount_cents: settledAmountCents,
                    available_at: new Date().toISOString(),
                  })
                  .eq("provider_transaction_id", paymentId)
                  .eq("business_id", businessId)
                  .eq("status", "pending")
                  .select("id");
                if (settleError) throw settleError;
                if (!settledWalletRows?.length) {
                  const { data: alreadySettled, error: settledLookupError } = await supabase
                    .from("localhub_wallet_transactions")
                    .select("id, status, amount_cents")
                    .eq("provider_transaction_id", paymentId)
                    .eq("business_id", businessId)
                    .maybeSingle();
                  if (settledLookupError) throw settledLookupError;
                  if (
                    alreadySettled?.status !== "available" ||
                    alreadySettled.amount_cents !== settledAmountCents
                  ) {
                    throw new Error("Não foi possível reconciliar o saldo liquidado com o ledger.");
                  }
                }
              }

              // Estorno / Devolução
              if (body.event === "PAYMENT_REFUNDED" || body.event === "PAYMENT_REVERSED") {
                await supabase
                  .from("localhub_asaas_order_payments")
                  .update({ status: "refunded", updated_at: new Date().toISOString() })
                  .eq("order_id", targetOrderId);

                await supabase
                  .from("localhub_orders")
                  .update({ payment_status: "refunded", updated_at: new Date().toISOString() })
                  .eq("id", targetOrderId);

                await supabase.from("localhub_wallet_transactions").upsert({
                  business_id: businessId,
                  provider_transaction_id: `${paymentId}_refund`,
                  transaction_type: "refund",
                  status: "completed",
                  amount_cents: -Math.abs(orderPayment.amount_cents),
                  description: `Estorno Asaas - Pedido #${targetOrderId.slice(0, 8)}`,
                });
              }

              // Expiração
              if (body.event === "PAYMENT_OVERDUE") {
                await supabase
                  .from("localhub_asaas_order_payments")
                  .update({ status: "overdue", updated_at: new Date().toISOString() })
                  .eq("order_id", targetOrderId);

                await supabase
                  .from("localhub_orders")
                  .update({ payment_status: "failed", updated_at: new Date().toISOString() })
                  .eq("id", targetOrderId)
                  .eq("payment_status", "pending");
              }
            }
          }

          return Response.json({ received: true });
        } catch (error) {
          console.error("Asaas webhook processing error:", error);
          const { error: releaseError } = await supabase
            .from("localhub_asaas_webhook_events")
            .delete()
            .eq("event_id", idempotencyId);
          if (releaseError) {
            console.error(
              "Não foi possível liberar a reserva do evento Asaas após falha.",
              releaseError,
            );
          }
          return Response.json({ error: "Erro ao processar evento." }, { status: 500 });
        }
      },
    },
  },
});
