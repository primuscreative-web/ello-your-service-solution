import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type BusinessOnboardingDetails = {
  specialties: string[];
  serviceModes: string[];
};

export type BusinessDayHours = {
  open: string;
  close: string;
  closed: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
};
export type BusinessOpeningHours = Record<string, BusinessDayHours>;
export const defaultOpeningHours: BusinessOpeningHours = Object.fromEntries(
  Array.from({ length: 7 }, (_, index) => [
    String(index + 1),
    { open: "09:00", close: "18:00", closed: false, breakStart: null, breakEnd: null },
  ]),
);
export const localDateInputValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

export type Business = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  phone: string;
  description: string;
  address: string;
  bannerUrl?: string | null;
  galleryUrls?: string[];
  bookingPolicy?: string;
  onboardingDetails?: BusinessOnboardingDetails;
  openingHours?: BusinessOpeningHours;
  blockedDates?: string[];
  acceptsDelivery?: boolean;
  acceptsPickup?: boolean;
  acceptsDineIn?: boolean;
  onlinePaymentEnabled?: boolean;
  pixKey?: string;
  loyaltyEnabled?: boolean;
  loyaltyMode?: "points" | "cashback";
  loyaltyRate?: number;
  deliveryFee?: number;
  logoUrl?: string | null;
  menuCategoriesOrder?: string[];
};

export type Service = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string | null;
  duration: number;
  price: number;
  costPrice?: number;
  active: boolean;
  menuCategory?: string;
  serviceModes?: Booking["serviceMode"][];
  addons?: ServiceAddon[];
  productVariants?: ProductVariant[];
  optionGroups?: ProductOptionGroup[];
  ncm?: string;
  cest?: string;
  cfop?: string;
  fiscalOrigin?: string;
  taxRegimeCode?: string;
  isFeatured?: boolean;
  isPromotion?: boolean;
  promotionalPrice?: number;
  promotionBadge?: string;
  displayOrder?: number;
};

export type ProductVariant = { id?: string; name: string; priceDelta: number; active: boolean };
export type ProductOption = { id?: string; name: string; priceDelta: number; active: boolean };
export type ProductOptionGroup = {
  id?: string;
  name: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  active: boolean;
  options: ProductOption[];
};

export type ServiceAddon = {
  id?: string;
  name: string;
  duration: number;
  price: number;
  active: boolean;
};

export type StaffMember = {
  id: string;
  name: string;
  specialty: string;
  registrationLabel?: string;
  registrationNumber?: string;
  accessEmail?: string;
  avatarUrl: string | null;
  weeklyHours: BusinessOpeningHours;
  blockedDates: string[];
  active: boolean;
};

export type FoodOrderItem = {
  serviceId: string | null;
  quantity: number;
  name: string;
  price: number;
};
export type FoodOrder = {
  id: string;
  number: number;
  customerName: string;
  phone: string;
  fulfillment: "delivery" | "pickup" | "dine_in";
  address: string;
  deliveryAreaName: string;
  notes: string;
  paymentMethod: "cash" | "pix" | "card" | "online_pix" | "online_card";
  subtotal: number;
  deliveryFee: number;
  discountAmount: number;
  couponCode: string;
  total: number;
  status:
    | "received"
    | "accepted"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "completed"
    | "cancelled";
  driverId: string | null;
  createdAt: string;
  publicTrackingToken?: string;
  paymentStatus?: string;
  items: FoodOrderItem[];
};
export type DeliveryDriver = { id: string; name: string; phone: string; active: boolean };
export type DeliveryArea = { id: string; name: string; fee: number; active: boolean };
type DeliveryAreaRow = { id: string; name: string; fee: number | string; is_active: boolean };

export type Booking = {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  customerName: string;
  phone: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "no_show" | "cancelled";
  staffId: string | null;
  addonIds: string[];
  visitType: "first_visit" | "follow_up";
  serviceMode: "in_person" | "online" | "home_visit";
  reminderConsent: boolean;
};

export type WaitlistEntry = {
  id: string;
  serviceId: string;
  staffId: string | null;
  customerName: string;
  phone: string;
  preferredDate: string | null;
  preferredWeekday: number | null;
  dayPeriod: "morning" | "afternoon" | "evening" | "any";
  status: "waiting" | "contacted" | "scheduled" | "closed";
  createdAt: string;
};

type BusinessRow = Omit<Business, "onboardingDetails" | "openingHours" | "blockedDates"> & {
  id: string;
  owner_id?: string;
  banner_url?: string | null;
  gallery_urls?: string[];
  booking_policy?: string;
  onboarding_details?: BusinessOnboardingDetails;
  opening_hours?: BusinessOpeningHours;
  blocked_dates?: string[];
  accepts_delivery?: boolean;
  accepts_pickup?: boolean;
  accepts_dine_in?: boolean;
  online_payment_enabled?: boolean;
  pix_key?: string;
  loyalty_enabled?: boolean;
  loyalty_mode?: "points" | "cashback";
  loyalty_rate?: number;
  delivery_fee?: number;
  logo_url?: string | null;
  menu_categories_order?: string[];
};
type ServiceRow = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  menu_category?: string;
  service_modes?: Booking["serviceMode"][];
  ncm?: string;
  cest?: string;
  cfop?: string;
  fiscal_origin?: string;
  tax_regime_code?: string;
  image_url?: string | null;
  is_featured?: boolean;
  is_promotion?: boolean;
  promotional_price?: number | string | null;
  promotion_badge?: string | null;
  display_order?: number | null;
};
type OrderItemRow = {
  service_id: string | null;
  quantity: number;
  item_name: string;
  unit_price: number | string;
};
type OrderRow = {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  fulfillment: FoodOrder["fulfillment"];
  delivery_address: string | null;
  delivery_area_name: string | null;
  notes: string | null;
  payment_method: FoodOrder["paymentMethod"];
  subtotal: number | string;
  delivery_fee: number | string;
  discount_amount: number | string;
  coupon_code: string | null;
  total: number | string;
  status: FoodOrder["status"];
  driver_id: string | null;
  created_at: string;
  public_tracking_token?: string | null;
  payment_status?: string | null;
  localhub_order_items?: OrderItemRow[];
};
type DriverRow = { id: string; name: string; phone: string; is_active: boolean };
type StaffRow = {
  id: string;
  name: string;
  specialty: string | null;
  registration_label?: string | null;
  registration_number?: string | null;
  avatar_url: string | null;
  weekly_hours: BusinessOpeningHours | null;
  blocked_dates: string[] | null;
  is_active: boolean;
};
type StaffAccessRow = { staff_id: string; email: string };
type WaitlistRow = {
  id: string;
  service_id: string;
  staff_id: string | null;
  customer_name: string;
  phone: string;
  preferred_date: string | null;
  preferred_weekday: number | null;
  day_period: WaitlistEntry["dayPeriod"];
  status: WaitlistEntry["status"];
  created_at: string;
};
type BookingRow = {
  id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  service_duration_minutes: number;
  customer_name: string;
  phone: string;
  status: Booking["status"];
  staff_id?: string | null;
  addon_ids?: string[] | null;
  visit_type?: Booking["visitType"];
  service_mode?: Booking["serviceMode"];
  reminder_consent?: boolean;
};
const emptyOnboardingDetails: BusinessOnboardingDetails = { specialties: [], serviceModes: [] };

