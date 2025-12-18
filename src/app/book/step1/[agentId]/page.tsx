"use client";

import { Suspense } from "react";
import BookingStep1Content from "./BookingStep1Content.tsx";

export default function BookingStep1Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading booking page...</p>
        </div>
      </div>
    }>
      <BookingStep1Content />
    </Suspense>
  );
}
