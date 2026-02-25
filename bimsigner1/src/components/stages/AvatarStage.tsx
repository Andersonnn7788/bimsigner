"use client";

import AvatarPlayer from "@/components/AvatarPlayer";
import { Badge } from "@/components/ui/badge";

interface Props {
  signs: string[];
  isLoading: boolean;
  error: string | null;
  onDone: () => void;
}

export default function AvatarStage({
  signs,
  isLoading,
  error,
  onDone,
}: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">
            Converting to sign language...
          </p>
        </div>
      )}

      {/* Avatar player */}
      {signs.length > 0 && (
        <div className="w-full max-w-lg">
          <AvatarPlayer signs={signs} onDone={onDone} />
        </div>
      )}

      {/* Sign labels */}
      {signs.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Signs:</span>
          {signs.map((sign, i) => (
            <Badge key={`${sign}-${i}`} variant="outline" className="text-primary border-primary/30">
              {sign}
            </Badge>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
