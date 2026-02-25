"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/types";
import StaffInput from "./StaffInput";
import AvatarPlayer from "./AvatarPlayer";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  messages: Message[];
  avatarSigns: string[];
  transcript: string;
  isListening: boolean;
  onToggleMic: () => void;
  onSendStaffMessage: () => void;
  onAvatarDone: () => void;
}

export default function ConversationPanel({
  messages,
  avatarSigns,
  transcript,
  isListening,
  onToggleMic,
  onSendStaffMessage,
  onAvatarDone,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  return (
    <div className="flex min-h-0 h-full flex-col gap-3">
      {/* Avatar player */}
      <AvatarPlayer signs={avatarSigns} onDone={onAvatarDone} />

      {/* Message list */}
      <ScrollArea className="min-h-0 flex-1 rounded-lg border border-border bg-card shadow-sm">
        <div className="p-3" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Conversation will appear here
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "deaf" ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg border px-3 py-2 text-sm text-foreground ${
                      msg.sender === "deaf"
                        ? "border-border bg-secondary"
                        : "border-blue-100 bg-blue-50"
                    }`}
                  >
                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {msg.sender === "deaf" ? "Deaf User" : "Staff"}
                    </div>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Staff input */}
      <StaffInput
        transcript={transcript}
        isListening={isListening}
        onToggleMic={onToggleMic}
        onSend={onSendStaffMessage}
      />
    </div>
  );
}
