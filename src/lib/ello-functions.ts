import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import process from "node:process";
import { z } from "zod";

// ============================================================================
// PROFESSIONAL PROFILE FUNCTIONS
// ============================================================================

const createProfessionalProfileSchema = z.object({
  userId: z.string(),
  publicName: z.string().min(1).max(120),
  specialty: z.string().min(1),
  city: z.string().min(1),
  description: z.string().optional(),
  experienceYears: z.number().optional(),
  headline: z.string().optional(),
});

export const createProfessionalProfile = createServerFn({ method: "POST" })
  .validator(createProfessionalProfileSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: profile, error } = await supabase
      .from("professional_profiles")
      .insert({
        user_id: data.userId,
        public_name: data.publicName,
        specialty: data.specialty,
        city: data.city,
        description: data.description,
        experience_years: data.experienceYears,
        headline: data.headline,
        verification_status: "draft",
        profile_status: "active",
        ello_link_slug: data.publicName.toLowerCase().replace(/\s+/g, "-"),
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, profile };
  });

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

const createServiceSchema = z.object({
  professionalProfileId: z.string(),
  title: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.number().optional(),
  duration: z.number().optional(),
});

export const createService = createServerFn({ method: "POST" })
  .validator(createServiceSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: service, error } = await supabase
      .from("services")
      .insert({
        professional_profile_id: data.professionalProfileId,
        title: data.title,
        category: data.category,
        description: data.description,
        price: data.price,
        duration_minutes: data.duration,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, service };
  });

// ============================================================================
// APPOINTMENT FUNCTIONS
// ============================================================================

const createAppointmentSchema = z.object({
  clientId: z.string(),
  professionalProfileId: z.string(),
  serviceId: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  notes: z.string().optional(),
});

export const createAppointment = createServerFn({ method: "POST" })
  .validator(createAppointmentSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);

    const { data: appointment, error } = await supabase
      .from("appointments")
      .insert({
        client_id: data.clientId,
        professional_profile_id: data.professionalProfileId,
        service_id: data.serviceId,
        appointment_date: appointmentDateTime.toISOString(),
        status: "pending",
        notes: data.notes,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, appointment };
  });

// ============================================================================
// QUOTE REQUEST FUNCTIONS
// ============================================================================

const createQuoteRequestSchema = z.object({
  clientId: z.string(),
  professionalProfileId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  budget: z.number().optional(),
});

export const createQuoteRequest = createServerFn({ method: "POST" })
  .validator(createQuoteRequestSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: quote, error } = await supabase
      .from("quote_requests")
      .insert({
        client_id: data.clientId,
        professional_profile_id: data.professionalProfileId,
        title: data.title,
        description: data.description,
        budget: data.budget,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, quote };
  });

// ============================================================================
// PORTFOLIO FUNCTIONS
// ============================================================================

const uploadPortfolioItemSchema = z.object({
  professionalProfileId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
});

export const uploadPortfolioItem = createServerFn({ method: "POST" })
  .validator(uploadPortfolioItemSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: item, error } = await supabase
      .from("portfolio_items")
      .insert({
        professional_profile_id: data.professionalProfileId,
        title: data.title,
        description: data.description,
        image_url: data.imageUrl,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, item };
  });

// ============================================================================
// REVIEW FUNCTIONS
// ============================================================================

const createReviewSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const createReview = createServerFn({ method: "POST" })
  .validator(createReviewSchema)
  .handler(async ({ data }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Backend não está configurado.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        appointment_id: data.appointmentId,
        rating: data.rating,
        comment: data.comment,
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return { success: true, review };
  });
