import {
  CATEGORIES,
  PROFESSIONALS,
  type Category,
  type Professional,
  type TrustLevel,
} from "./ello-data";
import {
  assertFutureAppointment,
  formatAppointmentError,
  type AppointmentStatus,
} from "./appointments";
import { getSupabaseBrowserClient } from "./supabase/client";
import type { Database, Json } from "./supabase/database.types";

type ProfessionalRow = {
  id: string;
  public_name: string | null;
  specialty: string;
  city: string;
  description: string;
  avatar_url: string | null;
  verification_status: "draft" | "pending" | "verified" | "rejected";
  profile_status: string;
  headline: string | null;
  bio: string | null;
  experience_years: number;
  trust_level: string;
  rating: number;
  completed_jobs: number;
  response_time_minutes: number | null;
  boosted_until: string | null;
  services: Array<{
    category: string;
    title: string;
  }> | null;
};

type ProfessionalProfile = Database["public"]["Tables"]["professional_profiles"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ClientProfile = Database["public"]["Tables"]["client_profiles"]["Row"];
type QuoteRequest = Database["public"]["Tables"]["quote_requests"]["Row"];
type QuoteMessageRow = Database["public"]["Tables"]["quote_messages"]["Row"];
type AppointmentRow = Database["public"]["Tables"]["appointments"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type PortfolioRow = Database["public"]["Tables"]["portfolio_items"]["Row"];
type MonetizationRequestRow = Database["public"]["Tables"]["monetization_requests"]["Row"];
type LocalPartnerSpaceRow = Database["public"]["Tables"]["local_partner_spaces"]["Row"];

type AdminMonetizationRequestRow = MonetizationRequestRow & {
  professional_profiles:
    | {
        id: string;
        public_name: string | null;
        specialty: string;
        city: string;
        ello_link_slug: string | null;
      }
    | Array<{
        id: string;
        public_name: string | null;
        specialty: string;
        city: string;
        ello_link_slug: string | null;
      }>
    | null;
};

type FavoriteProfessionalRow = {
  professional_id: string;
  professional_profiles: ProfessionalRow | ProfessionalRow[] | null;
};

type RequestHistoryRow = QuoteRequest & {
  professional_profiles:
    | {
        public_name: string | null;
        specialty: string;
        avatar_url: string | null;
      }
    | Array<{
        public_name: string | null;
        specialty: string;
        avatar_url: string | null;
      }>
    | null;
  services:
    | {
        title: string;
      }
    | Array<{
        title: string;
      }>
    | null;
  reviews: Array<{
    rating: number;
    comment: string | null;
  }> | null;
};

type ProfessionalQuoteRow = QuoteRequest & {
  client_profiles:
    | {
        city: string;
      }
    | Array<{
        city: string;
      }>
    | null;
  services:
    | {
        title: string;
      }
    | Array<{
        title: string;
      }>
    | null;
};

export type QuoteThread = {
  id: string;
  title: string;
  subtitle: string;
  lastMessage: string;
  timestamp: string;
  status: QuoteRequest["status"];
  professionalView: boolean;
};

export type QuoteMessage = {
  id: string;
  quoteRequestId: string;
  senderUserId: string;
  body: string;
  timestamp: string;
  mine: boolean;
};

export type AgendaItem = {
  id: string;
  quoteRequestId: string | null;
  professionalId: string;
  professionalName: string;
  professionalInitials: string;
  service: string;
  startsAt: string;
  date: string;
  time: string;
  address: string | null;
  notes: string | null;
  professionalView: boolean;
  status: Database["public"]["Tables"]["appointments"]["Row"]["status"];
};

export type BusinessDashboard = {
  profile: ProfessionalProfile | null;
  quoteCount: number;
  appointmentCount: number;
  serviceCount: number;
  elloLinkViewCount: number;
  elloLinkLeadCount: number;
  rating: number;
  completedJobs: number;
  recentQuotes: Array<{
    id: string;
    title: string;
    subtitle: string;
    status: QuoteRequest["status"];
  }>;
};

export type ProfessionalService = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  basePrice: string | null;
  chargeType: string | null;
  active: boolean;
};

export type ProfessionalProfileUpdate = {
  userId: string;
  publicName: string;
  specialty: string;
  headline?: string | null;
  bio?: string | null;
  city: string;
  coverage: string;
  availability?: string | null;
  basePrice: string;
  chargeType: string;
  experienceYears?: number;
  elloLinkSlug?: string | null;
  introVideoUrl?: string | null;
  coverUrl?: string | null;
};

export type PortfolioItem = {
  id: string;
  title: string;
  description: string | null;
  mediaUrl: string | null;
  mediaKind: string;
  featured: boolean;
};

export type RequestHistoryItem = {
  id: string;
  professionalId: string;
  professionalName: string;
  professionalSpecialty: string;
  professionalInitials: string;
  professionalAvatarUrl: string | null;
  serviceTitle: string;
  description: string;
  location: string;
  status: QuoteRequest["status"];
  createdAt: string;
  responsePrice: string | null;
  responseEta: string | null;
  review: {
    rating: number;
    comment: string | null;
  } | null;
};

export type ProfessionalQuoteItem = {
  id: string;
  clientCity: string;
  serviceTitle: string;
  description: string;
  location: string;
  status: QuoteRequest["status"];
  createdAt: string;
  responsePrice: string | null;
  responseEta: string | null;
  responseMessage: string | null;
};

export type PublicProfessionalLink = {
  id: string;
  slug: string;
  name: string;
  initials: string;
  avatarUrl: string | null;
  headline: string;
  specialty: string;
  bio: string;
  city: string;
  coverage: string;
  availability: string | null;
  basePrice: string;
  chargeType: string;
  rating: number;
  completedJobs: number;
  trustLevel: TrustLevel;
  boosted: boolean;
  elloLinkProEnabled: boolean;
  introVideoUrl: string | null;
  coverUrl: string | null;
  qrCodeEnabled: boolean;
  maxPortfolioItems: number;
  services: ProfessionalService[];
  portfolio: PortfolioItem[];
};

export type MonetizationRequestItem = {
  id: string;
  requestType: MonetizationRequestRow["request_type"];
  status: MonetizationRequestRow["status"];
  requestedDetails: MonetizationRequestRow["requested_details"];
  createdAt: string;
};

export type LocalPartnerSpace = {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string | null;
  imageUrl: string | null;
};

export type AdminLocalPartnerSpace = LocalPartnerSpaceRow;

export type AdminMonetizationRequest = MonetizationRequestItem & {
  professional: {
    id: string;
    name: string;
    specialty: string;
    city: string;
    slug: string | null;
  } | null;
};

export type UserProfileUpdate = {
  userId: string;
  fullName: string;
  avatarFile?: File | null;
  avatarUrl?: string | null;
};

export type ClientProfileUpdate = {
  userId: string;
  city: string;
  region?: string | null;
  interests?: string | null;
};

export async function listCategories(): Promise<Category[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return CATEGORIES;

  const { data, error } = await supabase.from("services").select("category").eq("active", true);

  if (error) {
    console.error("Failed to load categories from Supabase", error);
    return CATEGORIES;
  }

  const slugs = Array.from(
    new Set((data ?? []).map((service) => service.category).filter(Boolean)),
  );
  if (!slugs.length) return CATEGORIES;

  return slugs.map((slug) => {
    const known = CATEGORIES.find((category) => category.slug === slug);
    return known ?? { slug, name: humanizeSlug(slug), icon: "" };
  });
}

export async function listProfessionals(filters?: {
  category?: string;
  query?: string;
  limit?: number;
}): Promise<Professional[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return filterMockProfessionals(filters);

  let query = supabase
    .from("professional_profiles")
    .select(
      `
      id,
      public_name,
      specialty,
      city,
      description,
      avatar_url,
      verification_status,
      profile_status,
      headline,
      bio,
      experience_years,
      trust_level,
      rating,
      completed_jobs,
      response_time_minutes,
      boosted_until,
      services(category, title)
    `,
    )
    .in("profile_status", ["published", "active", "approved"])
    .order("rating", { ascending: false })
    .order("completed_jobs", { ascending: false });

  if (filters?.category) {
    query = query.eq("services.category", filters.category);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query.returns<ProfessionalRow[]>();

  if (error) {
    console.error("Failed to load professionals from Supabase", error);
    throw new Error("Não foi possível carregar os profissionais agora.");
  }

  const mapped = sortBoostedProfessionalRows(data ?? []).map(mapProfessionalRow);
  return filterProfessionals(mapped, filters);
}

export async function getProfessionalById(id: string): Promise<Professional | null> {
  const mock = PROFESSIONALS.find((professional) => professional.id === id);
  if (mock) return mock;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("professional_profiles")
    .select(
      `
      id,
      public_name,
      specialty,
      city,
      description,
      avatar_url,
      verification_status,
      profile_status,
      headline,
      bio,
      experience_years,
      trust_level,
      rating,
      completed_jobs,
      response_time_minutes,
      boosted_until,
      services(category, title)
    `,
    )
    .eq("id", id)
    .maybeSingle()
    .returns<ProfessionalRow | null>();

  if (error) {
    console.error("Failed to load professional from Supabase", error);
    return null;
  }

  return data ? mapProfessionalRow(data) : null;
}

export async function getMyProfessionalProfile(
  userId: string,
): Promise<ProfessionalProfile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load professional profile", error);
    return null;
  }

  return data;
}

