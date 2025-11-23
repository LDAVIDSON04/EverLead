"use client";

import { useState, useEffect, useRef } from "react";
import { GoogleMap, LoadScript, Marker, Circle } from "@react-google-maps/api";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 49.2827, // Vancouver, BC
  lng: -123.1207,
};

const libraries: ("places" | "geometry")[] = ["places"];

interface LocationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCity: string | null;
  currentProvince: string | null;
  currentLat: number | null;
  currentLng: number | null;
  currentRadius: number;
  onSave: (city: string, province: string, lat: number, lng: number, radius: number) => void;
}

export default function LocationChangeModal({
  isOpen,
  onClose,
  currentCity,
  currentProvince,
  currentLat,
  currentLng,
  currentRadius,
  onSave,
}: LocationChangeModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [city, setCity] = useState(currentCity || "");
  const [province, setProvince] = useState(currentProvince || "");
  const [latitude, setLatitude] = useState<number | null>(currentLat);
  const [longitude, setLongitude] = useState<number | null>(currentLng);
  const [radius, setRadius] = useState(currentRadius);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState(
    currentLat && currentLng
      ? { lat: currentLat, lng: currentLng }
      : defaultCenter
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  // Update state when props change
  useEffect(() => {
    if (isOpen) {
      setCity(currentCity || "");
      setProvince(currentProvince || "");
      setLatitude(currentLat);
      setLongitude(currentLng);
      setRadius(currentRadius);
      if (currentLat && currentLng) {
        setMapCenter({ lat: currentLat, lng: currentLng });
      }
    }
  }, [isOpen, currentCity, currentProvince, currentLat, currentLng, currentRadius]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      // Try to parse as "City, Province" format
      const parts = searchQuery.split(",").map((p) => p.trim());
      let searchCity = parts[0];
      let searchProvince = parts[1] || "";

      // If no province provided, try to infer from context or use current province
      if (!searchProvince && currentProvince) {
        searchProvince = currentProvince;
      }

      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "geocode",
          city: searchCity,
          province: searchProvince || "BC", // Default to BC if not provided
        }),
      });

      const result = await response.json();

      if (result.error) {
        alert("Location not found. Please try a different search.");
        return;
      }

      setCity(result.city);
      setProvince(result.province);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setMapCenter({ lat: result.latitude, lng: result.longitude });
      setSearchQuery("");
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search location. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    setLoading(true);
    try {
      const response = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "reverse",
          latitude: lat,
          longitude: lng,
        }),
      });

      const result = await response.json();

      if (result.error) {
        // Still update coordinates even if reverse geocoding fails
        setLatitude(lat);
        setLongitude(lng);
        setMapCenter({ lat, lng });
        return;
      }

      setCity(result.city);
      setProvince(result.province);
      setLatitude(result.latitude);
      setLongitude(result.longitude);
      setMapCenter({ lat: result.latitude, lng: result.longitude });
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      // Still update coordinates
      setLatitude(lat);
      setLongitude(lng);
      setMapCenter({ lat, lng });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!city || !province || !latitude || !longitude) {
      alert("Please select a location on the map or search for a city.");
      return;
    }

    onSave(city, province, latitude, longitude, radius);
    onClose();
  };

  if (!isOpen) return null;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Google Maps API Key Required</h2>
          <p className="text-sm text-gray-600 mb-4">
            Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
          </p>
          <button
            onClick={onClose}
            className="w-full rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#2a2a2a]">Change location</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {/* Search Bar */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#4a4a4a] mb-2">
              Search by town, city, neighbourhood or postal code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearch();
                  }
                }}
                placeholder="e.g. Summerland, BC"
                className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
                disabled={loading}
              />
              <button
                onClick={handleSearch}
                disabled={loading}
                className="rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] disabled:opacity-50"
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {/* Location Display */}
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Location</span>
              <span className="text-[#2a2a2a] font-medium">
                {city && province ? `${city}, ${province}` : "Not set"}
              </span>
            </div>

            {/* Radius Selector */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[#4a4a4a]">Radius</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-[#2a2a2a] outline-none focus:border-[#2a2a2a] focus:ring-1 focus:ring-[#2a2a2a]"
              >
                <option value={25}>25 km</option>
                <option value={50}>50 km</option>
                <option value={73}>73 km</option>
                <option value={100}>100 km</option>
                <option value={150}>150 km</option>
                <option value={200}>200 km</option>
              </select>
            </div>
          </div>

          {/* Map */}
          <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
            <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={latitude && longitude ? 10 : 6}
                onClick={handleMapClick}
                onLoad={(map) => {
                  mapRef.current = map;
                }}
                options={{
                  disableDefaultUI: false,
                  zoomControl: true,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: true,
                }}
              >
                {latitude && longitude && (
                  <>
                    <Marker position={{ lat: latitude, lng: longitude }} />
                    <Circle
                      center={{ lat: latitude, lng: longitude }}
                      radius={radius * 1000} // Convert km to meters
                      options={{
                        fillColor: "#3b82f6",
                        fillOpacity: 0.2,
                        strokeColor: "#3b82f6",
                        strokeOpacity: 0.5,
                        strokeWeight: 2,
                      }}
                    />
                  </>
                )}
              </GoogleMap>
            </LoadScript>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#2a2a2a] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!city || !province || !latitude || !longitude || loading}
              className="flex-1 rounded-md bg-[#2a2a2a] px-4 py-2 text-sm font-medium text-white hover:bg-[#3a3a3a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

