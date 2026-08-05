"use client";

import { CheckboxGroupField, RadioField } from "@/components/fields";
import { EEO_RACIAL_ETHNIC, EEO_SEX, EEO_VETERAN } from "@/lib/schema";

/**
 * Voluntary demographic survey.
 *
 * Legally sensitive and entirely optional. Nothing here is required, nothing
 * here can block submission, and it sits after the certification step so it
 * plays no part in the application itself. Answers are stored separately from
 * the application in the admin portal and are not visible to anyone making a
 * hiring decision — see `ApplicantDemographics` in the portal schema.
 *
 * REWRITTEN 2026-08-05, replacing the verbatim page-5 transcription of the
 * printed form. The old version used "handicapped individual", treated
 * Hispanic as a race, and omitted Native Hawaiian/Pacific Islander and
 * multiracial identities.
 *
 * Two deliberate omissions, both explained in EEO-SURVEY-REVIEW.md:
 *
 *   - No disability question. Section 503 requires OFCCP Form CC-305,
 *     verbatim and unmodifiable, and applies only to federal contractors.
 *     SLI's contractor status is unconfirmed; asking about disability
 *     pre-offer without an obligation carries risk and no benefit.
 *   - The veteran question is plain language, not the VEVRAA protected
 *     veteran categories, for the same reason.
 *
 * If SLI is confirmed to be a covered federal contractor, both of those
 * decisions must be revisited before this form is used.
 */
export function StepVoluntary() {
  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-brand-green/30 bg-brand-green-tint/60 p-4">
        <p className="text-sm font-semibold text-brand-green-deep">
          All answers are voluntary.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          You are invited to provide this information, which will be kept
          confidential. Choosing not to answer{" "}
          <strong className="font-semibold">will not</strong> affect your
          consideration for employment in any way. It is kept separate from
          your application, is not shared with the people deciding who to
          hire, and is used only to report on the makeup of our applicants as
          a group.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You may leave this page completely blank and submit.
        </p>
      </div>

      <CheckboxGroupField
        name="eeoRacialEthnic"
        label="Race and ethnicity"
        hint="Select all that apply, or leave blank."
        options={EEO_RACIAL_ETHNIC}
        columns={1}
      />

      <RadioField name="eeoSex" label="Sex" options={EEO_SEX} />

      <RadioField
        name="eeoVeteran"
        label="Veteran status"
        options={EEO_VETERAN}
      />
    </div>
  );
}
