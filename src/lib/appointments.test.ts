import assert from "node:assert/strict";
import test from "node:test";
import {
  assertFutureAppointment,
  canProposeAppointment,
  canEditAppointmentSchedule,
  canTransitionAppointment,
  canTransitionAppointmentAs,
  formatAppointmentDateTime,
  formatAppointmentError,
} from "./appointments.ts";

test("accepts a valid future appointment", () => {
  const now = new Date("2026-06-17T12:00:00.000Z");
  const result = assertFutureAppointment("2026-06-17T13:00:00.000Z", now);

  assert.equal(result, "2026-06-17T13:00:00.000Z");
});

test("rejects invalid and past appointment dates", () => {
  const now = new Date("2026-06-17T12:00:00.000Z");

  assert.throws(() => assertFutureAppointment("invalid", now), /data e horario validos/i);
  assert.throws(() => assertFutureAppointment("2026-06-17T11:59:59.000Z", now), /horario futuro/i);
});

test("allows only valid appointment status transitions", () => {
  assert.equal(canTransitionAppointment("pending", "confirmed"), true);
  assert.equal(canTransitionAppointment("pending", "cancelled"), true);
  assert.equal(canTransitionAppointment("confirmed", "completed"), true);
  assert.equal(canTransitionAppointment("confirmed", "cancelled"), true);
  assert.equal(canTransitionAppointment("completed", "confirmed"), false);
  assert.equal(canTransitionAppointment("cancelled", "confirmed"), false);
});

test("allows rescheduling only while the appointment is pending", () => {
  assert.equal(canEditAppointmentSchedule("pending"), true);
  assert.equal(canEditAppointmentSchedule("confirmed"), false);
  assert.equal(canEditAppointmentSchedule("completed"), false);
  assert.equal(canEditAppointmentSchedule("cancelled"), false);
});

test("allows only clients to propose appointments", () => {
  assert.equal(canProposeAppointment("client"), true);
  assert.equal(canProposeAppointment("professional"), false);
});

test("enforces appointment transitions by participant role", () => {
  assert.equal(canTransitionAppointmentAs("professional", "pending", "confirmed"), true);
  assert.equal(canTransitionAppointmentAs("professional", "confirmed", "completed"), true);
  assert.equal(canTransitionAppointmentAs("client", "pending", "confirmed"), false);
  assert.equal(canTransitionAppointmentAs("client", "confirmed", "completed"), false);
  assert.equal(canTransitionAppointmentAs("client", "pending", "cancelled"), true);
  assert.equal(canTransitionAppointmentAs("client", "confirmed", "cancelled"), true);
  assert.equal(canTransitionAppointmentAs("professional", "pending", "cancelled"), true);
  assert.equal(canTransitionAppointmentAs("professional", "confirmed", "cancelled"), true);
});

test("turns scheduling conflicts into a useful message", () => {
  assert.match(
    formatAppointmentError({ code: "23505", message: "duplicate key value" }),
    /horario ja esta reservado/i,
  );
});

test("turns invalid database transitions into a useful message", () => {
  assert.match(
    formatAppointmentError({ code: "23514", message: "invalid appointment status transition" }),
    /nao e permitida/i,
  );
});

test("turns database authorization failures into a useful message", () => {
  assert.match(
    formatAppointmentError({
      code: "42501",
      message: "only the professional can confirm a pending appointment",
    }),
    /profissional pode confirmar/i,
  );
});

test("formats appointment timestamps for Brazilian users", () => {
  assert.match(formatAppointmentDateTime("2026-06-18T15:30:00.000Z", "UTC"), /18\/06\/2026.*15:30/);
});
