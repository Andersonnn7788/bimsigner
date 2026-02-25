"use client";

import { useRef, useEffect } from "react";
import type { Message } from "@/types";
import StaffInput from "./StaffInput";
import AvatarPlayer from "./AvatarPlayer";

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
    <div className="flex h-full flex-col gap-3">
      {/* Avatar player */}
      <AvatarPlayer signs={avatarSigns} onDone={onAvatarDone} />

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto rounded-lg bg-white/5 p-3"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
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
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender === "deaf"
                      ? "bg-emerald-500/80 text-white"
                      : "bg-blue-500/80 text-white"
                  }`}
                >
                  <div className="mb-0.5 text-[10px] font-medium uppercase opacity-70">
                    {msg.sender === "deaf" ? "Deaf User" : "Staff"}
                  </div>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
