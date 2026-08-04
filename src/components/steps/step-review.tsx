"use client";

import { useFormContext } from "react-hook-form";
import { Pencil } from "lucide-react";
import { ConsentField } from "@/components/fields";
import { STEPS, stepIndexById, type StepId } from "@/lib/steps";
import type { ApplicationValues } from "@/lib/schema";

/**
 * Certification text transcribed verbatim from page 4 of
 * assets/SLI-Employment-Application.pdf. Do not edit this copy — it is the
 * legal text the applicant agrees to. The original refers to "my signature
 * below"; because this form collects no signature (see FIELD-INVENTORY.md
 * decision I), the checkbox is presented as the electronic equivalent.
 */
const CERTIFICATION_TEXT = `My signature below certifies that all information in this application is correct and complete to the best of my knowledge and belief and that I understand that providing false, inaccurate, incomplete, or misleading information will result in refusal of employment or termination of employment if discovered after date of hire. I acknowledge that the company will verify the accuracy and completeness of the information I have provided and I authorize all entities and individuals identified or discovered during the company's hiring process to provide information regarding my employment, education, character and qualifications. I release all entities and individuals who provide information in accordance with this release from all liability for any damages that may result from furnishing information to the company. I understand that if I am employed, I must conform to the company's rules, policies and procedures. I also understand that my employment is "at will," which means that the company or I may terminate my employment at any time for any reason.`;

interface ReviewProps {
  onEdit: (index: number) => void;
}

