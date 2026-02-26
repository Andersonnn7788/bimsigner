"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LocationListPanel from "@/components/locations/LocationListPanel";
import MapPanel from "@/components/locations/MapPanel";
import { MOCK_LOCATIONS } from "@/lib/mock-locations";
import type { PlaceCategory, LocationStatus } from "@/types";

export default function LocationsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<PlaceCategory | "ALL">("ALL");
  const [activeStatus, setActiveStatus] = useState<LocationStatus | "ALL">("ALL");

  const filteredLocations = useMemo(() => {
    return MOCK_LOCATIONS.filter((loc) => {
      if (activeCategory !== "ALL" && loc.category !== activeCategory) return false;
      if (activeStatus !== "ALL" && loc.status !== activeStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !loc.name.toLowerCase().includes(q) &&
          !loc.city.toLowerCase().includes(q) &&
          !loc.state.toLowerCase().includes(q) &&
          !loc.address.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [searchQuery, activeCategory, activeStatus]);

  const selectedLocation = useMemo(
    () => MOCK_LOCATIONS.find((l) => l.id === selectedId) ?? null,
    [selectedId]
  );

  function handleSelect(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Link>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              Deaf-Friendly <span className="text-primary">Government</span> Locations
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px]">
            Malaysia
          </Badge>
          <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
            {MOCK_LOCATIONS.filter((l) => l.status === "ACTIVE").length} Active
          </Badge>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left — list panel (40%) */}
        <div className="w-[40%] shrink-0 border-r border-border overflow-hidden">
          <LocationListPanel
            locations={filteredLocations}
            allLocations={MOCK_LOCATIONS}
            selectedId={selectedId}
            searchQuery={searchQuery}
            activeCategory={activeCategory}
            activeStatus={activeStatus}
            onSelect={handleSelect}
            onSearch={setSearchQuery}
            onCategoryChange={setActiveCategory}
            onStatusChange={setActiveStatus}
          />
        </div>

        {/* Right — map panel (60%) */}
        <div className="flex-1 overflow-hidden">
          <MapPanel
            selectedLocation={selectedLocation}
            allLocations={MOCK_LOCATIONS}
            filteredLocations={filteredLocations}
            onSelectPin={handleSelect}
          />
        </div>
      </div>
    </div>
  );
}
