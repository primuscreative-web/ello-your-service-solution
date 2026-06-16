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
};

export const PROFESSIONALS: Professional[] = [
  {
    id: "ricardo-menezes",
    name: "Ricardo Menezes",
    profession: "Eletricista Residencial",
    category: "eletricista",
    description:
      "Especialista em instalações elétricas, quadros de energia e automação residencial. Atendimento ágil em toda zona oeste.",
    specialties: ["Quadro de energia", "Chuveiros", "Tomadas", "Automação"],
    city: "São Paulo, SP",
    experienceYears: 12,
    certifications: ["NR-10", "SENAI Eletricista"],
    rating: 4.9,
    completedJobs: 142,
    responseTime: "15 min",
    trustLevel: "Ouro",
    available: "agora",
    initials: "RM",
    avatarTone: "oklch(0.78 0.09 60)",
  },
  {
    id: "bia-carvalho",
    name: "Bia Carvalho",
    profession: "Fotógrafa e Editora",
    category: "fotografo",
    description:
      "Ensaios, eventos e conteúdo para marcas. Pacotes flexíveis com entrega editorial em até 7 dias.",
    specialties: ["Ensaios", "Casamentos", "Conteúdo para marcas"],
    city: "Pinheiros, SP",
    experienceYears: 7,
    certifications: ["Curso SENAC Fotografia"],
    rating: 5.0,
    completedJobs: 89,
    responseTime: "~1h",
    trustLevel: "Prata",
    available: "hoje",
    initials: "BC",
    avatarTone: "oklch(0.82 0.07 30)",
  },
  {
    id: "carlos-lima",
    name: "Carlos Lima",
    profession: "Encanador Hidráulico",
    category: "encanador",
    description:
      "Vazamentos, desentupimentos e reformas hidráulicas com garantia de 90 dias.",
    specialties: ["Vazamentos", "Caixa d'água", "Desentupimento"],
    city: "Butantã, SP",
    experienceYears: 18,
    certifications: ["SENAI Hidráulica"],
    rating: 4.8,
    completedJobs: 312,
    responseTime: "30 min",
    trustLevel: "Diamante",
    available: "agora",
    initials: "CL",
    avatarTone: "oklch(0.7 0.08 220)",
  },
  {
    id: "ana-beatriz",
    name: "Ana Beatriz",
    profession: "Manicure e Pedicure",
    category: "manicure",
    description: "Atendimento em domicílio com materiais 100% esterilizados e nail art autoral.",
    specialties: ["Nail art", "Spa dos pés", "Esmaltação em gel"],
    city: "Vila Madalena, SP",
    experienceYears: 5,
    certifications: ["Curso Mãos & Pés Pro"],
    rating: 4.9,
    completedJobs: 220,
    responseTime: "20 min",
    trustLevel: "Ouro",
    available: "hoje",
    initials: "AB",
    avatarTone: "oklch(0.85 0.07 350)",
  },
  {
    id: "joao-pedro",
    name: "João Pedro",
    profession: "Pintor Residencial",
    category: "pintor",
    description: "Pintura residencial e comercial. Texturização, grafiato e efeitos decorativos.",
    specialties: ["Pintura interna", "Texturas", "Grafiato"],
    city: "Tatuapé, SP",
    experienceYears: 10,
    certifications: ["SENAI Pintor"],
    rating: 4.7,
    completedJobs: 95,
    responseTime: "1h",
    trustLevel: "Prata",
    available: "semana",
    initials: "JP",
    avatarTone: "oklch(0.78 0.1 140)",
  },
  {
    id: "marta-souza",
    name: "Marta Souza",
    profession: "Diarista",
    category: "diarista",
    description: "Limpeza completa, pós-obra e organização de ambientes residenciais.",
    specialties: ["Limpeza geral", "Pós-obra", "Organização"],
    city: "Mooca, SP",
    experienceYears: 8,
    certifications: [],
    rating: 4.9,
    completedJobs: 410,
    responseTime: "2h",
    trustLevel: "Elite",
    available: "hoje",
    initials: "MS",
    avatarTone: "oklch(0.84 0.07 70)",
  },
];

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

export function getProfessional(id: string) {
  return PROFESSIONALS.find((p) => p.id === id);
}

export type Conversation = {
  id: string;
  professionalId: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
};

export const CONVERSATIONS: Conversation[] = [
  { id: "c1", professionalId: "ricardo-menezes", lastMessage: "Posso passar amanhã às 10h.", timestamp: "12:42", unread: 2 },
  { id: "c2", professionalId: "ana-beatriz", lastMessage: "Tudo combinado! 😊", timestamp: "Ontem", unread: 0 },
  { id: "c3", professionalId: "carlos-lima", lastMessage: "Orçamento enviado.", timestamp: "Seg", unread: 0 },
];

export type Appointment = {
  id: string;
  professionalId: string;
  service: string;
  date: string;
  time: string;
  status: "confirmado" | "pendente" | "concluido";
};

export const APPOINTMENTS: Appointment[] = [
  { id: "a1", professionalId: "ana-beatriz", service: "Manicure + Pedicure", date: "Hoje", time: "16:00", status: "confirmado" },
  { id: "a2", professionalId: "ricardo-menezes", service: "Instalação de chuveiro", date: "Amanhã", time: "10:00", status: "pendente" },
  { id: "a3", professionalId: "marta-souza", service: "Diária completa", date: "Sex, 20 jun", time: "08:00", status: "confirmado" },
];
