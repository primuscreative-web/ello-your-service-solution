import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Business = {
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

type LocalHubState = {
  business: Business | null;
  services: Service[];
  bookings: Booking[];
};

type LocalHubContextValue = LocalHubState & {
  ready: boolean;
  createBusiness: (business: Business) => void;
  saveBusiness: (business: Business) => void;
  saveService: (service: Omit<Service, "id"> & { id?: string }) => void;
  removeService: (id: string) => void;
  addBooking: (booking: Omit<Booking, "id" | "status">) => void;
  setBookingStatus: (id: string, status: Booking["status"]) => void;
};

const STORAGE_KEY = "localhub.product.v1";
const LocalHubContext = createContext<LocalHubContextValue | null>(null);

export function LocalHubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LocalHubState>({
    business: null,
    services: [],
    bookings: [],
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as LocalHubState;
        if (parsed && Array.isArray(parsed.services) && Array.isArray(parsed.bookings)) {
          setState(parsed);
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [ready, state]);

  const value: LocalHubContextValue = {
    ...state,
    ready,
    createBusiness: (business) => setState({ business, services: [], bookings: [] }),
    saveBusiness: (business) => setState((current) => ({ ...current, business })),
    saveService: (service) =>
      setState((current) => {
        const id = service.id ?? crypto.randomUUID();
        const saved = { ...service, id };
        const exists = current.services.some((item) => item.id === id);
        return {
          ...current,
          services: exists
            ? current.services.map((item) => (item.id === id ? saved : item))
            : [...current.services, saved],
        };
      }),
    removeService: (id) =>
      setState((current) => ({
        ...current,
        services: current.services.filter((service) => service.id !== id),
      })),
    addBooking: (booking) =>
      setState((current) => ({
        ...current,
        bookings: [...current.bookings, { ...booking, id: crypto.randomUUID(), status: "pending" }],
      })),
    setBookingStatus: (id, status) =>
      setState((current) => ({
        ...current,
        bookings: current.bookings.map((booking) =>
          booking.id === id ? { ...booking, status } : booking,
        ),
      })),
  };

  return <LocalHubContext.Provider value={value}>{children}</LocalHubContext.Provider>;
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
