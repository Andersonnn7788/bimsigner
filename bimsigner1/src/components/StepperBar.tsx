"use client";

import { Hand, Languages, Volume2, Mic, UserRound, Check } from "lucide-react";
import type { Stage } from "@/lib/stageMachine";
import { cn } from "@/lib/utils";

const STEPS: { stage: Stage; label: string; icon: typeof Hand }[] = [
  { stage: "SIGNING", label: "Sign", icon: Hand },
  { stage: "TRANSLATING", label: "Translate", icon: Languages },
  { stage: "SPEAKING", label: "Speak", icon: Volume2 },
  { stage: "LISTENING", label: "Listen", icon: Mic },
  { stage: "AVATAR", label: "Avatar", icon: UserRound },
];

const STAGE_ORDER: Stage[] = [
  "SIGNING",
  "TRANSLATING",
  "SPEAKING",
  "LISTENING",
  "AVATAR",
];

interface Props {
  currentStage: Stage;
}

export default function StepperBar({ currentStage }: Props) {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-background/50 shrink-0">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        const Icon = isCompleted ? Check : step.icon;

        return (
          <div key={step.stage} className="flex items-center gap-1">
            <div
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-300",
                isCompleted && "bg-emerald-100 text-emerald-700",
                isActive && "bg-primary text-primary-foreground",
                !isCompleted && !isActive && "bg-muted text-muted-foreground"
              )}
            >
              <Icon className="h-3 w-3 shrink-0" />
              {isActive && <span>{step.label}</span>}
            </div>

            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-px w-3 rounded-full",
                  i < currentIndex ? "bg-emerald-400" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
