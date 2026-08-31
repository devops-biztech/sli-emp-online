/**
 * Adapter between the wizard's nested form state and the flat record shape the
 * Schmidbauer admin portal already reads.
 *
 * This is the ONLY module that knows the portal's field names. If the portal's
 * schema moves, it moves here and nowhere else. Everything upstream works in
 * clean nested arrays; everything downstream sees ciphertext.
 *
 * Field-by-field derivation is documented in FIELD-INVENTORY.md.
 */
import type {
  ApplicationValues,
  EmploymentEntry,
  LicenseEntry,
  ReferenceEntry,
  SchoolEntry,
} from "./schema";
import { SHIFTS } from "./schema";

/**
 * The flat, serializable record. Every value is a primitive — this object is
 * what gets JSON-stringified, encrypted, and stored.
 */
export interface ApplicationRecord {
  /* System */
  id: string;
  package: string | null;
  companyName: "SLI";
  date: string;
  documentLink: string | null;
  envelopeId: string | null;
  receivedByCompany: boolean;
  dismissApplicant: boolean;

  /* Applicant */
  applicationPosition: string;
  lastName: string;
  firstName: string;
  middleName: string;
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  mailingAddress: string;
  city: string;
  state: string;
  zipCode: string;

  /* Availability */
  availableForAnyShift: boolean;
  availableWeekends: boolean;
  ageVerified: boolean;

  /* SLI-specific availability detail (no sister-app equivalent) */
  employmentTypeSought: string;
  shiftsAvailable: string;
  howSoonAvailable: string;

  /* Company history */
  previouslyEmployedByCompany: boolean;
  datesPreviouslyEmployed: string;
  positionsPreviouslyHeld: string;
  relatedToCompanyEmployee: boolean;
  relatedTo: string;

  /* Education */
  highschoolName: string;
  highschoolLocation: string;
  hsGradStatus: string;

  /* Narrative (no sister-app equivalent) */
  training: string;
  specialSkills: string;
  experienceAndActivities: string;

  /* Certification */
  agreeToTerms: boolean;

  /*
   * No `eeoRacialEthnic` / `eeoSex` / `eeoVeteran` — the voluntary survey was
   * retired for SLI on 2026-08-31 and these keys are deliberately absent, not
   * blank. The portal's `mapDemographics()` tests for the *presence* of these
   * keys to decide whether the applicant was asked at all: sending them empty
   * would write an `ApplicantDemographics` row recording a declined survey
   * that was never shown, and would dilute TRL's response-rate reporting.
   * Omitting them writes no row. See `sync-applications.ts` in the portal.
   */

  /* Indexed groups are declared via the index signature below. */
  [key: string]: string | boolean | null;
}

const ORDINALS = ["One", "Two", "Three"] as const;

/** "2019-03" -> "03/2019". Empty in, empty out. */
function formatMonth(value: string): string {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const [year, month] = value.split("-");
  return `${month}/${year}`;
}

/** The portal stores employment dates as one human-readable string. */
function formatDateRange(from: string, to: string): string {
  const a = formatMonth(from);
  const b = formatMonth(to);
  if (!a && !b) return "";
  return `${a} – ${b}`;
}

/** Strips punctuation so the portal always receives 10 bare digits. */
function normalizePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 10 ? digits : value.trim();
}

function schoolFields(
  prefix: "college" | "tradeSchool",
  credentialKey: "Degree" | "Certificate",
  entries: SchoolEntry[],
): Record<string, string> {
  const out: Record<string, string> = {};
  ORDINALS.forEach((ordinal, i) => {
    const entry = entries[i];
    out[`${prefix}${ordinal}Name`] = entry?.name ?? "";
    out[`${prefix}${ordinal}CourseOfStudy`] = entry?.courseOfStudy ?? "";
    out[`${prefix}${ordinal}${credentialKey}`] = entry?.credential ?? "";
    // Location and Dates are SLI additions — the paper form asks for
    // "dates of enrollment, cities and states" but the portal has no slot.
    out[`${prefix}${ordinal}Location`] = entry?.location ?? "";
    out[`${prefix}${ordinal}Dates`] = entry?.dates ?? "";
  });
  return out;
}

function licenseFields(entries: LicenseEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  ORDINALS.forEach((ordinal, i) => {
    const entry = entries[i];
    out[`license${ordinal}Name`] = entry?.name ?? "";
    out[`license${ordinal}IssuedBy`] = entry?.issuedBy ?? "";
    out[`license${ordinal}ExpirationDate`] = entry?.expirationDate ?? "";
  });
  return out;
}

/**
 * Entry 0 is the current/most recent job and flattens to `current*`.
 * Entries 1 and 2 flatten to `previous*One` / `previous*Two`.
 */
