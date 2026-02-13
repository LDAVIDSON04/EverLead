# Payment method security (agent cards)

**CRITICAL: No agent must ever see or be charged with another agent's card.** This document and the code enforce that.

## Rule: one agent, one Stripe customer

- **Never** resolve a Stripe customer by email (`stripe.customers.list({ email })`). Multiple Stripe customers can share the same email; using the first match can attach or show another agent's card.
- **Always** use the agent’s own `profile.metadata.stripe_customer_id`. If it’s missing, treat the agent as having no payment method (no lookup, no fallback by email).
- **Only** set `stripe_customer_id` when **creating** a new Stripe customer for that agent (e.g. in payment-methods setup). Never set it from an email-based or other lookup.

## Where we use Stripe

| Path | Uses | Writes stripe_customer_id? |
|------|------|----------------------------|
| `GET /api/agent/settings/payment-methods/list` | `profile.metadata.stripe_customer_id` only; filters PMs by `customer === stripeCustomerId` | No |
| `POST /api/agent/settings/payment-methods/setup` | Profile `stripe_customer_id`; if missing, **create** new customer, then save ID to **this** profile | Yes (new customer only) |
| `DELETE /api/agent/settings/payment-methods` | `profile.metadata.stripe_customer_id` only; verifies PM `customer === stripeCustomerId` before delete | No |
| `GET /api/agent/onboarding-status` | `metadata.stripe_customer_id` only for `hasPaymentMethod` | No |
| `GET /api/agents/search` | Each agent’s `metadata.stripe_customer_id` for payment check; no email | No |
| `chargeAgentForAppointment(agentId, ...)` | Profile for `agentId` → `metadata.stripe_customer_id`; filters PMs by `customer === stripeCustomerId` before charge | No |
| `GET /api/agent/statements/[year]/[month]` | Authenticated user’s profile `stripe_customer_id` for last4 display | No |

## Auth and identity

- **Agent-facing APIs** (list, setup, DELETE, onboarding-status, statements): `agentId = user.id` from the Bearer token. Profile and Stripe customer are always for the authenticated agent.
- **Charges**: `agentId` is the agent who **owns** the appointment (from booking flow or from `declined_payments.agent_id`). We only use that agent’s profile and `stripe_customer_id` to charge.

## Defense-in-depth

- List and charge paths filter payment methods to those with `pm.customer === stripeCustomerId` so we never list or charge a card that isn’t this agent’s.
- DELETE path rejects with 403 if the payment method’s `customer` is not the profile’s `stripe_customer_id`.
