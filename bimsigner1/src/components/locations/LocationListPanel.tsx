"use client";

import { Building2, Search, Shield, Car, Activity, Check, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  GovernmentLocation,
  PlaceCategory,
  LocationStatus,
  DeafFeature,
} from "@/types";

// --- Config maps ---

const categoryConfig: Record<
  PlaceCategory,
  { label: string; icon: React.ElementType; iconClass: string; chipClass: string }
> = {
  BALAI_POLIS: {
    label: "Balai Polis",
    icon: Shield,
    iconClass: "text-blue-600",
    chipClass: "border-blue-500/30 bg-blue-50 text-blue-700",
  },
  JPJ: {
    label: "JPJ",
    icon: Car,
    iconClass: "text-orange-600",
    chipClass: "border-orange-500/30 bg-orange-50 text-orange-700",
  },
  HOSPITAL: {
    label: "Hospital / Klinik",
    icon: Activity,
    iconClass: "text-red-600",
    chipClass: "border-red-500/30 bg-red-50 text-red-700",
  },
};

const statusConfig: Record<
  LocationStatus,
  { label: string; className: string }
> = {
  ACTIVE: {
    label: "Active",
    className: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  COMING_SOON: {
    label: "Coming Soon",
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  MAINTENANCE: {
    label: "Maintenance",
    className: "bg-slate-50 border-border text-muted-foreground",
  },
};

const featureConfig: Record<DeafFeature, { label: string }> = {
  BIM_SIGNER_KIOSK: { label: "BIM Kiosk" },
  SIGN_INTERPRETER: { label: "Interpreter" },
  VISUAL_ALERTS: { label: "Visual Alerts" },
  INDUCTION_LOOP: { label: "Induction Loop" },
  VISUAL_QUEUE: { label: "Visual Queue" },
};

// --- Category filter chip ---

const ALL_CATEGORIES: Array<PlaceCategory | "ALL"> = [
  "ALL",
  "BALAI_POLIS",
  "JPJ",
  "HOSPITAL",
];

const ALL_STATUSES: Array<LocationStatus | "ALL"> = [
  "ALL",
  "ACTIVE",
  "COMING_SOON",
];

// --- LocationCard ---

function LocationCard({
  location,
  isSelected,
  onSelect,
}: {
  location: GovernmentLocation;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const cat = categoryConfig[location.category];
  const CatIcon = cat.icon;
  const status = statusConfig[location.status];

  return (
    <button
      onClick={() => onSelect(location.id)}
      className={cn(
        "w-full rounded-lg border p-3 text-left transition-all duration-150",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Category icon column */}
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border",
            isSelected ? "border-primary/30 bg-primary/10" : "border-border bg-muted/40"
          )}
        >
          <CatIcon className={cn("h-4 w-4", isSelected ? "text-primary" : cat.iconClass)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-foreground leading-tight">
              {location.name}
            </p>
            <span
              className={cn(
                "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-semibold",
                status.className
              )}
            >
              {status.label}
            </span>
          </div>

          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {location.city} &middot; {location.state}
          </p>
          <p className="mt-0.5 text-[10px] text-muted-foreground truncate">
            {location.address}
          </p>

          {location.hours && (
            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="h-2.5 w-2.5 shrink-0" />
              {location.hours}
            </p>
          )}

          {/* Feature badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {location.features.map((f) => (
              <span
                key={f}
                className="inline-flex items-center gap-0.5 rounded border border-border bg-muted/40 px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"
              >
                <Check className="h-2 w-2 text-emerald-500" />
                {featureConfig[f].label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

// --- LocationListPanel ---

export interface LocationListPanelProps {
  locations: GovernmentLocation[];
  allLocations: GovernmentLocation[];
  selectedId: string | null;
  searchQuery: string;
  activeCategory: PlaceCategory | "ALL";
  activeStatus: LocationStatus | "ALL";
  onSelect: (id: string) => void;
  onSearch: (query: string) => void;
  onCategoryChange: (cat: PlaceCategory | "ALL") => void;
  onStatusChange: (status: LocationStatus | "ALL") => void;
}

export default function LocationListPanel({
  locations,
  allLocations,
  selectedId,
  searchQuery,
  activeCategory,
  activeStatus,
  onSelect,
  onSearch,
  onCategoryChange,
  onStatusChange,
}: LocationListPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">Government Locations</span>
        </div>
        <Badge variant="secondary" className="text-[10px] font-mono">
          {locations.length} / {allLocations.length}
        </Badge>
      </div>

      {/* Filter bar */}
      <div className="shrink-0 border-b border-border px-3 py-2 flex flex-col gap-2">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="w-full rounded-md border border-border bg-background/60 py-1.5 pl-7 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        {/* Category chips */}
        <div className="flex gap-1 flex-wrap">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const label =
              cat === "ALL" ? "All" : categoryConfig[cat as PlaceCategory].label;
            return (
              <button
                key={cat}
                onClick={() => onCategoryChange(cat)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Status chips */}
        <div className="flex gap-1">
          {ALL_STATUSES.map((s) => {
            const isActive = activeStatus === s;
            const label =
              s === "ALL" ? "All Status" : statusConfig[s as LocationStatus].label;
            return (
              <button
                key={s}
                onClick={() => onStatusChange(s)}
                className={cn(
                  "rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-muted-foreground hover:border-primary/20 hover:text-foreground"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable location list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 flex flex-col gap-2">
          {locations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <Search className="h-8 w-8 opacity-30" />
              <p className="text-sm">No locations found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          ) : (
            locations.map((loc) => (
              <LocationCard
                key={loc.id}
                location={loc}
                isSelected={selectedId === loc.id}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