function formatMonth(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value || "—";
  const [y, m] = value.split("-");
  return `${m}/${y}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  const empty =
    value === undefined ||
    value === null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0);

  return (
    <div className="grid grid-cols-[minmax(0,11rem)_1fr] gap-x-4 gap-y-0.5 py-1.5 max-sm:grid-cols-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd
        className={
          empty
            ? "text-sm italic text-muted-foreground/70"
            : "text-sm font-medium break-words"
        }
      >
        {empty ? "Not provided" : value}
      </dd>
    </div>
  );
}

function Section({
  id,
  onEdit,
  children,
}: {
  id: StepId;
  onEdit: (index: number) => void;
  children: React.ReactNode;
}) {
  const index = stepIndexById(id);
  const step = STEPS[index];

  return (
    <section className="rounded-lg border border-border bg-card">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-brand-green-tint/60 px-4 py-2.5">
        <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
          {step.label}
        </h3>
        <button
          type="button"
          onClick={() => onEdit(index)}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-brand-green-deep underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-green/45"
        >
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
          <span className="sr-only"> {step.label}</span>
        </button>
      </header>
      <dl className="divide-y divide-border/60 px-4 py-2">{children}</dl>
    </section>
  );
}

/** An entry the applicant added but never filled in shouldn't clutter the review. */
function nonEmpty<T extends object>(entries: T[] | undefined): T[] {
  return (entries ?? []).filter((e) =>
    Object.values(e).some((val) => typeof val === "string" && val.trim() !== ""),
  );
}

export function StepReview({ onEdit }: ReviewProps) {
  const { watch } = useFormContext<ApplicationValues>();
  const v = watch();

  const fullName = [v.firstName, v.middleName, v.lastName]
    .filter(Boolean)
    .join(" ");

  const colleges = nonEmpty(v.colleges);
  const tradeSchools = nonEmpty(v.tradeSchools);
  const licenses = nonEmpty(v.licenses);

  return (
    <div className="grid gap-4">
      <Section id="personal" onEdit={onEdit}>
        <Row label="Name" value={fullName} />
        <Row label="Primary phone" value={v.primaryPhone} />
        <Row label="Other phone" value={v.secondaryPhone} />
        <Row label="Email" value={v.email} />
        <Row
          label="Address"
          value={
            v.mailingAddress
              ? `${v.mailingAddress}, ${v.city}, ${v.state} ${v.zipCode}`
              : ""
          }
        />
      </Section>

      <Section id="position" onEdit={onEdit}>
        <Row label="Position" value={v.applicationPosition} />
        <Row label="Available" value={v.howSoonAvailable} />
        <Row label="Employment type" value={v.employmentTypeSought?.join(", ")} />
        <Row label="Shifts" value={v.shiftsAvailable?.join(", ")} />
        <Row
          label="Weekends"
          value={v.availableWeekends === "yes" ? "Yes" : v.availableWeekends === "no" ? "No" : ""}
        />
        <Row
          label="Legal age to work"
          value={v.ageVerified ? "Confirmed" : ""}
        />
      </Section>

      <Section id="history" onEdit={onEdit}>
        <Row
          label="Worked here before"
          value={
            v.previouslyEmployedByCompany === "yes"
              ? `Yes — ${v.datesPreviouslyEmployed}, ${v.positionsPreviouslyHeld}`
              : v.previouslyEmployedByCompany === "no"
                ? "No"
                : ""
          }
        />
        <Row
          label="Related to an employee"
          value={
            v.relatedToCompanyEmployee === "yes"
              ? `Yes — ${v.relatedTo}`
              : v.relatedToCompanyEmployee === "no"
                ? "No"
                : ""
          }
        />
      </Section>

      <Section id="education" onEdit={onEdit}>
        <Row
          label="High school"
          value={
            v.highschoolName
              ? `${v.highschoolName}${v.highschoolLocation ? `, ${v.highschoolLocation}` : ""}${v.hsGradStatus ? ` — ${v.hsGradStatus}` : ""}`
              : ""
          }
        />
        {colleges.length ? (
          colleges.map((c, i) => (
            <Row
              key={i}
              label={`College ${i + 1}`}
              value={[c.name, c.location, c.dates, c.courseOfStudy, c.credential]
                .filter(Boolean)
                .join(" · ")}
            />
          ))
        ) : (
          <Row label="College" value="" />
        )}
      </Section>

      <Section id="credentials" onEdit={onEdit}>
        {tradeSchools.length ? (
          tradeSchools.map((t, i) => (
            <Row
              key={i}
              label={`Trade school ${i + 1}`}
              value={[t.name, t.location, t.dates, t.courseOfStudy, t.credential]
                .filter(Boolean)
                .join(" · ")}
            />
          ))
        ) : (
          <Row label="Trade school" value="" />
        )}
        {licenses.length ? (
          licenses.map((l, i) => (
            <Row
              key={i}
              label={`License ${i + 1}`}
              value={[l.name, l.issuedBy, l.expirationDate]
                .filter(Boolean)
                .join(" · ")}
            />
          ))
        ) : (
          <Row label="Licenses" value="" />
        )}
      </Section>

      <Section id="skills" onEdit={onEdit}>
        <Row label="Training" value={v.training} />
        <Row label="Special skills" value={v.specialSkills} />
        <Row label="Experience & activities" value={v.experienceAndActivities} />
      </Section>

      <Section id="employment" onEdit={onEdit}>
        {v.employmentHistory?.map((job, i) => (
          <Row
            key={i}
            label={i === 0 ? "Most recent" : `Job ${i + 1}`}
            value={
              job.employer ? (
                <span>
                  {job.jobTitle} at {job.employer}
                  <span className="block font-normal text-muted-foreground">
                    {formatMonth(job.employmentDateFrom)} –{" "}
                    {formatMonth(job.employmentDateTo)} · Left:{" "}
                    {job.reasonForLeaving}
                    {job.mayWeContactEmployer === "no" &&
                      " · Do not contact"}
                  </span>
                </span>
              ) : (
                ""
              )
            }
          />
        ))}
      </Section>

      <Section id="references" onEdit={onEdit}>
        {v.references?.map((r, i) => (
          <Row
            key={i}
            label={`Reference ${i + 1}`}
            value={
              r.name
                ? [r.name, r.occupation, r.telephone, r.address]
                    .filter(Boolean)
                    .join(" · ")
                : ""
            }
          />
        ))}
      </Section>

      <section className="rounded-lg border border-brand-green/40 bg-card">
        <header className="border-b border-brand-green/25 bg-brand-green-tint px-4 py-2.5">
          <h3 className="text-sm font-semibold tracking-tight text-brand-green-deep">
            Certification
          </h3>
        </header>
        <div className="grid gap-4 p-4">
          {/*
            Shown in full, never behind an inner scrollbar. This is the text
            the applicant is legally agreeing to — clipping it would mean
            certifying something they were never shown.
          */}
          <p className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground/90">
            {CERTIFICATION_TEXT}
          </p>
          <ConsentField name="agreeToTerms">
            I have read and agree to the certification above. Checking this box
            is my electronic signature.
          </ConsentField>
        </div>
      </section>
    </div>
  );
}
