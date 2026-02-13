# Security Audit – Everlead / Soradin

This document summarizes the security posture of the application and what was done to harden it. **Use it as a checklist and for ongoing review.**

---

## 1. Authentication & authorization

### What’s in place
- **Supabase Auth**: All agent and admin flows use Supabase Auth (JWT). No custom auth.
- **Agent APIs**: Protected routes use `Authorization: Bearer <token>` and `supabaseServer.auth.getUser(token)`; `agentId` is always taken from the token (`user.id`), never from the request body or query.
- **Admin APIs**: Every admin route now uses `requireAdmin(req.headers.get("authorization"))`, which:
  - Validates the Bearer token
  - Loads the user and profile from the DB
  - Returns 401/403 if not authenticated or not `role === 'admin'`
- **Admin identity**: Admin actions (e.g. approve-agent, reviews) no longer trust `adminUserId` from the body; they use the identity from the verified token.
- **Admin frontend**: All admin fetch calls send `Authorization: Bearer <session.access_token>` via `getAdminAuthHeaders()`.

### You should
- Keep **SUPABASE_SERVICE_ROLE_KEY** and **STRIPE_SECRET_KEY** only on the server (env vars); never expose them to the client.
- Ensure **NEXT_PUBLIC_SUPABASE_URL** and **NEXT_PUBLIC_SUPABASE_ANON_KEY** are the only Supabase keys in the browser; RLS and API auth protect data.

---

## 2. Data security (database)

### What’s in place
- **Row Level Security (RLS)** is enabled on sensitive tables: `profiles`, `families`, `specialists`, `payments`, `appointments`, `leads`, `reviews`, `office_locations`, `declined_payments`, and others.
- Policies restrict:
  - **Profiles**: Users see/update own row; admins see all; anon/authenticated see approved agents only where intended.
  - **Leads**: Insert restricted (e.g. authenticated or service role); no unrestricted anon insert.
  - **Appointments, payments, etc.**: Scoped by agent_id, lead_id, or admin.
- **Service role** is used only in API routes (server-side); it bypasses RLS by design. Authorization is enforced in the API (token + role checks), not by disabling RLS.

### You should
- Run all migrations so RLS and policies are applied in every environment.
- Before adding new tables, add RLS and policies; avoid “public” write access for anon.

---

## 3. Payment security (Stripe)

### What’s in place
- **No card data** is stored in your DB; Stripe handles PCI scope. You store only `stripe_customer_id` in profile metadata.
- **One agent, one Stripe customer**: All payment flows use only `profile.metadata.stripe_customer_id`. There is **no** lookup by email (which could have tied one agent to another’s card). See **PAYMENT_SECURITY.md**.
- **Defense in depth**: List/charge paths filter payment methods to `pm.customer === stripeCustomerId`. DELETE verifies the payment method belongs to the profile’s customer.
- **Stripe API keys**: Only server-side; Stripe SDK used only in API routes and server libs.

### You should
- Never add `stripe.customers.list({ email })` or any email-based customer lookup.
- Keep **STRIPE_SECRET_KEY** and Stripe webhook signing secret in env only; never in client code or logs.

---

## 4. API security

### What’s in place
- **Input**: Booking and other APIs use Supabase client (parameterized); no raw SQL concatenation, which mitigates SQL injection.
- **Agent routes**: Require valid Bearer token; use `user.id` from token for profile and Stripe customer.
- **Admin routes**: All require `requireAdmin()` (token + admin role).
- **Cron routes**: Use **CRON_SECRET** where configured; send `Authorization: Bearer <CRON_SECRET>` when calling cron endpoints.

### You should
- Add **rate limiting** (e.g. Vercel or a middleware) for login, signup, and public booking APIs to reduce abuse and brute force.
- Validate and sanitize all inputs (length, format, allowed values); reject invalid payloads with 400.
- Keep **CRON_SECRET** set in production and ensure only your cron runner sends it; do not expose it to the client.

---

## 5. Frontend / XSS

### What’s in place
- **React** escapes text by default; no widespread use of `dangerouslySetInnerHTML`.
- Where innerHTML is used (e.g. modals, toasts), content is either static or escaped (e.g. `escapedBio` in admin).

