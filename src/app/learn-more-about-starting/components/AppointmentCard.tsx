"use client";

import { Check } from "lucide-react";

interface AppointmentCardProps {
  name: string;
  date: string;
  status: string;
  imageUrl: string;
  featured?: boolean;
}

export function AppointmentCard({
  name,
  date,
  status,
  imageUrl,
  featured = false,
}: AppointmentCardProps) {
  return (
    <div
      className={`${
        featured
          ? "bg-white border-2 border-[#0D5C3D] shadow-2xl w-72"
          : "bg-white border border-gray-200 shadow-lg w-64"
      } rounded-2xl p-4 transition-all hover:scale-105`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
            <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-black truncate font-medium">{name}</h3>
          <p className="text-gray-600 text-sm mt-0.5">{date}</p>
          <div className="mt-2 flex items-center gap-1.5">
            {!featured && (
              <div className="bg-green-50 text-[#0D5C3D] px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Check className="w-3 h-3" />
                {status}
              </div>
            )}
            {featured && (
              <div className="bg-[#0D5C3D] text-white px-3 py-1 rounded-full text-xs font-medium">
                {status}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

