type BusinessCopy = {
  offer: string;
  offers: string;
  offerTitle: string;
  addOffer: string;
  offerInputLabel: string;
  offerDescriptionLabel: string;
  offerPlaceholder: string;
  emptyOffersTitle: string;
  emptyOffersDescription: string;
  customer: string;
  customers: string;
  customerInputLabel: string;
  booking: string;
  bookings: string;
  bookingAction: string;
};

const businessCopy: Record<string, Partial<BusinessCopy>> = {
  beleza: {
    offerPlaceholder: "Ex.: Manicure em gel",
    bookingAction: "Agendar horário",
  },
  barbearia: {
    offerPlaceholder: "Ex.: Corte e barba",
    bookingAction: "Agendar horário",
  },
  saude: {
    offerTitle: "Consultas e atendimentos",
    offer: "atendimento",
    offers: "atendimentos",
    addOffer: "Adicionar atendimento",
    offerInputLabel: "Nome do atendimento",
    offerDescriptionLabel: "Descrição do atendimento",
    offerPlaceholder: "Ex.: Consulta nutricional",
    emptyOffersTitle: "Seus atendimentos começam aqui",
    emptyOffersDescription: "Adicione os atendimentos, valores e duração para abrir sua agenda.",
    customer: "paciente",
    customers: "pacientes",
    customerInputLabel: "Nome do paciente",
    booking: "consulta",
    bookings: "consultas",
    bookingAction: "Agendar consulta",
  },
  automotivo: {
    offer: "serviço automotivo",
    offers: "serviços automotivos",
    offerTitle: "Serviços & Revisões",
    addOffer: "Adicionar serviço",
    offerInputLabel: "Nome do serviço / reparo",
    offerDescriptionLabel: "Descrição do serviço, peças inclusas e garantia",
    offerPlaceholder: "Ex.: Revisão Preventiva de Freios & Suspensão",
    emptyOffersTitle: "Seus serviços automotivos começam aqui",
    emptyOffersDescription:
      "Cadastre diagnósticos, revisões, lavagens ou trocas de óleo para os clientes agendarem.",
    customer: "cliente",
    customers: "clientes",
    customerInputLabel: "Nome do proprietário / motorista",
    booking: "agendamento de oficina",
    bookings: "agendamentos de oficina",
    bookingAction: "Agendar serviço automotivo",
  },
  casa: { offerPlaceholder: "Ex.: Reparo hidráulico", bookingAction: "Solicitar visita" },
  educacao: {
    offer: "aula",
    offers: "aulas",
    offerTitle: "Aulas e atividades",
    addOffer: "Adicionar aula",
    offerInputLabel: "Nome da aula",
    offerDescriptionLabel: "Descrição da aula",
    offerPlaceholder: "Ex.: Aula de inglês",
    emptyOffersTitle: "Suas aulas começam aqui",
    emptyOffersDescription: "Adicione aulas, valores e duração para organizar sua agenda.",
    customer: "aluno",
    customers: "alunos",
    customerInputLabel: "Nome do aluno",
    booking: "aula",
    bookings: "aulas",
    bookingAction: "Agendar aula",
  },
  pet: {
    offer: "serviço pet",
    offers: "serviços pet",
    offerTitle: "Serviços Pet & Banho",
    addOffer: "Adicionar serviço pet",
    offerInputLabel: "Nome do serviço pet",
    offerDescriptionLabel: "Descrição do serviço (portes atendidos, etapas e produtos inclusos)",
    offerPlaceholder: "Ex.: Banho & Tosa Completo com Hidratação",
    emptyOffersTitle: "Seus serviços de pet care começam aqui",
    emptyOffersDescription:
      "Cadastre opções de banho, tosa, diárias, consultas, vacinas ou pacotes mensais para os tutores agendarem.",
    customer: "tutor",
    customers: "tutores",
    customerInputLabel: "Nome do tutor",
    booking: "atendimento pet",
    bookings: "atendimentos pet",
    bookingAction: "Agendar atendimento pet",
  },
  "servicos-domesticos": {
    offerPlaceholder: "Ex.: Limpeza residencial",
    bookingAction: "Solicitar visita",
  },
  "outros-servicos": {
    offerPlaceholder: "Ex.: Consultoria",
    bookingAction: "Solicitar horário",
  },
  alimentacao: {
    offer: "item",
    offers: "itens do cardápio",
    offerTitle: "Cardápio",
    addOffer: "Adicionar item",
    offerInputLabel: "Nome do item",
    offerDescriptionLabel: "Descrição do item",
    offerPlaceholder: "Ex.: Hambúrguer da casa",
    emptyOffersTitle: "Seu cardápio começa aqui",
    emptyOffersDescription: "Adicione itens, descrições e preços para receber pedidos.",
    customer: "cliente",
    customers: "clientes",
    customerInputLabel: "Seu nome",
    booking: "pedido",
    bookings: "pedidos",
    bookingAction: "Pedir no WhatsApp",
  },
};

