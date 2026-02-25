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
    <div className="flex items-center justify-center gap-0 px-4 py-3">
      {STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        const Icon = isCompleted ? Check : step.icon;

        return (
          <div key={step.stage} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                  isCompleted &&
                    "border-emerald-500 bg-emerald-500 text-white",
                  isActive &&
                    "border-primary bg-primary text-primary-foreground animate-pulse",
                  !isCompleted &&
                    !isActive &&
                    "border-border bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isCompleted && "text-emerald-600",
                  isActive && "text-primary font-semibold",
                  !isCompleted && !isActive && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 mb-5 h-0.5 w-12 rounded-full transition-all duration-300",
                  i < currentIndex ? "bg-emerald-500" : "bg-border"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
