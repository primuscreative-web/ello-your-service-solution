import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  MapPin,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  UtensilsCrossed,
  X,
  Zap,
} from "lucide-react";
import { z } from "zod";
import { money } from "@/components/localhub/ui";
import { useLocalHub, type Booking, type Service } from "@/lib/localhub-context";
import { formatSetupChoice, getBusinessCopy, supportsAppointments } from "@/lib/localhub-business";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export const Route = createFileRoute("/loja/$slug")({
  validateSearch: z.object({
    servico: z.string().optional(),
    campanha: z.string().optional(),
    cupom: z.string().max(40).optional(),
  }),
  component: PublicBusinessPage,
});

const publicWeekDays = [
  ["1", "Segunda-feira"],
  ["2", "Terça-feira"],
  ["3", "Quarta-feira"],
  ["4", "Quinta-feira"],
  ["5", "Sexta-feira"],
  ["6", "Sábado"],
  ["7", "Domingo"],
] as const;
const noDeliveryAreas: NonNullable<Awaited<ReturnType<typeof useLocalHub>>["deliveryAreas"]> = [];
const noServices: Service[] = [];
type FoodCartLine = {
  key: string;
  service: Service;
  quantity: number;
  variantId: string | null;
  optionIds: string[];
};

function PublicBusinessPage() {
  const { slug } = Route.useParams();
  const {
    servico: requestedServiceId,
    campanha: requestedCampaign,
    cupom: requestedCoupon,
  } = Route.useSearch();
  const {
    getPublicStore,
    getAvailableBookingSlots,
    addBooking,
    addToWaitlist,
    createFoodOrder,
    previewFoodCoupon,
  } = useLocalHub();
  const [store, setStore] = useState<Awaited<ReturnType<typeof getPublicStore>>>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingBusy, setBookingBusy] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [whatsappUrlAfterBooking, setWhatsappUrlAfterBooking] = useState("");
  const [selected, setSelected] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]);
  const [visitType, setVisitType] = useState<Booking["visitType"]>("first_visit");
  const [serviceMode, setServiceMode] = useState<Booking["serviceMode"]>("in_person");
  const [reminderConsent, setReminderConsent] = useState(false);
  const [waitlistConsent, setWaitlistConsent] = useState(false);
  const [waitlistPeriod, setWaitlistPeriod] = useState<"morning" | "afternoon" | "evening" | "any">(
    "any",
  );
  const [waitlistBusy, setWaitlistBusy] = useState(false);
  const [waitlistAdded, setWaitlistAdded] = useState(false);
  const [waitlistError, setWaitlistError] = useState("");
  const [complete, setComplete] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [cart, setCart] = useState<FoodCartLine[]>([]);
  const [configuringProduct, setConfiguringProduct] = useState<Service | null>(null);
  const [selectedFoodVariant, setSelectedFoodVariant] = useState("");
  const [selectedFoodOptions, setSelectedFoodOptions] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderName, setOrderName] = useState("");
  const [orderPhone, setOrderPhone] = useState("");
  const [orderAddress, setOrderAddress] = useState("");
  const [couponCode, setCouponCode] = useState(requestedCoupon?.toUpperCase() ?? "");
  const [couponPreview, setCouponPreview] = useState<{
    code: string;
    discountAmount: number;
    key: string;
  } | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const attemptedCampaignCoupon = useRef("");
  const [recoveryConsent, setRecoveryConsent] = useState(false);
  const [recoverySaveError, setRecoverySaveError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const savedRecoveryPhone = useRef("");
  const [deliveryAreaId, setDeliveryAreaId] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup" | "dine_in">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "pix" | "card" | "online_pix" | "online_card"
  >("cash");
  const stripeCheckoutEnabled = import.meta.env.VITE_STRIPE_ONLINE_PAYMENTS_ENABLED === "true";
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<{
    number: number;
    total: number;
    trackingToken: string;
  } | null>(null);
  useEffect(() => {
    let active = true;
    setLoading(true);
    void getPublicStore(slug)
      .then((result) => {
        if (active) setStore(result);
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(error instanceof Error ? error.message : "Falha ao carregar a página.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [getPublicStore, slug]);

  useEffect(() => {
    if (store?.business?.name) {
      document.title = `${store.business.name} — ELLO`;
    }
  }, [store?.business?.name]);

  const business = store?.business ?? null;
  const deliveryAreas = store?.deliveryAreas ?? noDeliveryAreas;
  const services = store?.services ?? noServices;
  const activeStaff = (store?.staff ?? []).filter((member) => member.active);
  const galleryUrls = business?.galleryUrls ?? [];
  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);
  const isFoodBusiness = business?.category === "alimentacao";
  const otherSuggestions = useMemo(() => {
    if (!isFoodBusiness) return [];
    const inCartIds = new Set(cart.map((line) => line.service.id));
    return activeServices.filter((s) => !inCartIds.has(s.id));
  }, [activeServices, cart, isFoodBusiness]);
  const businessCopy = getBusinessCopy(business?.category);
  const hasAppointments = supportsAppointments(business?.category);
  const isHealthBusiness = business?.category === "saude";
  const healthModeChoices = [
    { key: "consultorio", value: "in_person" as const, label: "No consultório" },
    { key: "online", value: "online" as const, label: "Teleconsulta" },
    { key: "domiciliar", value: "home_visit" as const, label: "Atendimento domiciliar" },
  ].filter((mode) => business?.onboardingDetails?.serviceModes.includes(mode.key));
  const availableHealthModes = healthModeChoices.length
    ? healthModeChoices
    : [{ key: "consultorio", value: "in_person" as const, label: "Presencial" }];
  const selectedHealthModes = selected?.serviceModes?.length
    ? selected.serviceModes.map((mode) => ({
        value: mode,
        label: mode === "online" ? "Online" : mode === "home_visit" ? "Domiciliar" : "Presencial",
      }))
    : availableHealthModes;
  const selectedAddons = (selected?.addons ?? []).filter(
    (addon) => addon.active && selectedAddonIds.includes(addon.id ?? ""),
  );
  const bookingDuration =
    (selected?.duration ?? 0) + selectedAddons.reduce((sum, addon) => sum + addon.duration, 0);
  const bookingPrice =
    (selected?.price ?? 0) + selectedAddons.reduce((sum, addon) => sum + addon.price, 0);
  const menuGroups = useMemo(() => {
    if (!isFoodBusiness) return [{ name: "", services: activeServices }];
    const groups = new Map<string, Service[]>();
    for (const service of activeServices) {
      const name = service.menuCategory?.trim() || "Outros itens";
      const group = groups.get(name);
      if (group) group.push(service);
      else groups.set(name, [service]);
    }
    return [...groups.entries()]
      .sort(([first], [second]) => first.localeCompare(second, "pt-BR", { sensitivity: "base" }))
      .map(([name, groupedServices]) => ({ name, services: groupedServices }));
  }, [activeServices, isFoodBusiness]);
  useEffect(() => {
    if (!business) return;
    if (fulfillment === "delivery" && !business.acceptsDelivery) {
      setFulfillment(
        business.acceptsPickup ? "pickup" : business.acceptsDineIn ? "dine_in" : "delivery",
      );
    }
    if (fulfillment === "pickup" && !business.acceptsPickup) {
      setFulfillment(
        business.acceptsDelivery ? "delivery" : business.acceptsDineIn ? "dine_in" : "pickup",
      );
    }
    if (fulfillment === "dine_in" && !business.acceptsDineIn) {
      setFulfillment(business.acceptsDelivery ? "delivery" : "pickup");
    }
  }, [business, fulfillment]);
  const cartItems = useMemo(
    () => cart.filter((line) => activeServices.some((service) => service.id === line.service.id)),
    [activeServices, cart],
  );
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, line) => {
    const variantDelta =
      line.service.productVariants?.find((variant) => variant.id === line.variantId)?.priceDelta ??
      0;
    const optionDelta = (line.service.optionGroups ?? [])
      .flatMap((group) => group.options)
      .filter((option) => line.optionIds.includes(option.id ?? ""))
      .reduce((total, option) => total + option.priceDelta, 0);
    return sum + (line.service.price + variantDelta + optionDelta) * line.quantity;
  }, 0);
  const couponPreviewKey = `${couponCode.trim().toUpperCase()}|${orderPhone.trim()}|${cartSubtotal.toFixed(2)}`;
  const appliedCoupon = couponPreview?.key === couponPreviewKey ? couponPreview : null;
  const addFoodCartItem = (
    service: Service,
    variantId: string | null = null,
    optionIds: string[] = [],
  ) => {
    const key = `${service.id}:${variantId ?? "base"}:${[...optionIds].sort().join(",")}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing)
        return current.map((line) =>
          line.key === key ? { ...line, quantity: Math.min(30, line.quantity + 1) } : line,
        );
      return [...current, { key, service, quantity: 1, variantId, optionIds }];
    });
  };
  const setFoodCartQuantity = (key: string, quantity: number) =>
    setCart((current) =>
      current
        .map((line) => (line.key === key ? { ...line, quantity } : line))
        .filter((line) => line.quantity > 0),
    );
  const selectedDeliveryArea = deliveryAreas.find(
    (area) => area.id === deliveryAreaId && area.active,
  );
  const deliveryFee =
    fulfillment === "delivery"
      ? (selectedDeliveryArea?.fee ?? (deliveryAreas.length ? 0 : (business?.deliveryFee ?? 0)))
      : 0;

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client || !business?.slug || !cartItems.length) return;
    if (recoveryConsent) savedRecoveryPhone.current = orderPhone;
    const phone = recoveryConsent ? orderPhone : savedRecoveryPhone.current;
    if (!phone.trim()) return;
    const timer = window.setTimeout(() => {
      void client
        .rpc("localhub_save_abandoned_food_cart", {
          p_slug: business.slug,
          p_phone: phone,
          p_items: cartItems.map((line) => ({ id: line.service.id, quantity: line.quantity })),
          p_recovery_consent: recoveryConsent,
        })
        .then(({ error: saveError }) => {
          setRecoverySaveError(saveError?.message ?? "");
          if (!saveError) savedRecoveryPhone.current = recoveryConsent ? phone : "";
        });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [business?.slug, cartItems, orderPhone, recoveryConsent]);

  useEffect(() => {
    if (!orderAddress.trim() || !deliveryAreas.length) return;
    const normalizedAddress = orderAddress
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR");
    const match = deliveryAreas.find((area) => {
      const normalizedArea = area.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR");
      return normalizedArea.length > 1 && normalizedAddress.includes(normalizedArea);
    });
    if (match) setDeliveryAreaId(match.id);
  }, [deliveryAreas, orderAddress]);

  async function placeFoodOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business || !isFoodBusiness) return;
    setOrderBusy(true);
    setOrderError("");
    try {
      const result = await createFoodOrder({
        slug: business.slug,
        customerName: orderName,
        phone: orderPhone,
        fulfillment,
        address: orderAddress,
        deliveryAreaId: fulfillment === "delivery" ? (selectedDeliveryArea?.id ?? null) : null,
        notes: orderNotes,
        paymentMethod,
        couponCode: appliedCoupon?.code ?? "",
        campaignSlug: requestedCampaign,
        items: cartItems.map((line) => ({
          id: line.service.id,
          quantity: line.quantity,
          variantId: line.variantId,
          optionIds: line.optionIds,
        })),
      });
      if (paymentMethod === "online_pix") {
        const asaasResponse = await fetch("/api/asaas/charge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: result.id, trackingToken: result.trackingToken }),
        });
        const asaas = (await asaasResponse.json()) as { success?: boolean; error?: string };
        if (!asaasResponse.ok || !asaas.success) {
          throw new Error(asaas.error ?? "Não foi possível gerar a cobrança Pix.");
        }
        window.location.assign(`/pedido/${result.trackingToken}`);
        return;
      }
      if (paymentMethod === "online_card") {
        const checkoutResponse = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ orderId: result.id, trackingToken: result.trackingToken }),
        });
        const checkout = (await checkoutResponse.json()) as { url?: string; error?: string };
        if (!checkoutResponse.ok || !checkout.url) {
          throw new Error(checkout.error ?? "Não foi possível iniciar o pagamento online.");
        }
        window.location.assign(checkout.url);
        return;
      }
      setPlacedOrder({
        number: result.number,
        total: result.total,
        trackingToken: result.trackingToken,
      });
      setCart([]);
    } catch (caught) {
      setOrderError(
        caught instanceof Error
          ? caught.message
          : "Não foi possível enviar o pedido. Tente novamente.",
      );
    } finally {
      setOrderBusy(false);
    }
  }

  const applyFoodCoupon = useCallback(
    async (codeToApply = couponCode) => {
      if (!business || !codeToApply.trim() || !orderPhone.trim() || cartSubtotal <= 0) return;
      setCouponBusy(true);
      setCouponMessage("");
      try {
        const result = await previewFoodCoupon({
          slug: business.slug,
          code: codeToApply,
          phone: orderPhone,
          subtotal: cartSubtotal,
        });
        const previewKey = `${codeToApply.trim().toUpperCase()}|${orderPhone.trim()}|${cartSubtotal.toFixed(2)}`;
        setCouponPreview({ ...result, key: previewKey });
        setCouponMessage(`Cupom aplicado: desconto de ${money(result.discountAmount)}.`);
      } catch (caught) {
        setCouponPreview(null);
        setCouponMessage(
          caught instanceof Error ? caught.message : "Não foi possível validar o cupom.",
        );
      } finally {
        setCouponBusy(false);
      }
    },
    [business, cartSubtotal, couponCode, orderPhone, previewFoodCoupon],
  );

  useEffect(() => {
    const normalizedCoupon = requestedCoupon?.trim().toUpperCase() ?? "";
    const attemptKey = `${normalizedCoupon}|${orderPhone.trim()}|${cartSubtotal.toFixed(2)}`;
    if (
      !normalizedCoupon ||
      !cartOpen ||
      !orderPhone.trim() ||
      !cartCount ||
      couponBusy ||
      appliedCoupon ||
      attemptedCampaignCoupon.current === attemptKey
    )
      return;
    attemptedCampaignCoupon.current = attemptKey;
    setCouponCode(normalizedCoupon);
    void applyFoodCoupon(normalizedCoupon);
  }, [
    appliedCoupon,
    cartCount,
    cartOpen,
    cartSubtotal,
    couponBusy,
    orderPhone,
    requestedCoupon,
    applyFoodCoupon,
  ]);

  useEffect(() => {
    if (!business) return;
    const previousTitle = document.title;
    const description =
      business.description ||
      `${business.name} em ${business.city}. Confira ${businessCopy.offerTitle.toLocaleLowerCase("pt-BR")} na ELLO.`;
    const title = `${business.name} — ${business.category} | ELLO`;
    document.title = title;
    const metadata = [
      { attribute: "name", key: "description", content: description },
      { attribute: "property", key: "og:title", content: title },
      { attribute: "property", key: "og:description", content: description },
      ...(business.bannerUrl
        ? [{ attribute: "property", key: "og:image", content: business.bannerUrl }]
        : []),
    ];
    const previousMetadata = metadata.map(({ attribute, key, content }) => {
      let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const created = !element;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      const previousContent = element.getAttribute("content");
      element.setAttribute("content", content);
      return { element, created, previousContent };
    });
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.append(canonical);
    }
    const previousCanonical = canonical.getAttribute("href");
    canonical.href = `${window.location.origin}/loja/${business.slug}`;
    return () => {
      document.title = previousTitle;
      for (const { element, created, previousContent } of previousMetadata) {
        if (created) element.remove();
        else if (previousContent === null) element.removeAttribute("content");
        else element.setAttribute("content", previousContent);
      }
      if (createdCanonical) canonical?.remove();
      else if (canonical && previousCanonical) canonical.setAttribute("href", previousCanonical);
      else if (canonical) canonical.removeAttribute("href");
    };
  }, [business, businessCopy.offerTitle]);

  useEffect(() => {
    if (!requestedServiceId || !store || store.business.category === "alimentacao") return;
    const requestedService = store.services.find(
      (service) => service.id === requestedServiceId && service.active,
    );
    if (requestedService) setSelected(requestedService);
  }, [requestedServiceId, store]);

  useEffect(() => {
    if (!selected || !business?.id || !date || isFoodBusiness) {
      setAvailableSlots([]);
      setAvailabilityError("");
      setAvailabilityLoading(false);
      return;
    }
    let active = true;
    setAvailabilityLoading(true);
    setAvailabilityError("");
    void getAvailableBookingSlots(
      business.id,
      selected.id,
      date,
      selectedStaffId || activeStaff[0]?.id || null,
      selectedAddonIds,
    )
      .then((slots) => {
        if (active) setAvailableSlots(slots);
      })
      .catch(() => {
        if (active) {
          setAvailableSlots([]);
          setAvailabilityError("Não foi possível consultar os horários. Tente novamente.");
        }
      })
      .finally(() => {
        if (active) setAvailabilityLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    activeStaff,
    business?.id,
    date,
    getAvailableBookingSlots,
    isFoodBusiness,
    selected,
    selectedAddonIds,
    selectedStaffId,
  ]);

  async function book(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || !business) return;
    if (!availableSlots.includes(time)) {
      setBookingError("Esse horário não está mais disponível. Escolha outro.");
      return;
    }
    setBookingBusy(true);
    setBookingError("");
    const businessWhatsApp = toWhatsAppNumber(business.phone);
    const whatsappWindow =
      businessWhatsApp.length >= 10 ? window.open("about:blank", "_blank") : null;
    try {
      await addBooking(business.id!, {
        serviceId: selected.id,
        date,
        time,
        duration: selected.duration,
        customerName: customerName.trim(),
        phone,
        staffId: selectedStaffId || activeStaff[0]?.id || null,
        addonIds: selectedAddonIds,
        visitType: isHealthBusiness ? visitType : "first_visit",
        serviceMode: isHealthBusiness ? serviceMode : "in_person",
        reminderConsent,
      });
      const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
      const message = [
        `Olá, ${business.name}! Meu nome é ${customerName.trim()}.`,
        "Gostaria de solicitar este agendamento:",
        `${isHealthBusiness ? "Consulta" : "Serviço"}: ${isHealthBusiness ? "atendimento" : `${selected.name} (${bookingDuration} min)`}`,
        ...(selectedAddons.length
          ? [`Adicionais: ${selectedAddons.map((addon) => addon.name).join(", ")}`]
          : []),
        ...(activeStaff.length
          ? [
              `Profissional: ${activeStaff.find((member) => member.id === selectedStaffId)?.name ?? activeStaff[0].name}`,
            ]
          : []),
        ...(isHealthBusiness
          ? [
              `Formato: ${selectedHealthModes.find((mode) => mode.value === serviceMode)?.label ?? "Presencial"}`,
              `Tipo: ${visitType === "first_visit" ? "Primeira consulta" : "Retorno"}`,
              ...(serviceMode === "online"
                ? ["Aguardo a confirmação do atendimento online por este WhatsApp."]
                : []),
            ]
          : []),
        `Data: ${formattedDate} às ${time}`,
        ...(!isHealthBusiness ? [`Valor: ${money(bookingPrice)}`] : []),
        `Meu WhatsApp: ${phone.trim()}`,
      ].join("\n");
      const messageUrl =
        businessWhatsApp.length >= 10
          ? `https://wa.me/${businessWhatsApp}?text=${encodeURIComponent(message)}`
          : "";
      setWhatsappUrlAfterBooking(messageUrl);
      setComplete(true);
      if (messageUrl && whatsappWindow) {
        whatsappWindow.opener = null;
        whatsappWindow.location.replace(messageUrl);
      } else if (messageUrl) {
        window.location.assign(messageUrl);
      }
    } catch (error) {
      whatsappWindow?.close();
      setBookingError(error instanceof Error ? error.message : "Não foi possível enviar o pedido.");
    } finally {
      setBookingBusy(false);
    }
  }

  async function joinWaitlist() {
    if (!business?.id || !selected) return;
    if (!customerName.trim() || phone.replace(/\D/g, "").length < 10 || !date) {
      setWaitlistError("Informe seu nome, WhatsApp e a data desejada.");
      return;
    }
    if (!waitlistConsent) {
      setWaitlistError("Autorize o contato somente para avisarmos sobre horários disponíveis.");
      return;
    }
    setWaitlistBusy(true);
    setWaitlistError("");
    try {
      const parsedDate = new Date(`${date}T12:00:00`);
      await addToWaitlist({
        businessId: business.id,
        serviceId: selected.id,
        staffId: selectedStaffId || activeStaff[0]?.id || null,
        customerName: customerName.trim(),
        phone: phone.trim(),
        preferredDate: date,
        preferredWeekday: ((parsedDate.getDay() + 6) % 7) + 1,
        dayPeriod: waitlistPeriod,
      });
      setWaitlistAdded(true);
    } catch (caught) {
      setWaitlistError(
        caught instanceof Error ? caught.message : "Não foi possível entrar na lista de espera.",
      );
    } finally {
      setWaitlistBusy(false);
    }
  }

  if (loading)
    return (
      <div className="min-h-screen bg-[#f5f4ef] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-8 w-24 rounded-xl bg-slate-200" />
            <div className="h-9 w-28 rounded-xl bg-slate-200" />
          </div>
          <div className="h-56 w-full rounded-3xl bg-slate-200/80" />
          <div className="flex gap-3 overflow-hidden">
            <div className="h-10 w-28 rounded-xl bg-slate-200" />
            <div className="h-10 w-32 rounded-xl bg-slate-200" />
            <div className="h-10 w-24 rounded-xl bg-slate-200" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex h-32 gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs"
              >
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-5/6 rounded bg-slate-100" />
                  <div className="mt-3 h-4 w-1/3 rounded bg-slate-200" />
                </div>
                <div className="size-24 rounded-xl bg-slate-200/70" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  if (loadError || !business || business.slug !== slug)
    return (
      <div className="grid min-h-screen place-items-center bg-[#f5f4ef] px-5 text-center">
        <div>
          <Store className="mx-auto text-[#778253]" size={30} />
          <h1 className="mt-4 text-2xl font-bold">Página não encontrada</h1>
          <p className="mt-2 text-sm text-slate-500">
            {loadError || "Confira o link ou crie sua página ELLO."}
          </p>
          <Link
            to="/"
            className="mt-5 inline-flex rounded-xl bg-[#292b25] px-4 py-3 text-sm font-bold text-white"
          >
            Ir para ELLO
          </Link>
        </div>
      </div>
    );

  const waNumber = toWhatsAppNumber(business.phone);
  const whatsappUrl = waNumber
    ? "https://wa.me/" +
      waNumber +
      "?text=" +
      encodeURIComponent("Olá! Encontrei sua página " + business.name + " na ELLO.")
    : undefined;
  return (
    <div className="min-h-screen bg-[#f5f4ef] pb-12 text-[#292b25]">
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-sm font-extrabold">
            <span className="ello-brand-mark ello-brand-mark-small">e</span>
            ello
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: business.name,
                      text: business.description || `Conheça ${business.name} na ELLO`,
                      url: window.location.href,
                    });
                  } catch {
                    // Ignora cancelamento pelo usuário
                  }
                } else {
                  void navigator.clipboard.writeText(window.location.href);
                  setShareCopied(true);
                  setTimeout(() => setShareCopied(false), 2500);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <Share2 size={14} />
              {shareCopied ? "Link copiado!" : "Compartilhar"}
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/70"
              >
                <MessageCircle size={15} />
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        <section
          className="relative mt-5 overflow-hidden rounded-2xl bg-[#292b25] bg-cover bg-center px-6 py-9 text-white sm:mt-8 sm:px-10 sm:py-12"
          style={
            business.bannerUrl
              ? {
                  backgroundImage: `linear-gradient(90deg, rgba(25,27,22,.9), rgba(25,27,22,.66)), url("${business.bannerUrl}")`,
                }
              : undefined
          }
        >
          <div className="absolute -right-8 -top-20 size-64 rounded-full bg-[#d5ec9a]/10 blur-3xl" />
          <div className="absolute -bottom-28 left-1/3 size-72 rounded-full bg-[#d5ec9a]/10 blur-3xl" />
          <div className="relative max-w-2xl">
            <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
              {business.name}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
              {business.description ||
                (hasAppointments
                  ? `Conheça nossos ${businessCopy.offers} e escolha o melhor horário para você.`
                  : isFoodBusiness
                    ? "Confira nosso cardápio e faça seu pedido online."
                    : "Conheça nossos serviços e fale diretamente com o estabelecimento.")}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                Aberto agora
              </span>
              {isFoodBusiness && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  <Clock3 size={13} />
                  35 – 50 min
                </span>
              )}
              {business.onlinePaymentEnabled && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                  <Zap size={13} className="text-amber-300" />
                  Pix Online imediato
                </span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/70">
              {business.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {business.address ? business.address + " · " : ""}
                  {business.city}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <CalendarDays size={14} />
                {hasAppointments
                  ? "Agendamento online"
                  : isFoodBusiness
                    ? "Pedido online"
                    : "Fale com o estabelecimento"}
              </span>
            </div>
          </div>
        </section>
        {galleryUrls.length > 0 && (
          <section className="mt-5" aria-label="Portfólio de trabalhos">
            <div className="mb-3 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.14em] text-[#778253]">
                  Resultados reais
                </p>
                <h2 className="mt-1 font-display text-lg font-bold">Nosso portfólio</h2>
              </div>
              <span className="text-xs text-slate-400">{galleryUrls.length} fotos</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
              {galleryUrls.map((imageUrl, index) => (
                <figure key={imageUrl} className="overflow-hidden rounded-2xl bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={`Trabalho ${index + 1} de ${business.name}`}
                    loading="lazy"
                    className="aspect-square w-full object-cover transition duration-300 hover:scale-[1.03]"
                  />
                </figure>
              ))}
            </div>
          </section>
        )}
        {activeStaff.length > 0 && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Conheça a equipe</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {activeStaff.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"
                >
                  {member.avatarUrl ? (
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="size-11 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-[#edf0e5] text-sm font-bold text-[#586341]">
                      {member.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{member.name}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {member.specialty || "Profissional da equipe"}
                    </span>
                    {member.registrationLabel && member.registrationNumber && (
                      <span className="mt-1 block text-[11px] text-slate-400">
                        {member.registrationLabel} {member.registrationNumber}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(business.onboardingDetails?.specialties.length ||
          business.onboardingDetails?.serviceModes.length) && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Como podemos atender você</h2>
            {Boolean(business.onboardingDetails?.specialties.length) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-500">Especialidades</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {business.onboardingDetails!.specialties.map((specialty) => (
                    <li
                      key={specialty}
                      className="rounded-full bg-[#edf0e5] px-3 py-1.5 text-xs font-medium text-[#586341]"
                    >
                      {formatSetupChoice(specialty)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {Boolean(business.onboardingDetails?.serviceModes.length) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-500">Formas de atendimento</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {business.onboardingDetails!.serviceModes.map((mode) => (
                    <li
                      key={mode}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600"
                    >
                      {formatSetupChoice(mode)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">
            {isFoodBusiness ? "Horário de funcionamento" : "Horários de atendimento"}
          </h2>
          <ul className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {publicWeekDays.map(([day, label]) => {
              const hours = business.openingHours?.[day];
              const isClosed = !hours || hours.closed;
              return (
                <li
                  key={day}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 text-xs"
                >
                  <span className="font-medium text-slate-700">{label}</span>
                  <span className={isClosed ? "text-slate-400" : "text-slate-600"}>
                    {isClosed ? (
                      "Fechado"
                    ) : (
                      <>
                        {hours.open}–{hours.close}
                        {hours.breakStart && hours.breakEnd && (
                          <span className="block text-right text-[10px] text-slate-400">
                            Intervalo {hours.breakStart}–{hours.breakEnd}
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-[.14em] text-[#778253]">
                {isFoodBusiness ? "Feito para pedir" : "Conheça nosso trabalho"}
              </div>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight">
                {businessCopy.offerTitle}
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {activeServices.length} {businessCopy.offers}
            </span>
          </div>
          {activeServices.length ? (
            <>
              {isFoodBusiness && menuGroups.length > 1 && (
                <nav
                  aria-label="Categorias do cardápio"
                  className="mt-4 flex gap-2 overflow-x-auto pb-2"
                >
                  {menuGroups.map((group, index) => (
                    <a
                      key={group.name}
                      href={`#menu-category-${index}`}
                      className="min-h-10 shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:border-[#a5b280] hover:bg-[#edf0e5]"
                    >
                      {group.name}
                    </a>
                  ))}
                </nav>
              )}
              <div className="mt-4 space-y-8">
                {menuGroups.map((group, groupIndex) => (
                  <section
                    key={group.name || "offers"}
                    id={isFoodBusiness ? `menu-category-${groupIndex}` : undefined}
                    className="scroll-mt-6"
                  >
                    {isFoodBusiness && (
                      <h3 className="mb-3 text-base font-bold text-[#292b25]">{group.name}</h3>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.services.map((service) => (
                        <article
                          key={service.id}
                          className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6"
                        >
                          {isFoodBusiness && service.imageUrl && (
                            <img
                              src={service.imageUrl}
                              alt={service.name}
                              loading="lazy"
                              className="-mx-5 -mt-5 mb-4 aspect-[16/10] w-[calc(100%+2.5rem)] rounded-t-2xl object-cover sm:-mx-6 sm:-mt-6 sm:w-[calc(100%+3rem)]"
                            />
                          )}
                          <div className="flex items-start gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf0e5] text-[#667448]">
                              {isFoodBusiness ? (
                                <UtensilsCrossed size={18} />
                              ) : (
                                <Package size={18} />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="font-bold">{service.name}</h3>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {service.description ||
                                  (isFoodBusiness
                                    ? "Preparado com cuidado. Adicione ao pedido online."
                                    : "Atendimento pensado para você.")}
                              </p>
                            </div>
                          </div>
                          <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                            <div>
                              <div className="text-lg font-extrabold text-[#302ab0]">
                                {money(service.price)}
                              </div>
                              {!isFoodBusiness && (
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                  <Clock3 size={12} />
                                  {service.duration} minutos
                                </div>
                              )}
                            </div>
                            {isFoodBusiness ? (
                              <div className="flex items-center gap-2">
                                {cart
                                  .filter((line) => line.service.id === service.id)
                                  .reduce((sum, line) => sum + line.quantity, 0) > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      aria-label={`Remover ${service.name}`}
                                      onClick={() => {
                                        const line = [...cart]
                                          .reverse()
                                          .find((item) => item.service.id === service.id);
                                        if (line) setFoodCartQuantity(line.key, line.quantity - 1);
                                      }}
                                      className="grid size-9 place-items-center rounded-full border border-slate-200 text-slate-600"
                                    >
                                      <Minus size={14} />
                                    </button>
                                    <span className="min-w-4 text-center text-sm font-bold">
                                      {cart
                                        .filter((line) => line.service.id === service.id)
                                        .reduce((sum, line) => sum + line.quantity, 0)}
                                    </span>
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (
                                      (service.productVariants?.length ?? 0) ||
                                      (service.optionGroups?.length ?? 0)
                                    ) {
                                      setConfiguringProduct(service);
                                      setSelectedFoodVariant("");
                                      setSelectedFoodOptions([]);
                                    } else addFoodCartItem(service);
                                  }}
                                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#292b25] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#414338]"
                                >
                                  <Plus size={14} /> Adicionar
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected(service);
                                  setSelectedStaffId(activeStaff[0]?.id ?? "");
                                  setSelectedAddonIds([]);
                                  setVisitType("first_visit");
                                  setServiceMode(
                                    service.serviceModes?.[0] ??
                                      availableHealthModes[0]?.value ??
                                      "in_person",
                                  );
                                  setReminderConsent(false);
                                  setWaitlistConsent(false);
                                  setWaitlistAdded(false);
                                  setWaitlistError("");
                                  setComplete(false);
                                  setBookingError("");
                                  setDate("");
                                  setTime("");
                                  setWhatsappUrlAfterBooking("");
                                }}
                                className="rounded-xl bg-[#292b25] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#414338]"
                              >
                                {businessCopy.bookingAction}
                              </button>
                            )}
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              {isFoodBusiness ? (
                <UtensilsCrossed className="mx-auto text-[#a5b280]" size={26} />
              ) : (
                <Package className="mx-auto text-[#a5b280]" size={26} />
              )}
              <p className="mt-3 text-sm font-semibold">
                {isFoodBusiness
                  ? businessCopy.emptyOffersTitle
                  : "Estamos preparando nossos serviços"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-500">
                {isFoodBusiness
                  ? businessCopy.emptyOffersDescription
                  : "A lista de atendimentos será atualizada em breve. Entre em contato para consultar opções e horários."}
              </p>
              {!isFoodBusiness && toWhatsAppNumber(business.phone).length >= 12 && (
                <a
                  href={`https://wa.me/${toWhatsAppNumber(business.phone)}?text=${encodeURIComponent(`Olá! Encontrei a página ${business.name} na ELLO e gostaria de saber mais sobre os serviços e horários.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-[#292b25] px-4 text-xs font-bold text-white transition hover:bg-[#414338]"
                >
                  Consultar pelo WhatsApp
                </a>
              )}
            </div>
          )}
        </section>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400">
          <span>
            {business.name} · {business.city}
          </span>
          <span>
            Feito com{" "}
            <a href="/" className="font-bold text-[#667448]">
              ELLO
            </a>
          </span>
        </footer>
      </main>

      {isFoodBusiness && cartCount > 0 && !cartOpen && (
        <button
          type="button"
          onClick={() => {
            setPlacedOrder(null);
            setOrderError("");
            setCartOpen(true);
          }}
          className="fixed inset-x-4 bottom-5 z-40 mx-auto flex min-h-14 max-w-2xl items-center justify-between rounded-2xl border border-white/15 bg-[#292b25]/95 px-5 text-white shadow-2xl shadow-black/30 backdrop-blur-md transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl bg-white/15 text-white">
              <ShoppingBag size={17} />
            </span>
            <div className="text-left">
              <span className="block text-xs font-bold uppercase tracking-wider text-[#d5ec9a]">
                Sacola · {cartCount} {cartCount === 1 ? "item" : "itens"}
              </span>
              <span className="text-xs text-white/70">Toque para finalizar</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold">{money(cartSubtotal + deliveryFee)}</span>
            <ChevronRight size={18} className="text-white/60" />
          </div>
        </button>
      )}

      {isFoodBusiness && configuringProduct && (
        <div className="fixed inset-0 z-[60] grid place-items-end bg-slate-950/55 p-0 sm:place-items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-options-title"
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl sm:rounded-[26px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#778253]">
                  Personalize seu pedido
                </p>
                <h2 id="food-options-title" className="mt-1 text-xl font-bold">
                  {configuringProduct.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  A partir de {money(configuringProduct.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringProduct(null)}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {(configuringProduct.productVariants?.length ?? 0) > 0 && (
              <fieldset className="mt-5">
                <legend className="mb-2 text-sm font-bold">
                  Escolha uma variação{" "}
                  <span className="text-xs font-normal text-slate-500">obrigatório</span>
                </legend>
                <div className="space-y-2">
                  {configuringProduct.productVariants?.map((variant) => (
                    <label
                      key={variant.id}
                      className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 px-3"
                    >
                      <input
                        type="radio"
                        name="food-variant"
                        checked={selectedFoodVariant === variant.id}
                        onChange={() => setSelectedFoodVariant(variant.id ?? "")}
                        className="size-4 accent-[#778253]"
                      />
                      <span className="flex-1 text-sm font-medium">{variant.name}</span>
                      <span className="text-sm text-slate-600">
                        {variant.priceDelta >= 0 ? "+" : "−"}
                        {money(Math.abs(variant.priceDelta))}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}
            {(configuringProduct.optionGroups ?? []).map((group) => {
              const chosen = group.options.filter((option) =>
                selectedFoodOptions.includes(option.id ?? ""),
              );
              return (
                <fieldset key={group.id} className="mt-5">
                  <legend className="mb-2 text-sm font-bold">
                    {group.name}{" "}
                    <span className="text-xs font-normal text-slate-500">
                      {group.required ? "obrigatório" : "opcional"}
                      {group.maxSelections > 1 ? ` · até ${group.maxSelections}` : ""}
                    </span>
                  </legend>
                  <div className="space-y-2">
                    {group.options.map((option) => {
                      const optionId = option.id ?? "";
                      const checked = selectedFoodOptions.includes(optionId);
                      const disabled = !checked && chosen.length >= group.maxSelections;
                      return (
                        <label
                          key={optionId}
                          className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 ${disabled ? "border-slate-100 opacity-50" : "border-slate-200"}`}
                        >
                          <input
                            type={group.maxSelections === 1 ? "radio" : "checkbox"}
                            name={`food-group-${group.id}`}
                            checked={checked}
                            disabled={disabled}
                            onChange={(event) =>
                              setSelectedFoodOptions((current) =>
                                event.target.checked
                                  ? [...current, optionId]
                                  : current.filter((id) => id !== optionId),
                              )
                            }
                            className="size-4 accent-[#778253]"
                          />
                          <span className="flex-1 text-sm font-medium">{option.name}</span>
                          {option.priceDelta > 0 && (
                            <span className="text-sm text-slate-600">
                              +{money(option.priceDelta)}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            })}
            <button
              type="button"
              disabled={Boolean(
                (configuringProduct.productVariants?.length && !selectedFoodVariant) ||
                (configuringProduct.optionGroups ?? []).some((group) => {
                  const minimum = group.required
                    ? Math.max(1, group.minSelections)
                    : group.minSelections;
                  return (
                    group.options.filter((option) => selectedFoodOptions.includes(option.id ?? ""))
                      .length < minimum
                  );
                }),
              )}
              onClick={() => {
                addFoodCartItem(
                  configuringProduct,
                  selectedFoodVariant || null,
                  selectedFoodOptions,
                );
                setConfiguringProduct(null);
              }}
              className="mt-6 min-h-12 w-full rounded-xl bg-[#292b25] px-4 text-sm font-bold text-white disabled:opacity-50"
            >
              Adicionar ao pedido
            </button>
          </section>
        </div>
      )}

      {isFoodBusiness && cartOpen && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !orderBusy) setCartOpen(false);
          }}
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/55 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-checkout-title"
            className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-[26px] bg-white p-5 shadow-2xl sm:rounded-[26px] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#778253]">
                  {placedOrder ? "Pedido recebido" : "Seu pedido"}
                </p>
                <h2 id="food-checkout-title" className="mt-1 text-xl font-bold">
                  {placedOrder ? `Pedido #${placedOrder.number} enviado` : "Finalizar pedido"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {placedOrder ? (
              <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={22} />
                </span>
                <p className="mt-3 font-bold text-emerald-950">
                  Seu pedido foi enviado para {business?.name}.
                </p>
                <p className="mt-1 text-sm text-emerald-900">
                  Total: {money(placedOrder.total)} · pagamento{" "}
                  {fulfillment === "delivery"
                    ? "na entrega"
                    : fulfillment === "pickup"
                      ? "na retirada"
                      : "no estabelecimento"}
                  .
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  {business?.phone && (() => {
                    const rawPhone = business.phone.replace(/\D/g, "");
                    const cleanPhone = rawPhone.startsWith("55") ? rawPhone : `55${rawPhone}`;
                    const trackingUrl =
                      typeof window !== "undefined"
                        ? `${window.location.origin}/pedido/${placedOrder.trackingToken}`
                        : `https://ello.app.br/pedido/${placedOrder.trackingToken}`;
                    const message = encodeURIComponent(
                      `Olá! Acabei de fazer o Pedido #${placedOrder.number} pelo cardápio ELLO.\n\n` +
                        `*Cliente:* ${orderName.trim() || "Cliente"}\n` +
                        `*Tipo:* ${fulfillment === "delivery" ? `Entrega em ${orderAddress.trim()}` : fulfillment === "pickup" ? "Retirada no local" : "Consumo no local"}\n` +
                        `*Pagamento:* ${paymentMethod === "pix" ? "Pix" : paymentMethod === "card" ? "Cartão" : paymentMethod === "cash" ? "Dinheiro" : "Online"}\n` +
                        `*Total:* ${money(placedOrder.total)}\n\n` +
                        `Acompanhar status em tempo real:\n${trackingUrl}`,
                    );
                    return (
                      <a
                        href={`https://wa.me/${cleanPhone}?text=${message}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <MessageCircle size={18} />
                        Enviar comprovante no WhatsApp da loja
                      </a>
                    );
                  })()}
                  <Link
                    to="/pedido/$token"
                    params={{ token: placedOrder.trackingToken }}
                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800/20 bg-white px-4 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-100/50"
                  >
                    Acompanhar pedido
                  </Link>
                  <button
                    type="button"
                    onClick={() => setCartOpen(false)}
                    className="rounded-xl bg-[#292b25] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#34352f]"
                  >
                    Voltar ao cardápio
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
                  {cartItems.map((line) => {
                    const service = line.service;
                    const variant = service.productVariants?.find(
                      (item) => item.id === line.variantId,
                    );
                    const chosenOptions = (service.optionGroups ?? [])
                      .flatMap((group) => group.options)
                      .filter((option) => line.optionIds.includes(option.id ?? ""));
                    const unitPrice =
                      service.price +
                      (variant?.priceDelta ?? 0) +
                      chosenOptions.reduce((sum, option) => sum + option.priceDelta, 0);
                    return (
                      <div key={line.key} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold">{service.name}</div>
                          <div className="text-xs text-slate-500">
                            {[variant?.name, ...chosenOptions.map((item) => item.name)]
                              .filter(Boolean)
                              .join(" · ") || "Padrão"}{" "}
                            · {money(unitPrice)} cada
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            aria-label={`Diminuir ${service.name}`}
                            onClick={() => setFoodCartQuantity(line.key, line.quantity - 1)}
                            className="grid size-8 place-items-center rounded-full border border-slate-200"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="min-w-5 text-center text-sm font-bold">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            aria-label={`Aumentar ${service.name}`}
                            onClick={() => setFoodCartQuantity(line.key, line.quantity + 1)}
                            className="grid size-8 place-items-center rounded-full border border-slate-200"
                          >
                            <Plus size={13} />
                          </button>
                        </div>
                        <b className="text-sm">{money(unitPrice * line.quantity)}</b>
                      </div>
                    );
                  })}
                </div>

                {otherSuggestions.length > 0 && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Sparkles size={13} className="text-amber-500" />
                      <span>Peça também</span>
                    </div>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {otherSuggestions.slice(0, 4).map((suggested) => (
                        <button
                          key={suggested.id}
                          type="button"
                          onClick={() => {
                            if (suggested.productVariants?.length || suggested.optionGroups?.length) {
                              setConfiguringProduct(suggested);
                            } else {
                              addFoodCartItem(suggested, null, []);
                            }
                          }}
                          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-[#778253] hover:bg-slate-50"
                        >
                          {suggested.imageUrl ? (
                            <img
                              src={suggested.imageUrl}
                              alt=""
                              className="size-9 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="grid size-9 place-items-center rounded-lg bg-slate-100 text-slate-400">
                              <UtensilsCrossed size={14} />
                            </div>
                          )}
                          <div className="max-w-[120px]">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {suggested.name}
                            </p>
                            <p className="text-[11px] font-semibold text-[#778253]">
                              +{money(suggested.price)}
                            </p>
                          </div>
                          <span className="grid size-6 place-items-center rounded-full bg-[#edf0e5] text-xs font-bold text-[#586341]">
                            +
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={(event) => void placeFoodOrder(event)} className="mt-5 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-sm font-semibold">Como receber?</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {business?.acceptsDelivery !== false && (
                        <button
                          type="button"
                          onClick={() => setFulfillment("delivery")}
                          className={`min-h-11 rounded-xl border text-sm font-semibold ${fulfillment === "delivery" ? "border-[#778253] bg-[#edf0e5] text-[#586341]" : "border-slate-200"}`}
                        >
                          Entrega
                        </button>
                      )}
                      {business?.acceptsPickup !== false && (
                        <button
                          type="button"
                          onClick={() => setFulfillment("pickup")}
                          className={`min-h-11 rounded-xl border text-sm font-semibold ${fulfillment === "pickup" ? "border-[#778253] bg-[#edf0e5] text-[#586341]" : "border-slate-200"}`}
                        >
                          Retirada
                        </button>
                      )}
                      {business?.acceptsDineIn && (
                        <button
                          type="button"
                          onClick={() => setFulfillment("dine_in")}
                          aria-pressed={fulfillment === "dine_in"}
                          className={`min-h-11 rounded-xl border text-sm font-semibold ${fulfillment === "dine_in" ? "border-[#778253] bg-[#edf0e5] text-[#586341]" : "border-slate-200"}`}
                        >
                          Consumir no local
                        </button>
                      )}
                    </div>
                  </fieldset>
                  <label className="block text-sm font-semibold">
                    Seu nome
                    <input
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      value={orderName}
                      onChange={(event) => setOrderName(event.target.value)}
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    WhatsApp
                    <input
                      required
                      type="tel"
                      autoComplete="tel"
                      value={orderPhone}
                      onChange={(event) => {
                        if (event.target.value !== orderPhone && recoveryConsent)
                          setRecoveryConsent(false);
                        setOrderPhone(event.target.value);
                        setCouponMessage("");
                      }}
                      placeholder="(11) 99999-9999"
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal"
                    />
                  </label>
                  <div>
                    <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                      <input
                        type="checkbox"
                        checked={recoveryConsent}
                        onChange={(event) => {
                          setRecoverySaveError("");
                          setRecoveryConsent(event.target.checked);
                        }}
                        className="mt-1 size-4 shrink-0 accent-[#778253]"
                      />
                      <span>
                        Aceito receber um lembrete único no WhatsApp se eu não concluir este pedido.
                        Esta autorização não inclui ofertas ou mensagens promocionais.
                      </span>
                    </label>
                    {recoverySaveError && (
                      <p role="alert" className="mt-1 px-1 text-xs text-red-700">
                        Não foi possível salvar ou cancelar a autorização: {recoverySaveError}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl border border-slate-200 p-3">
                    <label htmlFor="food-coupon-code" className="text-sm font-semibold">
                      Cupom de desconto
                    </label>
                    <div className="mt-2 flex gap-2">
                      <input
                        id="food-coupon-code"
                        value={couponCode}
                        onChange={(event) => {
                          setCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""));
                          setCouponMessage("");
                        }}
                        placeholder="Digite seu cupom"
                        maxLength={40}
                        className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-normal"
                      />
                      <button
                        type="button"
                        onClick={() => void applyFoodCoupon()}
                        disabled={
                          couponBusy || !couponCode.trim() || !orderPhone.trim() || !cartCount
                        }
                        className="min-h-11 rounded-xl border border-slate-300 px-3 text-sm font-semibold disabled:opacity-50"
                      >
                        {couponBusy ? "Validando…" : appliedCoupon ? "Atualizar" : "Aplicar"}
                      </button>
                    </div>
                    {couponMessage && (!couponPreview || appliedCoupon) && (
                      <p
                        role={appliedCoupon ? "status" : "alert"}
                        className={`mt-2 text-xs ${appliedCoupon ? "text-emerald-700" : "text-red-700"}`}
                      >
                        {couponMessage}
                      </p>
                    )}
                  </div>
                  {fulfillment === "delivery" && (
                    <>
                      <label className="block text-sm font-semibold">
                        Endereço para entrega
                        <textarea
                          required
                          minLength={8}
                          autoComplete="street-address"
                          rows={2}
                          value={orderAddress}
                          onChange={(event) => {
                            setOrderAddress(event.target.value);
                            setDeliveryAreaId("");
                          }}
                          placeholder="Rua, número, bairro e complemento"
                          className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
                        />
                      </label>
                      {deliveryAreas.length > 0 && (
                        <label className="block text-sm font-semibold">
                          Bairro
                          <select
                            required
                            value={deliveryAreaId}
                            onChange={(event) => setDeliveryAreaId(event.target.value)}
                            className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal"
                          >
                            <option value="">Selecione seu bairro</option>
                            {deliveryAreas
                              .filter((area) => area.active)
                              .map((area) => (
                                <option key={area.id} value={area.id}>
                                  {area.name} · {money(area.fee)}
                                </option>
                              ))}
                          </select>
                          <span className="mt-1 block text-xs font-normal text-slate-500">
                            Se o bairro estiver no endereço, vamos sugeri-lo automaticamente.
                            Confirme a seleção para calcular a entrega.
                          </span>
                        </label>
                      )}
                    </>
                  )}
                  <label className="block text-sm font-semibold">
                    Observações (opcional)
                    <textarea
                      maxLength={500}
                      rows={2}
                      value={orderNotes}
                      onChange={(event) => setOrderNotes(event.target.value)}
                      placeholder="Ex.: sem cebola, ponto da carne…"
                      className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Pagamento{" "}
                    {fulfillment === "delivery"
                      ? "na entrega"
                      : fulfillment === "pickup"
                        ? "na retirada"
                        : "no estabelecimento"}
                    <select
                      value={paymentMethod}
                      onChange={(event) =>
                        setPaymentMethod(
                          event.target.value as
                            | "cash"
                            | "pix"
                            | "card"
                            | "online_pix"
                            | "online_card",
                        )
                      }
                      className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal"
                    >
                      <option value="cash">Dinheiro</option>
                      <option value="pix">Pix</option>
                      {business?.onlinePaymentEnabled && (
                        <>
                          <option value="online_pix">Pix online (aprovação imediata via Asaas)</option>
                          {stripeCheckoutEnabled && (
                            <option value="online_card">Cartão online (Stripe)</option>
                          )}
                        </>
                      )}
                    </select>
                  </label>
                  <div className="space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{money(cartSubtotal)}</span>
                    </div>
                    {fulfillment === "delivery" && (
                      <div className="flex justify-between">
                        <span>Entrega</span>
                        <span>{deliveryFee ? money(deliveryFee) : "Grátis"}</span>
                      </div>
                    )}
                    {appliedCoupon && (
                      <div className="flex justify-between text-emerald-700">
                        <span>Desconto ({appliedCoupon.code})</span>
                        <span>−{money(appliedCoupon.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-extrabold">
                      <span>Total</span>
                      <span>
                        {money(cartSubtotal + deliveryFee - (appliedCoupon?.discountAmount ?? 0))}
                      </span>
                    </div>
                  </div>
                  {orderError && (
                    <p role="alert" className="text-sm text-red-700">
                      {orderError}
                    </p>
                  )}
                  <button
                    disabled={
                      orderBusy ||
                      !cartCount ||
                      (fulfillment === "delivery" &&
                        deliveryAreas.length > 0 &&
                        !selectedDeliveryArea)
                    }
                    className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#292b25] px-4 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {orderBusy ? "Enviando pedido…" : "Confirmar pedido"}
                    <Check size={16} />
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    {paymentMethod === "online_pix" || paymentMethod === "online_card"
                      ? "Pagamento processado com segurança pelo Stripe. A confirmação chega após a validação do pagamento."
                      : "O pagamento é combinado diretamente com o estabelecimento. Sem comissão da ELLO."}
                  </p>
                </form>
              </>
            )}
          </section>
        </div>
      )}

      {selected && (
        <div
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelected(null);
              setComplete(false);
            }
          }}
          className="fixed inset-0 z-50 grid place-items-end bg-slate-950/50 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-4"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            className="w-full max-w-lg rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-7"
          >
            <div className="mb-5 flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[.14em] text-[#778253]">
                  {complete ? "Solicitação registrada" : businessCopy.bookingAction}
                </div>
                <h2 id="booking-title" className="mt-1 text-xl font-extrabold">
                  {complete ? "Pronto, " + customerName + "!" : selected.name}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {complete
                    ? "Pedido registrado. O WhatsApp abre com a mensagem pronta para enviar."
                    : money(bookingPrice) + " · " + bookingDuration + " min"}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null);
                  setComplete(false);
                }}
                aria-label="Fechar"
                className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {complete ? (
              <div className="rounded-2xl bg-emerald-50 px-5 py-7 text-center">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check size={22} />
                </span>
                <p className="mt-3 text-sm font-bold text-emerald-900">
                  Pedido para{" "}
                  {new Date(date + "T12:00:00").toLocaleDateString("pt-BR", {
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  às {time}
                </p>
                <p className="mt-1 text-xs text-emerald-800/70">
                  Envie a mensagem no WhatsApp para confirmar o horário com o negócio.
                </p>
                {whatsappUrlAfterBooking && (
                  <a
                    href={whatsappUrlAfterBooking}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white"
                  >
                    Abrir WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className={`mt-5 rounded-xl border border-emerald-200 px-4 py-2.5 text-xs font-bold text-emerald-900 ${
                    whatsappUrlAfterBooking ? "ml-2" : ""
                  }`}
                >
                  Concluir
                </button>
              </div>
            ) : (
              <form onSubmit={(event) => void book(event)} className="space-y-4">
                {isHealthBusiness && (
                  <fieldset className="grid gap-3 sm:grid-cols-2">
                    <legend className="mb-2 text-xs font-bold text-slate-600">
                      Detalhes da consulta
                    </legend>
                    <label className="block text-xs font-semibold text-slate-600">
                      Tipo de atendimento
                      <select
                        value={visitType}
                        onChange={(event) =>
                          setVisitType(event.target.value as Booking["visitType"])
                        }
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-[#dedfd6] bg-white px-3 text-sm font-normal text-slate-800"
                      >
                        <option value="first_visit">Primeira consulta</option>
                        <option value="follow_up">Retorno</option>
                      </select>
                    </label>
                    <label className="block text-xs font-semibold text-slate-600">
                      Formato
                      <select
                        value={serviceMode}
                        onChange={(event) =>
                          setServiceMode(event.target.value as Booking["serviceMode"])
                        }
                        className="mt-1.5 min-h-11 w-full rounded-xl border border-[#dedfd6] bg-white px-3 text-sm font-normal text-slate-800"
                      >
                        {selectedHealthModes.map((mode) => (
                          <option key={mode.value} value={mode.value}>
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </fieldset>
                )}
                {isHealthBusiness && serviceMode === "in_person" && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <p className="text-xs font-bold text-slate-700">Local do atendimento</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {[business.address, business.city].filter(Boolean).join(" · ") ||
                        "Endereço a confirmar com o consultório"}
                    </p>
                  </div>
                )}
                {isHealthBusiness && serviceMode === "online" && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3">
                    <p className="text-xs font-bold text-emerald-900">
                      Atendimento online pelo WhatsApp
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-900/75">
                      Ao solicitar, o WhatsApp abrirá com este atendimento e o horário escolhido
                      para combinar os detalhes da consulta.
                    </p>
                  </div>
                )}
                {activeStaff.length > 0 && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">
                      Escolha a profissional
                    </span>
                    <select
                      required
                      value={selectedStaffId || activeStaff[0].id}
                      onChange={(event) => {
                        setSelectedStaffId(event.target.value);
                        setTime("");
                      }}
                      className="min-h-11 w-full rounded-xl border border-[#dedfd6] bg-white px-3.5 text-sm"
                    >
                      {activeStaff.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                          {member.specialty ? ` · ${member.specialty}` : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {(selected.addons ?? []).some((addon) => addon.active) && (
                  <fieldset className="rounded-xl border border-slate-200 p-3">
                    <legend className="px-1 text-xs font-bold text-slate-700">
                      Quer adicionar algo?
                    </legend>
                    <div className="space-y-2">
                      {(selected.addons ?? [])
                        .filter((addon) => addon.active)
                        .map((addon) => (
                          <label
                            key={addon.id}
                            className="flex min-h-10 items-center gap-2 text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={selectedAddonIds.includes(addon.id ?? "")}
                              onChange={(event) => {
                                const addonId = addon.id ?? "";
                                setSelectedAddonIds((current) =>
                                  event.target.checked
                                    ? [...current, addonId]
                                    : current.filter((id) => id !== addonId),
                                );
                                setTime("");
                              }}
                              className="size-4 accent-[#667448]"
                            />
                            <span className="min-w-0 flex-1">{addon.name}</span>
                            <span className="shrink-0 text-slate-500">
                              +{addon.duration} min · {money(addon.price)}
                            </span>
                          </label>
                        ))}
                    </div>
                  </fieldset>
                )}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    {businessCopy.customerInputLabel}
                  </span>
                  <input
                    required
                    autoFocus
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className="w-full rounded-xl border border-[#dedfd6] px-3.5 py-3 text-sm outline-none focus:border-[#8a9668] focus:ring-4 focus:ring-[#edf0e5]"
                    placeholder="Como podemos te chamar?"
                  />
                </label>
                <label className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                  <input
                    type="checkbox"
                    checked={reminderConsent}
                    onChange={(event) => setReminderConsent(event.target.checked)}
                    className="mt-1 size-4 shrink-0 accent-[#667448]"
                  />
                  <span>
                    Aceito receber lembretes de horário pelo WhatsApp. Esta autorização é opcional.
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold text-slate-600">
                    WhatsApp para confirmação
                  </span>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className="w-full rounded-xl border border-[#dedfd6] px-3.5 py-3 text-sm outline-none focus:border-[#8a9668] focus:ring-4 focus:ring-[#edf0e5]"
                    placeholder="(11) 99999-9999"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Data</span>
                    <input
                      required
                      type="date"
                      min={localDateKey(new Date())}
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setTime("");
                      }}
                      className="w-full rounded-xl border border-[#dedfd6] px-3 py-3 text-sm outline-none focus:border-[#8a9668]"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Horário</span>
                    <select
                      required
                      value={time}
                      onChange={(event) => setTime(event.target.value)}
                      className="w-full rounded-xl border border-[#dedfd6] bg-white px-3 py-3 text-sm outline-none focus:border-[#8a9668]"
                    >
                      <option value="">
                        {!date
                          ? "Selecione a data"
                          : availabilityLoading
                            ? "Buscando..."
                            : availableSlots.length
                              ? "Escolha"
                              : "Sem horários livres"}
                      </option>
                      {availableSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {availabilityError && (
                  <p role="alert" className="text-sm text-red-600">
                    {availabilityError}
                  </p>
                )}
                {isHealthBusiness &&
                  date &&
                  !availabilityLoading &&
                  !availableSlots.length &&
                  !availabilityError && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                      {waitlistAdded ? (
                        <p role="status" className="text-sm font-semibold text-emerald-800">
                          Você entrou na lista de espera. A clínica poderá entrar em contato se
                          surgir um horário.
                        </p>
                      ) : (
                        <>
                          <p className="text-sm font-bold text-amber-900">
                            Sem horário livre nessa data?
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-900/75">
                            Entre na lista de espera desta consulta; seu contato será usado apenas
                            para avisar sobre disponibilidade.
                          </p>
                          <label className="mt-3 block text-xs font-semibold text-slate-700">
                            Período preferido
                            <select
                              value={waitlistPeriod}
                              onChange={(event) =>
                                setWaitlistPeriod(event.target.value as typeof waitlistPeriod)
                              }
                              className="mt-1.5 min-h-10 w-full rounded-lg border border-amber-200 bg-white px-3 text-sm"
                            >
                              <option value="any">Qualquer período</option>
                              <option value="morning">Manhã</option>
                              <option value="afternoon">Tarde</option>
                              <option value="evening">Noite</option>
                            </select>
                          </label>
                          <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-700">
                            <input
                              type="checkbox"
                              checked={waitlistConsent}
                              onChange={(event) => setWaitlistConsent(event.target.checked)}
                              className="mt-1 size-4 shrink-0 accent-[#667448]"
                            />
                            <span>
                              Concordo em ser contatado pelo negócio exclusivamente sobre horários
                              desta lista de espera.
                            </span>
                          </label>
                          {waitlistError && (
                            <p role="alert" className="mt-2 text-xs text-red-700">
                              {waitlistError}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => void joinWaitlist()}
                            disabled={waitlistBusy}
                            className="mt-3 min-h-10 w-full rounded-lg border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 disabled:opacity-60"
                          >
                            {waitlistBusy ? "Adicionando…" : "Entrar na lista de espera"}
                          </button>
                        </>
                      )}
                    </div>
                  )}
                <p className="rounded-xl bg-slate-50 px-3.5 py-3 text-[11px] leading-5 text-slate-600">
                  Seu nome, WhatsApp e horário ficam registrados na agenda deste negócio para
                  responder à solicitação.{" "}
                  {isHealthBusiness && "Não informe sintomas nem dados clínicos neste formulário. "}
                  O horário só é confirmado depois que o negócio aceitar seu pedido pelo WhatsApp.
                  {business.bookingPolicy && (
                    <span className="mt-2 block border-t border-slate-200 pt-2">
                      Política do negócio: {business.bookingPolicy}
                    </span>
                  )}
                </p>
                {bookingError && (
                  <p role="alert" className="text-sm text-red-600">
                    {bookingError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={bookingBusy}
                  className="w-full rounded-xl bg-[#292b25] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#414338] disabled:opacity-60"
                >
                  {bookingBusy ? "Enviando..." : "Pedir agendamento"}
                </button>
                <p className="text-center text-[10px] leading-4 text-slate-400">
                  Seu pedido fica pendente até a loja confirmar.
                </p>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}
