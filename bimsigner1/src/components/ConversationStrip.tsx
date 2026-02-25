"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Message } from "@/types";

interface Props {
  messages: Message[];
}

export default function ConversationStrip({ messages }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="border-t border-border bg-card shadow-sm">
      {/* Toggle header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/50 transition"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        Conversation ({messages.length})
        {isExpanded ? (
          <ChevronDown className="ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronUp className="ml-auto h-3.5 w-3.5" />
        )}
      </button>

      {/* Messages - compact when collapsed, full when expanded */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-48" : "max-h-10"
        )}
      >
        <div
          ref={scrollRef}
          className={cn(
            "px-4 pb-2",
            isExpanded
              ? "flex flex-col gap-1 overflow-y-auto max-h-44"
              : "flex items-center gap-2 overflow-x-auto"
          )}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "shrink-0 rounded-md px-2.5 py-1 text-xs",
                msg.sender === "deaf"
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-primary/10 text-primary"
              )}
            >
              <span className="font-medium">
                {msg.sender === "deaf" ? "You" : "Staff"}:
              </span>{" "}
              {msg.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
