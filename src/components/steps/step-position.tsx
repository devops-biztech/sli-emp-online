"use client";

import {
  CheckboxGroupField,
  ConsentField,
  TextField,
  YesNoField,
} from "@/components/fields";
import { EMPLOYMENT_TYPES, SHIFTS } from "@/lib/schema";

export function StepPosition() {
  return (
    <div className="grid gap-5">
      <TextField
        name="applicationPosition"
        label="Position you're applying for"
        required
        placeholder="e.g. Lumber grader, Forklift operator"
      />

      <TextField
        name="howSoonAvailable"
        label="How soon are you available for employment?"
        required
        placeholder="e.g. Immediately, or 2 weeks"
        hint="A date or a general answer — whichever fits."
      />

      <CheckboxGroupField
        name="employmentTypeSought"
        label="What kind of employment are you seeking?"
        hint="Choose all that apply."
        required
        options={EMPLOYMENT_TYPES}
      />

      <CheckboxGroupField
        name="shiftsAvailable"
        label="Which shifts can you work?"
        hint="Choose all that apply."
        required
        options={SHIFTS}
      />

      <YesNoField
        name="availableWeekends"
        label="Are you available to work weekends?"
      />

      <ConsentField name="ageVerified">
        I confirm that I am of legal age to work.
      </ConsentField>
    </div>
  );
}
