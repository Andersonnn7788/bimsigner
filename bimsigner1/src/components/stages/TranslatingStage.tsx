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
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      {/* Detected glosses */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {glosses.map((gloss, i) => (
          <Badge key={`${gloss}-${i}`} variant="secondary" className="text-base px-3 py-1">
            {gloss}
          </Badge>
        ))}
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Translating to Malay...
          </p>
        </div>
      )}

      {/* Resulting sentence */}
      {sentence && (
        <div className="max-w-md rounded-xl border border-primary/20 bg-primary/5 px-6 py-4 text-center">
          <p className="text-lg font-medium text-foreground">{sentence}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
