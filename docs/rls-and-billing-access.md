# RLS e acesso de billing ELLO

## Estado confirmado no ELLO1

- O schema de produção usa tabelas `localhub_*`; as tabelas legadas `profiles` e `monetization_requests` não existem nesse projeto e não devem ser alvo de migrations destinadas a ele.
- As 25 tabelas `localhub_*` verificadas estão com RLS habilitado e têm ao menos uma policy.
- As policies atuais limitam dados operacionais ao negócio dono ou liberam apenas operações públicas previstas, como leitura de catálogo, criação de agendamentos e entrada em lista de espera.
- A migration `20260929160000_localhub_rls_prebilling_hardening.sql` remove `TRUNCATE`, `TRIGGER` e `REFERENCES` de `PUBLIC`, `anon` e `authenticated` em tabelas do schema `public`; mantém os privilégios DML necessários e os grants específicos de leitura/entrada pública.
- A mesma migration revoga esses privilégios por padrão para novas tabelas criadas por `postgres` e interrompe a aplicação se encontrar uma tabela `localhub_*` sem RLS ou sem policy.

## Regras obrigatórias para planos e gateway

- Separar catálogo de planos (leitura pública ou autenticada somente) de assinaturas, faturas, tentativas, eventos do provedor e concessões de recurso (sem acesso direto de `anon`).
- Vincular toda assinatura ao negócio autenticado e validar o vínculo no banco; nunca aceitar `owner_id`, `business_id`, preço, status pago ou entitlement como autoridade vinda do navegador.
- Clientes leem somente uma projeção mínima da própria assinatura; criação, alteração de status, renovação, cancelamento confirmado e concessão de recursos ocorrem em funções server-side ou webhook autenticado do gateway.
- Webhooks validam assinatura do provedor, idempotência, timestamp e transições permitidas antes de atualizar registros. Chaves do gateway ficam exclusivamente em variáveis server-side.
- Cada migration de billing configura RLS, grants mínimos e policies por operação. Testes negativos precisam cobrir `anon`, dois negócios distintos, usuário autenticado e serviço server-side.
- `service_role` contorna RLS e permanece exclusivamente no servidor.

## Validação antes de ativar cobrança

A migration foi aplicada e registrada no ELLO1. A verificação pós-aplicação confirmou zero tabelas `localhub_*` sem RLS/policy, zero grants de `TRUNCATE`, `TRIGGER` ou `REFERENCES` para `anon`/`authenticated` e uma entrada da migration no ledger.

Antes de ativar cobrança, retestar catálogo público, onboarding, reservas, pedido público, PDV, CRM e acesso de profissional. Planos, assinaturas, gateway e webhooks não são criados nesta etapa.
