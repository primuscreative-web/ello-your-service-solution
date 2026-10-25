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
  Pencil,
  Share2,
  ShoppingBag,
  Sparkles,
  Store,
  Sun,
  Sunrise,
  UtensilsCrossed,
  X,
  Zap,
  QrCode,
  RefreshCw,
  ShieldCheck,
  ArrowRight,
  Search,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import { money } from "@/components/localhub/ui";
import { ElloLogo } from "@/components/ello/logo";
import {
  useLocalHub,
  type Booking,
  type Business,
  type Service,
  type PortfolioItem,
} from "@/lib/localhub-context";
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
  head: ({ match }) => {
    const slug = String(match.params.slug ?? "");
    const title = `Cardápio e serviços — ${slug} | ELLO`;
    const description = `Confira cardápio, serviços, horários e informações de ${slug} na ELLO.`;
    const url = `https://ello.app.br/loja/${encodeURIComponent(slug)}`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:image", content: "https://ello.app.br/images/ello/ello-logo-dark.png" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "index, follow, max-image-preview:large" },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
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
const foodDayLabels = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"] as const;
const noDeliveryAreas: NonNullable<Awaited<ReturnType<typeof useLocalHub>>["deliveryAreas"]> = [];
const noServices: Service[] = [];
function StudioEditAnchor({
  enabled,
  section,
  label,
  serviceId,
}: {
  enabled: boolean;
  section: string;
  label: string;
  serviceId?: string;
}) {
  if (!enabled) return null;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage(
          { type: "ello:studio-edit-target", section, serviceId },
          window.location.origin,
        );
      }}
      aria-label={label}
      title={label}
      className="absolute right-2 top-2 z-40 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/50 bg-[#171914]/90 px-3 text-[11px] font-bold text-white shadow-lg backdrop-blur transition hover:bg-[#34382b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d4f455]"
    >
      <Pencil size={13} /> Editar
    </button>
  );
}

