"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { TextField } from "@/components/fields";
import {
  AddEntryButton,
  EmptyEntries,
  EntryCard,
} from "@/components/wizard/entry-card";
import {
  emptyLicense,
  emptySchool,
  type ApplicationValues,
} from "@/lib/schema";

export function StepCredentials() {
  const { control } = useFormContext<ApplicationValues>();

  const trade = useFieldArray({ control, name: "tradeSchools" });
  const licenses = useFieldArray({ control, name: "licenses" });

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
          Trade or vocational school
        </h3>

        {trade.fields.length === 0 ? (
          <EmptyEntries>
            No trade school listed. Add one if it applies to you.
          </EmptyEntries>
        ) : (
          <div className="grid gap-3">
            {trade.fields.map((field, index) => (
              <EntryCard
                key={field.id}
                title={`Trade school ${index + 1}`}
                removeLabel={`trade school ${index + 1}`}
                onRemove={() => trade.remove(index)}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField
                    name={`tradeSchools.${index}.name`}
                    label="School name"
                  />
                  <TextField
                    name={`tradeSchools.${index}.location`}
                    label="City and state"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    name={`tradeSchools.${index}.dates`}
                    label="Dates attended"
                    placeholder="2018 – 2019"
                  />
                  <TextField
                    name={`tradeSchools.${index}.courseOfStudy`}
                    label="Course of study"
                  />
                  <TextField
                    name={`tradeSchools.${index}.credential`}
                    label="Certificate earned"
                  />
                </div>
              </EntryCard>
            ))}
          </div>
        )}

        <AddEntryButton
          onClick={() => trade.append({ ...emptySchool })}
          disabled={trade.fields.length >= 3}
          atLimitLabel="You've added the maximum of three trade schools."
        >
          Add a trade school
        </AddEntryButton>
      </div>

      <div className="grid gap-3">
        <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
          Licenses and certifications
        </h3>

        {licenses.fields.length === 0 ? (
          <EmptyEntries>
            No licenses listed. Add any that are current — CDL, forklift,
            first aid, and so on.
          </EmptyEntries>
        ) : (
          <div className="grid gap-3">
            {licenses.fields.map((field, index) => (
              <EntryCard
                key={field.id}
                title={`License ${index + 1}`}
                removeLabel={`license ${index + 1}`}
                onRemove={() => licenses.remove(index)}
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField
                    name={`licenses.${index}.name`}
                    label="License or certification"
                    placeholder="e.g. Class A CDL"
                  />
                  <TextField
                    name={`licenses.${index}.issuedBy`}
                    label="Issued by"
                  />
                  <TextField
                    name={`licenses.${index}.expirationDate`}
                    label="Expires"
                    type="date"
                  />
                </div>
              </EntryCard>
            ))}
          </div>
        )}

        <AddEntryButton
          onClick={() => licenses.append({ ...emptyLicense })}
          disabled={licenses.fields.length >= 3}
          atLimitLabel="You've added the maximum of three licenses."
        >
          Add a license
        </AddEntryButton>
      </div>
    </div>
  );
}
