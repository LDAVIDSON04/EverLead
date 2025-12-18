"use client";

import { Suspense } from "react";
import Step1Form from "./Step1Form";

export default function Step1Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p>Loading...</p>
      </div>
    }>
      <Step1Form />
    </Suspense>
  );
}
