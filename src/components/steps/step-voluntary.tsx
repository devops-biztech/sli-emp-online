"use client";

import { CheckboxGroupField, RadioField } from "@/components/fields";
import {
  EEO_RACIAL_ETHNIC,
  EEO_SELF_IDENTIFICATION,
} from "@/lib/schema";

/**
 * Affirmative Action Survey — page 5 of the source PDF.
 *
 * Legally sensitive and entirely voluntary. Nothing on this step is required,
 * nothing here can block submission, and it deliberately sits after the
 * certification step so it plays no part in the application itself.
 *
 * The categories and wording below are transcribed verbatim from the printed
 * form. They are 1970s-era and do not match current EEO-1 categories — see
 * FIELD-INVENTORY.md. Do not "modernize" them without HR compliance sign-off.
 */
export function StepVoluntary() {
  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-brand-green/30 bg-brand-green-tint/60 p-4">
        <p className="text-sm font-semibold text-brand-green-deep">
          All answers are voluntary.
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
          You are invited to volunteer this information, which will be treated
          as confidential. Failure to provide it{" "}
          <strong className="font-semibold">will not</strong> jeopardize or
          adversely affect your consideration for employment. Government
          agencies require periodic reports on the ethnicity, handicap and
          veteran status of employees. This data is for analysis and affirmative
          action only.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          You may leave this page completely blank and submit.
        </p>
      </div>

      <RadioField
        name="eeoRacialEthnic"
        label="Racial or ethnic identity"
        hint="I belong to the following ethnic and/or racial group. Choose one."
        options={EEO_RACIAL_ETHNIC}
      />

      <RadioField
        name="eeoVeteran"
        label="Are you a veteran?"
        options={["Yes", "No"]}
      />

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-sm font-semibold text-foreground">
          Special employment notice
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          Government contractors are subject to 38 U.S.C. 4212 of the Vietnam
          Era Veterans Readjustment Act of 1974 as amended, which requires that
          they take affirmative action to employ and advance in employment
          qualified disabled veterans of the Vietnam Era. And Section 503 of the
          Rehabilitation Act of 1973, as amended, which requires government
          contractors to take affirmative action to employ and advance in
          employment qualified handicapped individuals.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          If you are a disabled veteran or have a physical or mental handicap,
          you are invited to volunteer this information, which will be treated
          as confidential. Failure to provide this information will not
          jeopardize or adversely affect your consideration for employment.
        </p>
      </div>

      <CheckboxGroupField
        name="eeoSelfIdentification"
        label="If you wish to be identified, choose any that apply"
        options={EEO_SELF_IDENTIFICATION}
        columns={1}
      />
    </div>
  );
}
