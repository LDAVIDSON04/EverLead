// Hook for detecting browser geolocation
import { useState, useEffect } from "react";

export interface GeolocationResult {
  latitude: number;
  longitude: number;
  city?: string;
  province?: string;
  error?: string;
}

export function useBrowserGeolocation(shouldRequest: boolean = false) {
  const [result, setResult] = useState<GeolocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only request if explicitly requested
    if (!shouldRequest) {
      setLoading(false);
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Try to reverse geocode to get city/province
        try {
          const response = await fetch("/api/geocode", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "reverse",
              latitude,
              longitude,
            }),
          });

          const data = await response.json();

          if (data.error) {
            // Still return coordinates even if reverse geocoding fails
            setResult({
              latitude,
              longitude,
            });
          } else {
            setResult({
              latitude,
              longitude,
              city: data.city,
              province: data.province,
            });
          }
        } catch (err) {
          // Still return coordinates even if API call fails
          setResult({
            latitude,
            longitude,
          });
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 86400000, // Cache for 24 hours (browser will remember permission)
      }
    );
  }, [shouldRequest]);

  return { result, loading, error };
}

