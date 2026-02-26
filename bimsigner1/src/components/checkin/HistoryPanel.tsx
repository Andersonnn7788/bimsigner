"use client";

import { History } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { VisitRecord, VisitOutcome } from "@/types";

interface HistoryPanelProps {
  visitHistory: VisitRecord[];
}

const outcomeConfig: Record<
  VisitOutcome,
  { label: string; className: string }
> = {
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-amber-50 border-amber-200 text-amber-700",
  },
  INCOMPLETE: {
    label: "Incomplete",
    className: "bg-red-50 border-red-200 text-red-700",
  },
};

function VisitCard({ visit }: { visit: VisitRecord }) {
  const config = outcomeConfig[visit.outcome];

  return (
    <div className="rounded-lg border border-border bg-background/50 p-3 flex items-start gap-3">
      {/* Left: purpose + dept + notes */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground leading-tight">
          {visit.purpose}
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {visit.department} &middot; {visit.counter}
        </p>
        {visit.notes && (
          <p className="text-[10px] italic text-muted-foreground mt-1 leading-relaxed">
            {visit.notes}
          </p>
        )}
      </div>

      {/* Right: date + outcome badge */}
      <div className="shrink-0 flex flex-col items-end gap-1.5">
        <span className="text-[10px] font-mono text-muted-foreground">
          {visit.date}
        </span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold",
            config.className
          )}
        >
          {config.label}
        </span>
      </div>
    </div>
  );
}

export default function HistoryPanel({ visitHistory }: HistoryPanelProps) {
  return (
    <div className="flex flex-col h-full bg-card">
      {/* Panel header */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-3">
        <div className="flex items-center gap-2">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="panel-title">Visit History</span>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {visitHistory.length} record{visitHistory.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Scrollable visit list */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 flex flex-col gap-2">
          {visitHistory.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
