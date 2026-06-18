# ELLO — Redesign fiel às referências

Data: 18 de junho de 2026  
Status: aprovado pelo usuário em 18 de junho de 2026

## Objetivo

Reconstruir a experiência visual completa da ELLO usando os sete painéis de referência enviados pelo usuário como especificação oficial. A implementação deve preservar os fluxos reais já conectados ao Supabase, mas substituir a aparência atual pelo sistema visual dos prints.

“Idêntico” significa reproduzir com máxima fidelidade possível:

- hierarquia, composição e ordem das informações;
- paleta, tipografia, espaçamento, bordas, raios e sombras;
- dimensões e anatomia de botões, cartões, listas, abas e navegação;
- tratamento fotográfico, ícones, estados selecionados e indicadores;
- comportamento e sequência das telas;
- versões responsivas que mantenham a linguagem mobile das referências.

As imagens são a fonte de verdade visual. Quando houver diferença entre o layout atual e os prints, os prints prevalecem, exceto nas alterações de produto explicitamente aprovadas neste documento.

## Decisões aprovadas

1. A confirmação de e-mail não faz parte desta entrega.
2. Splash e onboarding devem abrir a experiência antes do restante do aplicativo.
3. Serão mantidos os modos Cliente e Profissional, com possibilidade de alternância.
4. Planos, assinatura PRO e venda de destaque serão removidos.
5. A Carteira ELLO permanecerá como única área financeira.
6. A Carteira será implementada sem gateway ativo, pronta para integração posterior.
7. Supabase, autenticação atual, perfis, favoritos, orçamentos, chat, agenda, avaliações, serviços, portfólio e administração devem continuar funcionando.
8. Não será implementada IA real nesta etapa. A tela de onboarding poderá comunicar a visão futura da IA, mas nenhuma função enganosa será apresentada como ativa.

## Direção visual

### Marca e cores

- Azul principal vivo e profundo, próximo ao azul das referências.
- Branco verdadeiro como fundo predominante.
- Azul-marinho quase preto para títulos e textos de alto contraste.
- Cinzas frios e discretos para textos secundários, divisórias e superfícies.
- Verde reservado para disponibilidade, sucesso, aceite e modo profissional.
- Amarelo/laranja reservado para avaliações, medalhas e alertas específicos.
- Vermelho reservado para erros, notificações e ações destrutivas.
- Gradientes apenas onde aparecem nas referências: splash, resumos financeiros e blocos de destaque visual.

### Tipografia

- Família sans-serif limpa, contemporânea e de alta legibilidade.
- Títulos fortes e compactos, com hierarquia semelhante aos prints.
- Corpo com peso regular e contraste suficiente.
- Rótulos, abas e navegação com tamanhos pequenos, mas legíveis.
- Valores financeiros e métricas com peso visual elevado.

### Componentes

- Botão primário azul, largura ampla, raio moderado e texto branco.
- Botão secundário branco com borda azul ou cinza.
- Cartões brancos com borda cinza suave; sombras mínimas.
- Campos com fundo branco, borda fina e ícones lineares.
- Avatares e fotografias reais em recortes consistentes.
- Navegação inferior distinta para Cliente e Profissional.
- Estados selecionados em azul; estados de sucesso em verde.
- Ícones lineares coerentes, preferencialmente da família já usada no projeto quando visualmente compatível.

## Modelo responsivo

O produto continuará mobile-first.

- Em celulares, cada tela deve ocupar a largura disponível e reproduzir diretamente a composição dos prints.
- Em desktop, o aplicativo deve permanecer centralizado em um invólucro semelhante a um aparelho, sem esticar componentes mobile de forma desproporcional.
- Formulários, listas e galerias devem respeitar áreas seguras, navegação inferior e conteúdo rolável.
- A navegação inferior permanece fixa quando mostrada na referência.
- Splash e onboarding devem preencher a altura útil da tela.

## Sequência de entrada

### 1. Splash

- Fundo azul em gradiente.
- Marca ELLO centralizada.
- Frase “Encontre ou ofereça serviços com facilidade.”
- Grupo fotográfico de profissionais na metade inferior.
- Botão primário “Começar”.
- Ação secundária “Entrar”.

O splash aparece para novos usuários. Usuários recorrentes podem seguir diretamente para autenticação ou aplicativo conforme a sessão e o estado local.

### 2–5. Onboarding

Carrossel horizontal com quatro páginas:

1. Contratar profissionais de confiança.
2. Organizar e divulgar serviços.
3. Agenda, portfólio e clientes em um só lugar.
4. Visão futura da assistência inteligente da ELLO.

Cada página possui:

- título grande com palavras em azul;
- texto curto;
- imagem ou composição principal;
- indicador de página;
- botão “Próximo” ou “Começar”;
- ação “Pular”.

O estado de conclusão será persistido localmente para evitar repetição obrigatória.

## Autenticação e modo