function FoodPromoCarousel({ images, editing = false }: { images: string[]; editing?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const slides = images.filter(Boolean).slice(0, 3);

  useEffect(() => {
    if (slides.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  return (
    <section className="food-promo-carousel mt-5" aria-label="Banners promocionais">
      <div className="food-promo-frame relative isolate overflow-hidden rounded-2xl">
        <StudioEditAnchor enabled={editing} section="media" label="Editar fotos e vídeos" />
        {slides.map((image, index) => (
          <a
            key={image}
            href="#food-menu"
            aria-label={`Banner promocional ${index + 1}: ver cardápio`}
            aria-hidden={index !== activeIndex}
            tabIndex={index === activeIndex ? 0 : -1}
            className={`food-promo-slide absolute inset-0 block transition-opacity duration-500 ${index === activeIndex ? "is-active" : ""}`}
          >
            <img src={image} alt="" className="size-full object-cover" loading={index === 0 ? "eager" : "lazy"} />
            <span className="food-promo-overlay absolute inset-0" />
            <span className="food-promo-cta absolute bottom-3 left-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-bold sm:bottom-5 sm:left-5 sm:min-h-10 sm:px-4 sm:text-sm">
              Ver cardápio <ChevronRight size={16} />
            </span>
          </a>
        ))}
        {slides.length > 1 && (
          <div className="food-promo-controls absolute bottom-3 right-3 flex items-center gap-2 sm:bottom-5 sm:right-5" aria-label="Selecionar banner">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Mostrar banner ${index + 1}`}
                aria-current={index === activeIndex}
                className={`food-promo-dot ${index === activeIndex ? "is-active" : ""}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

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
    business: ownerBusiness,
    services: ownerServices,
    deliveryAreas: ownerDeliveryAreas,
    staff: ownerStaff,
  } = useLocalHub();
  const [store, setStore] = useState<Awaited<ReturnType<typeof getPublicStore>>>(null);
  const [studioPreviewActive, setStudioPreviewActive] = useState(false);
  const [studioEditing, setStudioEditing] = useState(false);
  const [studioDraftStore, setStudioDraftStore] = useState<{
    business: Business;
    services: Service[];
  } | null>(null);
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
  const [rememberCustomerDetails, setRememberCustomerDetails] = useState(false);
  const [hasStoredCustomerDetails, setHasStoredCustomerDetails] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const [activeFoodSection, setActiveFoodSection] = useState("menu-destaques");
  const featuredStripRef = useRef<HTMLDivElement>(null);
  const [scheduleClock, setScheduleClock] = useState(0);
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

  const business = studioDraftStore?.business ?? (studioPreviewActive ? ownerBusiness : store?.business) ?? null;
  const deliveryAreas = store?.deliveryAreas ?? noDeliveryAreas;
  const services = studioDraftStore?.services ?? (studioPreviewActive ? ownerServices : store?.services) ?? noServices;
  const activeStaff = (studioPreviewActive ? ownerStaff : store?.staff ?? []).filter((member) => member.active);
  const galleryUrls = business?.galleryUrls ?? [];

  // Auto-exibição inteligente da Roleta de Boas-Vindas (Welcome Wheel)
  useEffect(() => {
    if (!business || typeof window === "undefined" || studioPreviewActive) return;
    const settings = business.wheelSettings;
    const isEnabled = settings?.enabled === true;
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
  }, [business, studioPreviewActive]);

  // Auto-preenchimento inteligente com memória do cliente (localStorage)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const hasConsent = localStorage.getItem("ello_remember_customer_details") === "true";
      const savedName = localStorage.getItem("ello_customer_name");
      const savedPhone = localStorage.getItem("ello_customer_phone");
      const savedAddress = localStorage.getItem("ello_customer_address");
      const savedCep = localStorage.getItem("ello_customer_cep");
      setHasStoredCustomerDetails(Boolean(savedName || savedPhone || savedAddress || savedCep));
      if (!hasConsent) {
        return;
      }
      setRememberCustomerDetails(true);
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

  function updateRememberCustomerDetails(remember: boolean) {
    setRememberCustomerDetails(remember);
    try {
      if (remember) {
        localStorage.setItem("ello_remember_customer_details", "true");
      } else {
        localStorage.removeItem("ello_remember_customer_details");
        for (const key of ["ello_customer_name", "ello_customer_phone", "ello_customer_address", "ello_customer_cep"]) {
          localStorage.removeItem(key);
        }
        setHasStoredCustomerDetails(false);
        setCustomerMemoryLoaded(false);
      }
    } catch {
      // A preferência continua válida durante esta sessão se o navegador bloquear armazenamento.
    }
  }
  useEffect(() => {
    const isStudioPreview = new URLSearchParams(window.location.search).get("studioPreview") === "1";
    setStudioPreviewActive(isStudioPreview);
    const receiveStudioMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return;
      if (event.data?.type === "ello:studio-preview-update" && event.data.business) {
        setStudioDraftStore({ business: event.data.business, services: event.data.services ?? [] });
      }
      if (event.data?.type === "ello:studio-edit-mode") {
        setStudioEditing(Boolean(event.data.enabled));
      }
    };
    window.addEventListener("message", receiveStudioMessage);
    return () => window.removeEventListener("message", receiveStudioMessage);
  }, []);

  useEffect(() => {
    let active = true;
    if (studioPreviewActive && ownerBusiness?.slug === slug) {
      setStore({
        business: ownerBusiness,
        services: ownerServices,
        deliveryAreas: ownerDeliveryAreas,
        staff: ownerStaff,
      });
      setLoadError("");
      setLoading(false);
      return () => {
        active = false;
      };
    }
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
  }, [getPublicStore, ownerBusiness, ownerDeliveryAreas, ownerServices, ownerStaff, slug, studioPreviewActive]);

  useEffect(() => {
    if (!business?.name) return;
    document.title = `${business.name} — Cardápio e serviços | ELLO`;
    const description = business.description?.trim()
      ? business.description.trim().slice(0, 300)
      : `Confira cardápio, serviços, horários e informações de ${business.name} na ELLO.`;
    const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string) => {
      let element = document.head.querySelector<HTMLMetaElement>(selector);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, key);
        document.head.append(element);
      }
      element.content = content;
    };
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", document.title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", window.location.origin + window.location.pathname);
    if (business.bannerUrl) setMeta('meta[property="og:image"]', "property", "og:image", business.bannerUrl);
  }, [business?.bannerUrl, business?.description, business?.name]);

  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);
  const normalizedMenuSearch = normalizeMenuText(menuSearch.trim());
  const isFoodBusiness = business?.category === "alimentacao";
  useEffect(() => {
    const timer = window.setInterval(() => setScheduleClock(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const foodStoreStatus = useMemo(() => {
    if (!business?.openingHours) return null;
    const now = new Date(scheduleClock || Date.now());
    const todayKey = String(now.getDay() === 0 ? 7 : now.getDay());
    const today = business.openingHours[todayKey];
    const toMinutes = (value?: string | null) => {
      if (!value || !/^\d{2}:\d{2}$/.test(value)) return null;
      const [hours, minutes] = value.split(":").map(Number);
      return hours * 60 + minutes;
    };
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openAt = toMinutes(today?.open);
    const closeAt = toMinutes(today?.close);
    const breakStart = toMinutes(today?.breakStart);
    const breakEnd = toMinutes(today?.breakEnd);
    const isOpen = Boolean(
      today && !today.closed && openAt !== null && closeAt !== null &&
      currentMinutes >= openAt && currentMinutes < closeAt &&
      !(breakStart !== null && breakEnd !== null && currentMinutes >= breakStart && currentMinutes < breakEnd),
    );
    if (isOpen) return { isOpen, label: "Aberto agora", next: "" };
    if (breakStart !== null && breakEnd !== null && currentMinutes >= breakStart && currentMinutes < breakEnd) {
      return { isOpen, label: "Em intervalo", next: `Volta às ${today?.breakEnd}` };
    }

    for (let offset = 0; offset < 7; offset += 1) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      const dayKey = String(date.getDay() === 0 ? 7 : date.getDay());
      const hours = business.openingHours[dayKey];
      const openingMinutes = toMinutes(hours?.open);
      if (!hours || hours.closed || openingMinutes === null) continue;
      if (offset === 0 && openingMinutes <= currentMinutes) continue;
      const day = offset === 0 ? "hoje" : offset === 1 ? "amanhã" : foodDayLabels[date.getDay()];
      return { isOpen, label: "Fechado", next: `Abre ${day} às ${hours.open}` };
    }
    return { isOpen, label: "Fechado", next: "Consulte os horários" };
  }, [business?.openingHours, scheduleClock]);
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
        const normalizedFirst = normalizeMenuText(first);
        const normalizedSecond = normalizeMenuText(second);
        const firstIsMainDish = /hamburg|burger/.test(normalizedFirst);
        const secondIsMainDish = /hamburg|burger/.test(normalizedSecond);
        if (firstIsMainDish !== secondIsMainDish) return firstIsMainDish ? -1 : 1;
        const indexA = orderList.indexOf(first);
        const indexB = orderList.indexOf(second);
        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        return first.localeCompare(second, "pt-BR", { sensitivity: "base" });
      })
      .map(([name, groupedServices]) => ({ name, services: groupedServices }))
      .map((group) => ({
        ...group,
        services: normalizedMenuSearch
          ? group.services.filter((service) => normalizeMenuText(`${service.name} ${service.description ?? ""}`).includes(normalizedMenuSearch))
          : group.services,
      }))
      .filter((group) => group.services.length > 0);
  }, [activeServices, isFoodBusiness, business?.menuCategoriesOrder, normalizedMenuSearch]);

  const featuredServices = useMemo(() => {
    if (!isFoodBusiness) return [];
    return activeServices
      .filter((service) => service.isFeatured || service.isPromotion)
      .filter((service) => !normalizedMenuSearch)
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }, [activeServices, isFoodBusiness, normalizedMenuSearch]);

  useEffect(() => {
    if (!isFoodBusiness || typeof IntersectionObserver === "undefined") return;
    const sectionIds = [
      ...(featuredServices.length ? ["menu-destaques"] : []),
      ...menuGroups.map((_, index) => `menu-category-${index}`),
    ];
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
        if (visible) setActiveFoodSection(visible.target.id);
      },
      { rootMargin: "-150px 0px -62% 0px", threshold: [0, 0.15, 0.35] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [isFoodBusiness, menuGroups, featuredServices.length]);

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
  const hasActiveDeliveryAreas = deliveryAreas.some((area) => area.active);
  const deliveryFeeNeedsArea = fulfillment === "delivery" && hasActiveDeliveryAreas && !selectedDeliveryArea;
  const deliveryFee =
    fulfillment === "delivery"
      ? (selectedDeliveryArea?.fee ?? (hasActiveDeliveryAreas ? 0 : (business?.deliveryFee ?? 0)))
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

      if (rememberCustomerDetails) {
        try {
          localStorage.setItem("ello_customer_name", orderName.trim());
          localStorage.setItem("ello_customer_phone", orderPhone.trim());
          localStorage.setItem("ello_customer_address", orderAddress.trim());
          localStorage.setItem("ello_customer_cep", orderCep.trim());
        } catch {
          // O armazenamento local é opcional após a confirmação do pedido.
        }
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
      if (rememberCustomerDetails) {
        try {
          localStorage.setItem("ello_customer_name", customerName.trim());
          localStorage.setItem("ello_customer_phone", phone.trim());
        } catch {
          // A confirmação do agendamento não depende do armazenamento local.
        }
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
          <ElloLogo tone="dark" height={28} className="mx-auto mb-4" />
          <Store className="mx-auto text-[#778253]" size={30} />
          <h1 className="mt-4 text-2xl font-bold">
            {loadError ? "Cardápio temporariamente indisponível" : "Página não encontrada"}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {loadError
              ? "Não foi possível carregar os dados agora. Tente novamente em instantes."
              : "Confira o link ou crie sua página ELLO."}
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
    <div className={isFoodBusiness ? "ello-food-store min-h-screen pb-12 antialiased" : "min-h-screen bg-[#f5f4ed] pb-12 text-[#171914] antialiased"}>
      <header className={`sticky top-0 z-40 ello-glass-dock ${isFoodBusiness ? "food-store-header" : ""}`}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          {isFoodBusiness && (
            <div className="flex items-center gap-2.5 sm:gap-3.5">
              <button
                type="button"
                onClick={() => {
                  setPlacedOrder(null);
                  setOrderError("");
                  setCartOpen(true);
                }}
                className="food-header-action inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#dedfd6] bg-white px-3.5 py-2 text-xs font-black text-[#171914] shadow-xs transition hover:border-[#b8bcad] hover:bg-[#fbfbf8] active:scale-95"
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
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={async () => {
                const shareUrl = `${window.location.origin}${window.location.pathname}`;
                const markCopied = () => {
                  setShareCopied(true);
                  toast.success("Link da loja copiado!");
                  window.setTimeout(() => setShareCopied(false), 2500);
                };
                const copyWithFallback = async () => {
                  try {
                    if (navigator.clipboard?.writeText) {
                      await navigator.clipboard.writeText(shareUrl);
                      markCopied();
                      return true;
                    }
                  } catch {
                    // A Clipboard API pode estar indisponível no navegador incorporado.
                  }
                  const input = document.createElement("textarea");
                  input.value = shareUrl;
                  input.setAttribute("readonly", "");
                  input.style.position = "fixed";
                  input.style.opacity = "0";
                  document.body.appendChild(input);
                  input.select();
                  const copied = document.execCommand("copy");
                  input.remove();
                  if (copied) markCopied();
                  return copied;
                };

                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: business.name,
                      text: business.description || `Conheça ${business.name} na ELLO`,
                      url: shareUrl,
                    });
                    return;
                  } catch (error) {
                    if (error instanceof DOMException && error.name === "AbortError") return;
                  }
                }
                if (!(await copyWithFallback())) toast.error("Não foi possível copiar o link. Tente copiar pela barra de endereço.");
              }}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 active:scale-[0.98] ${isFoodBusiness ? "food-header-action" : ""}`}
              aria-label={shareCopied ? "Link copiado" : `Compartilhar ${business.name}`}
            >
              {shareCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
              <span className="hidden sm:inline">{shareCopied ? "Copiado!" : "Compartilhar"}</span>
            </button>
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100/70 ${isFoodBusiness ? "food-header-action" : ""}`}
              >
                <MessageCircle size={15} />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 sm:px-6 ${isFoodBusiness ? "max-w-6xl" : "max-w-5xl"}`}>
        {isFoodBusiness ? (
          <section className="food-store-overview mt-3 overflow-hidden rounded-2xl">
            <div
              className={`food-store-cover relative w-full bg-[#181a15] bg-cover bg-center ${business.bannerUrl ? "h-40 sm:h-64" : "h-36 sm:h-56"} ${studioEditing ? "is-editing" : ""}`}
              style={
                business.bannerUrl
                  ? {
                      backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.45) 100%), url("${business.bannerUrl}")`,
                    }
                  : {
                      background: "linear-gradient(135deg, #22251d 0%, #3a4030 100%)",
                    }
              }
            >
              {studioEditing && (
                <button
                  type="button"
                  onClick={() => window.parent.postMessage({ type: "ello:studio-edit-target", section: "media" }, window.location.origin)}
                  aria-label="Editar imagem ou vídeo de capa"
                  className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 text-sm font-bold text-white opacity-0 transition hover:opacity-100 focus:opacity-100"
                >
                  <span className="rounded-full bg-[#171914]/90 px-4 py-2 shadow-lg"><Pencil size={14} className="mr-2 inline" />Editar imagem ou vídeo</span>
                </button>
              )}
              <StudioEditAnchor enabled={studioEditing} section="media" label="Editar capa, logo, fotos e vídeos" />
              <div className="food-store-identity absolute inset-x-3 bottom-3 z-20 flex items-center gap-2 sm:inset-x-6 sm:bottom-4 sm:max-w-2xl">
                <button
                  type="button"
                  onClick={() => studioEditing && window.parent.postMessage({ type: "ello:studio-edit-target", section: "media" }, window.location.origin)}
                  aria-label={studioEditing ? "Editar foto de perfil" : undefined}
                  className={`food-store-logo relative size-12 shrink-0 overflow-hidden rounded-full sm:size-14 ${studioEditing ? "cursor-pointer ring-2 ring-[#d4f455] ring-offset-2 ring-offset-black/30" : ""}`}
                >
                  {business.logoUrl ? (
                    <img src={business.logoUrl} alt={business.name} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center bg-[#d0f25a] text-[#141611]"><UtensilsCrossed size={20} /></div>
                  )}
                  {studioEditing && <Pencil size={14} className="absolute bottom-0 right-0 rounded-full bg-[#d4f455] p-0.5 text-black" />}
                </button>
                <div className="min-w-0 flex-1">
                  <h1 className="font-display text-base font-black tracking-tight text-white sm:text-lg">{business.name}</h1>
                  {business.description && <p className="mt-1 whitespace-normal break-words text-xs leading-5 text-white/90 sm:text-sm sm:leading-6">{business.description}</p>}
                </div>
              </div>
            </div>
            <div className="food-store-meta flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 sm:px-6">
              {foodStoreStatus && (
                <span className={`food-store-status inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${foodStoreStatus.isOpen ? "is-open" : "is-closed"}`}>
                  <span aria-hidden="true" className="size-2 rounded-full bg-current" />
                  {foodStoreStatus.label}
                  {foodStoreStatus.next && <span className="font-medium opacity-80">· {foodStoreStatus.next}</span>}
                </span>
              )}
              {business.city && (
                <a
                  className="food-store-meta-item inline-flex items-center gap-1.5 text-xs"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent([business.address, business.city].filter(Boolean).join(", "))}`}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Traçar rota até ${business.name}, ${business.address ? `${business.address}, ` : ""}${business.city}`}
                >
                  <MapPin size={14} />{business.city}<ExternalLink size={12} aria-hidden="true" />
                </a>
              )}
              {requestedTable && <span className="food-store-meta-item inline-flex items-center gap-1.5 text-xs"><UtensilsCrossed size={14} />Mesa {requestedTable}</span>}
              <div className="flex flex-wrap gap-1.5 sm:ml-auto">
                {business.acceptsDelivery && <span className="food-store-mode rounded-full px-2.5 py-1 text-[11px] font-semibold">Entrega</span>}
                {business.acceptsPickup && <span className="food-store-mode rounded-full px-2.5 py-1 text-[11px] font-semibold">Retirada</span>}
                {business.acceptsDineIn && <span className="food-store-mode rounded-full px-2.5 py-1 text-[11px] font-semibold">Consumo no local</span>}
                {business.onlinePaymentEnabled && <span className="food-store-mode online-payment inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"><Zap size={12} />Pagamento online</span>}
              </div>
              <button type="button" onClick={() => document.getElementById("store-details")?.scrollIntoView({ behavior: "smooth", block: "start" })} className="food-store-info-link ml-auto inline-flex min-h-9 items-center gap-1 text-xs font-bold sm:ml-0">Mais informações <ChevronRight size={14} /></button>
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
            <StudioEditAnchor enabled={studioEditing} section="media" label="Editar capa, logo, fotos e vídeos" />
            <button
              type="button"
              onClick={() => window.parent.postMessage({ type: "ello:studio-edit-target", section: "profile" }, window.location.origin)}
              className={studioEditing ? "absolute right-3 top-14 z-40 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-white/50 bg-[#171914]/90 px-3 text-[11px] font-bold text-white shadow-lg backdrop-blur" : "hidden"}
            >
              <Pencil size={13} /> Editar perfil
            </button>
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
              {business.onlinePaymentEnabled && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                    <Zap size={13} className="text-amber-300" />
                    Pix Online imediato
                  </span>
                </div>
              )}
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
        {((business.portfolioItems && business.portfolioItems.length > 0) || (!isFoodBusiness && galleryUrls.length > 0)) && (
          <section className="relative mt-7" aria-label="Portfólio de trabalhos">
            <StudioEditAnchor enabled={studioEditing} section="media" label="Editar fotos e vídeos" />
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
        <details id={isFoodBusiness ? "store-details" : undefined} open={!isFoodBusiness} className={`mt-5 group ${isFoodBusiness ? "food-store-details" : ""}`}>
          <summary className={`flex min-h-12 cursor-pointer list-none items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 font-display text-sm font-bold text-[#292b25] [&::-webkit-details-marker]:hidden ${isFoodBusiness ? "food-detail-summary" : ""}`}>
            <span>{isFoodBusiness ? "Horários e atendimento" : "Informações de atendimento"}</span>
            <ChevronRight size={17} className="text-slate-400 transition-transform group-open:rotate-90" />
          </summary>
          <div className="space-y-1">
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
        <section className={`relative mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 ${isFoodBusiness ? "food-detail-panel" : ""}`}>
          <StudioEditAnchor enabled={studioEditing} section="hours" label="Editar horários" />
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
                  className={`flex items-start justify-between gap-3 border-b border-slate-100 py-2.5 text-xs ${isFoodBusiness ? "food-hour-row" : ""}`}
                >
                  <span className="font-medium text-slate-700">{label}</span>
              <span className={`${isClosed ? "text-slate-400" : "text-slate-600"} ${isFoodBusiness ? "food-hour-value" : ""}`}>
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
          </div>
        </details>
        {isFoodBusiness && <FoodPromoCarousel images={galleryUrls} editing={studioEditing} />}
        <section id={isFoodBusiness ? "food-menu" : undefined} className={`relative mt-8 ${isFoodBusiness ? "food-menu-section" : ""}`}>
          <StudioEditAnchor enabled={studioEditing} section="catalog" label="Editar cardápio e serviços" />
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <div className={`text-xs font-bold uppercase tracking-[.14em] text-[#778253] ${isFoodBusiness ? "food-menu-eyebrow" : ""}`}>
                {isFoodBusiness ? "Feito para pedir" : "Conheça nosso trabalho"}
              </div>
              <h2 className={`mt-2 font-display text-2xl font-extrabold tracking-tight ${isFoodBusiness ? "food-menu-title" : ""}`}>
                {businessCopy.offerTitle}
              </h2>
            </div>
            <span className={`text-xs text-slate-400 ${isFoodBusiness ? "food-muted" : ""}`}>
              {isFoodBusiness && menuSearch
                ? menuGroups.reduce((count, group) => count + group.services.length, 0)
                : activeServices.length} {businessCopy.offers}
            </span>
          </div>
          {activeServices.length ? (
            <>
              {isFoodBusiness && (
                <label className="food-menu-search relative mb-3 block">
                  <Search size={18} aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <span className="sr-only">Buscar no cardápio</span>
                  <input
                    type="search"
                    value={menuSearch}
                    onChange={(event) => setMenuSearch(event.target.value)}
                    placeholder="Buscar no cardápio"
                    className="food-search-input min-h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-12 text-sm text-[#292b25] shadow-xs outline-none transition placeholder:text-slate-400 focus:border-[#8a9668] focus:ring-4 focus:ring-[#edf0e5]"
                  />
                  {menuSearch && (
                    <button type="button" onClick={() => setMenuSearch("")} aria-label="Limpar busca" className="food-search-clear absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
                      <X size={16} />
                    </button>
                  )}
                </label>
              )}
              {/* Navegação Sticky de Grupos / Categorias */}
              {isFoodBusiness && (menuGroups.length > 1 || featuredServices.length > 0) && (
                <nav
                  aria-label="Categorias do cardápio"
                  className="food-category-nav sticky top-[7.15rem] z-30 -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 py-2.5 sm:-mx-6 sm:px-6"
                >
                  {featuredServices.length > 0 && (
                    <a
                      href="#menu-destaques"
                      onClick={() => setActiveFoodSection("menu-destaques")}
                      className={`food-category-chip inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 ${activeFoodSection === "menu-destaques" ? "is-active" : ""}`}
                    >
                      <Sparkles size={13} className="text-rose-600" />
                      Promoções do Dia
                    </a>
                  )}
                  {menuGroups.map((group, index) => (
                    <a
                      key={group.name}
                      href={`#menu-category-${index}`}
                      onClick={() => setActiveFoodSection(`menu-category-${index}`)}
                      className={`food-category-chip inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 ${activeFoodSection === `menu-category-${index}` ? "is-active" : ""}`}
                    >
                      {group.name}
                    </a>
                  ))}
                </nav>
              )}

              {/* Seção Especial: Destaques & Promoções do Dia (Acima dos grupos) */}
              {isFoodBusiness && featuredServices.length > 0 && (
                <section id="menu-destaques" className="food-featured-section mb-8 scroll-mt-36">
                  <div className="mb-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="food-icon-tile grid size-8 place-items-center rounded-lg">
                        <Sparkles size={16} />
                      </span>
                      <div>
                        <h3 className="food-menu-title font-display text-base font-extrabold sm:text-lg">
                          Destaques
                        </h3>
                        <p className="food-muted text-xs">
                          Itens selecionados pela loja
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="food-count-pill rounded-full px-2.5 py-1 text-[11px] font-bold">
                        {featuredServices.length} {featuredServices.length === 1 ? "item" : "itens"}
                      </span>
                      <button type="button" aria-label="Próximos destaques" onClick={() => featuredStripRef.current?.scrollBy({ left: 300, behavior: "smooth" })} className="food-next-feature grid size-9 place-items-center rounded-full border">
                        <ChevronRight size={17} />
                      </button>
                    </div>
                  </div>

                  <div ref={featuredStripRef} className="food-featured-strip no-scrollbar flex gap-3 overflow-x-auto pb-2">
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
                          className="food-feature-card group relative flex w-[min(84vw,21rem)] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border p-3.5 transition-all duration-200 sm:w-[22rem] sm:p-4"
                        >
                          <div className="flex gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex flex-wrap items-center gap-1.5">
                                <span className={`food-product-badge inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${isPromo ? "is-promo" : ""}`}>
                                  {isPromo && service.price > service.promotionalPrice! && service.price > 0
                                    ? `${Math.round((1 - service.promotionalPrice! / service.price) * 100)}% OFF`
                                    : isPromo ? "Oferta" : "Recomendado"}
                                </span>
                              </div>
                              <h4 className="food-product-name font-bold sm:text-base">{service.name}</h4>
                              <p className="food-product-description mt-1 line-clamp-2 text-xs leading-4">
                                {service.description || "Adicione ao pedido online."}
                              </p>
                            </div>
                            {service.imageUrl && (
                              <img
                                src={service.imageUrl}
                                alt={service.name}
                                loading="lazy"
                                className="food-feature-image size-20 shrink-0 rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.02] sm:size-24"
                              />
                            )}
                          </div>

                          <div className="food-feature-footer mt-3.5 flex items-center justify-between border-t pt-3">
                            <div>
                              {isPromo ? (
                                <div className="flex items-baseline gap-1.5">
                                  <span className="food-price-promo text-base font-black tracking-tight sm:text-lg">
                                    {money(service.promotionalPrice!)}
                                  </span>
                                  <span className="food-price-old text-xs line-through">
                                    {money(service.price)}
                                  </span>
                                </div>
                              ) : (
                                <span className="food-product-name text-base font-black tracking-tight sm:text-lg">
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
                    className="scroll-mt-36"
                  >
                    {isFoodBusiness && (
                      <div className="food-category-heading mb-3 flex items-center justify-between border-b pb-2">
                        <h3 className="food-menu-title font-display text-base font-extrabold sm:text-lg">
                          {group.name}
                        </h3>
                        <span className="food-muted text-xs">
                          {group.services.length} {group.services.length === 1 ? "item" : "itens"}
                        </span>
                      </div>
                    )}
                    <div className={isFoodBusiness
                      ? "food-product-carousel flex gap-3 overflow-x-auto pb-2"
                      : `food-product-grid grid gap-3 ${group.services.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
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
                            className={`food-product-card group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 sm:p-4 ${isFoodBusiness ? "food-product-carousel-card" : ""}`}
                          >
                            <StudioEditAnchor enabled={studioEditing} section="service" serviceId={service.id} label={`Editar ${service.name}`} />
                            <div className="flex gap-3">
                              <div className="min-w-0 flex-1">
                                {(isPromo || service.isFeatured) && (
                                  <div className="mb-1">
                                    <span
                                      className={`food-product-badge inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-black uppercase tracking-wider ${isPromo ? "is-promo" : ""}`}
                                    >
                                      {isPromo && service.price > service.promotionalPrice! && service.price > 0
                                        ? `${Math.round((1 - service.promotionalPrice! / service.price) * 100)}% OFF`
                                        : isPromo ? "Oferta" : "Recomendado"}
                                    </span>
                                  </div>
                                )}
                                <h3 className="food-product-name font-bold">{service.name}</h3>
                                <p className="food-product-description mt-1 line-clamp-2 text-xs leading-5">
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
                                  className="food-product-image size-20 shrink-0 rounded-xl object-cover transition-transform duration-200 group-hover:scale-[1.02] sm:size-24"
                                />
                              )}
                            </div>

                            <div className="food-product-footer mt-3.5 flex items-center justify-between border-t pt-3">
                              <div>
                                {isPromo ? (
                                  <div className="flex items-baseline gap-1.5">
                                    <span className="food-price-promo text-base font-black tracking-tight sm:text-lg">
                                      {money(service.promotionalPrice!)}
                                    </span>
                                    <span className="food-price-old text-xs line-through">
                                      {money(service.price)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="food-product-name text-base font-black tracking-tight sm:text-lg">
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
                                        className="food-quantity-button grid size-9 place-items-center rounded-full border active:scale-95"
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
                                        className="food-add-button cursor-pointer inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition active:scale-95"
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
              {isFoodBusiness && menuGroups.length === 0 && featuredServices.length === 0 && (
                  <div className="food-empty-state rounded-2xl border border-dashed px-5 py-10 text-center">
                  <Search className="mx-auto text-[#a5b280]" size={24} />
                  <p className="mt-3 text-sm font-semibold">Nenhum item encontrado</p>
                  <p className="food-muted mt-1 text-xs">Tente outro nome ou descrição.</p>
                  <button type="button" onClick={() => setMenuSearch("")} className="food-add-button mt-4 min-h-10 rounded-xl px-4 text-xs font-bold">Limpar busca</button>
                </div>
              )}
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

        <footer className={`mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5 text-xs text-slate-400 ${isFoodBusiness ? "food-store-footer" : ""}`}>
          <span>
            {business.name} · {business.city}
          </span>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 transition"
            aria-label="Conheça a ELLO"
          >
            <span>Feito com</span>
            <ElloLogo tone={isFoodBusiness ? "white" : "dark"} height={16} />
          </Link>
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
          className="food-cart-bar fixed inset-x-4 bottom-5 z-40 mx-auto flex min-h-14 max-w-2xl cursor-pointer items-center justify-between rounded-2xl border border-white/20 bg-[#292b25]/95 px-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_12px_40px_rgba(0,0,0,0.45)] active:translate-y-0 active:scale-[0.99]"
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
            <span className="text-right text-xs font-semibold">
              <span className="block text-base font-extrabold">{money(deliveryFeeNeedsArea ? cartSubtotal : cartSubtotal + deliveryFee)}</span>
              {deliveryFeeNeedsArea && <span className="text-[10px] font-medium text-white/60">Subtotal · frete pendente</span>}
            </span>
            <ChevronRight size={18} className="text-white/60" />
          </div>
        </button>
      )}

      {isFoodBusiness && configuringProduct && (
        <div className="food-config-backdrop fixed inset-0 z-[60] grid place-items-end bg-slate-950/55 p-0 sm:place-items-center sm:p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="food-options-title"
            className="food-config-panel max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[26px] p-5 shadow-2xl sm:rounded-[26px] sm:p-7"
          >
            {configuringProduct.imageUrl && (
              <div className="food-config-image mb-4 -mx-5 -mt-5 overflow-hidden sm:-mx-7 sm:-mt-7">
                <img src={configuringProduct.imageUrl} alt={configuringProduct.name} className="aspect-[2/1] w-full object-cover" />
              </div>
            )}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="food-config-eyebrow text-xs font-bold uppercase tracking-wider text-[#778253]">
                  Personalize seu pedido
                </p>
                <h2 id="food-options-title" className="mt-1 text-xl font-bold">
                  {configuringProduct.name}
                </h2>
                <p className="food-config-muted mt-1 text-sm text-slate-500">
                  A partir de {money(configuringProduct.price)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConfiguringProduct(null)}
                aria-label="Fechar"
                className="food-config-close grid size-10 place-items-center rounded-full bg-slate-100 text-slate-500"
              >
                <X size={17} />
              </button>
            </div>
            {(configuringProduct.productVariants?.length ?? 0) > 0 && (
              <fieldset className="mt-5">
                <legend className="food-config-title mb-2 text-sm font-bold">
                  Escolha uma variação{" "}
                      <span className="food-config-muted text-xs font-normal text-slate-500">obrigatório</span>
                </legend>
                <div className="space-y-2">
                  {configuringProduct.productVariants?.map((variant) => (
                    <label
                      key={variant.id}
                      className="food-option-row flex min-h-12 items-center gap-3 rounded-xl border px-3"
                    >
                      <input
                        type="radio"
                        name="food-variant"
                        checked={selectedFoodVariant === variant.id}
                        onChange={() => setSelectedFoodVariant(variant.id ?? "")}
                        className="size-4 accent-[#d0f25a]"
                      />
                      <span className="food-config-title flex-1 text-sm font-medium">{variant.name}</span>
                      <span className="food-config-muted text-sm text-slate-600">
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
                  <legend className="food-config-title mb-2 text-sm font-bold">
                    {group.name}{" "}
                    <span className="food-config-muted text-xs font-normal text-slate-500">
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
                          className={`food-option-row flex min-h-12 items-center gap-3 rounded-xl border px-3 ${disabled ? "is-disabled opacity-50" : ""}`}
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
                            className="size-4 accent-[#d0f25a]"
                          />
                          <span className="food-config-title flex-1 text-sm font-medium">{option.name}</span>
                          {option.priceDelta > 0 && (
                            <span className="food-config-muted text-sm text-slate-600">
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
              className="food-add-button mt-6 min-h-12 w-full rounded-xl px-4 text-sm font-bold disabled:opacity-50"
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

                      <label className="flex min-h-11 items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-[11px] leading-4 text-white/65">
                        <input type="checkbox" checked={rememberCustomerDetails} onChange={(event) => updateRememberCustomerDetails(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#d0f25a]" />
                        <span>Salvar meus dados neste aparelho para próximos pedidos. Desmarque para apagar essa preferência.</span>
                      </label>
                      {hasStoredCustomerDetails && !rememberCustomerDetails && (
                        <button type="button" onClick={() => updateRememberCustomerDetails(false)} className="min-h-10 text-left text-[11px] font-semibold text-[#d0f25a] underline underline-offset-2">
                          Apagar dados anteriores salvos neste aparelho
                        </button>
                      )}

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

                          {hasActiveDeliveryAreas && (
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
                            <span>Taxa de entrega</span>
                            <span className="font-mono text-white">{deliveryFeeNeedsArea ? "Selecione o bairro" : deliveryFee ? money(deliveryFee) : "Grátis"}</span>
                          </div>
                        )}
                        {appliedCoupon && (
                          <div className="flex justify-between text-xs text-emerald-400">
                            <span>Desconto ({appliedCoupon.code})</span>
                            <span className="font-mono">−{money(appliedCoupon.discountAmount)}</span>
                          </div>
                        )}
                        <div className="pt-2 border-t border-white/10 flex justify-between text-sm font-bold text-white">
                          <span>{deliveryFeeNeedsArea ? "Subtotal · frete pendente" : "Total a pagar"}</span>
                          <span className="font-mono text-[#d0f25a] text-base">
                            {deliveryFeeNeedsArea ? "A calcular" : money(cartSubtotal + deliveryFee - (appliedCoupon?.discountAmount ?? 0))}
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
                        (fulfillment === "delivery" && hasActiveDeliveryAreas && !selectedDeliveryArea)
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
                <label className="flex min-h-11 items-start gap-2 rounded-xl bg-[#f5f6f1] px-3 py-2.5 text-[11px] leading-4 text-slate-600">
                  <input type="checkbox" checked={rememberCustomerDetails} onChange={(event) => updateRememberCustomerDetails(event.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[#667448]" />
                  <span>Salvar meus dados neste aparelho para próximos agendamentos. Desmarque para apagar essa preferência.</span>
                </label>
                {hasStoredCustomerDetails && !rememberCustomerDetails && (
                  <button type="button" onClick={() => updateRememberCustomerDetails(false)} className="min-h-10 text-left text-[11px] font-semibold text-[#586341] underline underline-offset-2">
                    Apagar dados anteriores salvos neste aparelho
                  </button>
                )}

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
        business.wheelSettings?.enabled === true &&
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

function normalizeMenuText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
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

