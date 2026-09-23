"use client";

import { cn } from "@/lib/utils";
import { STEPS, TOTAL_STEPS } from "@/lib/steps";

interface StepperProps {
  current: number;
  /** Highest step reached, so completed steps stay reachable by click. */
  furthest: number;
  onJump: (index: number) => void;
}

export function Stepper({ current, furthest, onJump }: StepperProps) {
  const step = STEPS[current];
  const percent = Math.round(((current + 1) / TOTAL_STEPS) * 100);

  return (
    <nav aria-label="Application progress" className="w-full">
      {/*
        The bar is the whole progress story on mobile and the spine of the
        labeled version on desktop. One element, two densities — so the
        applicant sees the same shape whichever device they're on.
      */}
      <ol className="flex w-full gap-1" role="list">
        {STEPS.map((s, i) => {
          const isComplete = i < current;
          const isCurrent = i === current;
          const isReachable = i <= furthest;

          return (
            <li key={s.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => isReachable && onJump(i)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Step ${i + 1} of ${TOTAL_STEPS}: ${s.label}${
                  isComplete ? " (completed)" : ""
                }`}
                className={cn(
                  "group flex w-full flex-col gap-1.5 rounded-sm pb-0.5 text-left",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-green-deep",
                  isReachable ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors duration-300",
                    isComplete && "bg-brand-gold",
                    isCurrent && "bg-brand-gold",
                    !isComplete && !isCurrent && "bg-white/25",
                    isReachable && !isCurrent && "group-hover:bg-brand-gold/80",
                  )}
                />
                <span
                  className={cn(
                    "hidden truncate text-[11px] font-medium leading-tight lg:block",
                    isCurrent
                      ? "text-white"
                      : isComplete
                        ? "text-white/75"
                        : "text-white/45",
                  )}
                >
                  {s.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <p className="mt-2.5 text-sm text-white/80 lg:hidden">
        <span className="font-semibold text-white">
          Step {current + 1} of {TOTAL_STEPS}
        </span>
        <span className="mx-1.5 text-white/40">·</span>
        {step.label}
      </p>

      {/* Announced on step change; the visual bar above is aria-hidden noise otherwise. */}
      <p className="sr-only" aria-live="polite">
        Step {current + 1} of {TOTAL_STEPS}: {step.label}. {percent}% complete.
      </p>
    </nav>
  );
}
