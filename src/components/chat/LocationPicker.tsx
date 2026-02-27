import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Search, MapPin, Navigation, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { MAPBOX_PUBLIC_TOKEN } from "@/lib/constants";

interface LocationPickerProps {
  recipientId: string;
  onClose: () => void;
  onSent: () => void;
}

interface NearbyPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const LocationPicker = ({ recipientId, onClose, onSent }: LocationPickerProps) => {
  const { user } = useAuth();
  const [currentLat, setCurrentLat] = useState<number | null>(null);
  const [currentLng, setCurrentLng] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyPlace[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [sending, setSending] = useState(false);
  const [liveSharing, setLiveSharing] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);

  // Get current location
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      setLoadingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));
        setLoadingLocation(false);
      },
      (err) => {
        toast.error("Location access denied. Please enable location permissions.");
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Load map when location is available
  useEffect(() => {
    if (!mapContainerRef.current || !currentLat || !currentLng || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const [mapboxgl] = await Promise.all([
        import("mapbox-gl").then(m => m.default),
        import("mapbox-gl/dist/mapbox-gl.css"),
      ]);

      if (cancelled || !mapContainerRef.current) return;
      mapboxgl.accessToken = MAPBOX_PUBLIC_TOKEN;

      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [currentLng, currentLat],
        zoom: 15,
      });

      // Add user location marker
      const el = document.createElement("div");
      el.className = "w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg";
      el.style.boxShadow = "0 0 0 8px rgba(59,130,246,0.2)";

      markerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([currentLng, currentLat])
        .addTo(mapRef.current);

      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [currentLat, currentLng]);

  // Fetch nearby places
  useEffect(() => {
    if (!currentLat || !currentLng) return;

    const fetchPlaces = async () => {
      try {
        const query = searchQuery || "restaurant,shop,park";
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?proximity=${currentLng},${currentLat}&limit=8&access_token=${MAPBOX_PUBLIC_TOKEN}&types=poi`
        );
        const data = await res.json();
        const places: NearbyPlace[] = (data.features || []).map((f: any) => ({
          name: f.text,
          address: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
        }));
        setNearbyPlaces(places);
      } catch {
        // Silently fail
      }
    };

    const debounce = setTimeout(fetchPlaces, 300);
    return () => clearTimeout(debounce);
  }, [currentLat, currentLng, searchQuery]);

  const sendLocation = async (lat: number, lng: number, label?: string) => {
    if (!user || sending) return;
    setSending(true);

    const locationLabel = label || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;

    await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: `📍 ${locationLabel}\n${mapUrl}`,
      message_type: "location",
    });

    setSending(false);
    toast.success("Location shared");
    onSent();
    onClose();
  };

  const startLiveLocation = () => {
    if (!navigator.geolocation || !user) return;
    setLiveSharing(true);

    // Send initial
    if (currentLat && currentLng) {
      sendLiveUpdate(currentLat, currentLng);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentLat(pos.coords.latitude);
        setCurrentLng(pos.coords.longitude);
        setAccuracy(Math.round(pos.coords.accuracy));

        if (mapRef.current && markerRef.current) {
          markerRef.current.setLngLat([pos.coords.longitude, pos.coords.latitude]);
          mapRef.current.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 16 });
        }
      },
      () => toast.error("Lost location access"),
      { enableHighAccuracy: true }
    );

    toast.success("Live location sharing started");
  };

  const sendLiveUpdate = async (lat: number, lng: number) => {
    if (!user) return;
    await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id: recipientId,
      content: `📍 Live location: ${lat.toFixed(6)}, ${lng.toFixed(6)}\nhttps://www.google.com/maps?q=${lat},${lng}`,
      message_type: "location",
    });
  };

  const stopLiveLocation = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLiveSharing(false);
    toast.success("Stopped live location sharing");
    onClose();
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold flex-1">Send location</h1>
      </header>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search places..."
            className="flex-1 bg-transparent border-0 outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Map */}
      <div className="h-52 relative border-b border-border">
        {loadingLocation ? (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div ref={mapContainerRef} className="w-full h-full" />
            <button
              onClick={() => {
                if (mapRef.current && currentLat && currentLng) {
                  mapRef.current.flyTo({ center: [currentLng, currentLat], zoom: 16 });
                }
              }}
              className="absolute top-3 right-3 h-9 w-9 rounded-full bg-background shadow-md flex items-center justify-center"
            >
              <Navigation className="h-4 w-4 text-primary" />
            </button>
          </>
        )}
      </div>

      {/* Location options */}
      <div className="flex-1 overflow-y-auto">
        {/* Live location */}
        <button
          onClick={liveSharing ? stopLiveLocation : startLiveLocation}
          disabled={!currentLat || !currentLng}
          className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border"
        >
          <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <Navigation className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <span className="text-sm font-medium text-foreground">
            {liveSharing ? "Stop sharing live location" : "Share live location"}
          </span>
        </button>

        {/* Current location */}
        <button
          onClick={() => currentLat && currentLng && sendLocation(currentLat, currentLng, "Current location")}
          disabled={!currentLat || !currentLng || sending}
          className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/50 transition-colors border-b border-border"
        >
          <div className="h-12 w-12 rounded-full border-2 border-green-500 flex items-center justify-center">
            <div className="h-3 w-3 rounded-full bg-green-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Send your current location</p>
            <p className="text-xs text-muted-foreground">
              {accuracy ? `Accurate to ${accuracy} meters` : "Getting accuracy..."}
            </p>
          </div>
        </button>

        {/* Nearby places header */}
        {nearbyPlaces.length > 0 && (
          <div className="px-4 py-2 bg-muted/30">
            <p className="text-xs text-muted-foreground font-medium">Nearby places</p>
          </div>
        )}

        {/* Nearby places list */}
        {nearbyPlaces.map((place, i) => (
          <button
            key={i}
            onClick={() => sendLocation(place.lat, place.lng, place.name)}
            disabled={sending}
            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border/50"
          >
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
              <MapPin className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{place.name}</p>
              <p className="text-xs text-muted-foreground truncate">{place.address}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationPicker;
