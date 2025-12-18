"use client";

import { Suspense } from "react";
import BookingStep1Content from "./BookingStep1Content";

export default function BookingStep1Page() {
  try {
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
  } catch (error) {
    console.error("Error in BookingStep1Page:", error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
          <p className="text-gray-600">Please try again later.</p>
          {process.env.NODE_ENV === 'development' && (
            <pre className="mt-4 text-xs text-red-600">{String(error)}</pre>
          )}
        </div>
      </div>
    );
  }
}
