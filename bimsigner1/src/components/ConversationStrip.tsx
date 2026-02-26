"use client";

import { useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface Props {
  messages: Message[];
}

export default function ConversationStrip({ messages }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex h-36 shrink-0 flex-col border-t border-border bg-background/50">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="panel-title">Conversation</span>
        {messages.length > 0 && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {messages.length} {messages.length === 1 ? "message" : "messages"}
          </span>
        )}
      </div>

      {/* Message list */}
      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-2"
      >
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center mt-4">
            Conversation will appear here
          </p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-lg px-3 py-1.5 text-xs",
                msg.sender === "deaf"
                  ? "self-start bg-secondary text-secondary-foreground"
                  : "self-end bg-primary/10 text-primary"
              )}
            >
              <span className="font-semibold">
                {msg.sender === "deaf" ? "You" : "Staff"}:{" "}
              </span>
              {msg.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
