"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { SelectField, TextField } from "@/components/fields";
import {
  AddEntryButton,
  EmptyEntries,
  EntryCard,
} from "@/components/wizard/entry-card";
import { emptySchool, HS_GRAD_STATUS, type ApplicationValues } from "@/lib/schema";

const gradOptions = HS_GRAD_STATUS.map((s) => ({ value: s, label: s }));

export function StepEducation() {
  const { control } = useFormContext<ApplicationValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "colleges",
  });

  return (
    <div className="grid gap-6">
      <fieldset className="grid gap-4">
        <legend className="mb-1 text-sm font-semibold tracking-tight text-brand-green-deep">
          High school
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField name="highschoolName" label="School name" />
          <TextField
            name="highschoolLocation"
            label="City and state"
            placeholder="Eureka, CA"
          />
        </div>
        <SelectField
          name="hsGradStatus"
          label="Did you graduate?"
          options={gradOptions}
          className="sm:max-w-xs"
        />
      </fieldset>

      <div className="grid gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
          College or university
        </h3>

        {fields.length === 0 ? (
          <EmptyEntries>
            No college listed. Add one if it applies to you.
          </EmptyEntries>
        ) : (
          <div className="grid gap-3">
            {fields.map((field, index) => (
              <EntryCard
                key={field.id}
                title={`College ${index + 1}`}
                removeLabel={`college ${index + 1}`}
                onRemove={() => remove(index)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name={`colleges.${index}.name`}
                    label="School name"
                  />
                  <TextField
                    name={`colleges.${index}.location`}
                    label="City and state"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    name={`colleges.${index}.dates`}
                    label="Dates attended"
                    placeholder="2018 – 2022"
                  />
                  <TextField
                    name={`colleges.${index}.courseOfStudy`}
                    label="Course of study"
                  />
                  <TextField
                    name={`colleges.${index}.credential`}
                    label="Degree earned"
                  />
                </div>
              </EntryCard>
            ))}
          </div>
        )}

        <AddEntryButton
          onClick={() => append({ ...emptySchool })}
          disabled={fields.length >= 3}
          atLimitLabel="You've added the maximum of three colleges."
        >
          Add a college
        </AddEntryButton>
      </div>
    </div>
  );
}