export async function ensureMyProfessionalProfile(input: {
  userId: string;
  displayName: string;
  city?: string | null;
}): Promise<ProfessionalProfile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  const existing = await getMyProfessionalProfile(input.userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("professional_profiles")
    .insert({
      user_id: input.userId,
      public_name: input.displayName,
      specialty: "Profissional de serviços",
      city: input.city ?? "São Paulo, SP",
      coverage: "São Paulo e região",
      description:
        "Perfil profissional criado pela ELLO. Complete seu portfólio para receber mais oportunidades.",
      base_price: "A combinar",
      charge_type: "por serviço",
      verification_status: "draft",
      profile_status: "draft",
      headline: "Profissional de serviços",
      bio: "Perfil profissional criado pela ELLO. Complete seu portfólio para receber mais oportunidades.",
      experience_years: 0,
      trust_level: "Bronze",
      rating: 0,
      completed_jobs: 0,
      response_time_minutes: null,
      is_published: false,
      ello_link_slug: slugify(input.displayName),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateMyUserProfile(input: UserProfileUpdate): Promise<ProfileRow> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const fullName = input.fullName.trim();
  if (!fullName) throw new Error("Informe seu nome.");

  const avatarUrl = input.avatarFile
    ? await uploadAvatarFile({
        userId: input.userId,
        file: input.avatarFile,
      })
    : input.avatarUrl?.trim() || null;

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      avatar_url: avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)
    .select("*")
    .single();

  if (error) throw error;

  const existingProfessional = await getMyProfessionalProfile(input.userId);
  if (existingProfessional) {
    await supabase
      .from("professional_profiles")
      .update({
        public_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingProfessional.id);
  }

  return data;
}

export async function chooseMyAccountMode(input: {
  userId: string;
  mode: ProfileRow["role"];
  displayName: string;
  city?: string | null;
}): Promise<ProfileRow> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role: input.mode,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.userId)
    .select("*")
    .single();

  if (error) throw error;

  if (input.mode === "professional") {
    await ensureMyProfessionalProfile({
      userId: input.userId,
      displayName: input.displayName,
      city: input.city ?? "Sao Paulo, SP",
    });
  } else {
    await ensureMyClientProfile({
      userId: input.userId,
      city: input.city ?? "Sao Paulo, SP",
    });
  }

  return data;
}

async function getUserProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load user profile", error);
    return null;
  }

  return data;
}

