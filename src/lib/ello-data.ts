export type TrustLevel = "Bronze" | "Prata" | "Ouro" | "Diamante" | "Elite";

export type Category = {
  slug: string;
  name: string;
  icon: string;
};

export const CATEGORIES: Category[] = [
  { slug: "eletricista", name: "Eletricista", icon: "⚡" },
  { slug: "encanador", name: "Encanador", icon: "🔧" },
  { slug: "pintor", name: "Pintor", icon: "🎨" },
  { slug: "diarista", name: "Diarista", icon: "🧹" },
  { slug: "cuidador-idosos", name: "Cuidador de Idosos", icon: "👵" },
  { slug: "tecnico-informatica", name: "Técnico de Informática", icon: "💻" },
  { slug: "marido-aluguel", name: "Marido de Aluguel", icon: "🛠️" },
  { slug: "jardineiro", name: "Jardineiro", icon: "🌿" },
  { slug: "pedreiro", name: "Pedreiro", icon: "🧱" },
  { slug: "montador-moveis", name: "Montador de Móveis", icon: "🪑" },
  { slug: "manicure", name: "Manicure", icon: "💅" },
  { slug: "fotografo", name: "Fotógrafo", icon: "📸" },
];

export type Professional = {
  id: string;
  name: string;
  profession: string;
  category: string;
  description: string;
  specialties: string[];
  city: string;
  experienceYears: number;
  certifications: string[];
  rating: number;
  completedJobs: number;
  responseTime: string;
  trustLevel: TrustLevel;
  available: "agora" | "hoje" | "semana" | "indisponivel";
  initials: string;
  avatarTone: string;
  avatarUrl?: string | null;
  boosted?: boolean;
};

export const TRUST_STYLES: Record<TrustLevel, { bg: string; text: string }> = {
  Bronze: { bg: "bg-orange-100", text: "text-orange-800" },
  Prata: { bg: "bg-zinc-200", text: "text-zinc-800" },
  Ouro: { bg: "bg-amber-200", text: "text-amber-900" },
  Diamante: { bg: "bg-sky-100", text: "text-sky-800" },
  Elite: { bg: "bg-foreground", text: "text-background" },
};

export const AVAILABILITY_LABEL: Record<Professional["available"], string> = {
  agora: "Disponível agora",
  hoje: "Disponível hoje",
  semana: "Esta semana",
  indisponivel: "Indisponível",
};
