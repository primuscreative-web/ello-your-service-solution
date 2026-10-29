import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { ErrorComponentProps } from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "../styles.css?url";
import { LocalHubProvider } from "@/lib/localhub-context";
import { ElloLogo } from "@/components/ello/logo";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <Link to="/" className="inline-block mb-6" aria-label="ELLO">
          <ElloLogo tone="dark" height={32} />
        </Link>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O endereço que você tentou acessar não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <a href="/" className="inline-block mb-6" aria-label="ELLO">
          <ElloLogo tone="dark" height={28} />
        </a>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Esta tela não carregou
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo saiu do eixo por aqui. Tente novamente ou volte para o início.
        </p>
        {error instanceof Error && error.message && (
          <details className="mt-4 rounded-lg border border-border/60 bg-muted/40 p-2.5 text-left text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium hover:text-foreground">
              Detalhes do erro
            </summary>
            <p className="mt-1 font-mono break-all text-[11px] select-all">{error.message}</p>
          </details>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { title: "ELLO — Seu negócio, no seu melhor lugar" },
      {
        name: "description",
        content:
          "Apresente seus serviços, receba pedidos e organize seu negócio local em um só lugar.",
      },
      { name: "theme-color", content: "#292b25" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "author", content: "ELLO" },
      { property: "og:title", content: "ELLO — Seu negócio, no seu melhor lugar" },
      {
        property: "og:description",
        content:
          "Uma página bonita e prática para mostrar serviços, receber pedidos e organizar sua rotina.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ello.app.br/" },
      { property: "og:image", content: "https://ello.app.br/images/ello/ello-logo-dark.png" },
      { name: "twitter:image", content: "https://ello.app.br/images/ello/ello-logo-dark.png" },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@elloapp" },
    ],
    links: [
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300..850;1,300..850&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const elloStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://ello.app.br/#organization",
      "name": "ELLO",
      "url": "https://ello.app.br",
      "description":
        "Plataforma completa para gestão, cardápio digital, agendamento e vendas para negócios locais e prestadores de serviços.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://ello.app.br/#software",
      "name": "ELLO Studio & Delivery",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "featureList": [
        "Cardápio digital sem comissão",
        "Agendamento online inteligente",
        "Gestão de entregas próprias e motoboys",
        "Frente de caixa e financeiro integrado",
        "Página profissional personalizada",
      ],
    },
  ],
};

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(elloStructuredData),
          }}
        />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: createChunkRecoveryScript(),
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: createPublicRuntimeConfigScript(),
          }}
        />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function createChunkRecoveryScript() {
  return `window.addEventListener('vite:preloadError',function(event){event.preventDefault();var key='ello:chunk-recovery-attempted';try{if(sessionStorage.getItem(key))return;sessionStorage.setItem(key,'1');}catch{}var url=new URL(window.location.href);url.searchParams.set('__ello_chunk_retry',String(Date.now()));window.location.replace(url.toString());});`;
}

function createPublicRuntimeConfigScript() {
  const config = {
    supabaseUrl: "https://fahrhrcxzcnnrhjavrfk.supabase.co",
    supabaseAnonKey: "sb_publishable_2wUjef5P5H6bPLqRhfouWw_AFp-Mbk_",
  };

  return `window.__ELLO_CONFIG__=${JSON.stringify(config).replace(/</g, "\\u003c")};if('serviceWorker' in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(()=>{});});}`;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <LocalHubProvider>
        <Outlet />
      </LocalHubProvider>
    </QueryClientProvider>
  );
}
