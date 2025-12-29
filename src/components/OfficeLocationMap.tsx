"use client";

interface OfficeLocationMapProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  province: string;
  address?: string;
  className?: string;
}

export function OfficeLocationMap({
  latitude,
  longitude,
  city,
  province,
  address,
  className = "",
}: OfficeLocationMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Build the address for the map
  const mapAddress = address
    ? `${address}, ${city}, ${province}`
    : `${city}, ${province}`;

  if (!apiKey) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`} style={{ height: '300px' }}>
        <p className="text-sm text-gray-500">Map unavailable - API key not configured</p>
      </div>
    );
  }

  // Build map URL - prefer coordinates if available, otherwise use address
  // Use zoom level 11-12 to show the whole city
  // Only show the office pin (no other businesses)
  let mapUrl: string;
  let mapLink: string;

  if (latitude && longitude) {
    // Use Static Maps API with coordinates - zoomed to show whole city (zoom level 11)
    // Style the map to remove points of interest (businesses) and make it cleaner
    // Only show the office pin, no other businesses
    mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${latitude},${longitude}&zoom=11&size=600x300&markers=color:0x1a4d2e|label:O|${latitude},${longitude}&style=feature:poi|visibility:off&style=feature:poi.business|visibility:off&key=${apiKey}`;
    mapLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  } else {
    // Use Static Maps API with address - will geocode and show city
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