const defaultCopy: BusinessCopy = {
  offer: "serviço",
  offers: "serviços",
  offerTitle: "Serviços",
  addOffer: "Adicionar serviço",
  offerInputLabel: "Nome do serviço",
  offerDescriptionLabel: "Descrição do serviço",
  offerPlaceholder: "Ex.: Atendimento personalizado",
  emptyOffersTitle: "Seus serviços começam aqui",
  emptyOffersDescription:
    "Adicione seus serviços, valores e duração para que seus clientes encontrem o atendimento certo.",
  customer: "cliente",
  customers: "clientes",
  customerInputLabel: "Seu nome",
  booking: "atendimento",
  bookings: "atendimentos",
  bookingAction: "Agendar atendimento",
};

export function getBusinessCopy(category?: string | null): BusinessCopy {
  return { ...defaultCopy, ...businessCopy[category ?? ""] };
}

export function supportsAppointments(category?: string | null) {
  return category !== "alimentacao";
}

const setupChoiceLabels: Record<string, string> = {
  "a-domicilio": "A domicílio",
  "na-casa-cliente": "Na casa do cliente",
  "no-endereco": "No endereço do cliente",
  "no-espaco": "No espaço do negócio",
  "por-chegada": "Por ordem de chegada",
  "com-horario": "Com hora marcada",
  "com-agendamento": "Com agendamento",
  agendamento: "Com agendamento",
  presencial: "Presencial",
  "consumo-local": "Consumo no local",
  "loja-clinica": "Na loja ou clínica",
  "corte-barba": "Cabelo e barba",
  "banho-tosa": "Banho e tosa completo",
  "tosa-higienica": "Tosa higiênica e desembolo",
  "banho-terapeutico": "Banhos terapêuticos e hidratação",
  veterinaria: "Consultas e vacinas veterinárias",
  "creche-daycare": "Daycare e creche diária",
  "creche-hotel": "Creche e hospedagem",
  "hotel-hospedagem": "Hotelzinho e hospedagem pet",
  "dog-walker": "Dog walker e passeios",
  passeio: "Passeio",
  adestramento: "Adestramento e comportamento",
  "taxi-pet": "Táxi Pet (Leva e Traz)",
  "produtos-pet": "Farmácia, rações e pet shop",
  "pacotes-mensais": "Planos e pacotes mensais",
  "cat-friendly": "Espaço seguro para gatos (Cat Friendly)",
  "todos-portes": "Todos os portes (P, M, G e GG)",
  "portes-pequenos": "Especialista em pequeno porte",
  "cafes-bebidas": "Cafés e bebidas",
  "servicos-criativos": "Serviços criativos",
  "eletrica-residencial": "Elétrica residencial",
  "limpeza-residencial": "Limpeza residencial",
  "casa-manutencao": "Casa e manutenção",
  "area-atendimento": "Em uma área de atendimento",
  orcamento: "Orçamento prévio",
  "consultas-medicas": "Consultas & Avaliação Médica",
  "nutricao-clinica": "Nutrição Clínica & Esportiva",
  "psicologia-terapia": "Psicologia & Psicoterapia",
  "fisioterapia-reabilitacao": "Fisioterapia & Reabilitação",
  "odontologia-estetica": "Odontologia & Procedimentos",
  "terapias-integrativas": "Terapias Integrativas & Bem-Estar",
  fonoaudiologia: "Fonoaudiologia",
  "pilates-postura": "Pilates Clínico & Postura",
  "estetica-avancada": "Estética Avançada & Corporal",
  "exames-diagnosticos": "Exames & Check-ups Rápidos",
  consultorio: "No Consultório / Clínica Física",
  online: "Teleatendimento / Consulta Online",
  domiciliar: "Atendimento em Domicílio",
  "pacotes-sessoes": "Pacotes & Planos de Tratamento",
  "retorno-incluso": "Consultas com Retorno Incluso",
  "reembolso-convenio": "Emite Recibo para Reembolso",
  "urgencia-encaixe": "Atendimento com Encaixe / Urgência",
  "mecanica-geral": "Mecânica Geral & Preventiva",
  "estetica-detail": "Estética Automotiva & Polimento",
  "troca-oleo-filtros": "Troca de Óleo & Lubrificantes",
  "eletrica-diagnostico": "Auto Elétrica & Injeção Eletrônica",
  "freios-suspensao": "Freios, Suspensão & Amortecedores",
  "pneus-alinhamento": "Pneus, Alinhamento & Balanceamento",
  "ar-condicionado": "Higienização & Ar Condicionado",
  "lavagem-tecnica": "Lavagem Técnica & Higienização",
  "funilaria-martelinho": "Funilaria & Martelinho de Ouro",
  "auto-socorro": "Socorro & Atendimento Rápido",
  "na-oficina": "Na Oficina / Box Físico",
  "com-agendamento": "Com Agendamento Prévio",
  "leva-traz-auto": "Serviço de Leva e Traz do Carro",
  "garantia-pecas": "Garantia de Peças e Mão de Obra",
  "faturamento-empresas": "Atende Frotas e Empresas",
  "espera-climatizada": "Sala de Espera Climatizada c/ Wi-Fi",
};

export function formatSetupChoice(choice: string) {
  return (
    setupChoiceLabels[choice] ??
    choice
      .split("-")
      .map((word) => word.charAt(0).toLocaleUpperCase("pt-BR") + word.slice(1))
      .join(" ")
  );
}
