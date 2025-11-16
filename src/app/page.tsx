// src/app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        padding: "40px 16px",
        background: "#F9FAFB",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "880px" }}>
        {/* Top bar */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: "20px",
                letterSpacing: "-0.03em",
              }}
            >
              EverLead
            </span>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>
              Pre-need lead marketplace
            </span>
          </div>

          <nav style={{ display: "flex", gap: "16px", fontSize: "14px" }}>
            <Link
              href="/get-started"
              style={{ color: "#374151", textDecoration: "none" }}
            >
              Get started
            </Link>
            <Link
              href="/login"
              style={{ color: "#374151", textDecoration: "none" }}
            >
              Agent login
            </Link>
          </nav>
        </header>

        {/* Hero */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
            gap: "32px",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "34px",
                lineHeight: 1.1,
                fontWeight: 700,
                marginBottom: "16px",
              }}
            >
              Zillow-style{" "}
              <span style={{ color: "#2563EB" }}>pre-need leads</span> for
              funeral professionals.
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: "#4B5563",
                marginBottom: "20px",
              }}
            >
              Families answer a short pre-planning questionnaire. EverLead
              turns those responses into qualified leads that your sales team
              can buy instantly or bid on, just like Zillow or eBay — with a{" "}
              <strong>first lead free</strong>.
            </p>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/get-started"
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  background: "#2563EB",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 500,
                  textDecoration: "none",
                }}
              >
                I'm a family – start my plan
              </Link>
              <Link
                href="/login"
                style={{
                  padding: "10px 18px",
                  borderRadius: "999px",
                  border: "1px solid #D1D5DB",
                  color: "#111827",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                I'm an agent – log in
              </Link>
            </div>

            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "10px",
              }}
            >
              First agent lead is free. After that, pay per lead with Stripe.
            </p>
          </div>

          {/* Right side "feature card" */}
          <div
            style={{
              borderRadius: "16px",
              border: "1px solid #E5E7EB",
              background: "white",
              padding: "18px 18px 14px",
              boxShadow: "0 10px 25px rgba(15, 23, 42, 0.08)",
              fontSize: "13px",
            }}
          >
            <p
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginBottom: "8px",
              }}
            >
              For funeral sales teams
            </p>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 600,
                marginBottom: "10px",
              }}
            >
              Stop waiting for the phone to ring.
            </h2>

            <ul
              style={{
                listStyle: "disc",
                paddingLeft: "18px",
                marginBottom: "14px",
                color: "#374151",
              }}
            >
              <li>Families fill out a guided pre-need questionnaire.</li>
              <li>
                Leads are tagged HOT / WARM / COLD with contact details and
                preferences.
              </li>
              <li>Agents can bid or hit Buy Now to lock in exclusivity.</li>
              <li>
                Admins see total leads, revenue, and performance in a single
                dashboard.
              </li>
            </ul>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "12px",
                color: "#6B7280",
              }}
            >
              <div>
                <div style={{ fontSize: "11px" }}>Typical commission</div>
                <div style={{ fontWeight: 600 }}>$300+ per sale</div>
              </div>
              <div>
                <div style={{ fontSize: "11px" }}>Lead pricing</div>
                <div style={{ fontWeight: 600 }}>$10–$50 per hot lead</div>
              </div>
              <div>
                <div style={{ fontSize: "11px" }}>Your risk</div>
                <div style={{ fontWeight: 600 }}>First lead is free</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