### 6. Login/cadastro

- Logo ELLO no topo.
- Saudação central.
- Entradas sociais e alternativas com a anatomia dos prints.
- E-mail/senha reais continuam disponíveis.
- Métodos ainda não conectados devem ficar visualmente desabilitados ou identificados sem iniciar fluxos falsos.
- Termos e Privacidade devem apontar para páginas reais quando criadas.

### 7. Escolha de modo

- Cartão azul para Cliente.
- Cartão verde para Profissional.
- Explicação de que a conta pode usar os dois modos.
- Seleção persistida no perfil.
- Alternância disponível posteriormente em Configurações.

## Experiência Cliente

### 8. Home Cliente

Ordem visual:

1. localização, notificações e conta;
2. saudação personalizada;
3. campo de busca;
4. categorias populares;
5. carrossel fotográfico promocional;
6. profissionais em destaque;
7. navegação inferior.

O carrossel fotográfico solicitado pelo usuário aparece antes das listagens de profissionais e deve usar imagens de alta qualidade relacionadas a serviços reais. Ele terá paginação, gesto horizontal, reprodução automática moderada e suporte a redução de movimento.

### 9. Busca inteligente

- Busca no topo com termo atual.
- Abas Todos, Profissionais e Serviços.
- Lista compacta de profissionais com foto, avaliação, distância e disponibilidade.
- Botão para carregar ou visualizar mais profissionais.
- Lista de serviços relacionados.

A busca deve consumir dados reais; conteúdo demonstrativo não deve se misturar silenciosamente com resultados reais.

### 10–13. Perfil público do profissional

Estrutura:

- capa e retrato profissional;
- nome, verificação, avaliação e disponibilidade;
- métricas principais;
- biografia;
- abas Perfil, Serviços, Avaliações e Galeria;
- ações Chat e Solicitar serviço.

Serviços, avaliações e galeria terão telas/abas próprias e devem usar dados do Supabase. Estados vazios devem conservar a mesma linguagem visual.

### 14. Agendamento

- seleção do serviço;
- calendário mensal;
- horários disponíveis;
- endereço;
- observação opcional;
- confirmação.

As transições de status e regras de autorização já implementadas devem ser preservadas.

### 15. Solicitar orçamento

- serviço desejado;
- descrição;
- fotos opcionais;
- endereço;
- urgência/prazo;
- envio.

Uploads devem usar o armazenamento já previsto no Supabase ou um estado explicitamente indisponível até a configuração correspondente.

### 16. Chat

- cabeçalho com profissional e presença;
- bolhas cinzas e azuis;
- horários;
- campo de mensagem e anexos;
- navegação inferior.

Mensagens reais e realtime existentes devem ser mantidos.

### 17. Orçamento recebido

- identidade do profissional;
- serviço, valor, prazo e descrição;
- ações Recusar e Aceitar orçamento.

O pagamento continua fora da plataforma enquanto o gateway não estiver conectado.

### 18. Notificações

- abas Todas e Não lidas;
- itens com avatar/ícone, resumo, tempo e indicador;
- ligação com orçamento, mensagem e agenda quando houver infraestrutura real;
- estado vazio consistente.

### Navegação Cliente

Itens:

- Início;
- Busca;
- Favoritos;
- Mensagens;
- Perfil.

A Agenda continua acessível por atalho, notificações e áreas relacionadas, mesmo que não ocupe um dos cinco itens principais.

## Experiência Profissional

### 19. Home Profissional

- saudação;
- sino de notificações;
- resumo do dia em painel azul;
- próximos agendamentos;
- atalhos rápidos;
- botão central de criação na navegação.

As métricas devem ser derivadas de dados reais. Ausência de dados gera zeros e estados vazios, não números inventados.

### 20. Agenda

- calendário mensal;
- lista por dia e horário;
- etiquetas de status;
- criação/gestão de compromisso dentro das permissões existentes.

### 21. Orçamentos

- abas Recebidos e Enviados;
- cartões com serviço, cliente, tempo e status;
- acesso ao detalhe e à conversa.

### 22. Clientes (CRM)

- busca;
- lista de clientes atendidos;
- contagem de serviços;
- entrada para detalhes.

Somente relações originadas de interações autorizadas devem ser exibidas.

### 23. ELLO Link

- página pública compacta;
- capa, perfil e contatos;
- WhatsApp, ligação e solicitação de orçamento;
- serviços, avaliações, galeria e sobre;
- métricas de visualização preservadas.

### 24. Editar perfil

- foto;
- nome;
- categoria;
- descrição;
- área de atendimento;
- telefone;
- e-mail;
- salvamento com validação e retorno visual.

### Carteira ELLO

Substitui integralmente:

- Planos/Destaque;
- Assinatura PRO;
- Ganhos com promessa de pagamentos processados pela plataforma.

A Carteira terá:

