import { createFileRoute } from "@tanstack/react-router";
import { getSecurityAdminSupabase } from "@/lib/security.server";

export const Route = createFileRoute("/api/store/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        if (!slug) {
          return Response.json({ error: "Slug não informado." }, { status: 400 });
        }

        try {
          const supabase = getSecurityAdminSupabase();
          
          // 1. Busca empresa publicada
          const { data: businessRow, error: businessError } = await supabase
            .from("localhub_businesses")
            .select("*")
            .eq("slug", slug)
            .eq("is_published", true)
            .maybeSingle();

          if (businessError) {
            return Response.json({ error: businessError.message }, { status: 500 });
          }

          if (!businessRow) {
            return Response.json({ error: "Empresa não encontrada." }, { status: 404 });
          }

          const businessId = businessRow.id;

          // 2. Busca serviços ativos, staff, addons e áreas de entrega em paralelo
          const [serviceRes, staffRes, addonRes, areaRes] = await Promise.all([
            supabase
              .from("localhub_services")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("created_at"),
            supabase
              .from("localhub_staff")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("created_at"),
            supabase
              .from("localhub_service_addons")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("created_at"),
            supabase
              .from("localhub_delivery_areas")
              .select("*")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("name"),
          ]);

          const services = (serviceRes.data ?? []).map((s: any) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            duration: Number(s.duration_minutes || 0),
            price: Number(s.price || 0),
            active: Boolean(s.is_active),
            menuCategory: s.menu_category || "",
            serviceModes: s.service_modes || ["in_person"],
            ncm: s.ncm || "",
            cest: s.cest || "",
            cfop: s.cfop || "",
            fiscalOrigin: s.fiscal_origin || "0",
            taxRegimeCode: s.tax_regime_code || "1",
            imageUrl: s.image_url || null,
            isFeatured: Boolean(s.is_featured),
            isPromotion: Boolean(s.is_promotion),
            promotionalPrice: s.promotional_price !== null ? Number(s.promotional_price) : null,
            promotionBadge: s.promotion_badge || null,
            displayOrder: Number(s.display_order || 0),
            addons: (addonRes.data ?? [])
              .filter((a: any) => a.service_id === s.id)
              .map((a: any) => ({
                id: a.id,
                name: a.name,
                duration: Number(a.duration_minutes || 0),
                price: Number(a.price || 0),
                active: Boolean(a.is_active),
              })),
          }));

          const staff = (staffRes.data ?? []).map((m: any) => ({
            id: m.id,
            name: m.name,
            specialty: m.specialty || "",
            registrationLabel: m.registration_label || "",
            registrationNumber: m.registration_number || "",
            avatarUrl: m.avatar_url || null,
            weeklyHours: m.weekly_hours || null,
            blockedDates: m.blocked_dates || [],
            active: Boolean(m.is_active),
          }));

          const deliveryAreas = (areaRes.data ?? []).map((d: any) => ({
            id: d.id,
            name: d.name,
            fee: Number(d.fee || 0),
            active: Boolean(d.is_active),
          }));

          const ob = businessRow.onboarding_details || {};
          const portfolioItems = ob.portfolioItems || [];
          const wheelSettings = ob.wheelSettings || ob.luckyWheel || null;

          const business = {
            id: businessRow.id,
            name: businessRow.name,
            slug: businessRow.slug,
            category: businessRow.category,
            city: businessRow.city,
            phone: businessRow.phone,
            description: businessRow.description,
            address: businessRow.address,
            bannerUrl: businessRow.banner_url || null,
            galleryUrls: businessRow.gallery_urls || [],
            bookingPolicy: businessRow.booking_policy || "",
            onboardingDetails: ob,
            openingHours: businessRow.opening_hours || {},
            blockedDates: businessRow.blocked_dates || [],
            acceptsDelivery: businessRow.accepts_delivery ?? true,
            acceptsPickup: businessRow.accepts_pickup ?? true,
            acceptsDineIn: businessRow.accepts_dine_in ?? false,
            onlinePaymentEnabled: businessRow.online_payment_enabled ?? false,
            pixKey: businessRow.pix_key || "",
            loyaltyEnabled: businessRow.loyalty_enabled ?? false,
            loyaltyMode: businessRow.loyalty_mode || "points",
            loyaltyRate: Number(businessRow.loyalty_rate || 0),
            deliveryFee: Number(businessRow.delivery_fee || 0),
            logoUrl: businessRow.logo_url || ob.logoUrl || null,
            menuCategoriesOrder: Array.isArray(businessRow.menu_categories_order)
              ? businessRow.menu_categories_order
              : [],
            wheelSettings,
            portfolioItems,
          };

          return Response.json({
            business,
            services,
            staff,
            deliveryAreas,
          });
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Erro interno no servidor.";
          return Response.json({ error: message }, { status: 500 });
        }
      },
    },
  },
});
