"use client";

import * as React from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  MonthYearField,
  PhoneField,
  TextAreaField,
  TextField,
  YesNoField,
} from "@/components/fields";
import { emptyEmployment, type ApplicationValues } from "@/lib/schema";

const MAX_JOBS = 3;

/**
 * A single job carries a dozen fields. Stacking three of them would make this
 * the one step that violates the no-heavy-scroll rule, so jobs are paged: the
 * applicant sees one at a time and switches with the tabs above. Validation
 * still covers all of them at once, and a failure pages to the offending job.
 */
export function StepEmployment() {
  const { control, formState } = useFormContext<ApplicationValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "employmentHistory",
  });
  const [active, setActive] = React.useState(0);

  const entryErrors = formState.errors.employmentHistory;

  /*
   * A blocked Next must land the applicant on the job that's actually wrong.
   * This adjusts state during render rather than in an effect — the sanctioned
   * React pattern for "derive from a change" — so it doesn't cascade renders.
   */
  /*
   * Built by walking `fields`, not by mapping `entryErrors`. RHF hands back a
   * SPARSE array — an error on job 2 only arrives as `[<hole>, {...}]` — and
   * Array.map skips holes, so mapping it yields "1" instead of "01" and points
   * the jump at the wrong job.
   */
  const errorKey = Array.isArray(entryErrors)
    ? fields.map((_, i) => (entryErrors[i] ? "1" : "0")).join("")
    : "";
  const [seenErrorKey, setSeenErrorKey] = React.useState(errorKey);
  if (errorKey !== seenErrorKey) {
    setSeenErrorKey(errorKey);
    const firstBad = errorKey.indexOf("1");
    if (firstBad >= 0) setActive(firstBad);
  }

  const index = Math.min(active, Math.max(fields.length - 1, 0));
  const contactBlocked =
    useFormContext<ApplicationValues>().watch(
      `employmentHistory.${index}.mayWeContactEmployer`,
    ) === "no";

  const jobHasError = (i: number) =>
    Array.isArray(entryErrors) && Boolean(entryErrors[i]);

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="tablist"
          aria-label="Jobs"
          className="flex flex-wrap gap-1.5"
        >
          {fields.map((field, i) => (
            <button
              key={field.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              onClick={() => setActive(i)}
              className={cn(
                "h-9 rounded-md border px-3 text-sm font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-green/45",
                i === index
                  ? "border-brand-green bg-brand-green text-white"
                  : "border-input bg-card hover:bg-brand-green-tint",
                jobHasError(i) &&
                  i !== index &&
                  "border-destructive text-destructive",
              )}
            >
              {i === 0 ? "Most recent" : `Job ${i + 1}`}
              {jobHasError(i) && (
                <span className="sr-only"> — has errors</span>
              )}
            </button>
          ))}
        </div>

        {fields.length < MAX_JOBS && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              append({ ...emptyEmployment });
              setActive(fields.length);
            }}
            className="h-9 gap-1.5 border-dashed border-brand-green/45 text-brand-green-deep hover:border-brand-green hover:bg-brand-green-tint"
          >
            <Plus className="size-4" aria-hidden="true" />
            Add a job
          </Button>
        )}
      </div>

      {/*
        `key` is load-bearing, not decoration. These inputs are uncontrolled and
        registered by index-bearing name (`employmentHistory.1.employer`).
        Without a key, paging to another job reuses the same DOM nodes and only
        swaps their `name` — the previous job's typed values stay on screen and
        get written into the newly-named fields, corrupting both entries.
        Keying on the field id remounts them so each job shows its own data.
      */}
      <div
        key={fields[index]?.id ?? index}
        role="tabpanel"
        className="grid gap-5 rounded-lg border border-border bg-card p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {index === 0
              ? "Your most recent job. If you were self-employed, give the company name."
              : `Job ${index + 1} of ${fields.length}.`}
          </p>
          {fields.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                remove(index);
                setActive((prev) => Math.max(0, prev - 1));
              }}
              className="-mt-1 h-8 gap-1 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" aria-hidden="true" />
              Remove
              <span className="sr-only">
                {index === 0 ? "most recent job" : `job ${index + 1}`}
              </span>
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            name={`employmentHistory.${index}.employer`}
            label="Employer"
            required
          />
          <TextField
            name={`employmentHistory.${index}.jobTitle`}
            label="Your job title"
            required
          />
        </div>

        <TextField
          name={`employmentHistory.${index}.employerAddress`}
          label="Employer address"
          required
          placeholder="City and state is enough"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <PhoneField
            name={`employmentHistory.${index}.employerPhone`}
            label="Employer phone"
          />
          <TextField
            name={`employmentHistory.${index}.supervisorName`}
            label="Supervisor's name"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MonthYearField
            name={`employmentHistory.${index}.employmentDateFrom`}
            label="From"
            required
          />
          <MonthYearField
            name={`employmentHistory.${index}.employmentDateTo`}
            label="To"
            required
          />
        </div>

        <TextField
          name={`employmentHistory.${index}.hrsPerWeek`}
          label="Hours per week"
          inputMode="numeric"
          maxLength={3}
          className="sm:max-w-56"
        />

        <TextField
          name={`employmentHistory.${index}.reasonForLeaving`}
          label="Reason for leaving"
          required
        />

        <TextAreaField
          name={`employmentHistory.${index}.dutiesPerformed`}
          label="What did you do there?"
          hint="Jobs you held, duties performed, skills used or learned, any promotions."
          rows={4}
        />

        <YesNoField
          name={`employmentHistory.${index}.mayWeContactEmployer`}
          label="May we contact this employer?"
        />

        {contactBlocked && (
          <div className="rounded-lg border border-brand-green/30 bg-brand-green-tint/60 p-4">
            <TextAreaField
              name={`employmentHistory.${index}.mayWeContactReason`}
              label="Why not?"
              required
              rows={2}
            />
          </div>
        )}
      </div>
    </div>
  );
}
