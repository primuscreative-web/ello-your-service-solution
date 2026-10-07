import { createClient, type User } from "@supabase/supabase-js";
import { getServerConfig } from "./config.server.ts";

/**
 * Módulo Central de Segurança Defensiva para o Backend da Plataforma ELLO.
 *
 * Fornece:
 * 1. Rate Limiting em memória com janela deslizante (anti-DoS, anti-bruteforce, anti-carding).
 * 2. Autenticação e extração segura de sessão JWT/Bearer Token.
 * 3. Validação e sanitização de requisições.
 * 4. Mascaramento de dados sensíveis para logs e auditoria.
 */

// ---------------------------------------------------------------------------
// 1. RATE LIMITER (In-Memory Sliding Window)
// ---------------------------------------------------------------------------

type RateLimitRecord = {
  timestamps: number[];
};

const rateLimitStore = new Map<string, RateLimitRecord>();

// Limpeza periódica automática a cada 5 minutos para evitar vazamento de memória
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 600_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(key);
      }
    }
  }, 300_000);
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
};

/**
 * Valida se a requisição está dentro do limite estipulado.
 *
 * @param key Identificador único (ex: IP + rota)
 * @param maxRequests Máximo de requisições permitidas dentro da janela
 * @param windowMs Duração da janela em milissegundos
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60_000,
): RateLimitResult {
  const now = Date.now();
  let record = rateLimitStore.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  // Remove timestamps fora da janela
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0] || now;
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetSeconds: Math.ceil(windowMs / 1000),
  };
}

/**
 * Extrai o endereço IP do cliente de forma segura respeitando proxies confiáveis.
 */
export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

// ---------------------------------------------------------------------------
// 2. AUTENTICAÇÃO E VALIDAÇÃO DE SESSÃO
// ---------------------------------------------------------------------------

export function getSecurityAdminSupabase() {
  const config = getServerConfig();
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error("Banco de dados não configurado para verificação de segurança.");
  }
  return createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Valida o cabeçalho Authorization Bearer e retorna os dados do usuário autenticado.
 */
export async function authenticateRequestUser(
  request: Request,
): Promise<{ user: User | null; token: string | null; error?: string }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { user: null, token: null, error: "Token de autenticação ausente." };
  }

  const token = authHeader.slice(7).trim();
  if (!token || token.length < 15) {
    return { user: null, token: null, error: "Formato de token inválido." };
  }

  try {
    const supabase = getSecurityAdminSupabase();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return { user: null, token, error: "Sessão expirada ou inválida." };
    }

    return { user: data.user, token };
  } catch (err) {
    return {
      user: null,
      token,
      error: err instanceof Error ? err.message : "Falha na verificação de autenticação.",
    };
  }
}

/**
 * Verifica se o usuário autenticado é proprietário ou colaborador do negócio.
 */
export async function verifyUserBusinessAccess(
  userId: string,
  businessId: string,
): Promise<boolean> {
  try {
    const supabase = getSecurityAdminSupabase();

    // 1. Checa se é proprietário direto
    const { data: business } = await supabase
      .from("localhub_businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .maybeSingle();

    if (business) return true;

    // 2. Checa se é colaborador cadastrado na equipe
    const { data: staffMember } = await supabase
      .from("localhub_staff")
      .select("id")
      .eq("business_id", businessId)
      .eq("auth_user_id", userId)
      .maybeSingle();

    return Boolean(staffMember);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 3. SANITIZAÇÃO E PROTEÇÃO CONTRA VAZAMENTO DE DADOS
// ---------------------------------------------------------------------------

/**
 * Mascara dados de identificação e pagamento para logs e prevenção de vazamento.
 */
export function maskSensitiveData(input: string): string {
  if (!input) return "";
  // Se for e-mail
  if (input.includes("@")) {
    const [user, domain] = input.split("@");
    const maskedUser = (user || "").slice(0, 2) + "***";
    return `${maskedUser}@${domain}`;
  }
  // Se for CPF (11 dígitos)
  const digits = input.replace(/\D/g, "");
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}.***.***-${digits.slice(-2)}`;
  }
  // Se for cartão de crédito (13 a 19 dígitos)
  if (digits.length >= 13 && digits.length <= 19) {
    return `****-****-****-${digits.slice(-4)}`;
  }
  return input.slice(0, 3) + "***";
}

// ---------------------------------------------------------------------------
// 4. PROTEÇÃO CONTRA BOTS E CONTAS FAKES (Auth Defense)
// ---------------------------------------------------------------------------

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  "mailinator.com",
  "tempmail.com",
  "10minutemail.com",
  "guerrillamail.com",
  "throwawaymail.com",
  "yopmail.com",
  "sharklasers.com",
  "getairmail.com",
  "dispostable.com",
  "trashmail.com",
]);

/**
 * Valida se um endereço de e-mail pertence a um provedor temporário descartável.
 */
export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes("@")) return false;
  const domain = email.split("@")[1]?.toLowerCase().trim();
  return domain ? DISPOSABLE_EMAIL_DOMAINS.has(domain) : false;
}

/**
 * Valida os requisitos mínimos de segurança de uma senha.
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || password.length < 8) {
    return { valid: false, reason: "A senha deve ter pelo menos 8 caracteres." };
  }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, reason: "A senha deve conter pelo menos uma letra e um número." };
  }
  return { valid: true };
}

/**
 * Resposta padrão para limites de taxa excedidos (HTTP 429).
 */
export function createRateLimitResponse(resetSeconds: number) {
  return Response.json(
    {
      error: "Muitas requisições recebidas. Aguarde alguns instantes antes de tentar novamente.",
      retryAfterSeconds: resetSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetSeconds),
      },
    },
  );
}