export async function updateMyProfessionalProfile(
  input: ProfessionalProfileUpdate,
): Promise<ProfessionalProfile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) {
    throw new Error("Crie o perfil profissional antes de editar.");
  }

  const publicName = input.publicName.trim();
  const specialty = input.specialty.trim();
  const city = input.city.trim();
  const coverage = input.coverage.trim();
  const basePrice = input.basePrice.trim();
  const chargeType = input.chargeType.trim();
  const slug = slugify(input.elloLinkSlug?.trim() || publicName || specialty);

  if (!publicName) throw new Error("Informe o nome publico.");
  if (!specialty) throw new Error("Informe sua especialidade.");
  if (!city) throw new Error("Informe sua cidade.");
  if (!coverage) throw new Error("Informe sua area de atendimento.");
  if (!basePrice) throw new Error("Informe o preco base.");
  if (!chargeType) throw new Error("Informe o tipo de cobranca.");
  if (!slug) throw new Error("Informe um ELLO Link valido.");

  const { data, error } = await supabase
    .from("professional_profiles")
    .update({
      public_name: publicName,
      specialty,
      headline: input.headline?.trim() || specialty,
      bio: input.bio?.trim() || null,
      description: input.bio?.trim() || profile.description,
      city,
      coverage,
      availability: input.availability?.trim() || null,
      base_price: basePrice,
      charge_type: chargeType,
      experience_years: Math.max(0, Math.round(input.experienceYears ?? 0)),
      ello_link_slug: slug,
      intro_video_url: input.introVideoUrl?.trim() || null,
      cover_url: input.coverUrl?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listMyServices(userId: string): Promise<ProfessionalService[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) return [];

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load professional services", error);
    return [];
  }

  return (data ?? []).map(mapService);
}

export async function createMyService(input: {
  userId: string;
  title: string;
  category: string;
  description?: string | null;
  basePrice?: string | null;
  chargeType?: string | null;
}): Promise<ProfessionalService> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) {
    throw new Error("Crie o perfil profissional antes de cadastrar servicos.");
  }

  const title = input.title.trim();
  const category = slugify(input.category.trim() || title);
  if (!title) throw new Error("Informe o nome do servico.");
  if (!category) throw new Error("Informe a categoria do servico.");

  const { data, error } = await supabase
    .from("services")
    .insert({
      professional_id: profile.id,
      title,
      category,
      description: input.description?.trim() || null,
      base_price: input.basePrice?.trim() || null,
      charge_type: input.chargeType?.trim() || "por servico",
      active: true,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapService(data);
}

export async function setMyProfessionalProfilePublished(input: {
  userId: string;
  published: boolean;
}): Promise<ProfessionalProfile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) {
    throw new Error("Crie o perfil profissional antes de publicar.");
  }

  const { data, error } = await supabase
    .from("professional_profiles")
    .update({
      profile_status: input.published ? "published" : "draft",
      is_published: input.published,
    })
    .eq("id", profile.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function listMyPortfolioItems(userId: string): Promise<PortfolioItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) return [];

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("professional_id", profile.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load portfolio items", error);
    return [];
  }

  return (data ?? []).map(mapPortfolioItem);
}

export async function createMyPortfolioItem(input: {
  userId: string;
  title: string;
  description?: string | null;
  mediaUrl?: string | null;
  file?: File | null;
  featured?: boolean;
}): Promise<PortfolioItem> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) {
    throw new Error("Crie o perfil profissional antes de cadastrar portfolio.");
  }

  const title = input.title.trim();
  if (!title) throw new Error("Informe o titulo do item de portfolio.");

  const mediaUrl = input.file
    ? await uploadPortfolioFile({
        profileId: profile.id,
        file: input.file,
      })
    : input.mediaUrl?.trim() || null;

  const { data, error } = await supabase
    .from("portfolio_items")
    .insert({
      professional_id: profile.id,
      title,
      description: input.description?.trim() || null,
      image_url: mediaUrl,
      media_url: mediaUrl,
      media_kind: "image",
      is_featured: Boolean(input.featured),
      sort_order: 0,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapPortfolioItem(data);
}

async function uploadPortfolioFile(input: { profileId: string; file: File }): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  if (!input.file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  const extension = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${crypto.randomUUID()}.${extension}`;
  const path = `${input.profileId}/${safeName}`;

  const { error } = await supabase.storage.from("portfolio").upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("portfolio").getPublicUrl(path);
  return data.publicUrl;
}

async function uploadAvatarFile(input: { userId: string; file: File }): Promise<string> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  if (!input.file.type.startsWith("image/")) {
    throw new Error("Envie uma imagem PNG, JPG ou WebP.");
  }

  const extension = input.file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = `${crypto.randomUUID()}.${extension}`;
  const path = `${input.userId}/${safeName}`;

  const { error } = await supabase.storage.from("avatars").upload(path, input.file, {
    cacheControl: "3600",
    contentType: input.file.type,
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data.publicUrl;
}

export async function listProfessionalPortfolio(professionalId: string): Promise<PortfolioItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("professional_id", professionalId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    console.error("Failed to load public portfolio", error);
    return [];
  }

  return (data ?? []).map(mapPortfolioItem);
}

export async function getPublicProfessionalLink(
  slug: string,
): Promise<PublicProfessionalLink | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const normalizedSlug = slugify(slug);
  if (!normalizedSlug) return null;

  const { data: profile, error } = await supabase
    .from("professional_profiles")
    .select("*")
    .eq("ello_link_slug", normalizedSlug)
    .in("profile_status", ["published", "active", "approved"])
    .maybeSingle();

  if (error) {
    console.error("Failed to load public ELLO Link", error);
    return null;
  }

  if (!profile) return null;

  const isProActive =
    Boolean(profile.ello_link_pro_enabled) &&
    (!profile.ello_link_pro_until || new Date(profile.ello_link_pro_until).getTime() > Date.now());
  const maxPortfolioItems = isProActive ? profile.max_portfolio_items : 6;
  const [services, portfolio] = await Promise.all([
    listPublicProfessionalServices(profile.id),
    listProfessionalPortfolio(profile.id),
  ]);
  const name = profile.public_name ?? profile.specialty;

  return {
    id: profile.id,
    slug: profile.ello_link_slug ?? normalizedSlug,
    name,
    initials: initialsFor(name),
    avatarUrl: profile.avatar_url,
    headline: profile.headline ?? profile.specialty,
    specialty: profile.specialty,
    bio: profile.bio ?? profile.description,
    city: profile.city,
    coverage: profile.coverage,
    availability: profile.availability,
    basePrice: profile.base_price,
    chargeType: profile.charge_type,
    rating: Number(profile.rating),
    completedJobs: profile.completed_jobs,
    trustLevel: normalizeTrustLevel(profile.trust_level),
    boosted: isActiveUntil(profile.boosted_until),
    elloLinkProEnabled: isProActive,
    introVideoUrl: isProActive ? profile.intro_video_url : null,
    coverUrl: isProActive ? profile.cover_url : null,
    qrCodeEnabled: isProActive && profile.qr_code_enabled,
    maxPortfolioItems,
    services,
    portfolio: portfolio.slice(0, maxPortfolioItems),
  };
}

async function listPublicProfessionalServices(
  professionalId: string,
): Promise<ProfessionalService[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professionalId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public services", error);
    return [];
  }

  return (data ?? []).map(mapService);
}

export async function recordElloLinkEvent(input: {
  professionalId: string;
  eventType: Database["public"]["Tables"]["ello_link_events"]["Insert"]["event_type"];
  source?: string | null;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.from("ello_link_events").insert({
    professional_id: input.professionalId,
    event_type: input.eventType,
    source: input.source?.trim() || null,
  });

  if (error) {
    console.error("Failed to record ELLO Link event", error);
  }
}

export async function listMyMonetizationRequests(
  userId: string,
): Promise<MonetizationRequestItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) return [];

  const { data, error } = await supabase
    .from("monetization_requests")
    .select("*")
    .eq("professional_id", profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load monetization requests", error);
    return [];
  }

  return (data ?? []).map(mapMonetizationRequest);
}

export async function createMonetizationRequest(input: {
  userId: string;
  requestType: MonetizationRequestRow["request_type"];
  requestedDetails?: Record<string, Json>;
}): Promise<MonetizationRequestItem> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) {
    throw new Error("Crie seu perfil profissional antes de solicitar monetizacao.");
  }

  const pending = await listMyMonetizationRequests(input.userId);
  const alreadyPending = pending.some(
    (request) => request.requestType === input.requestType && request.status === "pending",
  );
  if (alreadyPending) {
    throw new Error("Ja existe uma solicitacao pendente para esta opcao.");
  }

  const { data, error } = await supabase
    .from("monetization_requests")
    .insert({
      professional_id: profile.id,
      request_type: input.requestType,
      requested_details: input.requestedDetails ?? {},
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMonetizationRequest(data);
}

export async function getMyElloLinkStats(userId: string): Promise<{
  views: number;
  quoteClicks: number;
  shareClicks: number;
  qrViews: number;
}> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return { views: 0, quoteClicks: 0, shareClicks: 0, qrViews: 0 };
  }

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) {
    return { views: 0, quoteClicks: 0, shareClicks: 0, qrViews: 0 };
  }

  const [views, quoteClicks, shareClicks, qrViews] = await Promise.all([
    countElloLinkEvents(profile.id, "view"),
    countElloLinkEvents(profile.id, "quote_click"),
    countElloLinkEvents(profile.id, "share_click"),
    countElloLinkEvents(profile.id, "qr_view"),
  ]);

  return { views, quoteClicks, shareClicks, qrViews };
}

export async function listLocalPartnerSpaces(city?: string | null): Promise<LocalPartnerSpace[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  let query = supabase
    .from("local_partner_spaces")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(6);

  if (city?.trim()) {
    query = query.ilike("city", `%${city.trim().split(",")[0]}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to load local partners", error);
    return [];
  }

  return (data ?? []).map(mapLocalPartnerSpace);
}

