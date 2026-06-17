import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { z } from "zod";

const createAccountSchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1).max(120),
  password: z.string().min(6).max(128),
});

export const createConfirmedPasswordAccount = createServerFn({ method: "POST" })
  .validator(createAccountSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend de cadastro nao esta configurado.");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.fullName,
      },
    });

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        throw new Error("Esta conta ja existe. Entre usando sua senha.");
      }
      throw new Error(error.message);
    }

    return {
      id: created.user.id,
      email: created.user.email,
    };
  });
