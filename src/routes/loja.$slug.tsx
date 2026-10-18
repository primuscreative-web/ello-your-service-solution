import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calendar,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  Gift,
  Loader2,
  MapPin,
  MessageCircle,
  Minus,
  Moon,
  Package,
  Plus,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Sunrise,
  ThumbsUp,
  Star,
  UtensilsCrossed,
  X,
  Zap,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { money } from "@/components/localhub/ui";
import { ElloLogo } from "@/components/ello/logo";
import { useLocalHub, type Booking, type Service, type PortfolioItem } from "@/lib/localhub-context";
import { formatSetupChoice, getBusinessCopy, supportsAppointments } from "@/lib/localhub-business";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { fetchAddressFromCep, formatCep } from "@/lib/cities";
import { LuckyWheelModal } from "@/components/localhub/lucky-wheel";
import { PortfolioCard, PortfolioLightbox } from "@/components/localhub/portfolio-view";

export const Route = createFileRoute("/loja/$slug")({
  validateSearch: z.object({
    servico: z.string().optional(),
    campanha: z.string().optional(),
    cupom: z.string().max(40).optional(),
    mesa: z.string().max(10).optional(),
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
    mesa: requestedTable,
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
  const [orderCep, setOrderCep] = useState("");
  const [cepSearching, setCepSearching] = useState(false);
  const [needsCashChange, setNeedsCashChange] = useState<"no" | "yes" | "">("");
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [slotPeriodFilter, setSlotPeriodFilter] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [customDatePicker, setCustomDatePicker] = useState(false);
  const [customerMemoryLoaded, setCustomerMemoryLoaded] = useState(false);
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
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup" | "dine_in">(
    requestedTable ? "dine_in" : "delivery",
  );
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "pix" | "card" | "online_pix" | "online_card"
  >("cash");
  const [orderBusy, setOrderBusy] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [placedOrder, setPlacedOrder] = useState<{
    number: number;
    total: number;
    trackingToken: string;
  } | null>(null);
  const [welcomeWheelOpen, setWelcomeWheelOpen] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<PortfolioItem | null>(null);
  const [portfolioTagFilter, setPortfolioTagFilter] = useState("all");

  const business = store?.business ?? null;
  const deliveryAreas = store?.deliveryAreas ?? noDeliveryAreas;
  const services = store?.services ?? noServices;
  const activeStaff = (store?.staff ?? []).filter((member) => member.active);
  const galleryUrls = business?.galleryUrls ?? [];

  // Auto-exibição inteligente da Roleta de Boas-Vindas (Welcome Wheel)
  useEffect(() => {
    if (!business || typeof window === "undefined") return;
    const settings = business.wheelSettings;
    const isEnabled = settings?.enabled ?? true;
    const allowsWelcome =
      settings?.trigger === "welcome" ||
      settings?.trigger === "both" ||
      !settings?.trigger;

    if (!isEnabled || !allowsWelcome) return;

    try {
      const storageKey = `ello_wheel_welcome_${business.slug}`;
      const hasSpun = localStorage.getItem(storageKey);
      if (!hasSpun) {
        const timer = window.setTimeout(() => {
          setWelcomeWheelOpen(true);
        }, 1200);
        return () => window.clearTimeout(timer);
      }
    } catch {
      // ignore
    }
  }, [business]);

  // Auto-preenchimento inteligente com memória do cliente (localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedName = localStorage.getItem("ello_customer_name");
      const savedPhone = localStorage.getItem("ello_customer_phone");
      const savedAddress = localStorage.getItem("ello_customer_address");
      const savedCep = localStorage.getItem("ello_customer_cep");
      if (savedName) {
        setCustomerName((prev) => prev || savedName);
        setOrderName((prev) => prev || savedName);
      }
      if (savedPhone) {
        setPhone((prev) => prev || savedPhone);
        setOrderPhone((prev) => prev || savedPhone);
      }
      if (savedAddress) {
        setOrderAddress((prev) => prev || savedAddress);
      }
      if (savedCep) {
        setOrderCep((prev) => prev || savedCep);
      }
      if (savedName || savedPhone || savedAddress) {
        setCustomerMemoryLoaded(true);
      }
    } catch {
      // ignore
    }
  }, []);
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
  ].filter((mode) => business?.onboardingDetails?.serviceModes?.includes(mode.key));
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
    // Ordenar itens dentro de cada grupo por displayOrder se definido
    for (const [, items] of groups) {
      items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
    }
    const orderList = business?.menuCategoriesOrder ?? [];
    return [...groups.entries()]
      .sort(([first], [second]) => {
        const indexA = orderList.indexOf(first);
        const indexB = orderList.indexOf(second);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return first.localeCompare(second, "pt-BR", { sensitivity: "base" });
      })
      .map(([name, groupedServices]) => ({ name, services: groupedServices }));
  }, [activeServices, isFoodBusiness, business?.menuCategoriesOrder]);

  const featuredServices = useMemo(() => {
    if (!isFoodBusiness) return [];
    return activeServices
      .filter((service) => service.isFeatured || service.isPromotion)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [activeServices, isFoodBusiness]);

  useEffect(() => {
    if (!business || !isFoodBusiness) return;
    if (fulfillment === "delivery" && !business.acceptsDelivery) {
      const fallback = business.acceptsPickup
        ? "pickup"
        : business.acceptsDineIn
          ? "dine_in"
          : "delivery";
      if (fulfillment !== fallback) setFulfillment(fallback);
    } else if (fulfillment === "pickup" && !business.acceptsPickup) {
      const fallback = business.acceptsDelivery
        ? "delivery"
        : business.acceptsDineIn
          ? "dine_in"
          : "pickup";
      if (fulfillment !== fallback) setFulfillment(fallback);
    } else if (fulfillment === "dine_in" && !business.acceptsDineIn) {
      const fallback = business.acceptsDelivery ? "delivery" : "pickup";
      setFulfillment(fallback);
    }
  }, [business, fulfillment, isFoodBusiness]);
  const cartItems = useMemo(
    () => cart.filter((line) => activeServices.some((service) => service.id === line.service.id)),
    [activeServices, cart],
  );
  const cartCount = cartItems.reduce((sum, line) => sum + line.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, line) => {
    const baseItemPrice =
      line.service.isPromotion &&
      typeof line.service.promotionalPrice === "number" &&
      line.service.promotionalPrice > 0
        ? line.service.promotionalPrice
        : line.service.price;
    const variantDelta =
      line.service.productVariants?.find((variant) => variant.id === line.variantId)?.priceDelta ??
      0;
    const optionDelta = (line.service.optionGroups ?? [])
      .flatMap((group) => group.options)
      .filter((option) => line.optionIds.includes(option.id ?? ""))
      .reduce((total, option) => total + option.priceDelta, 0);
    return sum + (baseItemPrice + variantDelta + optionDelta) * line.quantity;
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

  const orderTotalToPay = useMemo(() => {
    return Math.max(0, cartSubtotal + deliveryFee - (appliedCoupon?.discountAmount ?? 0));
  }, [cartSubtotal, deliveryFee, appliedCoupon]);

  const suggestedCashValues = useMemo(() => {
    const rounded = Math.ceil(orderTotalToPay);
    const options: number[] = [];
    const next50 = Math.ceil((rounded + 1) / 50) * 50;
    const next100 = Math.ceil((rounded + 1) / 100) * 100;
    if (next50 > rounded) options.push(next50);
    if (next100 > rounded && next100 !== next50) options.push(next100);
    if (options.length < 2) {
      options.push(rounded + 10, rounded + 20);
    }
    return [...new Set(options)].sort((a, b) => a - b).slice(0, 3);
  }, [orderTotalToPay]);

  const upcomingDays = useMemo(() => {
    const days: {
      key: string;
      weekday: string;
      dayNum: string;
      month: string;
      isToday: boolean;
      isTomorrow: boolean;
    }[] = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
      const key = localDateKey(d);
      const dayNum = String(d.getDate()).padStart(2, "0");
      const month = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const weekday = isToday
        ? "Hoje"
        : isTomorrow
          ? "Amanhã"
          : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
      days.push({ key, weekday, dayNum, month, isToday, isTomorrow });
    }
    return days;
  }, []);

  const filteredSlots = useMemo(() => {
    if (slotPeriodFilter === "all") return availableSlots;
    return availableSlots.filter((slot) => {
      const hour = parseInt(slot.split(":")[0], 10);
      if (isNaN(hour)) return true;
      if (slotPeriodFilter === "morning") return hour < 12;
      if (slotPeriodFilter === "afternoon") return hour >= 12 && hour < 18;
      if (slotPeriodFilter === "evening") return hour >= 18;
      return true;
    });
  }, [availableSlots, slotPeriodFilter]);

  const morningCount = useMemo(
    () => availableSlots.filter((s) => parseInt(s.split(":")[0], 10) < 12).length,
    [availableSlots],
  );
  const afternoonCount = useMemo(
    () =>
      availableSlots.filter((s) => {
        const h = parseInt(s.split(":")[0], 10);
        return h >= 12 && h < 18;
      }).length,
    [availableSlots],
  );
  const eveningCount = useMemo(
    () => availableSlots.filter((s) => parseInt(s.split(":")[0], 10) >= 18).length,
    [availableSlots],
  );

  const gcalLink = useMemo(() => {
    if (!date || !time || !selected || !business) return "";
    try {
      const startDate = new Date(`${date}T${time}:00`);
      if (isNaN(startDate.getTime())) return "";
      const durationMs = (bookingDuration || 30) * 60 * 1000;
      const endDate = new Date(startDate.getTime() + durationMs);
      const formatGCal = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");
      const dates = `${formatGCal(startDate)}/${formatGCal(endDate)}`;
      const title = encodeURIComponent(`${selected.name} · ${business.name}`);
      const details = encodeURIComponent(
        `Agendamento: ${selected.name} (${bookingDuration} min)\n` +
          `Local: ${business.address ? `${business.address}, ${business.city}` : business.name}\n` +
          `Cliente: ${customerName}\n` +
          `WhatsApp: ${phone}\n` +
          `Agendado via ELLO`,
      );
      const location = encodeURIComponent(
        [business.address, business.city].filter(Boolean).join(", ") || business.name,
      );
      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
    } catch {
      return "";
    }
  }, [date, time, selected, business, bookingDuration, customerName, phone]);

  async function handleCepSearch(rawCep: string) {
    const formatted = formatCep(rawCep);
    setOrderCep(formatted);
    const digits = formatted.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCepSearching(true);
    try {
      const data = await fetchAddressFromCep(digits);
      if (data) {
        const existing = orderAddress.trim();
        if (!existing || existing.length < 5) {
          setOrderAddress(
            data.formattedAddress
              ? `${data.formattedAddress}, Nº `
              : `${data.street}, Nº , ${data.neighborhood} - ${data.city}`,
          );
        } else if (data.neighborhood && !existing.toLowerCase().includes(data.neighborhood.toLowerCase())) {
          setOrderAddress(`${existing} - ${data.neighborhood}`);
        }
        if (deliveryAreas.length > 0 && data.neighborhood) {
          const normN = data.neighborhood.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          const match = deliveryAreas.find((area) => {
            const normA = area.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
            return normN.includes(normA) || normA.includes(normN);
          });
          if (match) {
            setDeliveryAreaId(match.id);
            toast.success(`Bairro ${match.name} identificado (${money(match.fee)})`);
          }
        }
        toast.success("Endereço preenchido pelo CEP!");
      } else {
        toast.error("CEP não localizado. Preencha o endereço manualmente.");
      }
    } catch {
      // ignore
    } finally {
      setCepSearching(false);
    }
  }

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

    const trocoInfo =
      paymentMethod === "cash"
        ? needsCashChange === "yes" && cashChangeFor
          ? `[Troco para R$ ${cashChangeFor} · Devolver: ${money(Math.max(0, Number(cashChangeFor) - orderTotalToPay))}]`
          : needsCashChange === "no"
            ? "[Não precisa de troco - valor exato]"
            : ""
        : "";
    const effectiveNotes = [orderNotes.trim(), trocoInfo].filter(Boolean).join(" · ");

    try {
      const result = await createFoodOrder({
        slug: business.slug,
        customerName: orderName,
        phone: orderPhone,
        fulfillment,
        address: orderAddress,
        deliveryAreaId: fulfillment === "delivery" ? (selectedDeliveryArea?.id ?? null) : null,
        notes: effectiveNotes,
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

      // Salva dados na memória local do cliente para compras futuras
      try {
        if (orderName) localStorage.setItem("ello_customer_name", orderName.trim());
        if (orderPhone) localStorage.setItem("ello_customer_phone", orderPhone.trim());
        if (orderAddress) localStorage.setItem("ello_customer_address", orderAddress.trim());
        if (orderCep) localStorage.setItem("ello_customer_cep", orderCep.trim());
      } catch {
        // ignore
      }

      // Notificação ativa no WhatsApp (cliente e lojista) para todos os pedidos
      void fetch("/api/notifications/whatsapp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "order",
          order: {
            orderNumber: result.number,
            customerName: orderName.trim(),
            customerPhone: orderPhone.trim(),
            businessName: business.name,
            businessSlug: business.slug,
            trackingToken: result.trackingToken,
            status: "received",
            fulfillment,
            itemsSummary: cartItems.map((line) => `${line.quantity}x ${line.service.name}`).join(", "),
            total: result.total,
            deliveryAddress: orderAddress.trim(),
          },
          target: "customer",
        }),
      }).catch(() => {});

      if (business.phone) {
        void fetch("/api/notifications/whatsapp", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            type: "order",
            order: {
              orderNumber: result.number,
              customerName: orderName.trim(),
              customerPhone: orderPhone.trim(),
              businessName: business.name,
              businessSlug: business.slug,
              trackingToken: result.trackingToken,
              status: "received",
              fulfillment,
              itemsSummary: cartItems.map((line) => `${line.quantity}x ${line.service.name}`).join(", "),
              total: result.total,
              deliveryAddress: orderAddress.trim(),
            },
            target: "owner",
            ownerPhone: business.phone,
          }),
        }).catch(() => {});
      }

      setCart([]);

      if (paymentMethod === "online_pix") {
        const asaasResponse = await fetch("/api/asaas/charge", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orderId: result.id,
            trackingToken: result.trackingToken,
            billingType: "PIX",
          }),
        });
        const asaas = (await asaasResponse.json()) as { success?: boolean; error?: string };
        if (!asaasResponse.ok || !asaas.success) {
          throw new Error(asaas.error ?? "Não foi possível gerar a cobrança Pix.");
        }
        window.location.assign(`/pedido/${result.trackingToken}`);
        return;
      }
      if (paymentMethod === "online_card") {
        window.location.assign(`/pedido/${result.trackingToken}`);
        return;
      }
      setPlacedOrder({
        number: result.number,
        total: result.total,
        trackingToken: result.trackingToken,
      });
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
      try {
        if (customerName) localStorage.setItem("ello_customer_name", customerName.trim());
        if (phone) localStorage.setItem("ello_customer_phone", phone.trim());
      } catch {
        // ignore
      }
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
    <div className="min-h-screen bg-[#f5f4ed] pb-12 text-[#171914] antialiased">
      <header className="sticky top-0 z-40 ello-glass-dock">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            {isFoodBusiness && (
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  setOrderError("");
                  setCartOpen(true);
                }}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2 text-xs font-black text-[#171914] shadow-xs transition hover:border-[#b8bcad] hover:bg-[#fbfbf8] active:scale-95"
                aria-label="Abrir carrinho de compras"
              >
                <div className="relative">
                  <ShoppingBag size={15} className="text-[#586341]" />
                  {cartCount > 0 && (
                    <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-[#171914] text-[9px] font-black text-[#d4f455]">
                      {cartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline font-bold">Carrinho</span>
                {cartCount > 0 && (
                  <span className="font-mono font-black text-[#586341]">
                    {money(cartSubtotal)}
                  </span>
                )}
              </button>
            )}
            <Link to="/" className="flex items-center gap-1.5 opacity-85 hover:opacity-100 transition" aria-label="ELLO">
              <ElloLogo tone="dark" height={20} />
            </Link>
          </div>

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
                  toast.success("Link da loja copiado para a área de transferência!");
                  setTimeout(() => setShareCopied(false), 2500);
                }
              }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98]"
            >
              {shareCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{shareCopied ? "Copiado!" : "Compartilhar"}</span>
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/70"
              >
                <MessageCircle size={15} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6">
        {isFoodBusiness ? (
          /* Layout Gastronômico Estilo InstaDelivery: Banner + Logo Centralizada */
          <section className="mt-4 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xs">
            <div
              className="relative h-36 w-full bg-[#292b25] bg-cover bg-center sm:h-52"
              style={
                business.bannerUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%), url("${business.bannerUrl}")`,
                    }
                  : {
                      background: "linear-gradient(135deg, #2b2e24 0%, #444a38 100%)",
                    }
              }
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>

            {/* Logo Centralizada no estilo InstaDelivery */}
            <div className="relative -mt-14 px-4 pb-6 sm:-mt-16 sm:px-8">
              <div className="flex flex-col items-center text-center">
                <div className="size-24 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl sm:size-28">
                  {business.logoUrl ? (
                    <img
                      src={business.logoUrl}
                      alt={business.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center bg-[#edf0e5] text-[#586341]">
                      <UtensilsCrossed size={34} />
                    </div>
                  )}
                </div>

                <h1 className="mt-3.5 font-display text-2xl font-black tracking-tight text-[#292b25] sm:text-3xl">
                  {business.name}
                </h1>

                {business.description && (
                  <p className="mt-1.5 max-w-xl text-xs leading-5 text-slate-500 sm:text-sm">
                    {business.description}
                  </p>
                )}

                {/* Badges de Informação & Status */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
                    Aberto agora
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                    <Clock3 size={13} className="text-slate-500" />
                    35 – 50 min
                  </span>
                  {requestedTable && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-3 py-1 text-xs font-bold text-purple-900 shadow-2xs">
                      🍽️ Mesa {requestedTable}
                    </span>
                  )}
                  {business.acceptsDelivery && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Entrega
                    </span>
                  )}
                  {business.acceptsPickup && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      Retirada
                    </span>
                  )}
                  {business.onlinePaymentEnabled && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      <Zap size={13} className="text-amber-600" />
                      Pix Online
                    </span>
                  )}
                </div>

                {business.city && (
                  <div className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400">
                    <MapPin size={13} />
                    <span>
                      {business.address ? `${business.address} · ` : ""}
                      {business.city}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* Layout Padrão para Clínicas, Salões e Serviços */
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
              <div className="flex items-center gap-3">
                {business.logoUrl && (
                  <img
                    src={business.logoUrl}
                    alt={business.name}
                    className="size-14 rounded-full border-2 border-white/30 object-cover shadow-md"
                  />
                )}
                <div>
                  <h1 className="font-display text-4xl font-semibold tracking-[-.05em] sm:text-5xl">
                    {business.name}
                  </h1>
                </div>
              </div>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/70">
                {business.description ||
                  (hasAppointments
                    ? `Conheça nossos ${businessCopy.offers} e escolha o melhor horário para você.`
                    : "Conheça nossos serviços e fale diretamente com o estabelecimento.")}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
                  <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                  Aberto agora
                </span>
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
                  {hasAppointments ? "Agendamento online" : "Fale com o estabelecimento"}
                </span>
              </div>
            </div>
          </section>
        )}
        {/* SEÇÃO RICA DE PORTFÓLIO E TRABALHOS (FOTOS, VÍDEOS & ANTES/DEPOIS) */}
        {((business.portfolioItems && business.portfolioItems.length > 0) || galleryUrls.length > 0) && (
          <section className="mt-7" aria-label="Portfólio de trabalhos">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#768452]">
                  Resultados Reais & Procedimentos
                </p>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-black text-[#171914]">
                  Galeria & Portfólio de Trabalhos
                </h2>
              </div>
              <span className="text-xs font-bold text-[#727568]">
                {business.portfolioItems?.length || galleryUrls.length} trabalhos apresentados
              </span>
            </div>

            {/* Filtros por Categoria/Mídia se houver itens estruturados */}
            {business.portfolioItems && business.portfolioItems.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {[
                  { id: "all", label: "Todos" },
                  ...(business.portfolioItems.some((i) => i.mediaType === "before_after")
                    ? [{ id: "before_after", label: "Antes & Depois" }]
                    : []),
                  ...(business.portfolioItems.some((i) => i.mediaType === "video")
                    ? [{ id: "video", label: "Vídeos & Reels" }]
                    : []),
                  ...(business.portfolioItems.some((i) => i.featured)
                    ? [{ id: "featured", label: "Destaques" }]
                    : []),
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPortfolioTagFilter(f.id)}
                    className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                      portfolioTagFilter === f.id
                        ? "bg-[#171914] text-white shadow-xs"
                        : "border border-[#dedfd6] bg-white text-[#55584d] hover:bg-[#f6f5ee]"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Grade de Trabalhos Estruturados */}
            {business.portfolioItems && business.portfolioItems.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {business.portfolioItems
                  .filter((item) => {
                    if (portfolioTagFilter === "all") return true;
                    if (portfolioTagFilter === "before_after") return item.mediaType === "before_after";
                    if (portfolioTagFilter === "video") return item.mediaType === "video";
                    if (portfolioTagFilter === "featured") return item.featured;
                    return true;
                  })
                  .map((item) => {
                    const linked = activeServices.find((s) => s.id === item.serviceId);
                    return (
                      <PortfolioCard
                        key={item.id}
                        item={item}
                        linkedService={linked}
                        onOpenLightbox={(selected) => setLightboxItem(selected)}
                        onSelectService={(service) => {
                          setSelected(service);
                          const el = document.getElementById("booking-schedule") || document.getElementById("catalog-section");
                          el?.scrollIntoView({ behavior: "smooth" });
                          toast.success(`Serviço "${service.name}" selecionado para agendamento!`);
                        }}
                      />
                    );
                  })}
              </div>
            ) : (
              /* Fallback para fotos simples em galleryUrls */
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5">
                {galleryUrls.map((imageUrl, index) => (
                  <figure
                    key={imageUrl}
                    onClick={() =>
                      setLightboxItem({
                        id: `gal_${index}`,
                        title: `Trabalho ${index + 1}`,
                        mediaType: "image",
                        mediaUrl: imageUrl,
                      })
                    }
                    className="cursor-pointer overflow-hidden rounded-2xl bg-slate-100 group aspect-square"
                  >
                    <img
                      src={imageUrl}
                      alt={`Trabalho ${index + 1} de ${business.name}`}
                      loading="lazy"
                      className="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </figure>
                ))}
              </div>
            )}
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
        {Boolean(
          business.onboardingDetails?.specialties?.length ||
            business.onboardingDetails?.serviceModes?.length,
        ) && (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold">Como podemos atender você</h2>
            {Boolean(business.onboardingDetails?.specialties?.length) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-500">Especialidades</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {(business.onboardingDetails?.specialties || []).map((specialty) => (
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
            {Boolean(business.onboardingDetails?.serviceModes?.length) && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-slate-500">Formas de atendimento</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {(business.onboardingDetails?.serviceModes || []).map((mode) => (
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
              {/* Navegação Sticky de Grupos / Categorias */}
              {isFoodBusiness && (menuGroups.length > 1 || featuredServices.length > 0) && (
                <nav
                  aria-label="Categorias do cardápio"
                  className="sticky top-14 z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-y border-slate-200/80 bg-[#f5f4ef]/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6"
                >
                  {featuredServices.length > 0 && (
                    <a
                      href="#menu-destaques"
                      className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3.5 py-1.5 text-xs font-bold text-rose-800 shadow-2xs transition hover:bg-rose-100 active:scale-95"
                    >
                      <Sparkles size={13} className="text-rose-600" />
                      Promoções do Dia
                    </a>
                  )}
                  {menuGroups.map((group, index) => (
                    <a
                      key={group.name}
                      href={`#menu-category-${index}`}
                      className="inline-flex min-h-9 shrink-0 items-center rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:border-[#a5b280] hover:bg-[#edf0e5] active:scale-95"
                    >
                      {group.name}
                    </a>
                  ))}
                </nav>
              )}

              {/* Seção Especial: Destaques & Promoções do Dia (Acima dos grupos) */}
              {isFoodBusiness && featuredServices.length > 0 && (
                <section id="menu-destaques" className="mb-8 scroll-mt-28">
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 place-items-center rounded-lg bg-rose-100 text-rose-700">
                        <Sparkles size={16} />
                      </span>
                      <div>
                        <h3 className="font-display text-base font-extrabold text-[#292b25] sm:text-lg">
                          Destaques & Promoções do Dia
                        </h3>
                        <p className="text-xs text-slate-500">
                          Ofertas especiais selecionadas para você hoje
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                      {featuredServices.length} {featuredServices.length === 1 ? "oferta" : "ofertas"}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {featuredServices.map((service) => {
                      const inCartQty = cart
                        .filter((line) => line.service.id === service.id)
                        .reduce((sum, line) => sum + line.quantity, 0);
                      const isPromo = Boolean(
                        service.isPromotion &&
                          typeof service.promotionalPrice === "number" &&
                          service.promotionalPrice > 0,
                      );
                      return (
                        <article
                          key={`featured-${service.id}`}
                          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-rose-200/80 bg-gradient-to-b from-rose-50/30 to-white p-4 shadow-xs transition-all duration-200 hover:border-rose-300 hover:shadow-md"
                        >
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-rose-800">
                                  {service.promotionBadge || (isPromo ? "Oferta do Dia" : "Destaque")}
                                </span>
                              </div>
                              <h4 className="font-bold text-[#292b25] sm:text-base">{service.name}</h4>
                              <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-500">
                                {service.description || "Adicione ao pedido online."}
                              </p>
                            </div>
                            {service.imageUrl && (
                              <img
                                src={service.imageUrl}
                                alt={service.name}
                                loading="lazy"
                                className="size-20 shrink-0 rounded-xl object-cover shadow-2xs transition-transform duration-200 group-hover:scale-[1.02] sm:size-24"
                              />
                            )}
                          </div>

                          <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div>
                              {isPromo ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-base font-black tracking-tight text-rose-600 sm:text-lg">
                                    {money(service.promotionalPrice!)}
                                  </span>
                                  <span className="text-xs text-slate-400 line-through">
                                    {money(service.price)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-base font-black tracking-tight text-[#292b25] sm:text-lg">
                                  {money(service.price)}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              {inCartQty > 0 && (
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
                                    className="grid size-8 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-2xs hover:bg-slate-50 active:scale-95"
                                  >
                                    <Minus size={13} />
                                  </button>
                                  <span className="min-w-4 text-center text-xs font-bold">
                                    {inCartQty}
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
                                className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-xl bg-[#292b25] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#3d4036] active:scale-95"
                              >
                                <Plus size={13} />
                                <span>Adicionar</span>
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Grupos do Cardápio / Serviços */}
              <div className="space-y-8">
                {menuGroups.map((group, groupIndex) => (
                  <section
                    key={group.name || "offers"}
                    id={isFoodBusiness ? `menu-category-${groupIndex}` : undefined}
                    className="scroll-mt-28"
                  >
                    {isFoodBusiness && (
                      <div className="mb-3 flex items-center justify-between border-b border-slate-200/60 pb-2">
                        <h3 className="font-display text-base font-extrabold text-[#292b25] sm:text-lg">
                          {group.name}
                        </h3>
                        <span className="text-xs text-slate-400">
                          {group.services.length} {group.services.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                    )}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {group.services.map((service) => {
                        const inCartQty = isFoodBusiness
                          ? cart
                              .filter((line) => line.service.id === service.id)
                              .reduce((sum, line) => sum + line.quantity, 0)
                          : 0;
                        const isPromo = Boolean(
                          service.isPromotion &&
                            typeof service.promotionalPrice === "number" &&
                            service.promotionalPrice > 0,
                        );
                        return (
                          <article
                            key={service.id}
                            className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs transition-all duration-200 hover:border-[#a5b280] hover:shadow-md"
                          >
                            <div className="flex gap-3">
                              <div className="min-w-0 flex-1">
                                {(isPromo || service.isFeatured) && (
                                  <div className="mb-1">
                                    <span
                                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        isPromo
                                          ? "bg-rose-100 text-rose-800"
                                          : "bg-amber-100 text-amber-800"
                                      }`}
                                    >
                                      {service.promotionBadge ||
                                        (isPromo ? "🔥 Promoção" : "⭐ Destaque")}
                                    </span>
                                  </div>
                                )}
                                <h3 className="font-bold text-[#292b25]">{service.name}</h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                                  {service.description ||
                                    (isFoodBusiness
                                      ? "Preparado com cuidado. Adicione ao pedido online."
                                      : "Atendimento pensado para você.")}
                                </p>
                              </div>
                              {isFoodBusiness && service.imageUrl && (
                                <img
                                  src={service.imageUrl}
                                  alt={service.name}
                                  loading="lazy"
                                  className="size-20 shrink-0 rounded-xl object-cover shadow-2xs transition-transform duration-200 group-hover:scale-[1.02] sm:size-24"
                                />
                              )}
                            </div>

                            <div className="mt-3.5 flex items-center justify-between border-t border-slate-100 pt-3">
                              <div>
                                {isPromo ? (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="text-base font-black tracking-tight text-rose-600 sm:text-lg">
                                      {money(service.promotionalPrice!)}
                                    </span>
                                    <span className="text-xs text-slate-400 line-through">
                                      {money(service.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-base font-black tracking-tight text-[#292b25] sm:text-lg">
                                    {money(service.price)}
                                  </div>
                                )}
                                {!isFoodBusiness && (
                                  <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                                    <Clock3 size={12} />
                                    {service.duration} minutos
                                  </div>
                                )}
                              </div>
                              {isFoodBusiness ? (
                                <div className="flex items-center gap-1.5">
                                  {inCartQty > 0 && (
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
                                        className="grid size-8 place-items-center rounded-full border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95"
                                      >
                                        <Minus size={13} />
                                      </button>
                                      <span className="min-w-4 text-center text-xs font-bold">
                                        {inCartQty}
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
                                    className="cursor-pointer inline-flex min-h-8 items-center gap-1.5 rounded-xl bg-[#292b25] px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition hover:bg-[#3d4036] active:scale-95"
                                  >
                                    <Plus size={13} />
                                    <span>Adicionar</span>
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
                                  className="cursor-pointer inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white shadow-2xs transition hover:bg-[#3d4036] active:scale-95"
                                >
                                  {businessCopy.bookingAction}
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
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

        <StoreReviewsSection
          businessSlug={business.slug}
          businessName={business.name}
          isFood={isFoodBusiness}
        />

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
          className="fixed inset-x-4 bottom-5 z-40 mx-auto flex min-h-14 max-w-2xl cursor-pointer items-center justify-between rounded-2xl border border-white/20 bg-[#292b25]/95 px-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.99]"
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
          className="fixed inset-0 z-50 overflow-hidden"
        >
          {/* Overlay escurecido com blur */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => !orderBusy && setCartOpen(false)}
          />

          <div className="absolute inset-y-0 right-0 flex max-w-full pl-4 sm:pl-10">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="food-checkout-title"
              className="w-screen max-w-md bg-[#181a15] border-l border-white/10 shadow-2xl flex flex-col text-white"
            >
              {/* Header da Gaveta */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#141611]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#d0f25a]/10 text-[#d0f25a]">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="food-checkout-title" className="text-base font-bold text-white font-display">
                      {placedOrder ? "Pedido Recebido" : "Sua Sacola"}
                    </h3>
                    <p className="text-xs text-white/50">
                      {placedOrder ? `Pedido #${placedOrder.number}` : `${cartCount} itens adicionados`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  aria-label="Fechar"
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white/70 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {placedOrder ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center space-y-3">
                    <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <CheckCircle2 size={26} />
                    </span>
                    <div>
                      <span className="inline-block rounded-full bg-emerald-500/20 text-emerald-300 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider mb-1">
                        Pedido Confirmado
                      </span>
                      <h4 className="font-display text-lg font-bold text-white">
                        Seu pedido foi enviado para {business?.name}
                      </h4>
                      <p className="text-xs text-white/70 mt-1">
                        Total: <span className="font-mono text-[#d0f25a] font-bold">{money(placedOrder.total)}</span> · pagamento{" "}
                        {fulfillment === "delivery"
                          ? "na entrega"
                          : fulfillment === "pickup"
                            ? "na retirada"
                            : "no estabelecimento"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5">
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
                          className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-bold text-white shadow-sm transition cursor-pointer"
                        >
                          <MessageCircle size={16} />
                          <span>Enviar comprovante no WhatsApp da loja</span>
                        </a>
                      );
                    })()}

                    <Link
                      to="/pedido/$token"
                      params={{ token: placedOrder.trackingToken }}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 px-4 text-xs font-bold text-white transition border border-white/10 cursor-pointer"
                    >
                      <Gift size={16} className="text-amber-400" />
                      <span>Acompanhar Pedido ao Vivo</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setCartOpen(false)}
                      className="rounded-xl bg-white/5 hover:bg-white/10 px-5 py-3 text-xs font-semibold text-white/70 hover:text-white transition cursor-pointer"
                    >
                      Voltar ao cardápio
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Lista de Itens */}
                    <div className="space-y-2.5">
                      {cartItems.map((line) => {
                        const service = line.service;
                        const variant = service.productVariants?.find((item) => item.id === line.variantId);
                        const chosenOptions = (service.optionGroups ?? [])
                          .flatMap((group) => group.options)
                          .filter((option) => line.optionIds.includes(option.id ?? ""));
                        const unitPrice =
                          service.price +
                          (variant?.priceDelta ?? 0) +
                          chosenOptions.reduce((sum, option) => sum + option.priceDelta, 0);
                        return (
                          <div
                            key={line.key}
                            className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-semibold text-white">{service.name}</h4>
                              <p className="text-[11px] text-white/50">
                                {[variant?.name, ...chosenOptions.map((item) => item.name)].filter(Boolean).join(" · ") || "Padrão"}
                              </p>
                              <span className="text-xs font-bold text-[#d0f25a] font-mono mt-0.5 block">
                                {money(unitPrice * line.quantity)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                aria-label={`Diminuir ${service.name}`}
                                onClick={() => setFoodCartQuantity(line.key, line.quantity - 1)}
                                className="grid size-7 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="min-w-5 text-center text-xs font-bold font-mono">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                aria-label={`Aumentar ${service.name}`}
                                onClick={() => setFoodCartQuantity(line.key, line.quantity + 1)}
                                className="grid size-7 place-items-center rounded-lg border border-white/15 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Sugestões de Adicionais (Cross-sell) */}
                    {otherSuggestions.length > 0 && (
                      <div className="border-t border-white/10 pt-3">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50">
                          <Sparkles size={12} className="text-[#d0f25a]" />
                          <span>Peça também</span>
                        </div>
                        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
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
                              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-2 text-left transition hover:border-[#d0f25a]/30 hover:bg-white/[0.05] cursor-pointer"
                            >
                              {suggested.imageUrl ? (
                                <img src={suggested.imageUrl} alt="" className="size-8 rounded-lg object-cover" />
                              ) : (
                                <div className="grid size-8 place-items-center rounded-lg bg-white/5 text-white/40">
                                  <UtensilsCrossed size={12} />
                                </div>
                              )}
                              <div className="max-w-[100px]">
                                <p className="truncate text-[11px] font-semibold text-white">{suggested.name}</p>
                                <p className="text-[10px] font-mono text-[#d0f25a]">+{money(suggested.price)}</p>
                              </div>
                              <span className="grid size-5 place-items-center rounded-full bg-[#d0f25a]/20 text-[#d0f25a] text-[10px] font-bold">
                                +
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Formulário de Dados */}
                    <form id="food-checkout-form" onSubmit={(event) => void placeFoodOrder(event)} className="space-y-4 border-t border-white/10 pt-4">
                      {/* Como receber */}
                      <div>
                        <label className="mb-1.5 text-xs font-semibold text-white/80 block">Como receber?</label>
                        <div className="grid grid-cols-2 gap-2">
                          {business?.acceptsDelivery !== false && (
                            <button
                              type="button"
                              onClick={() => setFulfillment("delivery")}
                              className={`min-h-10 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                fulfillment === "delivery"
                                  ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611] font-bold shadow-xs"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              Entrega
                            </button>
                          )}
                          {business?.acceptsPickup !== false && (
                            <button
                              type="button"
                              onClick={() => setFulfillment("pickup")}
                              className={`min-h-10 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                fulfillment === "pickup"
                                  ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611] font-bold shadow-xs"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              Retirada
                            </button>
                          )}
                          {business?.acceptsDineIn && (
                            <button
                              type="button"
                              onClick={() => setFulfillment("dine_in")}
                              className={`min-h-10 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                fulfillment === "dine_in"
                                  ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611] font-bold shadow-xs"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              Consumir no local
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Nome e WhatsApp */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-[11px] font-semibold text-white/80 block mb-1">Seu nome *</label>
                          <input
                            required
                            minLength={2}
                            maxLength={100}
                            autoComplete="name"
                            value={orderName}
                            onChange={(event) => setOrderName(event.target.value)}
                            placeholder="Nome completo"
                            className="w-full min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder-white/40 focus:border-[#d0f25a] focus:outline-hidden transition"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-white/80 block mb-1">WhatsApp *</label>
                          <input
                            required
                            type="tel"
                            autoComplete="tel"
                            value={orderPhone}
                            onChange={(event) => {
                              if (event.target.value !== orderPhone && recoveryConsent) setRecoveryConsent(false);
                              setOrderPhone(event.target.value);
                              setCouponMessage("");
                            }}
                            placeholder="(00) 00000-0000"
                            className="w-full min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder-white/40 focus:border-[#d0f25a] focus:outline-hidden transition"
                          />
                        </div>
                      </div>

                      {/* Endereço se entrega */}
                      {fulfillment === "delivery" && (
                        <div className="space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-1">
                              <label className="text-[11px] font-semibold text-white/80 block mb-1">CEP (opcional)</label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={orderCep}
                                  onChange={(e) => void handleCepSearch(e.target.value)}
                                  placeholder="00000-000"
                                  maxLength={9}
                                  className="w-full min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 pr-8 text-xs text-white placeholder-white/40 focus:border-[#d0f25a] focus:outline-hidden transition font-mono"
                                />
                                {cepSearching && (
                                  <Loader2 size={14} className="absolute right-2.5 top-3 animate-spin text-white/50" />
                                )}
                              </div>
                            </div>
                            <div className="sm:col-span-2">
                              <label className="text-[11px] font-semibold text-white/80 block mb-1">Endereço e Número *</label>
                              <input
                                required
                                minLength={6}
                                autoComplete="street-address"
                                value={orderAddress}
                                onChange={(event) => {
                                  setOrderAddress(event.target.value);
                                  setDeliveryAreaId("");
                                }}
                                placeholder="Rua, número, complemento"
                                className="w-full min-h-10 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder-white/40 focus:border-[#d0f25a] focus:outline-hidden transition"
                              />
                            </div>
                          </div>

                          {deliveryAreas.length > 0 && (
                            <div>
                              <label className="text-[11px] font-semibold text-white/80 block mb-1">Bairro *</label>
                              <select
                                required
                                value={deliveryAreaId}
                                onChange={(event) => setDeliveryAreaId(event.target.value)}
                                className="w-full min-h-10 rounded-xl border border-white/15 bg-[#1f221b] px-3 text-xs text-white focus:border-[#d0f25a] focus:outline-hidden transition cursor-pointer"
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
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cupom de desconto */}
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <label htmlFor="food-coupon-code" className="text-[11px] font-semibold text-white/80 block mb-1">
                          Cupom de desconto
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="food-coupon-code"
                            value={couponCode}
                            onChange={(event) => {
                              setCouponCode(event.target.value.toUpperCase().replace(/\s/g, ""));
                              setCouponMessage("");
                            }}
                            placeholder="CUPOM"
                            maxLength={40}
                            className="min-h-9 flex-1 rounded-xl border border-white/15 bg-white/5 px-3 text-xs text-white placeholder-white/40 font-mono uppercase focus:border-[#d0f25a] focus:outline-hidden"
                          />
                          <button
                            type="button"
                            onClick={() => void applyFoodCoupon()}
                            disabled={couponBusy || !couponCode.trim() || !orderPhone.trim() || !cartCount}
                            className="min-h-9 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20 disabled:opacity-50 transition cursor-pointer"
                          >
                            {couponBusy ? "Validando…" : appliedCoupon ? "Atualizar" : "Aplicar"}
                          </button>
                        </div>
                        {couponMessage && (!couponPreview || appliedCoupon) && (
                          <p className={`mt-1.5 text-[11px] ${appliedCoupon ? "text-emerald-400" : "text-rose-400"}`}>
                            {couponMessage}
                          </p>
                        )}
                      </div>

                      {/* Observações */}
                      <div>
                        <label className="text-[11px] font-semibold text-white/80 block mb-1">Observações (opcional)</label>
                        <textarea
                          maxLength={500}
                          rows={2}
                          value={orderNotes}
                          onChange={(event) => setOrderNotes(event.target.value)}
                          placeholder="Ex.: sem cebola, ponto da carne, interfone…"
                          className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-white placeholder-white/40 focus:border-[#d0f25a] focus:outline-hidden transition"
                        />
                      </div>

                      {/* Forma de Pagamento */}
                      <div>
                        <label className="text-[11px] font-semibold text-white/80 block mb-1">Forma de Pagamento</label>
                        <select
                          value={paymentMethod}
                          onChange={(event) =>
                            setPaymentMethod(
                              event.target.value as "cash" | "pix" | "card" | "online_pix" | "online_card",
                            )
                          }
                          className="w-full min-h-10 rounded-xl border border-white/15 bg-[#1f221b] px-3 text-xs text-white focus:border-[#d0f25a] focus:outline-hidden transition cursor-pointer"
                        >
                          <option value="pix">Pix (chave no app ou entrega)</option>
                          <option value="cash">Dinheiro</option>
                          <option value="card">Cartão na entrega (Maquininha)</option>
                          {business?.onlinePaymentEnabled && (
                            <>
                              <option value="online_pix">Pix Online Imediato (Asaas QR Code)</option>
                              <option value="online_card">Cartão de Crédito Online (Asaas)</option>
                            </>
                          )}
                        </select>
                      </div>

                      {/* Troco se dinheiro */}
                      {paymentMethod === "cash" && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white/80">Precisa de troco?</span>
                            <span className="text-xs font-mono text-[#d0f25a]">Total: {money(orderTotalToPay)}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setNeedsCashChange("no");
                                setCashChangeFor("");
                              }}
                              className={`min-h-9 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                needsCashChange === "no"
                                  ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611] font-bold"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              Não preciso de troco
                            </button>
                            <button
                              type="button"
                              onClick={() => setNeedsCashChange("yes")}
                              className={`min-h-9 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                                needsCashChange === "yes"
                                  ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611] font-bold"
                                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                              }`}
                            >
                              Sim, preciso de troco
                            </button>
                          </div>

                          {needsCashChange === "yes" && (
                            <div className="space-y-1.5 pt-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] text-white/60">Troco para:</span>
                                {suggestedCashValues.map((val) => (
                                  <button
                                    key={val}
                                    type="button"
                                    onClick={() => setCashChangeFor(String(val))}
                                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold border transition cursor-pointer ${
                                      cashChangeFor === String(val)
                                        ? "border-[#d0f25a] bg-[#d0f25a] text-[#141611]"
                                        : "border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
                                    }`}
                                  >
                                    R$ {val}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-xs text-white/50">Ou digite: R$</span>
                                <input
                                  type="number"
                                  min={Math.ceil(orderTotalToPay)}
                                  step="1"
                                  placeholder="50"
                                  value={cashChangeFor}
                                  onChange={(e) => setCashChangeFor(e.target.value)}
                                  className="min-h-8 w-24 rounded-lg border border-white/15 bg-white/5 px-2.5 text-xs font-mono text-white"
                                />
                                {Number(cashChangeFor) > orderTotalToPay && (
                                  <span className="text-xs font-mono text-emerald-400 font-bold">
                                    Troco: {money(Number(cashChangeFor) - orderTotalToPay)}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Resumo de Valores */}
                      <div className="rounded-2xl bg-white/[0.02] p-4 border border-white/[0.06] space-y-2">
                        <div className="flex justify-between text-xs text-white/60">
                          <span>Subtotal</span>
                          <span className="font-mono text-white">{money(cartSubtotal)}</span>
                        </div>
                        {fulfillment === "delivery" && (
                          <div className="flex justify-between text-xs text-white/60">
                            <span>Taxa de Entrega</span>
                            <span className="font-mono text-white">{deliveryFee ? money(deliveryFee) : "Grátis"}</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between text-xs text-emerald-400">
                            <span>Desconto ({appliedCoupon.code})</span>
                            <span className="font-mono">−{money(appliedCoupon.discountAmount)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
                          <span>Total a Pagar</span>
                          <span className="font-mono text-[#d0f25a] text-base">
                            {money(cartSubtotal + deliveryFee - (appliedCoupon?.discountAmount ?? 0))}
                          </span>
                        </div>
                      </div>

                      {orderError && (
                        <p role="alert" className="text-xs text-rose-400">
                          {orderError}
                        </p>
                      )}
                    </form>
                  </div>

                  {/* Footer Fixo da Gaveta */}
                  <div className="p-5 border-t border-white/10 bg-[#141611]">
                    <button
                      type="submit"
                      form="food-checkout-form"
                      disabled={
                        orderBusy ||
                        !cartCount ||
                        (fulfillment === "delivery" && deliveryAreas.length > 0 && !selectedDeliveryArea)
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#d0f25a] hover:bg-[#d9f863] active:scale-[0.98] py-3.5 text-sm font-bold text-[#141611] transition-all shadow-lg shadow-[#d0f25a]/20 cursor-pointer disabled:opacity-50"
                    >
                      {orderBusy ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Enviando Pedido...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirmar e Enviar Pedido</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-white/40 pt-2 flex items-center justify-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-400" />
                      <span>Pedido direto com o estabelecimento. Sem intermediários.</span>
                    </p>
                  </div>
                </>
              )}
            </section>
          </div>
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
                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  {whatsappUrlAfterBooking && (
                    <a
                      href={whatsappUrlAfterBooking}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-800"
                    >
                      <MessageCircle size={15} />
                      Abrir WhatsApp
                    </a>
                  )}
                  {gcalLink && (
                    <a
                      href={gcalLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-xs font-bold text-emerald-900 shadow-xs transition hover:bg-emerald-50"
                    >
                      <Calendar size={15} />
                      Salvar no Google Agenda
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const summary = [
                        `Agendamento em ${business?.name}:`,
                        `Serviço: ${selected?.name}`,
                        `Data: ${new Date(date + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })} às ${time}`,
                        `Cliente: ${customerName}`,
                        `WhatsApp: ${phone}`,
                      ].join("\n");
                      void navigator.clipboard.writeText(summary);
                      toast.success("Resumo copiado!");
                    }}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
                  >
                    <Copy size={14} />
                    Copiar resumo
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="mt-4 text-xs font-semibold text-slate-500 underline hover:text-slate-800"
                >
                  Concluir e fechar
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
                {customerMemoryLoaded && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-[#edf0e5]/70 px-3 py-1.5 text-[11px] font-medium text-[#586341]">
                    <Sparkles size={12} className="shrink-0 text-[#778253]" />
                    <span>Seus dados foram preenchidos com seu histórico.</span>
                  </div>
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

                {/* Carrossel de datas ("Pílulas de Dias") */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Escolha o dia</span>
                    <button
                      type="button"
                      onClick={() => setCustomDatePicker(!customDatePicker)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#778253] hover:underline"
                    >
                      <Calendar size={12} />
                      {customDatePicker ? "Ver carrossel" : "Outra data..."}
                    </button>
                  </div>

                  {customDatePicker ? (
                    <input
                      required
                      type="date"
                      min={localDateKey(new Date())}
                      value={date}
                      onChange={(event) => {
                        setDate(event.target.value);
                        setTime("");
                      }}
                      className="w-full rounded-xl border border-[#dedfd6] px-3.5 py-2.5 text-sm outline-none focus:border-[#8a9668]"
                    />
                  ) : (
                    <div className="flex gap-2 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar">
                      {upcomingDays.map((day) => {
                        const isSelected = date === day.key;
                        return (
                          <button
                            key={day.key}
                            type="button"
                            onClick={() => {
                              setDate(day.key);
                              setTime("");
                            }}
                            className={`flex min-w-[70px] shrink-0 flex-col items-center rounded-xl border px-2.5 py-2 text-center transition-all ${
                              isSelected
                                ? "border-[#292b25] bg-[#292b25] text-white shadow-md ring-2 ring-[#778253]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-[#778253] hover:bg-[#edf0e5]/40"
                            }`}
                          >
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider ${
                                isSelected ? "text-[#d0f25a]" : "text-slate-400"
                              }`}
                            >
                              {day.weekday}
                            </span>
                            <span className="text-base font-extrabold leading-tight">{day.dayNum}</span>
                            <span
                              className={`text-[10px] font-medium ${isSelected ? "text-slate-200" : "text-slate-500"}`}
                            >
                              {day.month}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Horários disponíveis com abas de período */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-600">Horário disponível</span>
                    {availableSlots.length > 0 && (
                      <span className="text-[11px] font-semibold text-[#778253]">
                        {availableSlots.length} horário{availableSlots.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Tabs de período */}
                  {availableSlots.length > 0 && (
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSlotPeriodFilter("all")}
                        className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                          slotPeriodFilter === "all"
                            ? "bg-[#292b25] text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Todos ({availableSlots.length})
                      </button>
                      {morningCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setSlotPeriodFilter("morning")}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                            slotPeriodFilter === "morning"
                              ? "bg-[#292b25] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Sunrise size={12} />
                          Manhã ({morningCount})
                        </button>
                      )}
                      {afternoonCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setSlotPeriodFilter("afternoon")}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                            slotPeriodFilter === "afternoon"
                              ? "bg-[#292b25] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Sun size={12} />
                          Tarde ({afternoonCount})
                        </button>
                      )}
                      {eveningCount > 0 && (
                        <button
                          type="button"
                          onClick={() => setSlotPeriodFilter("evening")}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 font-semibold transition ${
                            slotPeriodFilter === "evening"
                              ? "bg-[#292b25] text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          <Moon size={12} />
                          Noite ({eveningCount})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Grade interativa de horários */}
                  {!date ? (
                    <div className="rounded-xl border border-dashed border-slate-200 p-3.5 text-center text-xs text-slate-400">
                      Selecione um dia acima para visualizar os horários disponíveis.
                    </div>
                  ) : availabilityLoading ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                      ))}
                    </div>
                  ) : filteredSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-0.5">
                      {filteredSlots.map((slot) => {
                        const isSelected = time === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setTime(slot)}
                            className={`flex min-h-10 items-center justify-center rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "border-[#292b25] bg-[#292b25] text-white shadow-xs ring-2 ring-[#778253]"
                                : "border-slate-200 bg-white text-slate-700 hover:border-[#778253] hover:bg-[#edf0e5]/40"
                            }`}
                          >
                            {slot}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3 text-center text-xs text-amber-800">
                      Nenhum horário disponível para o filtro selecionado neste dia.
                    </div>
                  )}

                  <input type="hidden" required value={time} />
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
      {/* Gatilho Flutuante da Roleta de Boas-Vindas */}
      {business &&
        (business.wheelSettings?.enabled ?? true) &&
        (business.wheelSettings?.trigger === "welcome" ||
          business.wheelSettings?.trigger === "both" ||
          !business.wheelSettings?.trigger) && (
          <button
            type="button"
            onClick={() => setWelcomeWheelOpen(true)}
            aria-label="Abrir roleta de prêmios"
            className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full border border-amber-300 bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-2 text-xs font-black text-white shadow-lg shadow-amber-900/20 transition-all hover:scale-105 active:scale-95 sm:bottom-6 sm:left-6"
          >
            <span className="text-base">🎰</span>
            <span className="hidden xs:inline sm:inline">Girar Roleta</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">Prêmios</span>
          </button>
        )}

      {/* Modal da Roleta de Boas-Vindas */}
      {business && (
        <LuckyWheelModal
          isOpen={welcomeWheelOpen}
          onClose={() => setWelcomeWheelOpen(false)}
          settings={business.wheelSettings}
          businessName={business.name}
          businessSlug={business.slug}
          businessCategory={business.category}
          mode="welcome"
          onApplyCoupon={(code) => {
            setCouponCode(code);
            toast.success(`🎉 Cupom "${code}" ativado com sucesso! Adicione itens e aproveite seu desconto.`);
            setWelcomeWheelOpen(false);
            if (cart.length > 0 && !cartOpen) {
              setCartOpen(true);
            }
          }}
        />
      )}

      {/* Modal Lightbox de Visualização em Tela Cheia do Portfólio */}
      <PortfolioLightbox
        item={lightboxItem}
        linkedService={activeServices.find((s) => s.id === lightboxItem?.serviceId)}
        onClose={() => setLightboxItem(null)}
        onSelectService={(service) => {
          setSelected(service);
          const el = document.getElementById("booking-schedule") || document.getElementById("catalog-section");
          el?.scrollIntoView({ behavior: "smooth" });
          toast.success(`Serviço "${service.name}" selecionado para agendamento!`);
        }}
      />
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

type ReviewItem = {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

const initialFoodReviews: ReviewItem[] = [
  {
    id: "rev-1",
    author: "Matheus Silveira",
    rating: 5,
    date: "há 2 dias",
    comment: "Melhor hambúrguer da região! Chegou muito rápido, quentinho e a batata rústica estava super crocante.",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Camila Rocha",
    rating: 5,
    date: "há 5 dias",
    comment: "Ponto da carne perfeito e embalagem impecável. Parabéns pelo capricho no delivery!",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Lucas Ferreira",
    rating: 5,
    date: "há 1 semana",
    comment: "Entrega super rápida com motoboy educado. O molho da casa é um show à parte.",
    verified: true,
  },
];

const initialServiceReviews: ReviewItem[] = [
  {
    id: "rev-1",
    author: "Juliana Mendes",
    rating: 5,
    date: "há 3 dias",
    comment: "Atendimento maravilhoso e super pontual. O espaço é acolhedor e o resultado ficou perfeito!",
    verified: true,
  },
  {
    id: "rev-2",
    author: "Fernanda Costa",
    rating: 5,
    date: "há 6 dias",
    comment: "Profissional extremamente cuidadosa e atenciosa. Já agendei meu retorno direto pela página!",
    verified: true,
  },
  {
    id: "rev-3",
    author: "Beatriz Lima",
    rating: 5,
    date: "há 1 semana",
    comment: "Amei a facilidade de escolher o horário direto na agenda online. Recomendo muito!",
    verified: true,
  },
];

function StoreReviewsSection({
  businessSlug,
  businessName,
  isFood,
}: {
  businessSlug: string;
  businessName: string;
  isFood: boolean;
}) {
  const storageKey = `ello_reviews_${businessSlug}`;
  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    if (typeof window === "undefined") return isFood ? initialFoodReviews : initialServiceReviews;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as ReviewItem[];
    } catch {}
    return isFood ? initialFoodReviews : initialServiceReviews;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formAuthor, setFormAuthor] = useState("");
  const [formComment, setFormComment] = useState("");
  const [hoverRating, setHoverRating] = useState(0);

  const averageRating = useMemo(() => {
    if (!reviews.length) return 5.0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  function handleAddReview(e: FormEvent) {
    e.preventDefault();
    if (!formAuthor.trim() || !formComment.trim()) return;

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      author: formAuthor.trim(),
      rating: formRating,
      date: "hoje",
      comment: formComment.trim(),
      verified: true,
    };

    const updated = [newRev, ...reviews];
    setReviews(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch {}
    }

    setFormAuthor("");
    setFormComment("");
    setFormRating(5);
    setModalOpen(false);
  }

  return (
    <section className="mt-12 rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs sm:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
            <ThumbsUp size={13} />
            <span>98% de clientes recomendam</span>
          </div>
          <h2 className="mt-2.5 font-display text-2xl font-bold tracking-tight text-[#292b25]">
            Avaliações de Clientes
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Experiências reais de clientes que pediram ou agendaram no {businessName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-[#edf0e5]/80 px-4 py-2 border border-[#d6dcce]/60">
            <span className="font-display text-2xl font-black text-[#454e33]">{averageRating}</span>
            <div>
              <div className="flex text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className="fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <span className="text-[11px] font-semibold text-slate-600">
                {reviews.length} avaliações
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#292b25] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#3d4036]"
          >
            <Star size={14} /> Deixar avaliação
          </button>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((rev) => (
          <div
            key={rev.id}
            className="flex flex-col justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:bg-slate-50 hover:shadow-2xs"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-full bg-[#edf0e5] text-xs font-bold text-[#586341]">
                    {rev.author.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <span className="block text-xs font-bold text-slate-900 leading-tight">
                      {rev.author}
                    </span>
                    <span className="text-[10px] text-slate-400">{rev.date}</span>
                  </div>
                </div>

                <div className="flex text-amber-400">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={12}
                      className={
                        i <= rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-slate-200 text-slate-200"
                      }
                    />
                  ))}
                </div>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-slate-600">
                "{rev.comment}"
              </p>
            </div>

            {rev.verified && (
              <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                <Check size={12} /> Cliente verificado
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="font-display text-xl font-bold text-[#292b25]">
              Avaliar {businessName}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Conte sua experiência com o atendimento, pontualidade e qualidade.
            </p>

            <form onSubmit={handleAddReview} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sua nota
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setFormRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={
                          star <= (hoverRating || formRating)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-slate-200 text-slate-200"
                        }
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-700">
                    {hoverRating || formRating} de 5 estrelas
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Seu nome *
                </label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Ex.: Mariana Souza"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#778253] focus:ring-2 focus:ring-[#edf0e5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Seu comentário *
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={300}
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="O que você mais gostou no atendimento ou no pedido?"
                  className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#778253] focus:ring-2 focus:ring-[#edf0e5]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#292b25] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#3d4036]"
                >
                  Publicar avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
}

