import { useEffect, useRef, useCallback, useState } from "react";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/constants";

interface LocationMapProps {
  onLocationSelect?: (lat: number, lng: number, city?: string, state?: string, country?: string) => void;
  initialLat?: number;
  initialLng?: number;
  className?: string;
}

export function LocationMap({ onLocationSelect, initialLat = 37.7749, initialLng = -122.4194, className }: LocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_PUBLIC_TOKEN}&types=place,region,country`
      );
      const data = await res.json();
      let city = "", state = "", country = "";
      for (const feat of data.features || []) {
        if (feat.place_type?.includes("place")) city = feat.text;
        if (feat.place_type?.includes("region")) state = feat.text;
        if (feat.place_type?.includes("country")) country = feat.text;
      }
      onLocationSelect?.(lat, lng, city, state, country);
    } catch {
      onLocationSelect?.(lat, lng);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    let cancelled = false;

    (async () => {
      const [mapboxgl] = await Promise.all([
        import("mapbox-gl").then(m => m.default),
        import("mapbox-gl/dist/mapbox-gl.css"),
      ]);

      if (cancelled || !mapContainer.current) return;

      mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [initialLng, initialLat],
        zoom: 10,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      marker.current = new mapboxgl.Marker({ color: "#6366f1", draggable: true })
        .setLngLat([initialLng, initialLat])
        .addTo(map.current);

      marker.current.on("dragend", () => {
        const lngLat = marker.current!.getLngLat();
        reverseGeocode(lngLat.lat, lngLat.lng);
      });

      map.current.on("click", (e: any) => {
        marker.current!.setLngLat(e.lngLat);
        reverseGeocode(e.lngLat.lat, e.lngLat.lng);
      });

      setLoading(false);
    })();

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Fly to new coordinates when initialLat/initialLng change
  useEffect(() => {
    if (!map.current || !marker.current) return;
    map.current.flyTo({ center: [initialLng, initialLat], zoom: 12 });
    marker.current.setLngLat([initialLng, initialLat]);
  }, [initialLat, initialLng]);

  return (
    <div className={`relative ${className || "w-full h-48 rounded-xl overflow-hidden border border-border"}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
