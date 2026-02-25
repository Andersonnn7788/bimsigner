"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Props {
  glosses: string[];
  sentence: string;
  onSpeak: () => void;
  onClear: () => void;
  isSpeaking: boolean;
}

export default function GlossBar({
  glosses,
  sentence,
  onSpeak,
  onClear,
  isSpeaking,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="panel-title">Detected Signs</div>

      <div className="flex min-h-[2rem] flex-wrap gap-1.5">
        {glosses.length === 0 ? (
          <span className="text-sm text-muted-foreground">
            Perform signs to detect...
          </span>
        ) : (
          glosses.map((g, i) => (
            <Badge key={`${g}-${i}`} variant="secondary">
              {g}
            </Badge>
          ))
        )}
      </div>

      {sentence && (
        <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-foreground">
          {sentence}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={onSpeak}
          disabled={glosses.length === 0 || isSpeaking}
        >
          {isSpeaking ? "Speaking..." : "Speak"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onClear}
          disabled={glosses.length === 0}
        >
          Clear
        </Button>
      </div>
    </div>
  );
}
