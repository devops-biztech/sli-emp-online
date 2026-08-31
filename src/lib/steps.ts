/**
 * Step definitions. Single source for the stepper labels, the review-step
 * section order, and — critically — which fields each step validates.
 *
 * `fields` is what gets passed to react-hook-form's `trigger()` when the
 * applicant presses Next. If a field isn't listed on some step, it can never
 * block advancement, which is exactly how a required field goes missing. Keep
 * this in sync with FIELD-INVENTORY.md.
 */
import type { FieldPath } from "react-hook-form";
import type { ApplicationValues } from "./schema";

/**
 * Every step this app knows how to render. `STEPS` is the subset currently in
 * the flow — "voluntary" is declared here but retired, see `VOLUNTARY_STEP`.
 */
export type StepId =
  | "personal"
  | "position"
  | "history"
  | "education"
  | "credentials"
  | "skills"
  | "employment"
  | "references"
  | "review"
  | "voluntary";

export interface StepDefinition {
  id: StepId;
  /** Full label — stepper on desktop, section heading on the review step. */
  label: string;
  /** Terse label for the mobile stepper. */
  shortLabel: string;
  /** One line of orientation under the step heading. */
  description: string;
  fields: FieldPath<ApplicationValues>[];
  /** Voluntary steps never block submission and show a Skip control. */
  optional?: boolean;
}

export const STEPS: StepDefinition[] = [
  {
    id: "personal",
    label: "Your Information",
    shortLabel: "You",
    description: "How we reach you about this application.",
    fields: [
      "firstName",
      "lastName",
      "middleName",
      "primaryPhone",
      // `secondaryPhone` is intentionally absent: no input renders for it, so
      // there is nothing to validate or focus. It still ships in the record.
      "email",
      "mailingAddress",
      "city",
      "state",
      "zipCode",
    ],
  },
  {
    id: "position",
    label: "Position & Availability",
    shortLabel: "Position",
    description: "What you're applying for and when you can start.",
    fields: [
      "applicationPosition",
      "howSoonAvailable",
      "employmentTypeSought",
      "shiftsAvailable",
      "availableWeekends",
      "ageVerified",
    ],
  },
  {
    id: "history",
    label: "Schmidbauer History",
    shortLabel: "History",
    description: "Any prior connection to the company.",
    fields: [
      "previouslyEmployedByCompany",
      "datesPreviouslyEmployed",
      "positionsPreviouslyHeld",
      "relatedToCompanyEmployee",
      "relatedTo",
    ],
  },
  {
    id: "education",
    label: "Education",
    shortLabel: "School",
    description: "High school and college. All optional.",
    fields: ["highschoolName", "highschoolLocation", "hsGradStatus", "colleges"],
  },
  {
    id: "credentials",
    label: "Trade Schools & Licenses",
    shortLabel: "Trade",
    description: "Vocational training and current licenses. All optional.",
    fields: ["tradeSchools", "licenses"],
  },
  {
    id: "skills",
    label: "Skills & Experience",
    shortLabel: "Skills",
    description: "Tell us what you can do. All optional.",
    fields: ["training", "specialSkills", "experienceAndActivities"],
  },
  {
    id: "employment",
    label: "Work Experience",
    shortLabel: "Work",
    description: "Start with your most recent job.",
    fields: ["employmentHistory"],
  },
  {
    id: "references",
    label: "References",
    shortLabel: "Refs",
    description: "Three people who can speak to your work.",
    fields: ["references"],
  },
  {
    id: "review",
    label: "Review & Certify",
    shortLabel: "Review",
    description: "Check everything, then certify and submit.",
    fields: ["agreeToTerms"],
  },
];

/**
 * The voluntary EEO survey step — RETIRED FROM THE FLOW 2026-08-31.
 *
 * SLI is not a federal contractor and, unlike TRL, has no reporting
 * obligation that applicant demographics feed; it collects that data from
 * people it has hired instead. So the step was taken out of `STEPS` rather
 * than deleted, along with the three `eeo*` keys in `toFlatRecord()` — the
 * portal treats the *presence* of those keys as "this applicant was asked",
 * so emitting them blank would log a declined survey that was never shown.
 *
 * Kept here, unreferenced, so restoring it is an edit and not an
 * archaeology exercise. The full checklist is in
 * `src/components/steps/step-voluntary.tsx`.
 */
export const VOLUNTARY_STEP: StepDefinition = {
  id: "voluntary",
  label: "Voluntary Survey",
  shortLabel: "Survey",
  description: "Optional. Not part of the hiring decision.",
  fields: [],
  optional: true,
};

export const TOTAL_STEPS = STEPS.length;

export function stepIndexById(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}
