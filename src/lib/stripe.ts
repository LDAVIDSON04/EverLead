// src/lib/stripe.ts
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables.");
}

// Stripe automatically uses test mode when using test keys (sk_test_*)
// Make sure STRIPE_SECRET_KEY is set to a test key (sk_test_...) for testing
// Test keys won't charge real bank accounts - use live keys (sk_live_...) only in production
const isTestMode = secretKey.startsWith('sk_test_');
if (!isTestMode && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ WARNING: Using a live Stripe key in non-production environment. For testing, use a test key (sk_test_...)');
}

// Use the default API version from the installed Stripe SDK
export const stripe = new Stripe(secretKey);

