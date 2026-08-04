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
      "secondaryPhone",
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
  {
    id: "voluntary",
    label: "Voluntary Survey",
    shortLabel: "Survey",
    description: "Optional. Not part of the hiring decision.",
    fields: [],
    optional: true,
  },
];

export const TOTAL_STEPS = STEPS.length;

export function stepIndexById(id: StepId): number {
  return STEPS.findIndex((s) => s.id === id);
}
