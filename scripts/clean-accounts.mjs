import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("Iniciando limpeza de todas as contas e negócios...");

  // 1. Listar e deletar todos os usuários do auth
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (usersError) {
    console.error("Erro ao listar usuários:", usersError);
  } else {
    console.log(`Encontrados ${usersData.users.length} usuários em auth.users.`);
    for (const u of usersData.users) {
      console.log(`Deletando usuário: ${u.email} (${u.id})`);
      const { error: delError } = await supabase.auth.admin.deleteUser(u.id);
      if (delError) {
        console.error(`Erro ao deletar usuário ${u.id}:`, delError.message);
      } else {
        console.log(`✓ Usuário ${u.email} deletado.`);
      }
    }
  }

  // 2. Limpar dados nas tabelas do banco
  const tablesToClean = [
    "localhub_cash_movements",
    "localhub_cash_sessions",
    "localhub_order_items",
    "localhub_orders",
    "localhub_food_orders",
    "localhub_bookings",
    "localhub_waitlist",
    "localhub_abandoned_carts",
    "localhub_campaign_links",
    "localhub_coupons",
    "localhub_delivery_areas",
    "localhub_staff_members",
    "localhub_services",
    "localhub_businesses",
    "localhub_user_roles",
    "localhub_profiles",
  ];

  for (const table of tablesToClean) {
    try {
      const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) {
        // Tentar sem filtro se falhar
        const { error: err2 } = await supabase.from(table).delete().gte("created_at", "1970-01-01");
        if (err2) {
          console.log(`Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✓ Tabela ${table} limpa.`);
        }
      } else {
        console.log(`✓ Tabela ${table} limpa.`);
      }
    } catch (e) {
      console.log(`Ignorando tabela ${table} se não existir.`);
    }
  }

  console.log("Limpeza concluída com sucesso!");
}

main().catch(console.error);
