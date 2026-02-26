"use client";

import { User, Sparkles, Target, CheckCircle2, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { UserProfile, IntentPrediction } from "@/types";

interface ProfilePanelProps {
  profile: UserProfile;
  intentPrediction: IntentPrediction | null;
  intentLoading: boolean;
  confirmedIntent: string | null;
  onOpenModal: () => void;
}

const confidenceBadgeClass: Record<string, string> = {
  "Very Likely": "border-emerald-500/30 bg-emerald-50 text-emerald-700",
  Likely: "border-amber-500/30 bg-amber-50 text-amber-700",
  Possible: "border-border bg-muted/60 text-muted-foreground",
};

export default function ProfilePanel({
  profile,
  intentPrediction,
  intentLoading,
  confirmedIntent,
  onOpenModal,
}: ProfilePanelProps) {
  const registeredYear = profile.registered_since.slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
        <User className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="panel-title">Visitor Profile</span>
      </div>

      {/* Profile card */}
      <div className="shrink-0 p-3">
        <div className="flex items-start gap-3 rounded-xl border border-border bg-background/60 p-3">
          {/* Initials avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/20">
            <span className="text-lg font-bold text-primary">
              {profile.photo_placeholder_initials}
            </span>
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground leading-tight">{profile.name}</p>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{profile.ic_number}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px]">
                Deaf
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] border-primary/30 text-primary"
              >
                {profile.visit_count} visits
              </Badge>
              <Badge
                variant="outline"
                className="text-[10px] border-emerald-500/30 text-emerald-600"
              >
                Since {registeredYear}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <Separator className="shrink-0" />

      {/* AI Intent section */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
        {/* Section label */}
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">Predicted Intent</span>
        </div>

        {/* Loading */}
        {intentLoading && (
          <div className="flex items-center gap-2.5 text-muted-foreground">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            <p className="text-sm">Analysing visit history...</p>
          </div>
        )}

        {/* Confirmed intent */}
        {confirmedIntent && (
          <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-50 p-3 flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-600 mb-1">
                Confirmed Intent
              </p>
              <p className="text-sm font-medium text-emerald-800 leading-snug">
                {confirmedIntent}
              </p>
            </div>
          </div>
        )}

        {/* Pending prediction */}
        {intentPrediction && !confirmedIntent && !intentLoading && (
          <div className="flex flex-col gap-2">
            {/* Confidence badge */}
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  confidenceBadgeClass[intentPrediction.confidence_label]
                )}
              >
                {intentPrediction.confidence_label}
              </span>
            </div>

            {/* Prediction card */}
            <div className="rounded-xl border border-border bg-background/50 p-3 flex items-start gap-2.5">
              <Target className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">
                  {intentPrediction.primary_intent}
                </p>
                <p className="text-xs text-muted-foreground italic mt-1.5 leading-relaxed">
                  {intentPrediction.reasoning}
                </p>
              </div>
            </div>

            {/* Confirm button */}
            <Button
              className="w-full gap-2 mt-1"
              onClick={onOpenModal}
            >
              <CheckSquare className="h-4 w-4" />
              Confirm with Visitor
            </Button>
          </div>
        )}

        {/* Placeholder (not loading, no prediction yet) */}
        {!intentLoading && !intentPrediction && !confirmedIntent && (
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        )}
      </div>
    </div>
  );
}
