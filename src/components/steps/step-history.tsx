"use client";

import { useFormContext } from "react-hook-form";
import { TextField, YesNoField } from "@/components/fields";
import type { ApplicationValues } from "@/lib/schema";

export function StepHistory() {
  const { watch } = useFormContext<ApplicationValues>();
  const workedHere = watch("previouslyEmployedByCompany") === "yes";
  const isRelated = watch("relatedToCompanyEmployee") === "yes";

  return (
    <div className="grid gap-5">
      <YesNoField
        name="previouslyEmployedByCompany"
        label="Have you ever worked for Schmidbauer Lumber before?"
      />

      {workedHere && (
        <div className="grid gap-4 rounded-lg border border-brand-green/30 bg-brand-green-tint/60 p-4 sm:grid-cols-2">
          <TextField
            name="datesPreviouslyEmployed"
            label="When did you work here?"
            required
            placeholder="e.g. 2019 – 2021"
          />
          <TextField
            name="positionsPreviouslyHeld"
            label="What position did you hold?"
            required
          />
        </div>
      )}

      <YesNoField
        name="relatedToCompanyEmployee"
        label="Are you related to anyone who works at Schmidbauer Lumber?"
        hint="This doesn't affect your application — we ask for transparency only."
      />

      {isRelated && (
        <div className="rounded-lg border border-brand-green/30 bg-brand-green-tint/60 p-4">
          <TextField
            name="relatedTo"
            label="Who are you related to, and how?"
            required
            placeholder="e.g. Jane Doe, my aunt"
          />
        </div>
      )}
    </div>
  );
}