- saldo disponível exibido como R$ 0,00 enquanto não houver gateway;
- saldo futuro/pendente quando aplicável;
- histórico de movimentações vazio ou alimentado apenas por registros reais;
- estado “Gateway ainda não conectado”;
- área preparada para futura conta bancária, Pix, saques e repasses;
- nenhuma cobrança, assinatura ou compra ativa nesta etapa.

### Estatísticas

- visualizações;
- contatos;
- orçamentos;
- serviços;
- conversão;
- gráficos simples e fontes de tráfego.

Somente dados reais ou zeros devem ser mostrados.

### Avaliações recebidas

- nota média;
- distribuição por estrelas;
- lista de avaliações reais.

### Configurações

- perfil;
- segurança;
- notificações;
- privacidade;
- serviços;
- áreas e horários de atendimento;
- carteira;
- ajuda;
- contato;
- alternância de modo;
- saída da conta.

### Navegação Profissional

Itens:

- Início;
- Agenda;
- Clientes;
- Orçamentos;
- Mais.

O botão central de criação pode aparecer nas telas indicadas pela referência.

## Mapeamento das 30 referências

| Referência | Destino |
| --- | --- |
| 1 | Splash |
| 2–5 | Onboarding |
| 6 | Login/cadastro |
| 7 | Escolha de modo |
| 8 | Home Cliente |
| 9 | Busca inteligente |
| 10 | Perfil profissional |
| 11 | Serviços |
| 12 | Avaliações |
| 13 | Galeria |
| 14 | Agendamento |
| 15 | Solicitar orçamento |
| 16 | Chat |
| 17 | Orçamento recebido |
| 18 | Notificações |
| 19 | Home Profissional |
| 20 | Agenda |
| 21 | Orçamentos |
| 22 | Clientes/CRM |
| 23 | ELLO Link |
| 24 | Editar perfil |
| 25 | Removida; substituída pela Carteira |
| 26 | Removida; substituída pela Carteira |
| 27 | Estatísticas |
| 28 | Avaliações recebidas |
| 29 | Convertida em visão da Carteira, sem valores fictícios |
| 30 | Configurações |

## Arquitetura de frontend

O redesign deve ser construído sobre o projeto React/TanStack existente, sem reescrever integrações válidas.

Unidades principais:

- `AppShell`: moldura mobile, área rolável e safe areas;
- `ClientBottomNav` e `ProfessionalBottomNav`;
- `ScreenHeader`;
- `PrimaryButton`, `SecondaryButton` e `IconButton`;
- `SearchField`, campos e seletores;
- `PhotoCarousel`;
- `ProfessionalRow` e `ProfessionalCard`;
- `ServiceRow`;
- `MetricPanel`;
- `StatusBadge`;
- `EmptyState`;
- `WalletSummary`;
- módulos independentes para onboarding, cliente e profissional.

Os componentes devem receber dados por propriedades e não depender diretamente de dados demonstrativos internos. Consultas e mutações permanecem nas rotas ou hooks apropriados.

## Dados e estados

Cada tela deverá cobrir:

- carregando;
- sucesso com dados;
- vazio;
- erro recuperável;
- usuário não autenticado;
- função ainda não conectada, quando aplicável.

Dados demonstrativos atuais devem ser removidos da experiência de produção ou ficar disponíveis apenas em um modo de demonstração explicitamente identificado.

## Imagens

As fotografias são parte estrutural do design, não decoração opcional.

Será necessário um conjunto visual coerente para:

- splash;
- quatro telas de onboarding;
- carrossel da Home;
- profissionais;
- serviços;
- capas;
- galerias e portfólios.

As imagens deverão representar pessoas e serviços brasileiros de forma natural, profissional e consistente. Texto e controles continuam nativos no código.

## Acessibilidade e interação

- alvos de toque adequados;
- contraste legível;
- foco visível;
- rótulos acessíveis;
- navegação por teclado em desktop;
- texto alternativo em imagens informativas;
- respeito a `prefers-reduced-motion`;
- carrosséis com controles manuais e paginação.

## Verificação

Cada grupo de telas será comparado visualmente com os prints em:

- viewport mobile principal;
- viewport mobile estreito;
- desktop centralizado;
- conteúdo vazio e com dados;
- navegação e ações principais.

Critérios obrigatórios:

1. build de produção aprovado;
2. lint dos arquivos alterados aprovado;
3. testes existentes aprovados;
4. ausência de erros relevantes no console;
5. fluxo Cliente exercitado;
6. fluxo Profissional exercitado;
7. comparação visual direta com as referências;
8. dados reais preservados;
9. planos/PRO ausentes;
10. Carteira presente sem gateway ou valores fictícios.

## Fora do escopo

- confirmação de e-mail;
- gateway de pagamento;
- Pix, saque ou repasse real;
- assinatura ou planos pagos;
- IA funcional;
- aplicativo nativo para lojas;
- mudança de provedor de banco ou hospedagem.

