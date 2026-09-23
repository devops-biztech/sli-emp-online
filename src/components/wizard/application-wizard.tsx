"use client";

import * as React from "react";
import Image from "next/image";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/wizard/stepper";
import { STEPS, TOTAL_STEPS } from "@/lib/steps";
import {
  applicationSchema,
  defaultValues,
  type ApplicationValues,
} from "@/lib/schema";
import type { OpenPosition } from "@/lib/positions";

import { StepPersonal } from "@/components/steps/step-personal";
import { StepPosition } from "@/components/steps/step-position";
import { StepHistory } from "@/components/steps/step-history";
import { StepEducation } from "@/components/steps/step-education";
import { StepCredentials } from "@/components/steps/step-credentials";
import { StepSkills } from "@/components/steps/step-skills";
import { StepEmployment } from "@/components/steps/step-employment";
import { StepReferences } from "@/components/steps/step-references";
import { StepReview } from "@/components/steps/step-review";
import { StepVoluntary } from "@/components/steps/step-voluntary";

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; id: string };

/**
 * How long the fake submission spins. Long enough to read as a real network
 * round trip, short enough not to drag during a walkthrough.
 */
const DEMO_SUBMIT_DELAY_MS = 1400;

/** Shaped like the production confirmation number (a UUID), made up locally. */
function demoConfirmationId() {
  return crypto.randomUUID();
}

interface ApplicationWizardProps {
  /**
   * Preselection for the position dropdown, from the `?position=` link
   * parameter. Already resolved against `OPEN_POSITIONS` in `page.tsx`, so
   * it is either an open role or absent — an unrecognized link value arrives
   * here as `undefined` and the form falls back to the entry-level default.
   */
  initialPosition?: OpenPosition;
}

