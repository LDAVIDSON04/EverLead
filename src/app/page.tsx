// src/app/page.tsx
export default function HomePage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <section>
        <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "8px" }}>
          Plan ahead with confidence.
        </h1>
        <p style={{ maxWidth: "640px", marginBottom: "12px" }}>
          EverLead connects families planning funeral and pre-arrangement
          services with trusted advisors. Families answer a few simple
          questions, and licensed agents can bid on or buy those warm leads.
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <a
            href="/get-started"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              background: "#2563EB",
              color: "white",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Get your personalized plan
          </a>
          <a
            href="#how-it-works"
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "1px solid #CBD5F5",
              fontSize: "14px",
              textDecoration: "none",
            }}
          >
            Learn more
          </a>
        </div>
      </section>

      <section id="how-it-works">
        <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "8px" }}>
          How it works
        </h2>
        <ol style={{ paddingLeft: "20px" }}>
          <li>Families answer a short questionnaire about their wishes.</li>
          <li>We classify the lead as hot, warm, or cold.</li>
          <li>
            Agents can <strong>bid</strong> on leads or click{" "}
            <strong>Buy Now</strong> to secure them instantly.
          </li>
          <li>
            Agents contact families to help them choose the right
            pre-arrangement plan.
          </li>
        </ol>
      </section>
    </div>
  );
}
