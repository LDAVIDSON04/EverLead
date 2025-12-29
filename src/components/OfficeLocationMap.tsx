"use client";

interface OfficeLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  province: string;
  address?: string;
  postalCode?: string;
  className?: string;
}

export function OfficeLocationMap({
  latitude,
  longitude,
  city,
  province,
  address,
  postalCode,
  className = "",
}: OfficeLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Build the full address for the map - prioritize full address over coordinates
  // This ensures we show the exact location, not city-level coordinates
  let mapAddress: string;
  if (address && postalCode) {
    mapAddress = `${address}, ${city}, ${province} ${postalCode}`;
  } else if (address) {
    mapAddress = `${address}, ${city}, ${province}`;
  } else {
    mapAddress = `${city}, ${province}`;
  }

  if (!apiKey) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '300px' }}>
        <p className="text-sm text-gray-500">Map unavailable - API key not configured</p>
      </div>
    );
  }

  // Build map URL - ALWAYS use full address when available for accurate geocoding
  // Only use coordinates if no street address is provided
  // Use zoom level 11 to show the whole city
  // Only show the office pin (no other businesses)
  let mapUrl: string;
  let mapLink: string;

  // If we have a street address, always use it for geocoding (more accurate than stored coordinates)
  if (address) {
    const encodedAddress = encodeURIComponent(mapAddress);
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=11&size=600x300&markers=color:0x1a4d2e|label:O|${encodedAddress}&style=feature:poi|visibility:off&style=feature:poi.business|visibility:off&key=${apiKey}`;
    mapLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  } else if (latitude && longitude) {
    // Fallback to coordinates only if no street address
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=11&size=600x300&markers=color:0x1a4d2e|label:O|${latitude},${longitude}&style=feature:poi|visibility:off&style=feature:poi.business|visibility:off&key=${apiKey}`;
    mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else {
    // Last resort: use city/province
    const encodedAddress = encodeURIComponent(mapAddress);
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${encodedAddress}&zoom=11&size=600x300&markers=color:0x1a4d2e|label:O|${encodedAddress}&style=feature:poi|visibility:off&style=feature:poi.business|visibility:off&key=${apiKey}`;
    mapLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  }

  // Use Static Maps API (image) - clickable to open in Google Maps
  return (
    <div className={`rounded-lg overflow-hidden border border-gray-200 ${className}`}>
      <a
        href={mapLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <img
          src={mapUrl}
          alt={`Map showing ${mapAddress}`}
          className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
          style={{ height: '300px' }}
        />
      </a>
    </div>
  );
}

