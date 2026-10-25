import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { getServerConfig } from "@/lib/config.server";

export const Route = createFileRoute("/api/store/$slug")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const slug = params.slug;
        if (!slug) {
          return Response.json({ error: "Slug não informado." }, { status: 400 });
        }

        try {
          const config = getServerConfig();
          const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          // Use the public key and let the same published-store RLS rules apply
          // as in a direct browser request.
          const { data: businessRow, error: businessError } = await supabase
            .from("localhub_businesses")
            .select(
              "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,opening_hours,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee,logo_url,menu_categories_order",
            )
            .eq("slug", slug)
            .eq("is_published", true)
            .maybeSingle();

          if (businessError) {
            console.error("[api/store] Business lookup failed", {
              code: businessError.code,
            });
            return Response.json(
              { error: "Não foi possível carregar os dados da loja." },
              { status: 503, headers: { "Cache-Control": "private, no-store" } },
            );
          }

          if (!businessRow) {
            return Response.json({ error: "Empresa não encontrada." }, { status: 404 });
          }

          const businessId = businessRow.id;

          // Load only storefront fields; fiscal and internal staff fields stay private.
          const [serviceRes, staffRes, addonRes, areaRes] = await Promise.all([
            supabase
              .from("localhub_services")
              .select(
                "id,business_id,name,description,duration_minutes,price,is_active,menu_category,product_kind,service_modes,image_url,is_featured,is_promotion,promotional_price,promotion_badge,display_order",
              )
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("display_order")
              .order("id"),
            supabase
              .from("localhub_staff")
              .select(
                "id,business_id,name,specialty,registration_label,registration_number,avatar_url,weekly_hours,blocked_dates,is_active",
              )
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("created_at"),
            supabase
              .from("localhub_service_addons")
              .select("id,business_id,service_id,name,duration_minutes,price,is_active")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("created_at"),
            supabase
              .from("localhub_delivery_areas")
              .select("id,business_id,name,fee,is_active")
              .eq("business_id", businessId)
              .eq("is_active", true)
              .order("name"),
          ]);

          const failedRead = [serviceRes, staffRes, addonRes, areaRes].find(
            (result) => result.error,
          );
          if (failedRead?.error) {
            console.error("[api/store] Storefront catalog lookup failed", {
              code: failedRead.error.code,
            });
            return Response.json(
              { error: "Não foi possível carregar os dados da loja." },
              { status: 503, headers: { "Cache-Control": "private, no-store" } },
            );
          }

          const services = (serviceRes.data ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            duration: Number(s.duration_minutes || 0),
            price: Number(s.price || 0),
            active: Boolean(s.is_active),
            menuCategory: s.menu_category || "",
            serviceModes: s.service_modes || ["in_person"],
            imageUrl: s.image_url || null,
            isFeatured: Boolean(s.is_featured),
            isPromotion: Boolean(s.is_promotion),
            promotionalPrice: s.promotional_price !== null ? Number(s.promotional_price) : null,
            promotionBadge: s.promotion_badge || null,
            displayOrder: Number(s.display_order || 0),
            addons: (addonRes.data ?? [])
              .filter((a) => a.service_id === s.id)
              .map((a) => ({
                id: a.id,
                name: a.name,
                duration: Number(a.duration_minutes || 0),
                price: Number(a.price || 0),
                active: Boolean(a.is_active),
              })),
          }));

          const staff = (staffRes.data ?? []).map((m) => ({
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

          const deliveryAreas = (areaRes.data ?? []).map((d) => ({
            id: d.id,
            name: d.name,
            fee: Number(d.fee || 0),
            active: Boolean(d.is_active),
          }));

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
            onboardingDetails: { specialties: [], serviceModes: [] },
            openingHours: businessRow.opening_hours || {},
            blockedDates: businessRow.blocked_dates || [],
            acceptsDelivery: businessRow.accepts_delivery ?? true,
            acceptsPickup: businessRow.accepts_pickup ?? true,
            acceptsDineIn: businessRow.accepts_dine_in ?? false,
            onlinePaymentEnabled: businessRow.online_payment_enabled ?? false,
            pixKey: "",
            loyaltyEnabled: businessRow.loyalty_enabled ?? false,
            loyaltyMode: businessRow.loyalty_mode || "points",
            loyaltyRate: Number(businessRow.loyalty_rate || 0),
            deliveryFee: Number(businessRow.delivery_fee || 0),
            logoUrl: businessRow.logo_url || null,
            menuCategoriesOrder: Array.isArray(businessRow.menu_categories_order)
              ? businessRow.menu_categories_order
              : [],
            wheelSettings: null,
            portfolioItems: [],
          };

          return Response.json(
            { business, services, staff, deliveryAreas },
            {
              headers: {
                "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
              },
            },
          );
        } catch (err: unknown) {
          const cause = err instanceof Error ? err.cause : undefined;
          console.error("[api/store] Public store lookup failed", {
            name: err instanceof Error ? err.name : "UnknownError",
            causeName: cause instanceof Error ? cause.name : undefined,
            causeCode:
              cause && typeof cause === "object" && "code" in cause
                ? String(cause.code)
                : undefined,
          });
          return Response.json(
            { error: "Não foi possível carregar os dados da loja." },
            { status: 503, headers: { "Cache-Control": "no-store" } },
          );
        }
      },
    },
  },
});
