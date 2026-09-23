import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export type Business = {
  id?: string;
  name: string;
  slug: string;
  category: string;
  city: string;
  phone: string;
  description: string;
  address: string;
};

export type Service = {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  active: boolean;
};

export type Booking = {
  id: string;
  serviceId: string;
  date: string;
  time: string;
  customerName: string;
  phone: string;
  status: "pending" | "confirmed" | "cancelled";
};

type BusinessRow = Business & { id: string; owner_id?: string };
type ServiceRow = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
};
type BookingRow = {
  id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  customer_name: string;
  phone: string;
  status: Booking["status"];
};
type LocalHubContextValue = {
  business: Business | null;
  services: Service[];
  bookings: Booking[];
  user: User | null;
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getPublicStore: (slug: string) => Promise<{ business: Business; services: Service[] } | null>;
  createBusiness: (business: Business) => Promise<void>;
  saveBusiness: (business: Business) => Promise<void>;
  saveService: (service: Omit<Service, "id"> & { id?: string }) => Promise<void>;
  removeService: (id: string) => Promise<void>;
  addBooking: (businessId: string, booking: Omit<Booking, "id" | "status">) => Promise<void>;
  setBookingStatus: (id: string, status: Booking["status"]) => Promise<void>;
};

const LocalHubContext = createContext<LocalHubContextValue | null>(null);
const serviceFromRow = (row: ServiceRow): Service => ({
  id: row.id,
  name: row.name,
  description: row.description,
  duration: row.duration_minutes,
  price: Number(row.price),
  active: row.is_active,
});
const bookingFromRow = (row: BookingRow): Booking => ({
  id: row.id,
  serviceId: row.service_id,
  date: row.booking_date,
  time: row.booking_time.slice(0, 5),
  customerName: row.customer_name,
  phone: row.phone,
  status: row.status,
});

export function LocalHubProvider({ children }: { children: ReactNode }) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
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
      setError(null);
      setReady(true);
      return;
    }
    const { data: row, error: businessError } = await supabase
      .from("localhub_businesses")
      .select("id,name,slug,category,city,phone,description,address")
      .eq("owner_id", auth.user.id)
      .maybeSingle();
    if (businessError) {
      setError(businessError.message);
      setReady(true);
      return;
    }
    const nextBusiness = row as BusinessRow | null;
    setBusiness(nextBusiness);
    if (!nextBusiness) {
      setServices([]);
      setBookings([]);
      setError(null);
      setReady(true);
      return;
    }
    const [serviceResult, bookingResult] = await Promise.all([
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
    ]);
    if (serviceResult.error || bookingResult.error) {
      setError(
        serviceResult.error?.message ?? bookingResult.error?.message ?? "Falha ao carregar dados.",
      );
    } else {
      setServices((serviceResult.data ?? []).map((item) => serviceFromRow(item as ServiceRow)));
      setBookings((bookingResult.data ?? []).map((item) => bookingFromRow(item as BookingRow)));
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
    } = supabase.auth.onAuthStateChange(() => {
      window.setTimeout(() => {
        if (active) void refresh();
      }, 0);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [refresh]);

  const getPublicStore = useCallback(async (slug: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) throw new Error("O serviço está temporariamente indisponível.");
    const { data, error: queryError } = await supabase
      .from("localhub_businesses")
      .select("id,name,slug,category,city,phone,description,address")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();
    if (queryError) throw queryError;
    if (!data) return null;
    const store = data as BusinessRow;
    const { data: serviceRows, error: serviceError } = await supabase
      .from("localhub_services")
      .select("*")
      .eq("business_id", store.id)
      .eq("is_active", true)
      .order("created_at");
    if (serviceError) throw serviceError;
    return {
      business: store,
      services: (serviceRows ?? []).map((item) => serviceFromRow(item as ServiceRow)),
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
      })
      .eq("id", business.id);
    if (writeError) throw writeError;
    await refresh();
  };
  const saveService = async (item: Omit<Service, "id"> & { id?: string }) => {
    if (!business?.id) throw new Error("Não foi possível localizar seu negócio.");
    const payload = {
      business_id: business.id,
      name: item.name.trim(),
      description: item.description.trim(),
      duration_minutes: item.duration,
      price: item.price,
      is_active: item.active,
    };
    const request = item.id
      ? requireClient().from("localhub_services").update(payload).eq("id", item.id)
      : requireClient().from("localhub_services").insert(payload);
    const { error: writeError } = await request;
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
      status: "pending",
    });
    if (writeError) throw writeError;
  };
  const setBookingStatus = async (id: string, status: Booking["status"]) => {
    const { error: writeError } = await requireClient()
      .from("localhub_bookings")
      .update({ status })
      .eq("id", id);
    if (writeError) throw writeError;
    await refresh();
  };

  return (
    <LocalHubContext.Provider
      value={{
        business,
        services,
        bookings,
        user,
        ready,
        error,
        refresh,
        getPublicStore,
        createBusiness,
        saveBusiness,
        saveService,
        removeService,
        addBooking,
        setBookingStatus,
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
