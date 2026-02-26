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
    <div className="flex flex-col gap-4 p-4">
      <p className="panel-title">BIM Avatar</p>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2.5 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm">Converting to sign language...</p>
        </div>
      )}

      {/* Avatar player */}
      {signs.length > 0 && (
        <div className="w-full">
          <AvatarPlayer signs={signs} onDone={onDone} />
        </div>
      )}

      {/* Sign labels */}
      {signs.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Signs:</span>
          {signs.map((sign, i) => (
            <Badge
              key={`${sign}-${i}`}
              variant="outline"
              className="text-primary border-primary/30 text-xs"
            >
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
