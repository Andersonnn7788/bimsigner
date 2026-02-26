"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ProfilePanel from "@/components/checkin/ProfilePanel";
import HistoryPanel from "@/components/checkin/HistoryPanel";
import IntentConfirmCard from "@/components/checkin/IntentConfirmCard";
import { MOCK_PROFILE, MOCK_HISTORY, simulatePredictIntent } from "@/lib/mock-checkin";
import type { IntentPrediction } from "@/types";

export default function CheckinPage() {
  const [intentLoading, setIntentLoading] = useState(true);
  const [intentPrediction, setIntentPrediction] = useState<IntentPrediction | null>(null);
  const [confirmedIntent, setConfirmedIntent] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Simulate intent prediction on mount
  useEffect(() => {
    simulatePredictIntent().then((result) => {
      setIntentPrediction(result);
      setIntentLoading(false);
      setShowModal(true);
    });
  }, []);

  function handleConfirmIntent(intent: string) {
    setConfirmedIntent(intent);
    setShowModal(false);
  }

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">

      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-card px-4 shadow-sm">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm font-bold tracking-tight text-foreground">
            <span className="text-primary">BIM</span> Signer
          </span>
          <span className="text-muted-foreground text-xs">&middot;</span>
          <span className="text-xs text-muted-foreground font-medium">Check-in</span>
        </div>

        <Badge
          variant="outline"
          className="border-primary/30 text-primary text-[10px]"
        >
          OKU Friendly
        </Badge>
      </header>

      {/* Two-column body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left: Profile + Intent (40%) */}
        <div className="w-[40%] shrink-0 border-r border-border overflow-hidden">
          <ProfilePanel
            profile={MOCK_PROFILE}
            intentPrediction={intentPrediction}
            intentLoading={intentLoading}
            confirmedIntent={confirmedIntent}
            onOpenModal={() => setShowModal(true)}
          />
        </div>

        {/* Right: Visit History (60%) */}
        <div className="flex-1 overflow-hidden">
          <HistoryPanel visitHistory={MOCK_HISTORY} />
        </div>

      </div>

      {/* Deaf-friendly confirmation popup */}
      {showModal && intentPrediction && (
        <IntentConfirmCard
          prediction={intentPrediction}
          userName={MOCK_PROFILE.name}
          onConfirm={handleConfirmIntent}
          onDismiss={() => setShowModal(false)}
        />
      )}

    </div>
  );
}
