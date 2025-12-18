"use client";

import { Suspense } from "react";
import BookingStep1Content from "./BookingStep1Content";

export default function BookingStep1Page() {
  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Test - Step 1 Page Loading</h1>
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
    </div>
  );
}
