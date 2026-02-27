import { useEffect, useRef, useState } from "react";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/constants";

interface EventMapEvent {
  id: string;
  name: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  event_date: string | null;
  category: string | null;
  attendee_count: number | null;
}

interface EventsMapProps {
  events: EventMapEvent[];
  onEventClick?: (id: string) => void;
  className?: string;
}

export function EventsMap({ events, onEventClick, className }: EventsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const mapboxRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    let cancelled = false;

    (async () => {
      if (!mapboxRef.current) {
        const [mapboxgl] = await Promise.all([
          import("mapbox-gl").then(m => m.default),
          import("mapbox-gl/dist/mapbox-gl.css"),
        ]);
        mapboxRef.current = mapboxgl;
      }

      if (cancelled || !mapContainer.current) return;

      const mapboxgl = mapboxRef.current;
      mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: "mapbox://styles/mapbox/dark-v11",
          center: [-98.5, 39.8],
          zoom: 3,
        });
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      }

      setLoading(false);

      // Clear old markers
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      const eventsWithCoords = events.filter((e) => e.latitude && e.longitude);

      const escapeHtml = (str: string) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");

      eventsWithCoords.forEach((event) => {
        const el = document.createElement("div");
        el.className = "event-map-marker";
        el.style.cssText = `
          width: 32px; height: 32px; border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border: 3px solid white; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;

        const safeName = escapeHtml(event.name);
        const safeLocation = event.location ? escapeHtml(event.location) : "";
        const safeCount = parseInt(String(event.attendee_count)) || 0;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
          <div style="padding:4px 8px;">
            <strong style="font-size:13px;">${safeName}</strong>
            ${event.location ? `<p style="font-size:11px;color:#888;margin:2px 0 0;">${safeLocation}</p>` : ""}
            <p style="font-size:11px;color:#6366f1;margin:2px 0 0;">${safeCount} going</p>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([event.longitude!, event.latitude!])
          .setPopup(popup)
          .addTo(map.current!);

        el.addEventListener("click", () => onEventClick?.(event.id));
        markers.current.push(marker);
      });

      // Fit bounds
      if (eventsWithCoords.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        eventsWithCoords.forEach((e) => bounds.extend([e.longitude!, e.latitude!]));
        map.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
      }
    })();

    return () => { cancelled = true; };
  }, [events, onEventClick]);

  useEffect(() => {
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  return (
    <div className={`relative ${className || "w-full h-[60vh] rounded-xl overflow-hidden border border-border"}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}