const businessFromRow = (row: BusinessRow): Business => {
  const { onboarding_details, banner_url, opening_hours, blocked_dates, ...business } = row;
  return {
    ...business,
    bannerUrl: banner_url ?? null,
    galleryUrls: row.gallery_urls ?? [],
    bookingPolicy: row.booking_policy ?? "",
    onboardingDetails: onboarding_details ?? emptyOnboardingDetails,
    openingHours: opening_hours ?? defaultOpeningHours,
    blockedDates: blocked_dates ?? [],
    acceptsDelivery: row.accepts_delivery ?? true,
    acceptsPickup: row.accepts_pickup ?? true,
    acceptsDineIn: row.accepts_dine_in ?? false,
    onlinePaymentEnabled: row.online_payment_enabled ?? false,
    pixKey: row.pix_key ?? "",
    loyaltyEnabled: row.loyalty_enabled ?? false,
    loyaltyMode: row.loyalty_mode ?? "points",
    loyaltyRate: Number(row.loyalty_rate ?? 0),
    deliveryFee: Number(row.delivery_fee ?? 0),
    logoUrl: row.logo_url ?? null,
    menuCategoriesOrder: Array.isArray(row.menu_categories_order) ? row.menu_categories_order : [],
  };
};

type LocalHubContextValue = {
  business: Business | null;
  services: Service[];
  bookings: Booking[];
  orders: FoodOrder[];
  drivers: DeliveryDriver[];
  staff: StaffMember[];
  waitlist: WaitlistEntry[];
  isStaffAccount: boolean;
  staffMemberId: string | null;
  deliveryAreas: DeliveryArea[];
  user: User | null;
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getPublicStore: (slug: string) => Promise<{
    business: Business;
    services: Service[];
    deliveryAreas: DeliveryArea[];
    staff: StaffMember[];
  } | null>;
  getAvailableBookingSlots: (
    businessId: string,
    serviceId: string,
    date: string,
    staffId?: string | null,
    addonIds?: string[],
  ) => Promise<string[]>;
  createBusiness: (business: Business) => Promise<void>;
  saveBusiness: (business: Business) => Promise<void>;
  saveService: (service: Omit<Service, "id"> & { id?: string }) => Promise<void>;
  saveServiceCost: (serviceId: string, costPrice: number) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  addBooking: (businessId: string, booking: Omit<Booking, "id" | "status">) => Promise<void>;
  addToWaitlist: (
    entry: Omit<WaitlistEntry, "id" | "status" | "createdAt"> & { businessId: string },
  ) => Promise<void>;
  setWaitlistStatus: (id: string, status: WaitlistEntry["status"]) => Promise<void>;
  rescheduleBooking: (id: string, date: string, time: string) => Promise<void>;
  setBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
  createFoodOrder: (input: {
    slug: string;
    customerName: string;
    phone: string;
    fulfillment: "delivery" | "pickup" | "dine_in";
    address: string;
    deliveryAreaId: string | null;
    notes: string;
    paymentMethod: "cash" | "pix" | "card" | "online_pix" | "online_card";
    couponCode?: string;
    campaignSlug?: string;
    items: { id: string; quantity: number; variantId?: string | null; optionIds?: string[] }[];
  }) => Promise<{ id: string; number: number; total: number; trackingToken: string }>;
  previewFoodCoupon: (input: {
    slug: string;
    code: string;
    phone: string;
    subtotal: number;
  }) => Promise<{ code: string; discountAmount: number }>;
  setOrderStatus: (
    id: string,
    status: FoodOrder["status"],
    driverId?: string | null,
  ) => Promise<void>;
  saveDriver: (driver: Omit<DeliveryDriver, "id"> & { id?: string }) => Promise<void>;
  removeDriver: (id: string) => Promise<void>;
  saveStaff: (staff: Omit<StaffMember, "id"> & { id?: string }) => Promise<void>;
  removeStaff: (id: string) => Promise<void>;
  saveDeliveryArea: (area: Omit<DeliveryArea, "id"> & { id?: string }) => Promise<void>;
  removeDeliveryArea: (id: string) => Promise<void>;
};

const LocalHubContext = createContext<LocalHubContextValue | null>(null);
const serviceFromRow = (row: ServiceRow): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  imageUrl: row.image_url ?? null,
  duration: row.duration_minutes,
  price: Number(row.price),
  active: row.is_active,
  menuCategory: row.menu_category ?? "",
  serviceModes: row.service_modes ?? ["in_person"],
  ncm: row.ncm ?? "",
  cest: row.cest ?? "",
  cfop: row.cfop ?? "",
  fiscalOrigin: row.fiscal_origin ?? "",
  taxRegimeCode: row.tax_regime_code ?? "",
  isFeatured: Boolean(row.is_featured),
  isPromotion: Boolean(row.is_promotion),
  promotionalPrice: row.promotional_price !== null && row.promotional_price !== undefined ? Number(row.promotional_price) : undefined,
  promotionBadge: row.promotion_badge ?? "",
  displayOrder: row.display_order ? Number(row.display_order) : 0,
});
const bookingFromRow = (row: BookingRow): Booking => ({
  id: row.id,
  serviceId: row.service_id,
  date: row.booking_date,
  time: row.booking_time.slice(0, 5),
  duration: row.service_duration_minutes,
  customerName: row.customer_name,
  phone: row.phone,
  status: row.status,
  staffId: row.staff_id ?? null,
  addonIds: row.addon_ids ?? [],
  visitType: row.visit_type ?? "first_visit",
  serviceMode: row.service_mode ?? "in_person",
  reminderConsent: row.reminder_consent ?? false,
});

