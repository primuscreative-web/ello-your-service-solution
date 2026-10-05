# Arquitetura Financeira Unificada — Asaas na ELLO

A ELLO opera exclusivamente com o **Asaas** como provedor de pagamentos e liquidação financeira para toda a plataforma (eliminando a necessidade de múltiplos gateways e a dependência do Stripe).

## 1. Visão Geral da Solução

O Asaas atende dois pilares fundamentais da plataforma:
1. **Lojistas e Estabelecimentos (`/studio/financeiro`)**:
   - Criação e ativação de subcontas Asaas via API (`POST /api/asaas/subaccount`).
   - Gestão de saldo em tempo real (saldo disponível e a compensar/pendente).
   - Solicitação de saque/transferência Pix (`POST /api/asaas/withdraw`) direto para a chave Pix cadastrada pelo titular.
   - Ativação/pausa de recebimentos online na loja do negócio.
2. **Clientes Finais (`/loja/$slug` e `/pedido/$token`)**:
   - **Pix Online**: Cobrança gerada com QR Code e Copia-e-Cola exibida em tempo real na tela de rastreamento do pedido com polling adaptativo (4s).
   - **Cartão de Crédito Online**: Cobrança processada pelo Asaas com antifraude e parcelamento integrado.

---

## 2. Variáveis de Ambiente (Server-Only)

Configure no painel Vercel ou `.env.local` (nunca expor em variáveis `VITE_`):

- `ASAAS_API_KEY`: Chave mestra da conta principal da ELLO (`$aact_...`).
- `ASAAS_API_BASE_URL`: `https://sandbox.asaas.com/api/v3` (para testes) ou `https://api.asaas.com/api/v3` (para produção).
- `ASAAS_WEBHOOK_TOKEN`: Token secreto configurado no webhook do painel Asaas para validação via `timingSafeEqual`.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço para escrita nas tabelas financeiras com auditoria.

---

## 3. Endpoints da API

### `POST /api/asaas/subaccount`
Abre ou atualiza a subconta do estabelecimento no Asaas a partir dos dados do titular (CPF/CNPJ, Razão Social, Telefone, Endereço, CEP e Chave Pix). Salva de forma protegida o `provider_account_id`, `wallet_id` e `subaccount_api_key`.

### `GET /api/asaas/subaccount?businessId={uuid}`
Retorna o status da subconta, dados cadastrais públicos e consulta o saldo disponível/pendente em tempo real no Asaas (`GET /v3/finance/balance`).

### `POST /api/asaas/withdraw`
Solicita a transferência via Pix do saldo disponível da subconta para a chave Pix cadastrada (`POST /v3/transfers`), registrando a operação em `localhub_wallet_withdrawals` e debitando no extrato da carteira.

### `POST /api/asaas/charge`
Gera a cobrança para o pedido no Asaas. Roteia a transação diretamente para a subconta do estabelecimento através de sua chave de subconta (ou split de pagamento).
- Para `billingType: "PIX"`, retorna QR Code em base64 e payload Copia-e-Cola.
- Para `billingType: "CREDIT_CARD"`, retorna a fatura segura do Asaas (`invoiceUrl`) ou processa os dados do cartão.

### `POST /api/asaas/webhook`
Recebe eventos de notificação do Asaas com autenticação via cabeçalho `asaas-access-token` e deduplicação na tabela `localhub_asaas_webhook_events`:
- `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED`: Atualiza o pedido para `paid` e libera o saldo na carteira.
- `PAYMENT_REFUNDED` / `PAYMENT_REVERSED`: Registra estorno no pedido e debita na carteira.
- `PAYMENT_OVERDUE`: Marca pagamento como expirado.
- `TRANSFER_DONE` / `TRANSFER_FAILED`: Atualiza o status do saque Pix do lojista.

---

## 4. Segurança e Integridade

- **Chaves de API**: A `subaccount_api_key` de cada lojista e a chave mestra `ASAAS_API_KEY` são server-only.
- **Row Level Security (RLS)**: O proprietário do negócio pode consultar apenas os seus próprios registros através de funções com `SECURITY DEFINER` que omitem credenciais confidenciais.
- **Deduplicação de Webhooks**: Cada evento recebido é indexado por `${event}_${entityId}` evitando processamento duplo.
