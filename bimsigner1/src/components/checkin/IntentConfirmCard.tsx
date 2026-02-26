"use client";

import { useState } from "react";
import { Lightbulb, Check, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IntentPrediction, ConfidenceLabel } from "@/types";

interface IntentConfirmCardProps {
  prediction: IntentPrediction;
  userName: string;
  onConfirm: (intent: string) => void;
  onDismiss: () => void;
}

const confidenceBadgeClass: Record<ConfidenceLabel, string> = {
  "Very Likely": "border-emerald-500/30 bg-emerald-50 text-emerald-700",
  Likely: "border-amber-500/30 bg-amber-50 text-amber-700",
  Possible: "border-border bg-muted/60 text-muted-foreground",
};

export default function IntentConfirmCard({
  prediction,
  userName,
  onConfirm,
  onDismiss,
}: IntentConfirmCardProps) {
  const [view, setView] = useState<"primary" | "alternatives">("primary");
  const [selectedAlt, setSelectedAlt] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(true);

  // Extract first name for the greeting
  const firstName = userName.split(" ")[0];

  return (
    /* Full-screen overlay */
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onDismiss}
    >
      {/* Modal card */}
      <div
        className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            {view === "alternatives" && (
              <button
                onClick={() => {
                  setView("primary");
                  setSelectedAlt(null);
                }}
                className="mr-1 rounded-md p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            <Lightbulb className="h-4.5 w-4.5 text-primary" />
            <span className="text-sm font-bold text-foreground">
              Why Are You Here Today?
            </span>
          </div>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
              confidenceBadgeClass[prediction.confidence_label]
            )}
          >
            {prediction.confidence_label}
          </span>
        </div>

        {/* Primary view */}
        {view === "primary" && (
          <div className="px-5 py-6 flex flex-col items-center gap-5">
            {/* Greeting */}
            <p className="text-sm text-muted-foreground">
              Welcome, <span className="font-semibold text-foreground">{firstName}</span>!
            </p>

            {/* Avatar video */}
            <div className="relative w-full aspect-video rounded-xl overflow-hidden ring-2 ring-primary/30 shadow-lg bg-black">
              {isSigning && (
                <span className="absolute inset-0 rounded-xl animate-ping ring-2 ring-primary/20 pointer-events-none" />
              )}
              <video
                src="/avatars/avatar.mp4"
                autoPlay
                muted
                playsInline
                onEnded={() => setIsSigning(false)}
                className="w-full h-full object-contain"
              />
              <span className={cn(
                "absolute bottom-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full transition-colors",
                isSigning ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
              )}>
                {isSigning ? "● LIVE" : "BIM"}
              </span>
            </div>

            {/* Intent card */}
            <div className="w-full rounded-2xl border-2 border-primary/30 bg-primary/5 px-5 py-3 text-center">
              <p className="text-base font-bold text-foreground leading-snug">
                {prediction.primary_intent}
              </p>
            </div>

            {/* Confirm CTA */}
            <Button
              className="w-full h-14 text-base font-bold rounded-xl gap-2"
              onClick={() => onConfirm(prediction.primary_intent)}
            >
              <Check className="h-5 w-5" />
              Yes
            </Button>

            {/* Ghost link */}
            <button
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => setView("alternatives")}
            >
              No, show me other options →
            </button>
          </div>
        )}

        {/* Alternatives view */}
        {view === "alternatives" && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground text-center mb-1">
              Please select the correct reason:
            </p>

            {prediction.alternatives.map((alt, i) => (
              <button
                key={i}
                onClick={() => setSelectedAlt(alt)}
                className={cn(
                  "w-full rounded-xl border-2 p-4 text-left flex items-center gap-3 transition-all duration-150",
                  selectedAlt === alt
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background/50 text-foreground hover:border-primary/40 hover:bg-primary/5"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                    selectedAlt === alt
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
                <span className="text-sm font-medium leading-snug">{alt}</span>
              </button>
            ))}

            <Button
              className="w-full h-12 text-sm font-semibold rounded-xl mt-1"
              disabled={!selectedAlt}
              onClick={() => selectedAlt && onConfirm(selectedAlt)}
            >
              Confirm This Choice
            </Button>

            <button
              className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
              onClick={() => {
                setView("primary");
                setSelectedAlt(null);
              }}
            >
              ← Back to prediction
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