export async function listAdminMonetizationRequests(
  userId: string,
): Promise<AdminMonetizationRequest[]> {
  const profile = await getUserProfile(userId);
  if (profile?.role !== "admin") return [];

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("monetization_requests")
    .select(
      `
      *,
      professional_profiles(id, public_name, specialty, city, ello_link_slug)
    `,
    )
    .order("created_at", { ascending: false })
    .returns<AdminMonetizationRequestRow[]>();

  if (error) {
    console.error("Failed to load admin monetization requests", error);
    return [];
  }

  return (data ?? []).map(mapAdminMonetizationRequest);
}

export async function reviewMonetizationRequest(input: {
  userId: string;
  requestId: string;
  status: "approved" | "rejected" | "cancelled";
  days?: number;
}): Promise<void> {
  const profile = await getUserProfile(input.userId);
  if (profile?.role !== "admin") {
    throw new Error("Apenas administradores podem revisar monetizacao.");
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const { data: requestData, error: requestError } = await supabase
    .from("monetization_requests")
    .select("*")
    .eq("id", input.requestId)
    .single();

  if (requestError) throw requestError;
  const request = requestData as MonetizationRequestRow | null;
  if (!request) throw new Error("Solicitacao de monetizacao nao encontrada.");

  if (input.status === "approved") {
    const days = Math.max(
      1,
      Math.min(365, Math.round(input.days ?? defaultDaysFor(request.request_type))),
    );
    const expiresAt = addDaysIso(days);
    const profilePatch =
      request.request_type === "profile_boost"
        ? {
            boosted_until: expiresAt,
          }
        : request.request_type === "ello_link_pro"
          ? {
              ello_link_pro_enabled: true,
              ello_link_pro_until: expiresAt,
              max_portfolio_items: 18,
              qr_code_enabled: true,
            }
          : null;

    if (profilePatch) {
      const { error: profileError } = await supabase
        .from("professional_profiles")
        .update({
          ...profilePatch,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.professional_id);

      if (profileError) throw profileError;
    }
  }

  const { error } = await supabase
    .from("monetization_requests")
    .update({
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.requestId);

  if (error) throw error;
}

export async function listAdminLocalPartnerSpaces(userId: string): Promise<LocalPartnerSpaceRow[]> {
  const profile = await getUserProfile(userId);
  if (profile?.role !== "admin") return [];

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("local_partner_spaces")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load admin local partners", error);
    return [];
  }

  return data ?? [];
}

export async function upsertAdminLocalPartnerSpace(input: {
  userId: string;
  id?: string | null;
  name: string;
  category: string;
  city: string;
  description: string;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  imageUrl?: string | null;
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}): Promise<LocalPartnerSpaceRow> {
  const profile = await getUserProfile(input.userId);
  if (profile?.role !== "admin") {
    throw new Error("Apenas administradores podem gerenciar parceiros.");
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const payload = {
    name: input.name.trim(),
    category: input.category.trim(),
    city: input.city.trim(),
    description: input.description.trim(),
    cta_label: input.ctaLabel?.trim() || "Conhecer parceiro",
    cta_url: input.ctaUrl?.trim() || null,
    image_url: input.imageUrl?.trim() || null,
    active: input.active,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    updated_at: new Date().toISOString(),
  };

  if (!payload.name) throw new Error("Informe o nome do parceiro.");
  if (!payload.category) throw new Error("Informe a categoria do parceiro.");
  if (!payload.city) throw new Error("Informe a cidade do parceiro.");
  if (!payload.description) throw new Error("Informe a descricao do parceiro.");

  const query = input.id
    ? supabase.from("local_partner_spaces").update(payload).eq("id", input.id)
    : supabase.from("local_partner_spaces").insert(payload);

  const { data, error } = await query.select("*").single();
  if (error) throw error;
  return data;
}

export async function deleteAdminLocalPartnerSpace(input: {
  userId: string;
  id: string;
}): Promise<void> {
  const profile = await getUserProfile(input.userId);
  if (profile?.role !== "admin") {
    throw new Error("Apenas administradores podem remover parceiros.");
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const { error } = await supabase.from("local_partner_spaces").delete().eq("id", input.id);
  if (error) throw error;
}

export async function getMyClientProfile(userId: string): Promise<ClientProfile | null> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("client_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to load client profile", error);
    return null;
  }

  return data;
}

export async function listMyFavoriteProfessionalIds(userId: string): Promise<string[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const clientProfile = await getMyClientProfile(userId);
  if (!clientProfile) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select("professional_id")
    .eq("client_id", clientProfile.id);

  if (error) {
    console.error("Failed to load favorite ids", error);
    return [];
  }

  return (data ?? []).map((favorite) => favorite.professional_id);
}

export async function listMyFavoriteProfessionals(userId: string): Promise<Professional[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const clientProfile = await getMyClientProfile(userId);
  if (!clientProfile) return [];

  const { data, error } = await supabase
    .from("favorites")
    .select(
      `
      professional_id,
      professional_profiles(
        id,
        public_name,
        specialty,
        city,
        description,
        avatar_url,
        verification_status,
        profile_status,
        headline,
        bio,
        experience_years,
        trust_level,
        rating,
        completed_jobs,
        response_time_minutes,
        services(category, title)
      )
    `,
    )
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false })
    .returns<FavoriteProfessionalRow[]>();

  if (error) {
    console.error("Failed to load favorite professionals", error);
    return [];
  }

  return (data ?? [])
    .map((favorite) => asRelatedObject(favorite.professional_profiles))
    .filter((professional): professional is ProfessionalRow => Boolean(professional))
    .map(mapProfessionalRow);
}

