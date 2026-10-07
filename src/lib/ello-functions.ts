import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Funções Legadas de Protótipo.
 *
 * Todas as operações atuais do ELLO são executadas de forma segura e auditada
 * via LocalHub (RPCs seguras com RLS no PostgreSQL do Supabase).
 * As funções abaixo foram neutralizadas para fechar superfícies de ataque RPC.
 */

function disabledLegacyEndpoint(): never {
  throw new Error("Esta função RPC legada foi desativada permanentemente por políticas de segurança.");
}

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
  .handler(async () => {
    disabledLegacyEndpoint();
  });

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
  .handler(async () => {
    disabledLegacyEndpoint();
  });

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
  .handler(async () => {
    disabledLegacyEndpoint();
  });

const createQuoteRequestSchema = z.object({
  clientId: z.string(),
  professionalProfileId: z.string(),
  title: z.string().min(1),
  description: z.string().min(1),
  budget: z.number().optional(),
});

export const createQuoteRequest = createServerFn({ method: "POST" })
  .validator(createQuoteRequestSchema)
  .handler(async () => {
    disabledLegacyEndpoint();
  });

const uploadPortfolioItemSchema = z.object({
  professionalProfileId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().url(),
});

export const uploadPortfolioItem = createServerFn({ method: "POST" })
  .validator(uploadPortfolioItemSchema)
  .handler(async () => {
    disabledLegacyEndpoint();
  });

const createReviewSchema = z.object({
  appointmentId: z.string(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
});

export const createReview = createServerFn({ method: "POST" })
  .validator(createReviewSchema)
  .handler(async () => {
    disabledLegacyEndpoint();
  });
