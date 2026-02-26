"use client";

import { Badge } from "@/components/ui/badge";

interface Props {
  glosses: string[];
  sentence: string;
  isLoading: boolean;
  error: string | null;
}

export default function TranslatingStage({
  glosses,
  sentence,
  isLoading,
  error,
}: Props) {
  return (
    <div className="flex flex-col gap-4 p-4">
      <p className="panel-title">Translation</p>

      {/* Detected glosses */}
      <div>
        <p className="text-xs text-muted-foreground mb-2">Detected signs:</p>
        <div className="flex flex-wrap gap-2">
          {glosses.map((gloss, i) => (
            <Badge key={`${gloss}-${i}`} variant="secondary" className="text-sm px-2.5 py-0.5">
              {gloss}
            </Badge>
          ))}
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm">Translating to Malay...</p>
        </div>
      )}

      {/* Resulting sentence */}
      {sentence && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-base font-medium text-foreground">{sentence}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
