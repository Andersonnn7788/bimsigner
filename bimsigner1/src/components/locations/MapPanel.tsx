"use client";

import {
  Map,
  MapPin,
  Shield,
  Car,
  Activity,
  Clock,
  Navigation,
  Check,
} from "lucide-react";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { GovernmentLocation, PlaceCategory, DeafFeature } from "@/types";

// --- Config maps ---

const categoryConfig: Record<
  PlaceCategory,
  {
    label: string;
    icon: React.ElementType;
    pinClass: string;
    iconClass: string;
  }
> = {
  BALAI_POLIS: {
    label: "Balai Polis",
    icon: Shield,
    pinClass: "bg-blue-600 border-blue-700",
    iconClass: "text-blue-600",
  },
  JPJ: {
    label: "JPJ",
    icon: Car,
    pinClass: "bg-orange-500 border-orange-600",
    iconClass: "text-orange-600",
  },
  HOSPITAL: {
    label: "Hospital / Klinik",
    icon: Activity,
    pinClass: "bg-red-500 border-red-600",
    iconClass: "text-red-600",
  },
};

const featureConfig: Record<DeafFeature, { label: string }> = {
  BIM_SIGNER_KIOSK: { label: "BIM Signer Kiosk" },
  SIGN_INTERPRETER: { label: "Sign Language Interpreter" },
  VISUAL_ALERTS: { label: "Visual Alert System" },
  INDUCTION_LOOP: { label: "Induction Loop" },
  VISUAL_QUEUE: { label: "Visual Queue Display" },
};

// --- Custom map marker ---

function LocationMarker({
  location,
  isSelected,
  onClick,
}: {
  location: GovernmentLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cat = categoryConfig[location.category];
  const CatIcon = cat.icon;

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 shadow-md transition-all duration-150",
        isSelected
          ? "scale-125 ring-2 ring-white ring-offset-1 ring-offset-transparent"
          : "hover:scale-110",
        cat.pinClass
      )}
      title={location.name}
    >
      <CatIcon className="h-3.5 w-3.5 text-white" />
    </div>
  );
}

// --- Pin strip item ---

function PinItem({
  location,
  isSelected,
  onClick,
}: {
  location: GovernmentLocation;
  isSelected: boolean;
  onClick: () => void;
}) {
  const cat = categoryConfig[location.category];
  const PinIcon = cat.icon;

  return (
    <button
      onClick={onClick}
      title={location.name}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1 rounded-lg border px-2 py-1.5 transition-all duration-150",
        isSelected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border-2 text-white",
          isSelected ? "bg-primary border-primary" : cat.pinClass
        )}
      >
        <PinIcon className="h-3 w-3" />
      </div>
      <span className="text-[9px] font-medium max-w-[52px] text-center leading-tight line-clamp-2">
        {location.city}
      </span>
    </button>
  );
}

// --- MapPanel ---

export interface MapPanelProps {
  selectedLocation: GovernmentLocation | null;
  allLocations: GovernmentLocation[];
  filteredLocations: GovernmentLocation[];
  onSelectPin: (id: string) => void;
}

const MALAYSIA_CENTER = { lat: 3.163, lng: 101.61 };

export default function MapPanel({
  selectedLocation,
  allLocations,
  filteredLocations,
  onSelectPin,
}: MapPanelProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Map className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">Map View</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">
            Malaysia &middot; {allLocations.length} locations
          </span>
        </div>
      </div>

      {/* Map area */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <APIProvider apiKey={apiKey}>
          <GoogleMap
            mapId={mapId}
            defaultCenter={MALAYSIA_CENTER}
            defaultZoom={11}
            gestureHandling="cooperative"
            style={{ width: "100%", height: "100%" }}
          >
            {filteredLocations.map((loc) => (
              <AdvancedMarker
                key={loc.id}
                position={loc.coordinates}
                onClick={() => onSelectPin(loc.id)}
              >
                <LocationMarker
                  location={loc}
                  isSelected={selectedLocation?.id === loc.id}
                  onClick={() => onSelectPin(loc.id)}
                />
              </AdvancedMarker>
            ))}
          </GoogleMap>
        </APIProvider>

        {/* Hint badge — shown when nothing is selected */}
        {!selectedLocation && (
          <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 shadow-sm backdrop-blur-sm">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              Click a marker to see details
            </span>
          </div>
        )}

        {/* Detail card — shown when a location is selected */}
        {selectedLocation && (
          <div className="absolute bottom-[5.5rem] left-3 w-full max-w-[300px] rounded-xl border border-border bg-card shadow-xl overflow-hidden">
            {(() => {
              const cat = categoryConfig[selectedLocation.category];
              const CatIcon = cat.icon;
              return (
                <>
                  {/* Card header */}
                  <div className="flex items-center gap-2.5 border-b border-border bg-background/60 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10">
                      <CatIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground leading-tight truncate">
                        {selectedLocation.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {cat.label} &middot; {selectedLocation.state}
                      </p>
                    </div>
                    <button
                      onClick={() => onSelectPin(selectedLocation.id)}
                      className="shrink-0 rounded-md p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Dismiss"
                    >
                      <span className="text-[10px] leading-none">✕</span>
                    </button>
                  </div>

                  <div className="p-3 flex flex-col gap-2.5">
                    {/* Address */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">
                        Address
                      </p>
                      <p className="text-xs text-foreground leading-relaxed">
                        {selectedLocation.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {selectedLocation.city}, {selectedLocation.state}
                      </p>
                    </div>

                    {/* Hours */}
                    {selectedLocation.hours && (
                      <div className="flex items-start gap-1.5">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
                        <p className="text-xs text-foreground leading-relaxed">
                          {selectedLocation.hours}
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                        Deaf-Friendly Features
                      </p>
                      <div className="flex flex-col gap-1">
                        {selectedLocation.features.map((f) => (
                          <div key={f} className="flex items-center gap-1.5">
                            <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
                              <Check className="h-2 w-2 text-emerald-600" />
                            </div>
                            <span className="text-[10px] text-foreground">
                              {featureConfig[f].label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Coordinates */}
                    <p className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[9px] font-mono text-muted-foreground">
                      {selectedLocation.coordinates.lat.toFixed(4)},{" "}
                      {selectedLocation.coordinates.lng.toFixed(4)}
                    </p>

                    {/* Directions button */}
                    <Button
                      size="sm"
                      className="w-full gap-1.5 text-xs h-8"
                      onClick={() => {
                        const { lat, lng } = selectedLocation.coordinates;
                        window.open(
                          `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
                          "_blank"
                        );
                      }}
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      Get Directions
                    </Button>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* Bottom pin strip */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-sm px-3 py-2">
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-0.5" style={{ minWidth: "max-content" }}>
              {filteredLocations.map((loc) => (
                <PinItem
                  key={loc.id}
                  location={loc}
                  isSelected={selectedLocation?.id === loc.id}
                  onClick={() => onSelectPin(loc.id)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
