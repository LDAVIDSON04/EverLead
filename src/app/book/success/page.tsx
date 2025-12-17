"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle } from "lucide-react";

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const email = searchParams.get("email");

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-800" />
          </div>
        </div>
        
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Appointment Confirmed!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your appointment has been successfully booked.
          {email && (
            <span className="block mt-2">
              A confirmation email has been sent to <strong>{email}</strong>.
            </span>
          )}
        </p>
        
        <div className="space-y-3">
          <Link
            href="/search"
            className="block w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-900 transition-colors"
          >
            Book Another Appointment
          </Link>
          
          <Link
            href="/"
            className="block w-full border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