export async function setProfessionalFavorite(input: {
  userId: string;
  professionalId: string;
  favorite: boolean;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const clientProfile = await ensureMyClientProfile({
    userId: input.userId,
    city: "Sao Paulo, SP",
  });

  if (input.favorite) {
    const { error } = await supabase.from("favorites").upsert(
      {
        client_id: clientProfile.id,
        professional_id: input.professionalId,
      },
      {
        onConflict: "client_id,professional_id",
      },
    );

    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("favorites")
    .delete()
    .eq("client_id", clientProfile.id)
    .eq("professional_id", input.professionalId);

  if (error) throw error;
}

export async function ensureMyClientProfile(input: {
  userId: string;
  city?: string | null;
}): Promise<ClientProfile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  const existing = await getMyClientProfile(input.userId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from("client_profiles")
    .insert({
      user_id: input.userId,
      city: input.city ?? "São Paulo, SP",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateMyClientProfile(input: ClientProfileUpdate): Promise<ClientProfile> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const city = input.city.trim();
  if (!city) throw new Error("Informe sua cidade.");

  const clientProfile = await ensureMyClientProfile({
    userId: input.userId,
    city,
  });

  const { data, error } = await supabase
    .from("client_profiles")
    .update({
      city,
      region: input.region?.trim() || null,
      interests: input.interests?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", clientProfile.id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function createQuoteRequest(input: {
  userId: string;
  professionalId: string;
  description: string;
  location?: string | null;
  serviceId?: string | null;
}): Promise<QuoteRequest> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase não está configurado neste ambiente.");
  }

  const clientProfile = await ensureMyClientProfile({
    userId: input.userId,
    city: input.location ?? "São Paulo, SP",
  });

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      client_id: clientProfile.id,
      professional_id: input.professionalId,
      service_id: input.serviceId ?? null,
      description: input.description,
      location: input.location ?? clientProfile.city,
      status: "new",
      payment_mode: "external",
      payment_status: "not_applicable",
      platform_fee_percent: null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function createDetailedQuoteRequest(input: {
  userId: string;
  professionalId: string;
  description: string;
  location: string;
  serviceId?: string | null;
  desiredDate?: string | null;
}): Promise<QuoteRequest> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const description = input.description.trim();
  const location = input.location.trim();
  if (!description) throw new Error("Descreva o servico que voce precisa.");
  if (!location) throw new Error("Informe a cidade ou bairro do atendimento.");

  const clientProfile = await ensureMyClientProfile({
    userId: input.userId,
    city: location,
  });

  const { data, error } = await supabase
    .from("quote_requests")
    .insert({
      client_id: clientProfile.id,
      professional_id: input.professionalId,
      service_id: input.serviceId ?? null,
      description,
      desired_date: input.desiredDate || null,
      location,
      status: "new",
      payment_mode: "external",
      payment_status: "not_applicable",
      platform_fee_percent: null,
    })
    .select("*")
    .single();

  if (error) throw error;

  const { error: messageError } = await supabase.from("quote_messages").insert({
    quote_request_id: data.id,
    sender_user_id: input.userId,
    body: description,
  });

  if (messageError) throw messageError;
  return data;
}

export async function listMyQuoteThreads(userId: string): Promise<QuoteThread[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const professionalProfile = await getMyProfessionalProfile(userId);
  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `
      id,
      description,
      status,
      created_at,
      professional_id,
      professional_profiles(public_name, specialty),
      client_profiles(city)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to load quote threads", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const professional = asRelatedObject<{
      public_name: string | null;
      specialty: string;
    }>(row.professional_profiles);
    const client = asRelatedObject<{ city: string }>(row.client_profiles);
    const professionalView = professionalProfile?.id === row.professional_id;
    return {
      id: row.id,
      title: professionalView
        ? `Cliente - ${client?.city ?? "ELLO"}`
        : (professional?.public_name ?? "Atendimento ELLO"),
      subtitle: professionalView
        ? "Solicitacao recebida"
        : (professional?.specialty ?? "Orcamento"),
      lastMessage: row.description,
      timestamp: formatShortDate(row.created_at),
      status: row.status,
      professionalView,
    };
  });
}

export async function listMyRequestHistory(userId: string): Promise<RequestHistoryItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const clientProfile = await getMyClientProfile(userId);
  if (!clientProfile) return [];

  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `
      *,
      professional_profiles(public_name, specialty, avatar_url),
      services(title),
      reviews(rating, comment)
    `,
    )
    .eq("client_id", clientProfile.id)
    .order("created_at", { ascending: false })
    .returns<RequestHistoryRow[]>();

  if (error) {
    console.error("Failed to load request history", error);
    return [];
  }

  return (data ?? []).map(mapRequestHistoryItem);
}

export async function listMyProfessionalQuotes(userId: string): Promise<ProfessionalQuoteItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) return [];

  const { data, error } = await supabase
    .from("quote_requests")
    .select(
      `
      *,
      client_profiles(city),
      services(title)
    `,
    )
    .eq("professional_id", profile.id)
    .order("created_at", { ascending: false })
    .returns<ProfessionalQuoteRow[]>();

  if (error) {
    console.error("Failed to load professional quotes", error);
    return [];
  }

  return (data ?? []).map(mapProfessionalQuoteItem);
}

export async function respondToProfessionalQuote(input: {
  userId: string;
  quoteRequestId: string;
  responsePrice: string;
  responseEta: string;
  responseMessage: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) throw new Error("Perfil profissional nao encontrado.");

  const responsePrice = input.responsePrice.trim();
  const responseEta = input.responseEta.trim();
  const responseMessage = input.responseMessage.trim();
  if (!responsePrice) throw new Error("Informe o valor combinado ou condicao do orcamento.");
  if (!responseEta) throw new Error("Informe o prazo ou disponibilidade.");
  if (!responseMessage) throw new Error("Escreva uma mensagem para o cliente.");

  const { error } = await supabase
    .from("quote_requests")
    .update({
      status: "quoted",
      response_price: responsePrice,
      response_eta: responseEta,
      response_message: responseMessage,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.quoteRequestId)
    .eq("professional_id", profile.id);

  if (error) throw error;

  await sendQuoteMessage({
    quoteRequestId: input.quoteRequestId,
    senderUserId: input.userId,
    body: `Orcamento enviado: ${responsePrice}. Prazo: ${responseEta}. ${responseMessage}`,
  });
}

export async function updateProfessionalQuoteStatus(input: {
  userId: string;
  quoteRequestId: string;
  status: Extract<QuoteRequest["status"], "accepted" | "in_progress" | "declined" | "cancelled">;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const profile = await getMyProfessionalProfile(input.userId);
  if (!profile) throw new Error("Perfil profissional nao encontrado.");

  const patch: Database["public"]["Tables"]["quote_requests"]["Update"] = {
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (input.status === "accepted") patch.accepted_at = new Date().toISOString();
  if (input.status === "cancelled" || input.status === "declined") {
    patch.cancelled_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("quote_requests")
    .update(patch)
    .eq("id", input.quoteRequestId)
    .eq("professional_id", profile.id);

  if (error) throw error;
}

export async function markQuoteRequestCompleted(input: {
  quoteRequestId: string;
  userId: string;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const clientProfile = await getMyClientProfile(input.userId);
  if (!clientProfile) throw new Error("Perfil de cliente nao encontrado.");

  const { error } = await supabase
    .from("quote_requests")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.quoteRequestId)
    .eq("client_id", clientProfile.id);

  if (error) throw error;

  await supabase
    .from("appointments")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("quote_request_id", input.quoteRequestId)
    .eq("client_id", clientProfile.id);
}

export async function createOrUpdateReview(input: {
  quoteRequestId: string;
  userId: string;
  rating: number;
  comment?: string | null;
}): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const clientProfile = await getMyClientProfile(input.userId);
  if (!clientProfile) throw new Error("Perfil de cliente nao encontrado.");

  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const { data: quote, error: quoteError } = await supabase
    .from("quote_requests")
    .select("id, client_id, professional_id, status")
    .eq("id", input.quoteRequestId)
    .eq("client_id", clientProfile.id)
    .single();

  if (quoteError) throw quoteError;
  if (quote.status !== "completed") {
    throw new Error("Conclua o servico antes de avaliar.");
  }

  const { error } = await supabase.from("reviews").upsert(
    {
      quote_request_id: quote.id,
      client_id: quote.client_id,
      professional_id: quote.professional_id,
      rating,
      comment: input.comment?.trim() || null,
    },
    {
      onConflict: "quote_request_id",
    },
  );

  if (error) throw error;
}

export async function listQuoteMessages(input: {
  quoteRequestId: string;
  currentUserId: string;
}): Promise<QuoteMessage[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("quote_messages")
    .select("*")
    .eq("quote_request_id", input.quoteRequestId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load quote messages", error);
    return [];
  }

  return (data ?? []).map((message) => mapQuoteMessage(message, input.currentUserId));
}

export async function sendQuoteMessage(input: {
  quoteRequestId: string;
  senderUserId: string;
  body: string;
}): Promise<QuoteMessage> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const body = input.body.trim();
  if (!body) throw new Error("Digite uma mensagem antes de enviar.");

  const { data, error } = await supabase
    .from("quote_messages")
    .insert({
      quote_request_id: input.quoteRequestId,
      sender_user_id: input.senderUserId,
      body,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapQuoteMessage(data, input.senderUserId);
}

export async function createAppointmentFromQuote(input: {
  quoteRequestId: string;
  startsAt: string;
  notes?: string | null;
}): Promise<AppointmentRow> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const startsAt = assertFutureAppointment(input.startsAt);
  const { data, error } = await supabase.rpc("propose_appointment", {
    p_quote_request_id: input.quoteRequestId,
    p_starts_at: startsAt,
    p_notes: input.notes?.trim() || null,
  });

  if (error) throw new Error(formatAppointmentError(error));
  return data;
}

export async function updateAppointmentStatus(input: {
  appointmentId: string;
  status: Extract<AppointmentStatus, "confirmed" | "completed" | "cancelled">;
}): Promise<AppointmentRow> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase nao esta configurado neste ambiente.");
  }

  const { data, error } = await supabase.rpc("transition_appointment", {
    p_appointment_id: input.appointmentId,
    p_status: input.status,
  });

  if (error) throw new Error(formatAppointmentError(error));
  return data;
}

export async function listMyAgendaItems(userId: string): Promise<AgendaItem[]> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return [];

  const professionalProfile = await getMyProfessionalProfile(userId);
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      id,
      quote_request_id,
      client_id,
      professional_id,
      starts_at,
      address,
      notes,
      status,
      services(title),
      client_profiles(city),
      professional_profiles(public_name, specialty)
    `,
    )
    .order("starts_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Failed to load agenda items", error);
    return [];
  }

  return (data ?? []).map((row) => {
    const professional = asRelatedObject<{
      public_name: string | null;
      specialty: string;
    }>(row.professional_profiles);
    const client = asRelatedObject<{ city: string }>(row.client_profiles);
    const service = asRelatedObject<{ title: string }>(row.services);
    const startsAt = new Date(row.starts_at);
    const professionalView = professionalProfile?.id === row.professional_id;
    const professionalName = professionalView
      ? `Cliente - ${client?.city ?? row.address ?? "ELLO"}`
      : (professional?.public_name ?? professional?.specialty ?? "Profissional");

    return {
      id: row.id,
      quoteRequestId: row.quote_request_id,
      professionalId: row.professional_id,
      professionalName,
      professionalInitials: initialsFor(professionalName),
      service: service?.title ?? professional?.specialty ?? "Servico agendado",
      startsAt: row.starts_at,
      date: formatShortDate(row.starts_at),
      time: startsAt.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      address: row.address,
      notes: row.notes,
      professionalView,
      status: row.status,
    };
  });
}

export async function getMyBusinessDashboard(userId: string): Promise<BusinessDashboard> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    return emptyBusinessDashboard(null);
  }

  const profile = await getMyProfessionalProfile(userId);
  if (!profile) return emptyBusinessDashboard(null);

  const [
    quotesResult,
    appointmentsResult,
    servicesResult,
    elloLinkViewsResult,
    elloLinkLeadsResult,
    recentQuotesResult,
  ] = await Promise.all([
    supabase
      .from("quote_requests")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profile.id),
    supabase
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profile.id),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profile.id),
    supabase
      .from("ello_link_events")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profile.id)
      .eq("event_type", "view"),
    supabase
      .from("ello_link_events")
      .select("id", { count: "exact", head: true })
      .eq("professional_id", profile.id)
      .eq("event_type", "quote_click"),
    supabase
      .from("quote_requests")
      .select(
        `
        id,
        description,
        status,
        created_at,
        client_profiles(city)
      `,
      )
      .eq("professional_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  if (quotesResult.error) console.error("Failed to count quotes", quotesResult.error);
  if (appointmentsResult.error) {
    console.error("Failed to count appointments", appointmentsResult.error);
  }
  if (servicesResult.error) console.error("Failed to count services", servicesResult.error);
  if (elloLinkViewsResult.error) {
    console.error("Failed to count ELLO Link views", elloLinkViewsResult.error);
  }
  if (elloLinkLeadsResult.error) {
    console.error("Failed to count ELLO Link leads", elloLinkLeadsResult.error);
  }
  if (recentQuotesResult.error) {
    console.error("Failed to load recent quotes", recentQuotesResult.error);
  }

  return {
    profile,
    quoteCount: quotesResult.count ?? 0,
    appointmentCount: appointmentsResult.count ?? 0,
    serviceCount: servicesResult.count ?? 0,
    elloLinkViewCount: elloLinkViewsResult.count ?? 0,
    elloLinkLeadCount: elloLinkLeadsResult.count ?? 0,
    rating: Number(profile.rating),
    completedJobs: profile.completed_jobs,
    recentQuotes: (recentQuotesResult.data ?? []).map((quote) => {
      const client = asRelatedObject<{ city: string }>(quote.client_profiles);
      return {
        id: quote.id,
        title: quote.description,
        subtitle: client?.city ?? "Cliente ELLO",
        status: quote.status,
      };
    }),
  };
}

