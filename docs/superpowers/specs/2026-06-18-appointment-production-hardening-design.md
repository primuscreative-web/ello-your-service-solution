# Appointment Production Hardening Design

## Goal

Make ELLO appointments safe for production by enforcing participant roles in the database, making each workflow transition atomic, enabling realtime refresh, and exposing only valid actions in the UI.

## Roles and transitions

- A client can create or reschedule a pending appointment attached to their quote.
- A professional can confirm a pending appointment and complete a confirmed appointment.
- Either participant can cancel a pending or confirmed appointment.
- Completed and cancelled appointments are terminal.
- Cancelling an appointment also cancels its quote so the two records cannot disagree.
- A professional cannot create or reschedule an appointment, and a client cannot confirm or complete one.

## Architecture

The browser calls two public Postgres RPC wrappers: one proposes an appointment and one transitions its status. Each wrapper delegates to a function in the private schema that runs the complete operation in one transaction, validates `auth.uid()` against the quote participants, updates the appointment and quote, and inserts the corresponding chat message.

Direct authenticated inserts and updates on `appointments` are revoked so callers cannot bypass the RPC rules. Participant SELECT access remains protected by RLS. The existing active-slot unique index prevents double booking, while trigger validation protects future timestamps and legal status transitions.

The TypeScript repository becomes a thin RPC client. Pure permission helpers drive button visibility and receive focused unit tests. Agenda realtime continues to invalidate React Query data after database changes.

## Error handling

Database functions raise stable application errors for unauthorized roles, invalid transitions, closed quotes, past dates, and occupied slots. The browser maps database constraint codes and messages into concise Portuguese feedback.

## Verification

- Unit tests cover every permitted and forbidden role transition.
- ESLint and the production build validate TypeScript integration.
- The migration is pushed to the linked Supabase project and checked with migration status/advisors where credentials permit.
- Browser QA verifies agenda rendering, action visibility, navigation, and console health.
