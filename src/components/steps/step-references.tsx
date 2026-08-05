"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { PhoneField, TextField } from "@/components/fields";
import { EntryCard } from "@/components/wizard/entry-card";
import type { ApplicationValues } from "@/lib/schema";

/**
 * The paper form asks for exactly three, so these are fixed slots — no add or
 * remove controls. Only the first is required; the other two may be left
 * blank. Starting one commits you to finishing it, which the schema enforces
 * (see `referencesSchema`), because a name without a phone number is no use
 * to whoever makes the calls.
 */
export function StepReferences() {
  const { control } = useFormContext<ApplicationValues>();
  const { fields } = useFieldArray({ control, name: "references" });

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Business or job-related references are preferable. Please don&apos;t
        list relatives. Only the first is required.
      </p>

      {fields.map((field, index) => {
        const isRequired = index === 0;

        return (
          <EntryCard
            key={field.id}
            title={
              isRequired
                ? "Reference 1"
                : `Reference ${index + 1} (optional)`
            }
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name={`references.${index}.name`}
                label="Name"
                required={isRequired}
              />
              <TextField
                name={`references.${index}.occupation`}
                label="Occupation"
                required={isRequired}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                name={`references.${index}.address`}
                label="Address"
                required={isRequired}
                placeholder="City and state is enough"
              />
              <PhoneField
                name={`references.${index}.telephone`}
                label="Telephone"
                required={isRequired}
              />
            </div>
          </EntryCard>
        );
      })}
    </div>
  );
}