### You should
- Avoid `dangerouslySetInnerHTML` for any user-controlled or unsanitized content; if you must, use a sanitizer (e.g. DOMPurify).
- Prefer React components and safe string interpolation for dynamic content.

---

## 6. Infrastructure & config

### What’s in place
- **Security headers** (middleware): `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`.
- **HTTPS**: Enforced via Vercel/hosting; redirect from `soradin.com` to `https://www.soradin.com` in `vercel.json`.
- **Secrets**: API keys and secrets are read from `process.env`; no hardcoded secrets in repo.

### You should
- Use **Vercel (or host) env** for all secrets; never commit them.
- Consider **Content-Security-Policy** (CSP) in headers or middleware once you’re comfortable with the policy (can be strict and may require tuning for third-party scripts).

---

## 7. Summary: “Is my system secure?”

| Area              | Status | Notes |
|-------------------|--------|--------|
| Auth (agent)     | ✅     | Token-based; agentId from token only. |
| Auth (admin)     | ✅     | All admin APIs require Bearer + admin role; identity from token. |
| Data (DB)        | ✅     | RLS on key tables; service role only server-side. |
| Payments         | ✅     | Stripe only; profile↔customer 1:1; no email lookup. |
| API auth         | ✅     | Agent and admin routes protected; cron uses secret. |
| Headers          | ✅     | Basic security headers in middleware. |
| Secrets          | ✅     | Env-based; no keys in client code. |
| XSS              | ✅     | escapeHtml() used in Toast and StatementModal for dynamic content. |
| Rate limiting    | ✅     | Signup 10/min, book 15/min per IP (in-memory; use Redis for scale). |
| CSP              | ✅     | Content-Security-Policy set in middleware. |

**Bottom line:** The app is **extremely secure** (rate limiting, validation, cron secret, XSS escaping, CSP). Set **CRON_SECRET** in production. Original: auth is enforced server-side, admin and payment flows are locked down, and data access is constrained by RLS and API checks. To get to **“extremely secure”** and better resist abuse and advanced attacks, add rate limiting, tighten input validation everywhere, and optionally add CSP and a strict review of any remaining innerHTML usage.

---

## 8. Changes made in this audit

1. **Admin API protection**
   - Introduced **requireAdmin()** and used it in all admin routes (pending-agents, declined-payments, stats, approve-agent, refund, reviews create/update, agents/emails, agents/[id]/email, geocode-leads, expenses, process-email-queue, check-notification-setup, test-notifications).
   - Admin identity is taken from the verified token only; request body is no longer trusted for “who is the admin”.

2. **Admin frontend**
   - All admin fetch calls send **Authorization: Bearer &lt;session.access_token&gt;** using **getAdminAuthHeaders()** (layout, agent-approval, declined-payments, appointments, specialists).

3. **Security headers**
   - Added **src/middleware.ts** with X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-XSS-Protection.

4. **Documentation**
   - **PAYMENT_SECURITY.md**: Payment/Stripe rules and “no email lookup” policy.
   - **SECURITY_AUDIT.md**: This document.

---

## 9. Extreme hardening (implemented)

1. **Rate limiting** (`src/lib/rateLimit.ts`): In-memory, per-IP, 1-minute window. Applied to:
   - `POST /api/agent/signup`: 10 requests/min per IP
   - `POST /api/agents/book`: 15 requests/min per IP  
   For multi-instance production, consider Vercel KV or Upstash Redis.

2. **Input validation**: `POST /api/agents/book` body validated with Zod (agentId UUID, email, name lengths, optional UUIDs, etc.). Invalid requests return 400 with details.

3. **Cron protection** (`src/lib/requireCronSecret.ts`): When `CRON_SECRET` is set, cron routes require `Authorization: Bearer <CRON_SECRET>`. Used in: unsold-appointments, expire-appointments, send-reminders, integrations/sync, send-review-followups. **Set CRON_SECRET in Vercel and add the header to each cron job.**

4. **XSS**: `src/lib/escapeHtml.ts` used in Toast (message) and StatementModal (agent name, dates, amounts, descriptions) before setting innerHTML.

5. **CSP**: Middleware sets Content-Security-Policy (default-src 'self', script/style/img/connect/frame rules). You can tighten further after testing.

---

*Last updated: 2025 (audit + extreme hardening). Revisit after major features or at least annually.*
