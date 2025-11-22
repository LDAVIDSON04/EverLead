// src/app/agent/leads/success/page.tsx
import { Suspense } from "react";
import SuccessClient from "./SuccessClient";

export default function Page() {
  return (
    <Suspense fallback={<p>Loading success page…</p>}>
      <SuccessClient />
    </Suspense>
  );
}
