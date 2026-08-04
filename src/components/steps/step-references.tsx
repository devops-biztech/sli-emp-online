"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { PhoneField, TextField } from "@/components/fields";
import { EntryCard } from "@/components/wizard/entry-card";
import type { ApplicationValues } from "@/lib/schema";

/**
 * The paper form asks for exactly three, so these are fixed slots — no add or
 * remove controls, and all four fields on each are required.
 */
export function StepReferences() {
  const { control } = useFormContext<ApplicationValues>();
  const { fields } = useFieldArray({ control, name: "references" });

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Business or job-related references are preferable. Please don&apos;t
        list relatives.
      </p>

      {fields.map((field, index) => (
        <EntryCard key={field.id} title={`Reference ${index + 1}`}>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name={`references.${index}.name`}
              label="Name"
              required
            />
            <TextField
              name={`references.${index}.occupation`}
              label="Occupation"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              name={`references.${index}.address`}
              label="Address"
              required
              placeholder="City and state is enough"
            />
            <PhoneField
              name={`references.${index}.telephone`}
              label="Telephone"
              required
            />
          </div>
        </EntryCard>
      ))}
    </div>
  );
}
