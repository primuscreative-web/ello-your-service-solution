import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { getAsaasServerConfig, getServerConfig } from "./config.server.ts";

export type AsaasCustomerInput = {
  name: string;
  cpfCnpj?: string;
  phone?: string;
  email?: string;
};

export type AsaasSubaccountInput = {
  name: string;
  email: string;
  cpfCnpj: string;
  birthDate?: string;
  companyType?: "MEI" | "LIMITED" | "INDIVIDUAL" | "ASSOCIATION";
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
};

export type AsaasSubaccountResponse = {
  id: string;
  name: string;
  email: string;
  loginEmail?: string;
  cpfCnpj: string;
  apiKey?: string;
  walletId: string;
  accountNumber?: {
    agency: string;
    account: string;
    accountDigit: string;
  };
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
  bankSlipUrl?: string;
  externalReference?: string;
  creditCard?: {
    creditCardNumber?: string;
    creditCardBrand?: string;
    creditCardToken?: string;
  };
};

export type AsaasPixQrCodeResponse = {
  encodedImage: string;
  payload: string;
  expirationDate: string;
};

export type AsaasBalanceResponse = {
  balance: number;
  totalPending: number;
  transferableBalance: number;
};

export type AsaasTransferResponse = {
  id: string;
  value: number;
  netValue?: number;
  status: string;
  transferFee?: number;
  effectiveDate?: string;
  scheduleDate?: string;
  transactionReceiptUrl?: string;
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

export async function asaasFetch<T>(
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

  if (cleanCpfCnpj) {
    try {
      const search = await asaasFetch<{ data: Array<{ id: string }> }>(
        `customers?cpfCnpj=${cleanCpfCnpj}`,
        { subaccountApiKey },
      );
      if (search.data && search.data.length > 0) {
        return search.data[0]!.id;
      }
    } catch {
      // continua para criação se falhar na busca
    }
  }

  if (cleanPhone) {
    try {
      const searchPhone = await asaasFetch<{ data: Array<{ id: string }> }>(
        `customers?phone=${cleanPhone}`,
        { subaccountApiKey },
      );
      if (searchPhone.data && searchPhone.data.length > 0) {
        return searchPhone.data[0]!.id;
      }
    } catch {
      // continua para criação
    }
  }

  const created = await asaasFetch<{ id: string }>("customers", {
    method: "POST",
    body: {
      name: input.name.trim(),
      cpfCnpj: cleanCpfCnpj || undefined,
      phone: cleanPhone || undefined,
      email: input.email?.trim() || undefined,
      notificationDisabled: true,
    },
    subaccountApiKey,
  });

  return created.id;
}

export async function createAsaasSubaccount(
  input: AsaasSubaccountInput,
): Promise<AsaasSubaccountResponse> {
  const cleanCpfCnpj = input.cpfCnpj.replace(/\D/g, "");
  const cleanPhone = input.phone?.replace(/\D/g, "");
  const cleanMobilePhone = (input.mobilePhone || input.phone)?.replace(/\D/g, "");
  const cleanPostalCode = input.postalCode?.replace(/\D/g, "");

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    email: input.email.trim(),
    loginEmail: input.email.trim(),
    cpfCnpj: cleanCpfCnpj,
  };

  if (input.birthDate) payload.birthDate = input.birthDate;
  if (input.companyType) payload.companyType = input.companyType;
  if (cleanPhone) payload.phone = cleanPhone;
  if (cleanMobilePhone) payload.mobilePhone = cleanMobilePhone;
  if (input.address) payload.address = input.address;
  if (input.addressNumber) payload.addressNumber = input.addressNumber;
  if (input.complement) payload.complement = input.complement;
  if (input.province) payload.province = input.province;
  if (cleanPostalCode) payload.postalCode = cleanPostalCode;

  const result = await asaasFetch<AsaasSubaccountResponse>("accounts", {
    method: "POST",
    body: payload,
  });

  return result;
}

export async function getAsaasBalance(subaccountApiKey?: string): Promise<AsaasBalanceResponse> {
  return asaasFetch<AsaasBalanceResponse>("finance/balance", {
    subaccountApiKey,
  });
}

export async function createAsaasTransfer(
  input: {
    value: number;
    pixAddressKey: string;
    pixAddressKeyType: "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";
    description?: string;
  },
  subaccountApiKey?: string,
): Promise<AsaasTransferResponse> {
  return asaasFetch<AsaasTransferResponse>("transfers", {
    method: "POST",
    body: {
      value: Math.round(input.value * 100) / 100,
      operationType: "PIX",
      pixAddressKey: input.pixAddressKey.trim(),
      pixAddressKeyType: input.pixAddressKeyType,
      description: input.description ?? "Saque de recebíveis ELLO",
    },
    subaccountApiKey,
  });
}

export async function createAsaasUnifiedCharge(
  input: {
    customerId: string;
    value: number;
    description: string;
    externalReference: string;
    billingType: "PIX" | "CREDIT_CARD" | "BOLETO";
    dueDate?: string;
    creditCard?: {
      holderName: string;
      number: string;
      expiryMonth: string;
      expiryYear: string;
      ccv: string;
    };
    creditCardHolderInfo?: {
      name: string;
      email: string;
      cpfCnpj: string;
      postalCode: string;
      addressNumber: string;
      phone: string;
    };
    installmentCount?: number;
  },
  subaccountApiKey?: string,
): Promise<AsaasPaymentResponse> {
  const today = new Date();
  const dueDateStr =
    input.dueDate ||
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: input.billingType,
    value: Math.round(input.value * 100) / 100,
    dueDate: dueDateStr,
    description: input.description,
    externalReference: input.externalReference,
    postalService: false,
  };

  if (input.billingType === "CREDIT_CARD") {
    if (input.creditCard && input.creditCardHolderInfo) {
      body.creditCard = input.creditCard;
      body.creditCardHolderInfo = input.creditCardHolderInfo;
      if (input.installmentCount && input.installmentCount > 1) {
        body.installmentCount = input.installmentCount;
        body.installmentValue = Math.round((input.value / input.installmentCount) * 100) / 100;
      }
    }
  }

  const payment = await asaasFetch<AsaasPaymentResponse>("payments", {
    method: "POST",
    body,
    subaccountApiKey,
  });

  return payment;
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
  return createAsaasUnifiedCharge(
    {
      ...input,
      billingType: "PIX",
    },
    subaccountApiKey,
  );
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