function filterMockProfessionals(filters?: { category?: string; query?: string; limit?: number }) {
  return filterProfessionals(PROFESSIONALS, filters);
}

function emptyBusinessDashboard(profile: ProfessionalProfile | null): BusinessDashboard {
  return {
    profile,
    quoteCount: 0,
    appointmentCount: 0,
    serviceCount: 0,
    elloLinkViewCount: 0,
    elloLinkLeadCount: 0,
    rating: profile ? Number(profile.rating) : 0,
    completedJobs: profile?.completed_jobs ?? 0,
    recentQuotes: [],
  };
}

function mapQuoteMessage(message: QuoteMessageRow, currentUserId: string): QuoteMessage {
  return {
    id: message.id,
    quoteRequestId: message.quote_request_id,
    senderUserId: message.sender_user_id,
    body: message.body,
    timestamp: new Date(message.created_at).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    mine: message.sender_user_id === currentUserId,
  };
}

function mapService(service: ServiceRow): ProfessionalService {
  return {
    id: service.id,
    title: service.title,
    description: service.description,
    category: service.category,
    basePrice: service.base_price,
    chargeType: service.charge_type,
    active: service.active,
  };
}

function mapRequestHistoryItem(row: RequestHistoryRow): RequestHistoryItem {
  const professional = asRelatedObject(row.professional_profiles);
  const service = asRelatedObject(row.services);
  const review = row.reviews?.[0] ?? null;
  const professionalName = professional?.public_name ?? professional?.specialty ?? "Profissional";

  return {
    id: row.id,
    professionalId: row.professional_id,
    professionalName,
    professionalSpecialty: professional?.specialty ?? "Servico ELLO",
    professionalInitials: initialsFor(professionalName),
    professionalAvatarUrl: professional?.avatar_url ?? null,
    serviceTitle: service?.title ?? professional?.specialty ?? "Orcamento",
    description: row.description,
    location: row.location,
    status: row.status,
    createdAt: formatShortDate(row.created_at),
    responsePrice: row.response_price,
    responseEta: row.response_eta,
    review,
  };
}

