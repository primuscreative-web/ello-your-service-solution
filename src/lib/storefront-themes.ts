export type StorefrontThemeId = "standard" | "sophisticated" | "luxury" | "artisanal";

export type StorefrontThemeOption = {
  id: StorefrontThemeId;
  name: string;
  description: string;
  palette: readonly [string, string, string];
};

const foodThemes: readonly StorefrontThemeOption[] = [
  {
    id: "standard",
    name: "Padrão ELLO",
    description: "Leve, direto e fácil de pedir.",
    palette: ["#f5f4ed", "#ffffff", "#687944"],
  },
  {
    id: "sophisticated",
    name: "Sofisticado",
    description: "Editorial, elegante e equilibrado.",
    palette: ["#f0eee7", "#fffdf8", "#8b7950"],
  },
  {
    id: "luxury",
    name: "Luxo",
    description: "Contraste profundo com detalhes dourados.",
    palette: ["#171513", "#24201c", "#c8a76b"],
  },
  {
    id: "artisanal",
    name: "Artesanal",
    description: "Acolhedor, natural e feito com personalidade.",
    palette: ["#efe6d6", "#fff8ec", "#a64f32"],
  },
];

const beautyThemes: readonly StorefrontThemeOption[] = [
  {
    id: "standard",
    name: "Padrão ELLO",
    description: "Leve, direto e fácil de navegar.",
    palette: ["#f5f4ed", "#ffffff", "#687944"],
  },
  {
    id: "sophisticated",
    name: "Editorial",
    description: "Bege suave, tipografia elegante e detalhes rosé.",
    palette: ["#f4eee9", "#fffaf6", "#a66e69"],
  },
  {
    id: "luxury",
    name: "Luxo",
    description: "Contraste profundo com acentos em champagne.",
    palette: ["#201b1b", "#2c2525", "#d2b486"],
  },
  {
    id: "artisanal",
    name: "Natural",
    description: "Tons botânicos e uma sensação acolhedora.",
    palette: ["#e9eee7", "#f8fbf6", "#66836b"],
  },
];

const petThemes: readonly StorefrontThemeOption[] = [
  {
    id: "standard",
    name: "Padrão ELLO",
    description: "Leve, direto e fácil de navegar.",
    palette: ["#f5f4ed", "#ffffff", "#687944"],
  },
  {
    id: "sophisticated",
    name: "Clássico",
    description: "Verde profundo, areia clara e cuidado tranquilo.",
    palette: ["#e9e6da", "#fffdf6", "#536b4c"],
  },
  {
    id: "luxury",
    name: "Premium",
    description: "Visual noturno com detalhes em cobre.",
    palette: ["#202625", "#2b3330", "#d49b71"],
  },
  {
    id: "artisanal",
    name: "Aventura",
    description: "Natureza, energia e tons acolhedores.",
    palette: ["#e9efe6", "#f8fbf5", "#d17a43"],
  },
];

const healthThemes: readonly StorefrontThemeOption[] = [
  {
    id: "standard",
    name: "Padrão ELLO",
    description: "Leve, direto e fácil de navegar.",
    palette: ["#f5f4ed", "#ffffff", "#687944"],
  },
  {
    id: "sophisticated",
    name: "Clínico",
    description: "Branco, azul sereno e informação bem organizada.",
    palette: ["#edf3f5", "#fbfeff", "#4b7d91"],
  },
  {
    id: "luxury",
    name: "Premium",
    description: "Azul profundo com acentos em prata suave.",
    palette: ["#18252d", "#23333d", "#b5cbd0"],
  },
  {
    id: "artisanal",
    name: "Calma",
    description: "Verde mineral e tons claros para acolher.",
    palette: ["#e8efeb", "#f8fbf9", "#658578"],
  },
];

export function getStorefrontThemes(category?: string | null) {
  if (category === "alimentacao") return foodThemes;
  if (category === "beleza") return beautyThemes;
  if (category === "pet") return petThemes;
  if (category === "saude") return healthThemes;
  return [];
}

export function isStorefrontThemeAvailable(category: string | null | undefined, theme: string) {
  return getStorefrontThemes(category).some((option) => option.id === theme);
}

export function getStorefrontTheme(category: string | null | undefined, theme?: string | null) {
  const themes = getStorefrontThemes(category);
  return themes.find((option) => option.id === theme) ?? themes[0] ?? null;
}