export function LocalHubProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [isStaffAccount, setIsStaffAccount] = useState(false);
  const [staffMemberId, setStaffMemberId] = useState<string | null>(null);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("O banco de dados não está configurado.");
      setReady(true);
      return;
    }
    const { data: auth } = await supabase.auth.getUser();
    setUser(auth.user);
    if (!auth.user) {
      setBusiness(null);
      setServices([]);
      setBookings([]);
      setOrders([]);
      setDrivers([]);
      setStaff([]);
      setWaitlist([]);
      setIsStaffAccount(false);
      setStaffMemberId(null);
      setDeliveryAreas([]);
      setError(null);
      setReady(true);
      return;
    }
    let { data: ownedRow, error: businessError } = await supabase
      .from("localhub_businesses")
      .select(
        "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,onboarding_details,opening_hours,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee,logo_url,menu_categories_order",
      )
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (businessError && (businessError.message?.includes("logo_url") || businessError.message?.includes("menu_categories_order"))) {
      const fallbackRes = await supabase
        .from("localhub_businesses")
        .select(
          "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,onboarding_details,opening_hours,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee",
        )
        .eq("owner_id", auth.user.id)
        .maybeSingle();
      ownedRow = fallbackRes.data
        ? ({ ...fallbackRes.data, logo_url: null, menu_categories_order: [] } as unknown as BusinessRow)
        : null;
      businessError = fallbackRes.error;
    }
    if (businessError) {
      setError(businessError.message);
      setReady(true);
      return;
    }
    let row = ownedRow;
    let currentStaffId: string | null = null;
    if (!row && auth.user.email) {
      const { data: access, error: accessError } = await supabase
        .from("localhub_staff_access")
        .select("business_id,staff_id")
        .eq("email", auth.user.email.toLowerCase())
        .maybeSingle();
      if (accessError) {
        setBusiness(null);
        setIsStaffAccount(false);
        setStaffMemberId(null);
        setError(accessError.message);
        setReady(true);
        return;
      }
      if (access) {
        currentStaffId = access.staff_id;
        const { data: staffBusiness, error: staffBusinessError } = await supabase
          .from("localhub_businesses")
          .select(
            "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,onboarding_details,opening_hours,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee,logo_url,menu_categories_order",
          )
          .eq("id", access.business_id)
          .maybeSingle();
        if (staffBusinessError) {
          const fallbackStaff = await supabase
            .from("localhub_businesses")
            .select(
              "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,onboarding_details,opening_hours,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee",
            )
            .eq("id", access.business_id)
            .maybeSingle();
          if (fallbackStaff.error) {
            setBusiness(null);
            setIsStaffAccount(false);
            setStaffMemberId(null);
            setError(fallbackStaff.error.message);
            setReady(true);
            return;
          }
          row = fallbackStaff.data
            ? ({ ...fallbackStaff.data, logo_url: null, menu_categories_order: [] } as unknown as BusinessRow)
            : null;
        } else {
          row = staffBusiness as BusinessRow | null;
        }
      }
    }
    setIsStaffAccount(Boolean(currentStaffId && row));
    setStaffMemberId(currentStaffId && row ? currentStaffId : null);
    const nextBusiness = row as BusinessRow | null;
    setBusiness(nextBusiness ? businessFromRow(nextBusiness) : null);
    if (!nextBusiness) {
      setServices([]);
      setBookings([]);
      setOrders([]);
      setDrivers([]);
      setStaff([]);
      setWaitlist([]);
      setIsStaffAccount(false);
      setStaffMemberId(null);
      setDeliveryAreas([]);
      setError(null);
      setReady(true);
      return;
    }
    const [
      serviceResult,
      bookingResult,
      orderResult,
      driverResult,
      areaResult,
      addonResult,
      staffResult,
      variantResult,
      groupResult,
      optionResult,
    ] = await Promise.all([
      supabase
        .from("localhub_services")
        .select("*")
        .eq("business_id", nextBusiness.id)
        .order("created_at"),
      supabase
        .from("localhub_bookings")
        .select("*")
        .eq("business_id", nextBusiness.id)
        .order("booking_date")
        .order("booking_time"),
      supabase
        .from("localhub_orders")
        .select("*, localhub_order_items(*), localhub_drivers(id,name,phone)")
        .eq("business_id", nextBusiness.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("localhub_drivers")
        .select("id,name,phone,is_active")
        .eq("business_id", nextBusiness.id)
        .order("created_at"),
      supabase
        .from("localhub_delivery_areas")
        .select("id,name,fee,is_active")
        .eq("business_id", nextBusiness.id)
        .order("name"),
      supabase
        .from("localhub_service_addons")
        .select("id,service_id,name,duration_minutes,price,is_active")
        .eq("business_id", nextBusiness.id)
        .order("created_at"),
      supabase
        .from("localhub_staff")
        .select("id,name,specialty,avatar_url,weekly_hours,blocked_dates,is_active")
        .eq("business_id", nextBusiness.id)
        .order("created_at"),
      supabase
        .from("localhub_product_variants")
        .select("id,service_id,name,price_delta,is_active")
        .eq("business_id", nextBusiness.id),
      supabase
        .from("localhub_product_option_groups")
        .select("id,service_id,name,required,min_selections,max_selections,is_active")
        .eq("business_id", nextBusiness.id),
      supabase
        .from("localhub_product_options")
        .select("id,group_id,name,price_delta,is_active")
        .eq("business_id", nextBusiness.id),
    ]);
    const staffAccessResult = currentStaffId
      ? { data: [], error: null }
      : await supabase
          .from("localhub_staff_access")
          .select("staff_id,email")
          .eq("business_id", nextBusiness.id);
    const waitlistResult =
      nextBusiness.category === "saude"
        ? await supabase
            .from("localhub_waitlist")
            .select(
              "id,service_id,staff_id,customer_name,phone,preferred_date,preferred_weekday,day_period,status,created_at",
            )
            .eq("business_id", nextBusiness.id)
            .order("created_at")
        : { data: [], error: null };
    const costResult =
      nextBusiness.category === "alimentacao"
        ? await supabase.from("localhub_service_costs").select("service_id,cost_price")
        : { data: [], error: null };
    if (
      serviceResult.error ||
      bookingResult.error ||
      orderResult.error ||
      driverResult.error ||
      areaResult.error ||
      addonResult.error ||
      staffResult.error ||
      variantResult.error ||
      groupResult.error ||
      optionResult.error ||
      waitlistResult.error ||
      staffAccessResult.error ||
      costResult.error
    ) {
      setError(
        serviceResult.error?.message ??
          bookingResult.error?.message ??
          orderResult.error?.message ??
          driverResult.error?.message ??
          areaResult.error?.message ??
          addonResult.error?.message ??
          staffResult.error?.message ??
          variantResult.error?.message ??
          groupResult.error?.message ??
          optionResult.error?.message ??
          waitlistResult.error?.message ??
          staffAccessResult.error?.message ??
          costResult.error?.message ??
          "Falha ao carregar dados.",
      );
    } else {
      const costs = new Map(
        (costResult.data ?? []).map((item: { service_id: string; cost_price: number | string }) => [
          item.service_id,
          Number(item.cost_price),
        ]),
      );
      const addonsByService = new Map<string, ServiceAddon[]>();
      for (const addon of addonResult.data ?? []) {
        const list = addonsByService.get(addon.service_id) ?? [];
        list.push({
          id: addon.id,
          name: addon.name,
          duration: addon.duration_minutes,
          price: Number(addon.price),
          active: addon.is_active,
        });
        addonsByService.set(addon.service_id, list);
      }
      const variantsByService = new Map<string, ProductVariant[]>();
      for (const row of variantResult.data ?? []) {
        const list = variantsByService.get(row.service_id) ?? [];
        list.push({
          id: row.id,
          name: row.name,
          priceDelta: Number(row.price_delta),
          active: row.is_active,
        });
        variantsByService.set(row.service_id, list);
      }
      const optionsByGroup = new Map<string, ProductOption[]>();
      for (const row of optionResult.data ?? []) {
        const list = optionsByGroup.get(row.group_id) ?? [];
        list.push({
          id: row.id,
          name: row.name,
          priceDelta: Number(row.price_delta),
          active: row.is_active,
        });
        optionsByGroup.set(row.group_id, list);
      }
      const groupsByService = new Map<string, ProductOptionGroup[]>();
      for (const row of groupResult.data ?? []) {
        const list = groupsByService.get(row.service_id) ?? [];
        list.push({
          id: row.id,
          name: row.name,
          required: row.required,
          minSelections: row.min_selections,
          maxSelections: row.max_selections,
          active: row.is_active,
          options: optionsByGroup.get(row.id) ?? [],
        });
        groupsByService.set(row.service_id, list);
      }
      setServices(
        (serviceResult.data ?? []).map((item) => ({
          ...serviceFromRow(item as ServiceRow),
          costPrice: costs.get((item as ServiceRow).id) ?? 0,
          addons: addonsByService.get((item as ServiceRow).id) ?? [],
          productVariants: variantsByService.get((item as ServiceRow).id) ?? [],
          optionGroups: groupsByService.get((item as ServiceRow).id) ?? [],
        })),
      );
      setBookings((bookingResult.data ?? []).map((item) => bookingFromRow(item as BookingRow)));
      setOrders(
        (orderResult.data ?? []).map((row: OrderRow) => ({
          id: row.id,
          number: Number(row.order_number),
          customerName: row.customer_name,
          phone: row.customer_phone,
          fulfillment: row.fulfillment,
          address: row.delivery_address ?? "",
          deliveryAreaName: row.delivery_area_name ?? "",
          notes: row.notes ?? "",
          paymentMethod: row.payment_method,
          subtotal: Number(row.subtotal),
          deliveryFee: Number(row.delivery_fee),
          discountAmount: Number(row.discount_amount ?? 0),
          couponCode: row.coupon_code ?? "",
          total: Number(row.total),
          status: row.status,
          driverId: row.driver_id,
          createdAt: row.created_at,
          publicTrackingToken: row.public_tracking_token ?? "",
          paymentStatus: row.payment_status ?? "pending",
          items: (row.localhub_order_items ?? []).map((item: OrderItemRow) => ({
            serviceId: item.service_id,
            quantity: item.quantity,
            name: item.item_name,
            price: Number(item.unit_price),
          })),
        })),
      );
      setDrivers(
        (driverResult.data ?? []).map((row: DriverRow) => ({
          id: row.id,
          name: row.name,
          phone: row.phone,
          active: row.is_active,
        })),
      );
      setStaff(
        (staffResult.data ?? []).map((row: StaffRow) => ({
          id: row.id,
          name: row.name,
          specialty: row.specialty ?? "",
          registrationLabel: row.registration_label ?? "",
          registrationNumber: row.registration_number ?? "",
          accessEmail:
            (staffAccessResult.data ?? []).find(
              (access: StaffAccessRow) => access.staff_id === row.id,
            )?.email ?? "",
          avatarUrl: row.avatar_url ?? null,
          weeklyHours: row.weekly_hours ?? {},
          blockedDates: row.blocked_dates ?? [],
          active: row.is_active,
        })),
      );
      setWaitlist(
        (waitlistResult.data ?? []).map((row: WaitlistRow) => ({
          id: row.id,
          serviceId: row.service_id,
          staffId: row.staff_id ?? null,
          customerName: row.customer_name,
          phone: row.phone,
          preferredDate: row.preferred_date ?? null,
          preferredWeekday: row.preferred_weekday ?? null,
          dayPeriod: row.day_period,
          status: row.status,
          createdAt: row.created_at,
        })),
      );
      setDeliveryAreas(
        (areaResult.data ?? []).map((row: DeliveryAreaRow) => ({
          id: row.id,
          name: row.name,
          fee: Number(row.fee),
          active: row.is_active,
        })),
      );
      setError(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      void refresh();
      return;
    }
    let active = true;
    const initialize = async () => {
      await refresh();
      if (!active) return;
    };
    void initialize();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(false);
      window.setTimeout(() => {
        if (active) void refresh();
      }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  useEffect(() => {
    if (business?.category !== "alimentacao") return;
    const interval = window.setInterval(() => void refresh(), 15_000);
    return () => window.clearInterval(interval);
  }, [business?.category, business?.id, refresh]);

  const getPublicStore = useCallback(async (slug: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("O serviço está temporariamente indisponível.");
    let { data, error: queryError } = await supabase
      .from("localhub_businesses")
      .select(
        "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,opening_hours,onboarding_details,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee,logo_url,menu_categories_order",
      )
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (queryError && (queryError.message?.includes("logo_url") || queryError.message?.includes("menu_categories_order"))) {
      const fallbackQuery = await supabase
        .from("localhub_businesses")
        .select(
          "id,name,slug,category,city,phone,description,address,banner_url,gallery_urls,booking_policy,opening_hours,onboarding_details,blocked_dates,accepts_delivery,accepts_pickup,accepts_dine_in,online_payment_enabled,pix_key,loyalty_enabled,loyalty_mode,loyalty_rate,delivery_fee",
        )
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();
      data = fallbackQuery.data
        ? ({ ...fallbackQuery.data, logo_url: null, menu_categories_order: [] } as unknown as BusinessRow)
        : null;
      queryError = fallbackQuery.error;
    }
    if (queryError) throw queryError;
    if (!data) return null;
    const store = businessFromRow(data as BusinessRow);
    const { data: serviceRows, error: serviceError } = await supabase
      .from("localhub_services")
      .select("*")
      .eq("business_id", store.id)
      .eq("is_active", true)
      .order("created_at");
    if (serviceError) throw serviceError;
    const [areaResult, addonResult, staffResult] = await Promise.all([
      supabase
        .from("localhub_delivery_areas")
        .select("id,name,fee,is_active")
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("localhub_service_addons")
        .select("id,service_id,name,duration_minutes,price,is_active")
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("created_at"),
      supabase
        .from("localhub_staff")
        .select(
          "id,name,specialty,registration_label,registration_number,avatar_url,weekly_hours,blocked_dates,is_active",
        )
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("created_at"),
    ]);
    if (areaResult.error) throw areaResult.error;
    if (addonResult.error) throw addonResult.error;
    if (staffResult.error) throw staffResult.error;
    const addonsByService = new Map<string, ServiceAddon[]>();
    for (const addon of addonResult.data ?? []) {
      const list = addonsByService.get(addon.service_id) ?? [];
      list.push({
        id: addon.id,
        name: addon.name,
        duration: addon.duration_minutes,
        price: Number(addon.price),
        active: addon.is_active,
      });
      addonsByService.set(addon.service_id, list);
    }
    const [variantResult, groupResult, optionResult] = await Promise.all([
      supabase
        .from("localhub_product_variants")
        .select("id,service_id,name,price_delta,is_active,position")
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("localhub_product_option_groups")
        .select("id,service_id,name,required,min_selections,max_selections,is_active,position")
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("position"),
      supabase
        .from("localhub_product_options")
        .select("id,group_id,name,price_delta,is_active,position")
        .eq("business_id", store.id)
        .eq("is_active", true)
        .order("position"),
    ]);
    if (variantResult.error) throw variantResult.error;
    if (groupResult.error) throw groupResult.error;
    if (optionResult.error) throw optionResult.error;
    const variantsByService = new Map<string, ProductVariant[]>();
    for (const row of variantResult.data ?? []) {
      const rows = variantsByService.get(row.service_id) ?? [];
      rows.push({
        id: row.id,
        name: row.name,
        priceDelta: Number(row.price_delta),
        active: row.is_active,
      });
      variantsByService.set(row.service_id, rows);
    }
    const optionsByGroup = new Map<string, ProductOption[]>();
    for (const row of optionResult.data ?? []) {
      const rows = optionsByGroup.get(row.group_id) ?? [];
      rows.push({
        id: row.id,
        name: row.name,
        priceDelta: Number(row.price_delta),
        active: row.is_active,
      });
      optionsByGroup.set(row.group_id, rows);
    }
    const groupsByService = new Map<string, ProductOptionGroup[]>();
    for (const row of groupResult.data ?? []) {
      const rows = groupsByService.get(row.service_id) ?? [];
      rows.push({
        id: row.id,
        name: row.name,
        required: row.required,
        minSelections: row.min_selections,
        maxSelections: row.max_selections,
        active: row.is_active,
        options: optionsByGroup.get(row.id) ?? [],
      });
      groupsByService.set(row.service_id, rows);
    }
    return {
      business: store,
      services: (serviceRows ?? []).map((item) => ({
        ...serviceFromRow(item as ServiceRow),
        addons: addonsByService.get((item as ServiceRow).id) ?? [],
        productVariants: variantsByService.get((item as ServiceRow).id) ?? [],
        optionGroups: groupsByService.get((item as ServiceRow).id) ?? [],
      })),
      staff: (staffResult.data ?? []).map((row: StaffRow) => ({
        id: row.id,
        name: row.name,
        specialty: row.specialty ?? "",
        registrationLabel: row.registration_label ?? "",
        registrationNumber: row.registration_number ?? "",
        avatarUrl: row.avatar_url ?? null,
        weeklyHours: row.weekly_hours ?? {},
        blockedDates: row.blocked_dates ?? [],
        active: row.is_active,
      })),
      deliveryAreas: (areaResult.data ?? []).map((row: DeliveryAreaRow) => ({
        id: row.id,
        name: row.name,
        fee: Number(row.fee),
        active: row.is_active,
      })),
    };
  }, []);

  const requireClient = () => {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("O serviço está temporariamente indisponível.");
    return client;
  };
  const createBusiness = async (item: Business) => {
    const client = requireClient();
    const { data: auth } = await client.auth.getUser();
    if (!auth.user) throw new Error("Entre na sua conta antes de criar a página.");
    const { error: writeError } = await client.from("localhub_businesses").insert({
      owner_id: auth.user.id,
      name: item.name.trim(),
      slug: item.slug,
      category: item.category,
      city: item.city.trim(),
      phone: item.phone.trim(),
      description: item.description.trim(),
      address: item.address.trim(),
      onboarding_details: item.onboardingDetails ?? emptyOnboardingDetails,
    });
    if (writeError) throw writeError;
    await refresh();
  };
  const saveBusiness = async (item: Business) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const { error: writeError } = await requireClient()
      .from("localhub_businesses")
      .update({
        name: item.name.trim(),
        slug: item.slug,
        category: item.category,
        city: item.city.trim(),
        phone: item.phone.trim(),
        description: item.description.trim(),
        address: item.address.trim(),
        banner_url: item.bannerUrl?.trim() || null,
        onboarding_details:
          item.onboardingDetails ?? business.onboardingDetails ?? emptyOnboardingDetails,
        gallery_urls: item.galleryUrls ?? business.galleryUrls ?? [],
        booking_policy: item.bookingPolicy?.trim() ?? business.bookingPolicy ?? "",
        opening_hours: item.openingHours ?? business.openingHours ?? defaultOpeningHours,
        blocked_dates: item.blockedDates ?? business.blockedDates ?? [],
        accepts_delivery: item.acceptsDelivery ?? business.acceptsDelivery ?? true,
        accepts_pickup: item.acceptsPickup ?? business.acceptsPickup ?? true,
        accepts_dine_in: item.acceptsDineIn ?? business.acceptsDineIn ?? false,
        loyalty_enabled: item.loyaltyEnabled ?? business.loyaltyEnabled ?? false,
        loyalty_mode: item.loyaltyMode ?? business.loyaltyMode ?? "points",
        loyalty_rate: item.loyaltyRate ?? business.loyaltyRate ?? 0,
        delivery_fee: item.deliveryFee ?? business.deliveryFee ?? 0,
        logo_url: item.logoUrl !== undefined ? item.logoUrl : business.logoUrl ?? null,
        menu_categories_order: item.menuCategoriesOrder ?? business.menuCategoriesOrder ?? [],
      })
      .eq("id", business.id);
    if (writeError) {
      if (writeError.message?.includes("logo_url") || writeError.message?.includes("menu_categories_order")) {
        const { error: fallbackErr } = await requireClient()
          .from("localhub_businesses")
          .update({
            name: item.name.trim(),
            slug: item.slug,
            category: item.category,
            city: item.city.trim(),
            phone: item.phone.trim(),
            description: item.description.trim(),
            address: item.address.trim(),
            banner_url: item.bannerUrl?.trim() || null,
            onboarding_details:
              item.onboardingDetails ?? business.onboardingDetails ?? emptyOnboardingDetails,
            gallery_urls: item.galleryUrls ?? business.galleryUrls ?? [],
            booking_policy: item.bookingPolicy?.trim() ?? business.bookingPolicy ?? "",
            opening_hours: item.openingHours ?? business.openingHours ?? defaultOpeningHours,
            blocked_dates: item.blockedDates ?? business.blockedDates ?? [],
            accepts_delivery: item.acceptsDelivery ?? business.acceptsDelivery ?? true,
            accepts_pickup: item.acceptsPickup ?? business.acceptsPickup ?? true,
            accepts_dine_in: item.acceptsDineIn ?? business.acceptsDineIn ?? false,
            loyalty_enabled: item.loyaltyEnabled ?? business.loyaltyEnabled ?? false,
            loyalty_mode: item.loyaltyMode ?? business.loyaltyMode ?? "points",
            loyalty_rate: item.loyaltyRate ?? business.loyaltyRate ?? 0,
            delivery_fee: item.deliveryFee ?? business.deliveryFee ?? 0,
          })
          .eq("id", business.id);
        if (fallbackErr) throw fallbackErr;
      } else {
        throw writeError;
      }
    }
    await refresh();
  };
  const saveService = async (item: Omit<Service, "id"> & { id?: string }) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const payload = {
      business_id: business.id,
      name: item.name.trim(),
      description: item.description.trim(),
      duration_minutes: item.duration,
      menu_category: item.menuCategory ?? "",
      image_url: item.imageUrl ?? null,
      service_modes: item.serviceModes ?? ["in_person"],
      ncm: item.ncm ?? "",
      cest: item.cest ?? "",
      cfop: item.cfop ?? "",
      fiscal_origin: item.fiscalOrigin ?? "",
      tax_regime_code: item.taxRegimeCode ?? "",
      price: item.price,
      is_active: item.active,
      is_featured: item.isFeatured ?? false,
      is_promotion: item.isPromotion ?? false,
      promotional_price: item.promotionalPrice ?? null,
      promotion_badge: item.promotionBadge ?? "",
      display_order: item.displayOrder ?? 0,
    };
    const client = requireClient();
    let request = item.id
      ? client.from("localhub_services").update(payload).eq("id", item.id).select("id").single()
      : client.from("localhub_services").insert(payload).select("id").single();
    let { data: savedService, error: writeError } = await request;
    if (writeError && (writeError.message?.includes("is_featured") || writeError.message?.includes("promotional_price"))) {
      const fallbackPayload = {
        business_id: business.id,
        name: item.name.trim(),
        description: item.description.trim(),
        duration_minutes: item.duration,
        menu_category: item.menuCategory ?? "",
        image_url: item.imageUrl ?? null,
        service_modes: item.serviceModes ?? ["in_person"],
        ncm: item.ncm ?? "",
        cest: item.cest ?? "",
        cfop: item.cfop ?? "",
        fiscal_origin: item.fiscalOrigin ?? "",
        tax_regime_code: item.taxRegimeCode ?? "",
        price: item.price,
        is_active: item.active,
      };
      const fallbackReq = item.id
        ? client.from("localhub_services").update(fallbackPayload).eq("id", item.id).select("id").single()
        : client.from("localhub_services").insert(fallbackPayload).select("id").single();
      const fallbackRes = await fallbackReq;
      savedService = fallbackRes.data;
      writeError = fallbackRes.error;
    }
    if (writeError) throw writeError;
    if (!savedService) throw new Error("Não foi possível identificar o item salvo.");
    if (business.category === "alimentacao") {
      const serviceId = savedService.id as string;
      const variants = item.productVariants ?? [];
      const existingVariants = await client
        .from("localhub_product_variants")
        .select("id")
        .eq("business_id", business.id)
        .eq("service_id", serviceId);
      if (existingVariants.error) throw existingVariants.error;
      const retainedVariantIds: string[] = [];
      for (const [position, variant] of variants.entries()) {
        const payload = {
          business_id: business.id,
          service_id: serviceId,
          name: variant.name.trim(),
          price_delta: variant.priceDelta,
          is_active: variant.active,
          position,
        };
        const result = variant.id
          ? await client
              .from("localhub_product_variants")
              .update(payload)
              .eq("id", variant.id)
              .eq("service_id", serviceId)
              .select("id")
              .single()
          : await client.from("localhub_product_variants").insert(payload).select("id").single();
        if (result.error) throw result.error;
        retainedVariantIds.push(result.data.id);
      }
      const removeVariants = client
        .from("localhub_product_variants")
        .delete()
        .eq("business_id", business.id)
        .eq("service_id", serviceId);
      const variantDelete = retainedVariantIds.length
        ? await removeVariants.not("id", "in", `(${retainedVariantIds.join(",")})`)
        : await removeVariants;
      if (variantDelete.error) throw variantDelete.error;
      const existingGroups = await client
        .from("localhub_product_option_groups")
        .select("id")
        .eq("business_id", business.id)
        .eq("service_id", serviceId);
      if (existingGroups.error) throw existingGroups.error;
      const retainedGroupIds: string[] = [];
      for (const [position, group] of (item.optionGroups ?? []).entries()) {
        const payload = {
          business_id: business.id,
          service_id: serviceId,
          name: group.name.trim(),
          required: group.required,
          min_selections: group.required ? Math.max(1, group.minSelections) : group.minSelections,
          max_selections: group.maxSelections,
          is_active: group.active,
          position,
        };
        const result = group.id
          ? await client
              .from("localhub_product_option_groups")
              .update(payload)
              .eq("id", group.id)
              .eq("service_id", serviceId)
              .select("id")
              .single()
          : await client
              .from("localhub_product_option_groups")
              .insert(payload)
              .select("id")
              .single();
        if (result.error) throw result.error;
        const groupId = result.data.id as string;
        retainedGroupIds.push(groupId);
        const retainedOptionIds: string[] = [];
        for (const [optionPosition, option] of group.options.entries()) {
          const optionPayload = {
            business_id: business.id,
            group_id: groupId,
            name: option.name.trim(),
            price_delta: option.priceDelta,
            is_active: option.active,
            position: optionPosition,
          };
          const savedOption = option.id
            ? await client
                .from("localhub_product_options")
                .update(optionPayload)
                .eq("id", option.id)
                .eq("group_id", groupId)
                .select("id")
                .single()
            : await client
                .from("localhub_product_options")
                .insert(optionPayload)
                .select("id")
                .single();
          if (savedOption.error) throw savedOption.error;
          retainedOptionIds.push(savedOption.data.id);
        }
        const deleteOptions = client
          .from("localhub_product_options")
          .delete()
          .eq("business_id", business.id)
          .eq("group_id", groupId);
        const optionDelete = retainedOptionIds.length
          ? await deleteOptions.not("id", "in", `(${retainedOptionIds.join(",")})`)
          : await deleteOptions;
        if (optionDelete.error) throw optionDelete.error;
      }
      const removeGroups = client
        .from("localhub_product_option_groups")
        .delete()
        .eq("business_id", business.id)
        .eq("service_id", serviceId);
      const groupDelete = retainedGroupIds.length
        ? await removeGroups.not("id", "in", `(${retainedGroupIds.join(",")})`)
        : await removeGroups;
      if (groupDelete.error) throw groupDelete.error;
      await refresh();
      return;
    }
    if (business.category !== "beleza") {
      await refresh();
      return;
    }
    const serviceId = savedService.id as string;
    const addons = item.addons ?? [];
    const retainedAddonIds: string[] = [];
    for (const addon of addons) {
      const addonPayload = {
        business_id: business.id,
        service_id: serviceId,
        name: addon.name.trim(),
        duration_minutes: addon.duration,
        price: addon.price,
        is_active: addon.active,
      };
      if (addon.id) {
        const { error: addonError } = await client
          .from("localhub_service_addons")
          .update(addonPayload)
          .eq("id", addon.id)
          .eq("service_id", serviceId);
        if (addonError) throw addonError;
        retainedAddonIds.push(addon.id);
      } else {
        const { data: addedAddon, error: addonError } = await client
          .from("localhub_service_addons")
          .insert(addonPayload)
          .select("id")
          .single();
        if (addonError) throw addonError;
        retainedAddonIds.push(addedAddon.id);
      }
    }
    const deleteQuery = client
      .from("localhub_service_addons")
      .delete()
      .eq("business_id", business.id)
      .eq("service_id", serviceId);
    const { error: removedAddonsError } = retainedAddonIds.length
      ? await deleteQuery.not("id", "in", `(${retainedAddonIds.join(",")})`)
      : await deleteQuery;
    if (removedAddonsError) throw removedAddonsError;
    await refresh();
  };
  const saveServiceCost = async (serviceId: string, costPrice: number) => {
    if (!business?.id || business.category !== "alimentacao") {
      throw new Error("A precificação de custos está disponível para negócios de alimentação.");
    }
    if (!Number.isFinite(costPrice) || costPrice < 0) {
      throw new Error("Informe um custo válido, igual ou maior que zero.");
    }
    const { error: writeError } = await requireClient()
      .from("localhub_service_costs")
      .upsert({ service_id: serviceId, cost_price: costPrice }, { onConflict: "service_id" });
    if (writeError) throw writeError;
    await refresh();
  };
  const removeService = async (id: string) => {
    const { error: writeError } = await requireClient()
      .from("localhub_services")
      .delete()
      .eq("id", id);
    if (writeError) throw writeError;
    await refresh();
  };
  const addBooking = async (businessId: string, booking: Omit<Booking, "id" | "status">) => {
    const { error: writeError } = await requireClient().from("localhub_bookings").insert({
      business_id: businessId,
      service_id: booking.serviceId,
      customer_name: booking.customerName.trim(),
      phone: booking.phone.trim(),
      booking_date: booking.date,
      booking_time: booking.time,
      staff_id: booking.staffId,
      addon_ids: booking.addonIds,
      visit_type: booking.visitType,
      service_mode: booking.serviceMode,
      reminder_consent: booking.reminderConsent,
      status: "pending",
    });
    if (writeError?.code === "23P01") {
      throw new Error("Este horário acabou de ficar indisponível. Escolha outro horário.");
    }
    if (writeError) throw writeError;
  };
  const addToWaitlist: LocalHubContextValue["addToWaitlist"] = async (entry) => {
    const { error: writeError } = await requireClient().from("localhub_waitlist").insert({
      business_id: entry.businessId,
      service_id: entry.serviceId,
      staff_id: entry.staffId,
      customer_name: entry.customerName.trim(),
      phone: entry.phone.trim(),
      preferred_date: entry.preferredDate,
      preferred_weekday: entry.preferredWeekday,
      day_period: entry.dayPeriod,
      contact_consent: true,
    });
    if (writeError) throw writeError;
  };
  const setWaitlistStatus: LocalHubContextValue["setWaitlistStatus"] = async (id, status) => {
    const { error: writeError } = await requireClient()
      .from("localhub_waitlist")
      .update({ status })
      .eq("id", id);
    if (writeError) throw writeError;
    await refresh();
  };
  const getAvailableBookingSlots = useCallback(
    async (
      businessId: string,
      serviceId: string,
      date: string,
      staffId: string | null = null,
      addonIds: string[] = [],
    ) => {
      const { data, error: queryError } = await requireClient().rpc(
        "localhub_available_booking_slots",
        {
          p_business_id: businessId,
          p_service_id: serviceId,
          p_booking_date: date,
          p_staff_id: staffId,
          p_addon_ids: addonIds,
        },
      );
      if (queryError) throw queryError;
      return (data ?? []).map((row: { slot_time: string }) => String(row.slot_time).slice(0, 5));
    },
    [],
  );
  const setBookingStatus = async (id: string, status: Booking["status"]) => {
    const { error: writeError } = await requireClient()
      .from("localhub_bookings")
      .update({ status })
      .eq("id", id);
    if (writeError) throw writeError;
    await refresh();
  };
  const rescheduleBooking = async (id: string, date: string, time: string) => {
    const { error: writeError } = await requireClient()
      .from("localhub_bookings")
      .update({ booking_date: date, booking_time: time })
      .eq("id", id);
    if (writeError?.code === "23P01") {
      throw new Error("Esse horário acabou de ser ocupado. Escolha outro horário.");
    }
    if (writeError?.code === "23514") {
      throw new Error("Esse horário está fora da disponibilidade configurada.");
    }
    if (writeError) throw writeError;
    await refresh();
  };

  const createFoodOrder: LocalHubContextValue["createFoodOrder"] = async (input) => {
    const { data, error: orderError } = await requireClient().rpc(
      "localhub_create_food_order_for_menu",
      {
        p_slug: input.slug,
        p_customer_name: input.customerName,
        p_customer_phone: input.phone,
        p_fulfillment: input.fulfillment,
        p_delivery_address:
          input.fulfillment === "delivery" && input.deliveryAreaId
            ? `${input.address.trim()}\n[ELLO_BAIRRO:${input.deliveryAreaId}]`
            : input.address,
        p_notes: input.notes,
        p_payment_method: input.paymentMethod,
        p_coupon_code: input.couponCode ?? "",
        p_items: input.items.map((item) => ({
          id: item.id,
          quantity: item.quantity,
          variant_id: item.variantId ?? null,
          option_ids: item.optionIds ?? [],
          strict_configuration: true,
        })),
      },
    );
    if (orderError) throw orderError;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error("Não foi possível confirmar o pedido.");
    if (input.campaignSlug) {
      await requireClient()
        .rpc("localhub_attribute_food_campaign_order", {
          p_order_id: result.id,
          p_tracking_token: result.tracking_token,
          p_campaign_slug: input.campaignSlug,
        })
        .then(
          () => undefined,
          () => undefined,
        );
    }
    return {
      id: result.id,
      number: Number(result.order_number),
      total: Number(result.total),
      trackingToken: result.tracking_token,
    };
  };
  const previewFoodCoupon: LocalHubContextValue["previewFoodCoupon"] = async (input) => {
    const { data, error: previewError } = await requireClient().rpc(
      "localhub_preview_food_coupon",
      {
        p_slug: input.slug,
        p_code: input.code,
        p_phone: input.phone,
        p_subtotal: input.subtotal,
      },
    );
    if (previewError) throw previewError;
    const result = Array.isArray(data) ? data[0] : data;
    if (!result) throw new Error("Não foi possível validar este cupom.");
    return { code: result.code, discountAmount: Number(result.discount_amount) };
  };
  const setOrderStatus = async (
    id: string,
    status: FoodOrder["status"],
    driverId?: string | null,
  ) => {
    const patch: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (driverId !== undefined) patch.driver_id = driverId;
    const { error: updateError } = await requireClient()
      .from("localhub_orders")
      .update(patch)
      .eq("id", id);
    if (updateError) throw updateError;
    await refresh();
  };
  const saveDriver: LocalHubContextValue["saveDriver"] = async (driver) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const payload = {
      business_id: business.id,
      name: driver.name.trim(),
      phone: driver.phone.trim(),
      is_active: driver.active,
    };
    const query = driver.id
      ? requireClient().from("localhub_drivers").update(payload).eq("id", driver.id)
      : requireClient().from("localhub_drivers").insert(payload);
    const { error: saveError } = await query;
    if (saveError) throw saveError;
    await refresh();
  };
  const removeDriver = async (id: string) => {
    const { error: deleteError } = await requireClient()
      .from("localhub_drivers")
      .delete()
      .eq("id", id);
    if (deleteError) throw deleteError;
    await refresh();
  };
  const saveStaff: LocalHubContextValue["saveStaff"] = async (member) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const payload = {
      business_id: business.id,
      name: member.name.trim(),
      specialty: member.specialty.trim(),
      registration_label: member.registrationLabel?.trim() ?? "",
      registration_number: member.registrationNumber?.trim() ?? "",
      avatar_url: member.avatarUrl,
      weekly_hours: member.weeklyHours,
      blocked_dates: member.blockedDates,
      is_active: member.active,
    };
    const query = member.id
      ? requireClient()
          .from("localhub_staff")
          .update(payload)
          .eq("id", member.id)
          .eq("business_id", business.id)
          .select("id")
          .single()
      : requireClient().from("localhub_staff").insert(payload).select("id").single();
    const { data: savedStaff, error: saveError } = await query;
    if (saveError) throw saveError;
    const accessEmail = member.accessEmail?.trim().toLowerCase();
    const accessQuery = accessEmail
      ? requireClient()
          .from("localhub_staff_access")
          .upsert(
            { business_id: business.id, staff_id: savedStaff.id, email: accessEmail },
            { onConflict: "staff_id" },
          )
      : requireClient()
          .from("localhub_staff_access")
          .delete()
          .eq("business_id", business.id)
          .eq("staff_id", savedStaff.id);
    const { error: accessError } = await accessQuery;
    if (accessError) throw accessError;
    await refresh();
  };
  const removeStaff = async (id: string) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const { error: deleteError } = await requireClient()
      .from("localhub_staff")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id);
    if (deleteError) throw deleteError;
    await refresh();
  };
  const saveDeliveryArea: LocalHubContextValue["saveDeliveryArea"] = async (area) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const payload = {
      business_id: business.id,
      name: area.name.trim(),
      fee: area.fee,
      is_active: area.active,
    };
    const query = area.id
      ? requireClient()
          .from("localhub_delivery_areas")
          .update(payload)
          .eq("id", area.id)
          .eq("business_id", business.id)
      : requireClient().from("localhub_delivery_areas").insert(payload);
    const { error: saveError } = await query;
    if (saveError) throw saveError;
    await refresh();
  };
  const removeDeliveryArea = async (id: string) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const { error: deleteError } = await requireClient()
      .from("localhub_delivery_areas")
      .delete()
      .eq("id", id)
      .eq("business_id", business.id);
    if (deleteError) throw deleteError;
    await refresh();
  };

  return (
    <LocalHubContext.Provider
      value={{
        business,
        services,
        bookings,
        waitlist,
        orders,
        drivers,
        staff,
        isStaffAccount,
        staffMemberId,
        deliveryAreas,
        user,
        ready,
        error,
        refresh,
        getPublicStore,
        getAvailableBookingSlots,
        createBusiness,
        saveBusiness,
        saveService,
        saveServiceCost,
        removeService,
        addBooking,
        addToWaitlist,
        setWaitlistStatus,
        rescheduleBooking,
        setBookingStatus,
        createFoodOrder,
        previewFoodCoupon,
        setOrderStatus,
        saveDriver,
        removeDriver,
        saveStaff,
        removeStaff,
        saveDeliveryArea,
        removeDeliveryArea,
      }}
    >
      {children}
    </LocalHubContext.Provider>
  );
}

export function useLocalHub() {
  const context = useContext(LocalHubContext);
  if (!context) throw new Error("useLocalHub precisa estar dentro de LocalHubProvider.");
  return context;
}

export function createSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
