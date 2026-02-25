"use client";

interface Props {
  transcript: string;
  isListening: boolean;
  onToggleMic: () => void;
  onSend: () => void;
}

export default function StaffInput({
  transcript,
  isListening,
  onToggleMic,
  onSend,
}: Props) {
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white/10 p-3">
      <div className="text-xs font-medium uppercase tracking-wider text-white/70">
        Staff Input (Speech)
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleMic}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            isListening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-white/20 text-white hover:bg-white/30"
          }`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          <svg
            className="h-5 w-5"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
          </svg>
        </button>

        <div className="min-h-[2.5rem] flex-1 rounded-md bg-black/30 px-3 py-2 text-sm text-white">
          {transcript || (
            <span className="text-white/40">
              {isListening ? "Listening..." : "Tap mic to speak"}
            </span>
          )}
        </div>

        <button
          onClick={onSend}
          disabled={!transcript.trim()}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
