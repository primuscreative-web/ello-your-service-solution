# ELLO (LocalHub)

ELLO é uma plataforma de gestão operacional e presença digital para negócios locais (alimentação, beleza, saúde, barbearia, pet, educação e serviços locais).

Permite que os negócios apresentem seus serviços e cardápios com link próprio (`/loja/$slug`), recebam pedidos e agendamentos com taxa zero de comissão, controlem caixa (PDV físico), motoboys, equipe, promoções e métricas em um só painel (`/studio`).

## Stack Tecnológica

- **Frontend & SSR**: React 19, TanStack Start, TanStack Router, TanStack React Query, Nitro, Vite 8
- **Estilização**: Tailwind CSS v4, Radix UI Primitives, Lucide Icons, Recharts
- **Banco de Dados & Autenticação**: Supabase (PostgreSQL com 100% RLS nas tabelas `localhub_*`, Auth e Storage)
- **Infraestrutura**: Vercel (`ello-app`), Supabase Cloud (`ELLO1` — ref: `fahrhrcxzcnnrhjavrfk`)
- **Produção**: `https://ello.app.br`

## Execução Local

```sh
npm install
npm run dev
```

Abra a URL indicada pelo Vite no terminal.

## Testes e Validação

```sh
# Executar todos os testes unitários (agendamentos, cupons, navegação e carteira)
npm test

# Verificar integridade e correspondência com o alvo de produção
npm run verify:production-target

# Compilação e tipagem TypeScript
npx tsc --noEmit
```

## Deploy em Produção

```sh
npm run deploy:prod
```

Este comando executa a verificação prévia (`scripts/verify-production-target.mjs`) que confere o projeto Vercel, o vínculo do Supabase CLI e as variáveis de ambiente antes de disparar o deploy oficial.

## Segurança e Arquitetura

- **Row Level Security (RLS)**: Todas as tabelas operacionais utilizam RLS no schema `public`.
- **Integridade Server-Side**: Operações financeiras, cupons e transições de pedidos são auditadas e calculadas no banco de dados via RPCs atômicas com `SECURITY DEFINER`.
- **Credenciais Sensíveis**: Tokens de ingestão (`FOOD_ORDER_INGESTION_TOKEN`), chaves de serviço do Supabase e segredos de webhook (Stripe/Asaas) ficam restritos ao servidor e nunca são expostos em variáveis públicas `VITE_`.
