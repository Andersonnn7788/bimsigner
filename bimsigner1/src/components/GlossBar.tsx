"use client";

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
    <div className="flex flex-col gap-2 rounded-lg bg-black/60 p-3 backdrop-blur-sm">
      <div className="text-xs font-medium uppercase tracking-wider text-white/70">
        Detected Signs
      </div>

      <div className="flex min-h-[2rem] flex-wrap gap-1.5">
        {glosses.length === 0 ? (
          <span className="text-sm text-white/40">
            Perform signs to detect...
          </span>
        ) : (
          glosses.map((g, i) => (
            <span
              key={`${g}-${i}`}
              className="rounded-md bg-emerald-500/80 px-2.5 py-1 text-sm font-medium text-white"
            >
              {g}
            </span>
          ))
        )}
      </div>

      {sentence && (
        <div className="rounded-md bg-white/10 px-3 py-2 text-sm text-white">
          {sentence}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onSpeak}
          disabled={glosses.length === 0 || isSpeaking}
          className="rounded-md bg-blue-500 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
        >
          {isSpeaking ? "Speaking..." : "Speak"}
        </button>
        <button
          onClick={onClear}
          disabled={glosses.length === 0}
          className="rounded-md bg-white/20 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-white/30 disabled:opacity-40"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
