export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
export type AppointmentActor = "client" | "professional";

const ALLOWED_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function assertFutureAppointment(value: string, now = new Date()): string {
  const appointmentDate = new Date(value);
  if (Number.isNaN(appointmentDate.getTime())) {
    throw new Error("Informe uma data e horario validos.");
  }
  if (appointmentDate.getTime() <= now.getTime()) {
    throw new Error("Escolha um horario futuro para o servico.");
  }
  return appointmentDate.toISOString();
}

export function canTransitionAppointment(
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
): boolean {
  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
}

export function canProposeAppointment(actor: AppointmentActor): boolean {
  return actor === "client";
}

export function canTransitionAppointmentAs(
  actor: AppointmentActor,
  currentStatus: AppointmentStatus,
  nextStatus: AppointmentStatus,
): boolean {
  if (!canTransitionAppointment(currentStatus, nextStatus)) return false;
  if (nextStatus === "cancelled") return true;
  if (nextStatus === "confirmed" || nextStatus === "completed") {
    return actor === "professional";
  }
  return false;
}

export function canEditAppointmentSchedule(status: AppointmentStatus): boolean {
  return status === "pending";
}

export function formatAppointmentDateTime(value: string, timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function formatAppointmentError(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const databaseError = error as { code?: string; message?: string };
    const code = databaseError.code;
    const message = databaseError.message ?? "";
    if (code === "23505") {
      return "Este horario ja esta reservado. Escolha outro horario.";
    }
    if (code === "23514") {
      return "Esta mudanca de agendamento nao e permitida.";
    }
    if (code === "42501") {
      if (message.includes("only the quote client")) {
        return "Somente o cliente pode propor ou remarcar este agendamento.";
      }
      if (message.includes("only the professional can confirm")) {
        return "Somente o profissional pode confirmar um agendamento pendente.";
      }
      if (message.includes("only the professional can complete")) {
        return "Somente o profissional pode concluir um agendamento confirmado.";
      }
      return "Voce nao tem permissao para alterar este agendamento.";
    }
  }

  return error instanceof Error ? error.message : "Nao foi possivel atualizar o agendamento.";
}
