import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { z } from "zod";
import {
  checkRateLimit,
  isDisposableEmail,
  validatePasswordStrength,
} from "@/lib/security.server";

const createAccountSchema = z.object({
  email: z.string().email("Endereço de e-mail inválido.").max(120),
  fullName: z.string().trim().min(2, "Informe seu nome completo.").max(120),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres.").max(128),
});

export const createConfirmedPasswordAccount = createServerFn({ method: "POST" })
  .validator(createAccountSchema)
  .handler(async ({ data }) => {
    const cleanEmail = data.email.toLowerCase().trim();

    // 1. Bloqueio de e-mails descartáveis / temporários (Anti-Spam / Anti-Abuse)
    if (isDisposableEmail(cleanEmail)) {
      throw new Error("Endereços de e-mail temporários não são permitidos. Use um e-mail válido.");
    }

    // 2. Validação de senha segura (mínimo 8 caracteres com letras e números)
    const passCheck = validatePasswordStrength(data.password);
    if (!passCheck.valid) {
      throw new Error(passCheck.reason || "Senha muito fraca.");
    }

    // 3. Rate limiting defensivo na criação de contas (máx 6 contas por hora)
    const rateLimit = checkRateLimit(`auth-create:${cleanEmail}`, 3, 3600_000);
    if (!rateLimit.allowed) {
      throw new Error("Muitas tentativas de cadastro para este endereço. Tente novamente mais tarde.");
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend de cadastro direto não está configurado.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName.trim(),
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        throw new Error("Esta conta já existe. Entre usando sua senha.");
      }
      throw new Error(error.message);
    }

    return {
      id: created.user.id,
      email: created.user.email,
    };
  });
