"use client";

import {
  CheckboxGroupField,
  ConsentField,
  SelectField,
  TextField,
  YesNoField,
} from "@/components/fields";
import { POSITION_OPTIONS } from "@/lib/positions";
import { EMPLOYMENT_TYPES, SHIFTS } from "@/lib/schema";

export function StepPosition() {
  return (
    <div className="grid gap-5">
      {/*
        A dropdown, not a text box: applicants were applying for roles that
        weren't open, which costs them a long form and costs SLI a letter
        back. The list is `OPEN_POSITIONS` — see `src/lib/positions.ts` for
        how to open or close a role.
      */}
      <SelectField
        name="applicationPosition"
        label="Position you're applying for"
        required
        hidePlaceholder
        hint="These are the roles we're hiring for right now."
        options={POSITION_OPTIONS}
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
