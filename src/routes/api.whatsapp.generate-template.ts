import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { authenticateRequestUser, getSecurityAdminSupabase } from "@/lib/security.server";
import { generateWhatsAppTemplateSuggestion } from "@/lib/whatsapp-templates";

const schema = z.object({
  kind: z.enum(["orderCustomer", "orderOwner", "appointment"]),
  tone: z.enum(["acolhedor", "profissional", "descontraido"]),
});

export const Route = createFileRoute("/api/whatsapp/generate-template")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authenticateRequestUser(request);
        if (!auth.user)
          return Response.json({ error: "Faça login para gerar um texto." }, { status: 401 });
        const parsed = schema.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Opções inválidas." }, { status: 400 });

        const supabase = getSecurityAdminSupabase();
        const { data: business } = await supabase
          .from("localhub_businesses")
          .select("id,name,category")
          .eq("owner_id", auth.user.id)
          .maybeSingle();
        if (!business) return Response.json({ error: "Negócio não encontrado." }, { status: 404 });
        const suggestion = generateWhatsAppTemplateSuggestion({
          ...parsed.data,
          businessName: business.name,
          category: business.category,
        });
        return Response.json({ suggestion, generatedBy: "assistente de texto ELLO" });
      },
    },
  },
});
