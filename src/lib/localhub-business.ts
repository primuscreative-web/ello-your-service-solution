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
    offerPlaceholder: "Ex.: Revisão preventiva",
    booking: "horário",
    bookings: "horários",
    bookingAction: "Escolher horário",
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
    offerPlaceholder: "Ex.: Banho e tosa",
    customer: "tutor",
    customers: "tutores",
    customerInputLabel: "Nome do tutor",
    bookingAction: "Agendar serviço",
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
  "banho-tosa": "Banho e tosa",
  "creche-hotel": "Creche e hospedagem",
  "cafes-bebidas": "Cafés e bebidas",
  "servicos-criativos": "Serviços criativos",
  "eletrica-residencial": "Elétrica residencial",
  "limpeza-residencial": "Limpeza residencial",
  "casa-manutencao": "Casa e manutenção",
  "area-atendimento": "Em uma área de atendimento",
  orcamento: "Orçamento prévio",
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
