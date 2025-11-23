// Geocoding utilities for converting addresses to coordinates
// Uses Google Maps Geocoding API

export interface GeocodeResult {
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
}

/**
 * Geocode a city and province to get latitude/longitude
 * Uses Google Maps Geocoding API
 */
export async function geocodeLocation(
  city: string,
  province: string
): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn("Google Maps API key not found. Geocoding will not work.");
    return null;
  }

  const query = `${city}, ${province}, Canada`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      return {
        city,
        province,
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
      };
    }

    console.warn("Geocoding failed:", data.status);
    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to get city and province
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<GeocodeResult | null> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.warn("Google Maps API key not found. Reverse geocoding will not work.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const location = result.geometry.location;

      // Extract city and province from address components
      let city = "";
      let province = "";

      for (const component of result.address_components) {
        if (component.types.includes("locality")) {
          city = component.long_name;
        }
        if (component.types.includes("administrative_area_level_1")) {
          province = component.short_name;
        }
      }

      return {
        city: city || "Unknown",
        province: province || "Unknown",
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
      };
    }

    console.warn("Reverse geocoding failed:", data.status);
    return null;
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return null;
  }
}