export function ApplicationWizard({ initialPosition }: ApplicationWizardProps) {
  const [current, setCurrent] = React.useState(0);
  const [furthest, setFurthest] = React.useState(0);
  const [submitState, setSubmitState] = React.useState<SubmitState>({
    status: "idle",
  });
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const form = useForm<ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: initialPosition
      ? { ...defaultValues, applicationPosition: initialPosition }
      : defaultValues,
    mode: "onTouched",
    shouldFocusError: false,
  });

  const step = STEPS[current];
  const isLast = current === TOTAL_STEPS - 1;
  const isReview = step.id === "review";

  const goTo = React.useCallback((index: number) => {
    setCurrent(index);
    setFurthest((f) => Math.max(f, index));
    window.scrollTo({ top: 0, behavior: "smooth" });
    // Focus the new step's heading so screen readers land in the right place.
    requestAnimationFrame(() => headingRef.current?.focus());
  }, []);

  /*
   * DEMO: Next never blocks. The production wizard validates the step's
   * fields here and refuses to advance; the demo lets a presenter click
   * straight through an empty form. Fields still show their validation
   * messages on blur, so the checks remain visible to anyone filling it in.
   */
  const handleNext = () => goTo(Math.min(current + 1, TOTAL_STEPS - 1));

  const handleBack = () => goTo(Math.max(current - 1, 0));

  /*
   * DEMO: nothing is assembled, encrypted, or sent. The spinner runs for a
   * moment so the hand-off feels like the real thing, then the confirmation
   * screen shows a made-up number. The entered values never leave this tab.
   */
  const runSubmit = () => {
    if (submitState.status === "submitting") return;
    setSubmitState({ status: "submitting" });
    window.setTimeout(() => {
      setSubmitState({ status: "success", id: demoConfirmationId() });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, DEMO_SUBMIT_DELAY_MS);
  };

  /** Clears any partial survey answers, then submits. */
  const skipSurveyAndSubmit = () => {
    form.setValue("eeoRacialEthnic", []);
    form.setValue("eeoSex", "");
    form.setValue("eeoVeteran", "");
    runSubmit();
  };

  if (submitState.status === "success") {
    return (
      <SubmissionConfirmation
        id={submitState.id}
        onRestart={() => {
          form.reset();
          setCurrent(0);
          setFurthest(0);
          setSubmitState({ status: "idle" });
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  return (
    <FormProvider {...form}>
      <div className="flex min-h-dvh flex-col bg-background">
        <DemoNotice />
        <header className="bg-brand-green-deep">
          <div className="mx-auto w-full max-w-3xl px-4 pb-4 pt-5 sm:px-6">
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/biztech-logo-reversed.png"
                alt="Biztech"
                width={547}
                height={185}
                priority
                className="h-9 w-auto shrink-0 sm:h-11"
              />
              <span className="ml-auto min-w-0 text-right text-xs font-medium uppercase tracking-widest text-white/60">
                Employment Application
                {initialPosition && ` - ${initialPosition}`}
              </span>
            </div>
            <Stepper current={current} furthest={furthest} onJump={goTo} />
          </div>
        </header>

        <main
          id="main"
          className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8"
        >
          <form
            onSubmit={(e) => {
              // Enter advances the wizard rather than submitting from step 1.
              // Only the final step's Enter actually submits.
              e.preventDefault();
              if (isLast) runSubmit();
              else void handleNext();
            }}
            noValidate
          >
            <div className="mb-5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1
                  ref={headingRef}
                  tabIndex={-1}
                  className="text-2xl font-semibold tracking-tight outline-none sm:text-3xl"
                >
                  {step.label}
                </h1>
                {step.optional && (
                  <span className="rounded-full bg-brand-green-tint px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-brand-green-deep">
                    Optional
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-muted-foreground">{step.description}</p>
            </div>

            <div key={step.id} className="animate-in-step">
              {step.id === "personal" && <StepPersonal />}
              {step.id === "position" && <StepPosition />}
              {step.id === "history" && <StepHistory />}
              {step.id === "education" && <StepEducation />}
              {step.id === "credentials" && <StepCredentials />}
              {step.id === "skills" && <StepSkills />}
              {step.id === "employment" && <StepEmployment />}
              {step.id === "references" && <StepReferences />}
              {step.id === "review" && <StepReview onEdit={goTo} />}
              {/* Dormant: "voluntary" is no longer in STEPS. */}
              {step.id === "voluntary" && <StepVoluntary />}
            </div>

            <div
              className={cn(
                "sticky bottom-0 z-10 -mx-4 mt-8 border-t border-border bg-background/95 px-4 py-3 backdrop-blur",
                "sm:-mx-6 sm:px-6",
              )}
            >
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={current === 0 || submitState.status === "submitting"}
                  className="h-11 gap-1.5"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </Button>

                <span className="hidden text-sm text-muted-foreground sm:block">
                  Step {current + 1} of {TOTAL_STEPS}
                </span>

                <div className="ml-auto flex items-center gap-2">
                  {/*
                    Gated on `optional`, not on `isLast`: the only optional
                    step was the voluntary survey, which is retired, so this
                    renders for nobody today and comes back correctly if the
                    step is ever restored. See `VOLUNTARY_STEP` in steps.ts.
                  */}
                  {step.optional && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={skipSurveyAndSubmit}
                      disabled={submitState.status === "submitting"}
                      className="h-11 text-muted-foreground"
                    >
                      Skip &amp; submit
                    </Button>
                  )}

                  {isLast ? (
                    /*
                     * `key` matters: without it React reuses this DOM node
                     * across steps, and a node that flips to type="submit"
                     * mid-click submits the form instead of advancing.
                     * Both branches are type="button" for the same reason —
                     * submission goes through onClick, never a default action.
                     */
                    <Button
                      key="submit"
                      type="button"
                      onClick={runSubmit}
                      disabled={submitState.status === "submitting"}
                      className="h-11 gap-1.5 bg-brand-blue font-semibold text-white hover:bg-brand-blue/90"
                    >
                      {submitState.status === "submitting" ? (
                        <>
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Send className="size-4" aria-hidden="true" />
                          Submit application
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      key="next"
                      type="button"
                      onClick={handleNext}
                      className="h-11 gap-1.5 bg-brand-blue font-semibold text-white hover:bg-brand-blue/90"
                    >
                      {isReview ? "Continue" : "Next"}
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </form>
        </main>

        <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
          Biztech · Online Employment Application
          <br />
          An Equal Opportunity Employer
        </footer>
      </div>
    </FormProvider>
  );
}

/**
 * Says plainly, on every screen, that this is a demo — so nobody walking
 * through it mistakes the confirmation screen for a real application.
 */
function DemoNotice() {
  return (
    <div className="bg-brand-blue px-4 py-1.5 text-center text-xs font-medium text-white sm:px-6">
      Demo &mdash; nothing you enter here is submitted or saved.
    </div>
  );
}

function SubmissionConfirmation({
  id,
  onRestart,
}: {
  id: string;
  onRestart: () => void;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <DemoNotice />
      <header className="bg-brand-green-deep">
        <div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-6">
          <Image
            src="/biztech-logo-reversed.png"
            alt="Biztech"
            width={547}
            height={185}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-16 sm:px-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-brand-green-tint">
          <Check
            className="size-7 text-brand-green-deep"
            aria-hidden="true"
            strokeWidth={2.5}
          />
        </div>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight">
          Application received
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground">
          Thank you for applying to Biztech. Your application has been
          submitted and is now with our hiring team.
        </p>
        {id && (
          <p className="mt-5 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <span className="text-muted-foreground">Confirmation number</span>
            <br />
            <span className="font-mono font-medium">{id}</span>
          </p>
        )}
        <div className="mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onRestart}
            className="h-11 gap-1.5"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Start the demo over
          </Button>
        </div>
      </main>

      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground sm:px-6">
        Biztech · An Equal Opportunity Employer
      </footer>
    </div>
  );
}