function mapProfessionalQuoteItem(row: ProfessionalQuoteRow): ProfessionalQuoteItem {
  const client = asRelatedObject(row.client_profiles);
  const service = asRelatedObject(row.services);

  return {
    id: row.id,
    clientCity: client?.city ?? row.location ?? "Cliente ELLO",
    serviceTitle: service?.title ?? "Orcamento",
    description: row.description,
    location: row.location,
    status: row.status,
    createdAt: formatShortDate(row.created_at),
    responsePrice: row.response_price,
    responseEta: row.response_eta,
    responseMessage: row.response_message,
  };
}

function mapPortfolioItem(item: PortfolioRow): PortfolioItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    mediaUrl: item.media_url ?? item.image_url,
    mediaKind: item.media_kind,
    featured: item.is_featured,
  };
}

function mapMonetizationRequest(row: MonetizationRequestRow): MonetizationRequestItem {
  return {
    id: row.id,
    requestType: row.request_type,
    status: row.status,
    requestedDetails: row.requested_details,
    createdAt: formatShortDate(row.created_at),
  };
}

function mapAdminMonetizationRequest(row: AdminMonetizationRequestRow): AdminMonetizationRequest {
  const professional = asRelatedObject(row.professional_profiles);

  return {
    ...mapMonetizationRequest(row),
    professional: professional
      ? {
          id: professional.id,
          name: professional.public_name ?? professional.specialty,
          specialty: professional.specialty,
          city: professional.city,
          slug: professional.ello_link_slug,
        }
      : null,
  };
}

