import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { getAsaasServerConfig, getServerConfig } from "./config.server.ts";

export type AsaasCustomerInput = {
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
};

export type AsaasPaymentResponse = {
  id: string;
  customer: string;
  value: number;
  netValue?: number;
  billingType: string;
  status: string;
  dueDate: string;
  invoiceUrl?: string;
  externalReference?: string;
};

export type AsaasPixQrCodeResponse = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export function getAsaasAdminSupabase() {
  const config = getServerConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Banco de dados não configurado para integração Asaas.");
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function isAsaasConfigured(): boolean {
  const { apiKey } = getAsaasServerConfig();
  return Boolean(apiKey && apiKey.trim().length > 10);
}

async function asaasFetch<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    subaccountApiKey?: string;
  } = {},
): Promise<T> {
  const { apiKey, apiBaseUrl } = getAsaasServerConfig();
  const token = options.subaccountApiKey || apiKey;

  if (!token) {
    throw new Error("Chave de API do Asaas (ASAAS_API_KEY) não configurada no servidor.");
  }

  const url = `${apiBaseUrl.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      access_token: token,
      "Content-Type": "application/json",
      "User-Agent": "ELLO-LocalHub/1.0",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  const data = (await response.json()) as T & { errors?: Array<{ code: string; description: string }> };

  if (!response.ok) {
    const errorMsg =
      data.errors?.map((err) => err.description).join("; ") ||
      `Erro na chamada Asaas (${response.status}): ${response.statusText}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export async function findOrCreateAsaasCustomer(
  input: AsaasCustomerInput,
  subaccountApiKey?: string,
): Promise<string> {
  const cleanPhone = input.phone?.replace(/\D/g, "");
  const cleanCpfCnpj = input.cpfCnpj?.replace(/\D/g, "");

  // Tenta localizar cliente existente por CPF/CNPJ ou telefone
  if (cleanCpfCnpj) {
    const search = await asaasFetch<{ data: Array<{ id: string }> }>(
      `customers?cpfCnpj=${cleanCpfCnpj}`,
      { subaccountApiKey },
    );
    if (search.data && search.data.length > 0) {
      return search.data[0]!.id;
    }
  }

  if (cleanPhone) {
    const searchPhone = await asaasFetch<{ data: Array<{ id: string }> }>(
      `customers?phone=${cleanPhone}`,
      { subaccountApiKey },
    );
    if (searchPhone.data && searchPhone.data.length > 0) {
      return searchPhone.data[0]!.id;
    }
  }

  // Cria novo cliente no Asaas
  const created = await asaasFetch<{ id: string }>("customers", {
    method: "POST",
    body: {
      name: input.name.trim(),
      cpfCnpj: cleanCpfCnpj || undefined,
      phone: cleanPhone || undefined,
      email: input.email?.trim() || undefined,
      notificationDisabled: true, // ELLO gerencia as notificações
    },
    subaccountApiKey,
  });

  return created.id;
}

export async function createAsaasPixCharge(
  input: {
    customerId: string;
    value: number;
    description: string;
    externalReference: string;
    dueDate?: string;
  },
  subaccountApiKey?: string,
): Promise<AsaasPaymentResponse> {
  const today = new Date();
  const dueDateStr =
    input.dueDate ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const payment = await asaasFetch<AsaasPaymentResponse>("payments", {
    method: "POST",
    body: {
      customer: input.customerId,
      billingType: "PIX",
      value: Math.round(input.value * 100) / 100,
      dueDate: dueDateStr,
      description: input.description,
      externalReference: input.externalReference,
      postalService: false,
    },
    subaccountApiKey,
  });

  return payment;
}

export async function getAsaasPixQrCode(
  paymentId: string,
  subaccountApiKey?: string,
): Promise<AsaasPixQrCodeResponse> {
  return asaasFetch<AsaasPixQrCodeResponse>(`payments/${paymentId}/pixQrCode`, {
    subaccountApiKey,
  });
}

export function verifyAsaasWebhookToken(providedToken: string | null): boolean {
  const { webhookToken } = getAsaasServerConfig();
  if (!webhookToken || !providedToken) return false;

  const expectedBuffer = Buffer.from(webhookToken.trim());
  const providedBuffer = Buffer.from(providedToken.trim());

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}