function employmentFields(
  entries: EmploymentEntry[],
): Record<string, string | boolean> {
  const out: Record<string, string | boolean> = {};

  const write = (
    entry: EmploymentEntry | undefined,
    employerKey: string,
    field: (name: string) => string,
    contactKey: string,
  ) => {
    out[contactKey] = entry ? entry.mayWeContactEmployer === "yes" : false;
    out[employerKey] = entry?.employer ?? "";
    out[field("Address")] = entry?.employerAddress ?? "";
    out[field("EmploymentDates")] = entry
      ? formatDateRange(entry.employmentDateFrom, entry.employmentDateTo)
      : "";
    out[field("JobTitle")] = entry?.jobTitle ?? "";
    out[field("HrsPerWeek")] = entry?.hrsPerWeek ?? "";
    out[field("SupervisorName")] = entry?.supervisorName ?? "";
    out[field("Phone")] = entry ? normalizePhone(entry.employerPhone) : "";
    out[field("DutiesPerformed")] = entry?.dutiesPerformed ?? "";
    out[field("ReasonForLeaving")] = entry?.reasonForLeaving ?? "";
    // SLI addition: the paper form's "No, because (state reason)".
    out[field("MayWeContactReason")] = entry?.mayWeContactReason ?? "";
  };

  write(
    entries[0],
    "currentEmployer",
    (name) =>
      name === "Address"
        ? "currentEmployerAddress"
        : name === "Phone"
          ? "currentEmployerPhone"
          : name === "MayWeContactReason"
            ? "currentMayWeContactReason"
            : `current${name}`,
    "mayWeContactCurrentEmployer",
  );

  ([1, 2] as const).forEach((index) => {
    const ordinal = ORDINALS[index];
    write(
      entries[index],
      `previousEmployer${ordinal}`,
      (name) =>
        name === "Address"
          ? `previousEmployerAddress${ordinal}`
          : name === "Phone"
            ? `previousEmployerPhone${ordinal}`
            : name === "MayWeContactReason"
              ? `previousMayWeContactReason${ordinal}`
              : `previous${name}${ordinal}`,
      `mayWeContactPreviousEmployer${ordinal}`,
    );
  });

  return out;
}

/** References have no sister-app equivalent — these are new portal fields. */
function referenceFields(entries: ReferenceEntry[]): Record<string, string> {
  const out: Record<string, string> = {};
  ORDINALS.forEach((ordinal, i) => {
    const entry = entries[i];
    out[`reference${ordinal}Name`] = entry?.name ?? "";
    out[`reference${ordinal}Address`] = entry?.address ?? "";
    out[`reference${ordinal}Telephone`] = entry
      ? normalizePhone(entry.telephone)
      : "";
    out[`reference${ordinal}Occupation`] = entry?.occupation ?? "";
  });
  return out;
}

export function toFlatRecord(values: ApplicationValues): ApplicationRecord {
  const submittedAt = new Date().toISOString();

  return {
    /* System */
    id: crypto.randomUUID(),
    package: null,
    companyName: "SLI",
    date: submittedAt,
    documentLink: null,
    envelopeId: null,
    receivedByCompany: false,
    dismissApplicant: false,

    /* Applicant */
    applicationPosition: values.applicationPosition,
    lastName: values.lastName,
    firstName: values.firstName,
    middleName: values.middleName,
    primaryPhone: normalizePhone(values.primaryPhone),
    secondaryPhone: normalizePhone(values.secondaryPhone),
    email: values.email,
    mailingAddress: values.mailingAddress,
    city: values.city,
    state: values.state,
    zipCode: values.zipCode,

    /* Availability — availableForAnyShift is derived, never asked directly. */
    availableForAnyShift: SHIFTS.every((s) =>
      values.shiftsAvailable.includes(s),
    ),
    availableWeekends: values.availableWeekends === "yes",
    ageVerified: values.ageVerified === true,
    employmentTypeSought: values.employmentTypeSought.join(", "),
    shiftsAvailable: values.shiftsAvailable.join(", "),
    howSoonAvailable: values.howSoonAvailable,

    /* Company history */
    previouslyEmployedByCompany: values.previouslyEmployedByCompany === "yes",
    datesPreviouslyEmployed: values.datesPreviouslyEmployed,
    positionsPreviouslyHeld: values.positionsPreviouslyHeld,
    relatedToCompanyEmployee: values.relatedToCompanyEmployee === "yes",
    relatedTo: values.relatedTo,

    /* Education */
    highschoolName: values.highschoolName,
    highschoolLocation: values.highschoolLocation,
    hsGradStatus: values.hsGradStatus,
    ...schoolFields("college", "Degree", values.colleges),
    ...schoolFields("tradeSchool", "Certificate", values.tradeSchools),
    ...licenseFields(values.licenses),

    /* Narrative */
    training: values.training,
    specialSkills: values.specialSkills,
    experienceAndActivities: values.experienceAndActivities,

    /* Employment + references */
    ...employmentFields(values.employmentHistory),
    ...referenceFields(values.references),

    /* Certification */
    agreeToTerms: values.agreeToTerms === true,

    /*
     * The `eeo*` keys are intentionally not emitted — see the note on
     * `ApplicationRecord` above. Restoring the survey means restoring them
     * here too, or the answers are collected and then thrown away.
     */
  };
}