function mapLocalPartnerSpace(row: LocalPartnerSpaceRow): LocalPartnerSpace {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    city: row.city,
    description: row.description,
    ctaLabel: row.cta_label,
    ctaUrl: row.cta_url,
    imageUrl: row.image_url,
  };
}

async function countElloLinkEvents(
  professionalId: string,
  eventType: Database["public"]["Tables"]["ello_link_events"]["Insert"]["event_type"],
): Promise<number> {
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from("ello_link_events")
    .select("id", { count: "exact", head: true })
    .eq("professional_id", professionalId)
    .eq("event_type", eventType);

  if (error) {
    console.error("Failed to count ELLO Link events", error);
    return 0;
  }

  return count ?? 0;
}

function sortBoostedProfessionalRows(rows: ProfessionalRow[]): ProfessionalRow[] {
  return [...rows].sort((a, b) => {
    const aBoosted = isActiveUntil(a.boosted_until);
    const bBoosted = isActiveUntil(b.boosted_until);
    if (aBoosted !== bBoosted) return aBoosted ? -1 : 1;
    return Number(b.rating) - Number(a.rating) || b.completed_jobs - a.completed_jobs;
  });
}

function isActiveUntil(value: string | null | undefined): boolean {
  return Boolean(value && new Date(value).getTime() > Date.now());
}

function defaultDaysFor(requestType: MonetizationRequestRow["request_type"]): number {
  if (requestType === "profile_boost") return 7;
  if (requestType === "ello_link_pro") return 30;
  return 30;
}

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function filterProfessionals(
  professionals: Professional[],
  filters?: {
    category?: string;
    query?: string;
    limit?: number;
  },
) {
  const filtered = professionals.filter((professional) => {
    if (filters?.category && professional.category !== filters.category) return false;

    if (filters?.query) {
      const normalized = filters.query.toLowerCase();
      return (
        professional.name.toLowerCase().includes(normalized) ||
        professional.profession.toLowerCase().includes(normalized) ||
        professional.specialties.some((specialty) => specialty.toLowerCase().includes(normalized))
      );
    }

    return true;
  });

  return typeof filters?.limit === "number" ? filtered.slice(0, filters.limit) : filtered;
}

function mapProfessionalRow(row: ProfessionalRow): Professional {
  const displayName = row.public_name ?? row.specialty;
  const firstService = row.services?.[0];
  const categorySlug = firstService?.category ?? slugify(row.specialty) ?? "servicos";
  const categoryName = firstService ? humanizeSlug(firstService.category) : row.specialty;
  const responseTime = row.response_time_minutes ? `${row.response_time_minutes} min` : "~1h";

  return {
    id: row.id,
    name: displayName,
    profession: row.headline ?? row.specialty ?? categoryName,
    category: categorySlug,
    description: row.bio ?? row.description ?? "Profissional verificado na ELLO.",
    specialties: row.services?.map((service) => service.title) ?? [row.specialty],
    city: row.city,
    experienceYears: row.experience_years,
    certifications: row.verification_status === "verified" ? ["Perfil verificado"] : [],
    rating: Number(row.rating),
    completedJobs: row.completed_jobs,
    responseTime,
    trustLevel: normalizeTrustLevel(row.trust_level),
    available: "hoje",
    initials: initialsFor(displayName),
    avatarTone: "oklch(0.82 0.07 205)",
    avatarUrl: row.avatar_url,
    boosted: isActiveUntil(row.boosted_until),
  };
}

function normalizeTrustLevel(value: string): TrustLevel {
  const normalized = value.toLowerCase();
  if (normalized === "prata") return "Prata";
  if (normalized === "ouro") return "Ouro";
  if (normalized === "diamante") return "Diamante";
  if (normalized === "elite") return "Elite";
  return "Bronze";
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

function humanizeSlug(value: string) {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function asRelatedObject<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}
