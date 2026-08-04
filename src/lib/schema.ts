/**
 * Single typed schema for the Schmidbauer Lumber employment application.
 *
 * This is the source of truth for the payload that gets encrypted and stored.
 * It is deliberately a clean, serializable object: no Dates, no class instances,
 * no undefined — every leaf is a string, boolean, or string[].
 *
 * Field derivation is documented in FIELD-INVENTORY.md. Every field here traces
 * either to assets/SLI-Employment-Application.pdf or to the sister-app record
 * shape. Nothing is invented.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Shared primitives                                                   */
/* ------------------------------------------------------------------ */

const required = (label: string) =>
  z.string().trim().min(1, { message: `${label} is required.` });

/** Accepts any 10-digit US number regardless of punctuation. */
const phoneShape = z
  .string()
  .trim()
  .refine((v) => v === "" || v.replace(/\D/g, "").length === 10, {
    message: "Enter a 10-digit phone number.",
  });

const requiredPhone = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required.` })
    .refine((v) => v.replace(/\D/g, "").length === 10, {
      message: "Enter a 10-digit phone number.",
    });

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Enter a valid email address, or leave this blank.",
  });

const zipShape = z
  .string()
  .trim()
  .min(1, { message: "ZIP code is required." })
  .refine((v) => /^\d{5}(-\d{4})?$/.test(v), {
    message: "Enter a 5-digit ZIP code.",
  });

const yesNo = z.enum(["yes", "no"], {
  errorMap: () => ({ message: "Choose Yes or No." }),
});

/**
 * `YYYY-MM`, not in the future. Collected via two dropdowns, so the only way to
 * fail the format check is to pick one half and not the other.
 */
const monthShape = (label: string) =>
  z
    .string()
    .trim()
    .min(1, { message: `${label} is required.` })
    .refine((v) => /^\d{4}-\d{2}$/.test(v), {
      message: "Choose both a month and a year.",
    })
    .refine((v) => v <= new Date().toISOString().slice(0, 7), {
      message: "This date can't be in the future.",
    });

/* ------------------------------------------------------------------ */
/* Option sets — verbatim from the source PDF                          */
/* ------------------------------------------------------------------ */

export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Temporary",
  "Summer",
] as const;

export const SHIFTS = ["Day", "Swing", "Night", "Rotating"] as const;

export const HS_GRAD_STATUS = [
  "Graduated",
  "GED",
  "Currently attending",
  "Did not graduate",
] as const;

/**
 * Verbatim from PDF page 5. These categories are 1970s-era and do not match
 * current EEO-1 reporting categories — see FIELD-INVENTORY.md. Reproduced
 * exactly as printed pending HR compliance review; do not "modernize" here.
 */
export const EEO_RACIAL_ETHNIC = [
  "White",
  "Black",
  "Hispanic",
  "American/Alaskan Indian",
  "Asian",
] as const;

/** Verbatim from PDF page 5. Same caveat as above. */
export const EEO_SELF_IDENTIFICATION = [
  "Handicapped individual",
  "Disabled veteran",
  "Vietnam era veteran",
] as const;

/* ------------------------------------------------------------------ */
/* Repeatable entry schemas                                            */
/* ------------------------------------------------------------------ */

export const schoolSchema = z.object({
  name: z.string().trim(),
  location: z.string().trim(),
  dates: z.string().trim(),
  courseOfStudy: z.string().trim(),
  /** "Degree" for colleges, "Certificate" for trade schools. */
  credential: z.string().trim(),
});

export const licenseSchema = z.object({
  name: z.string().trim(),
  issuedBy: z.string().trim(),
  expirationDate: z.string().trim(),
});

export const employmentSchema = z
  .object({
    employer: required("Employer"),
    employerAddress: required("Employer address"),
    employerPhone: phoneShape,
    supervisorName: z.string().trim(),
    employmentDateFrom: monthShape("Start date"),
    employmentDateTo: monthShape("End date"),
    jobTitle: required("Job title"),
    hrsPerWeek: z
      .string()
      .trim()
      .refine((v) => v === "" || (/^\d{1,3}$/.test(v) && Number(v) <= 168), {
        message: "Enter hours per week as a number.",
      }),
    dutiesPerformed: z.string().trim(),
    reasonForLeaving: required("Reason for leaving"),
    mayWeContactEmployer: yesNo,
    mayWeContactReason: z.string().trim(),
  })
  .superRefine((entry, ctx) => {
    if (entry.mayWeContactEmployer === "no" && !entry.mayWeContactReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["mayWeContactReason"],
        message: "Please tell us why we shouldn't contact this employer.",
      });
    }
    if (
      entry.employmentDateFrom &&
      entry.employmentDateTo &&
      entry.employmentDateTo < entry.employmentDateFrom
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["employmentDateTo"],
        message: "The end date must come after the start date.",
      });
    }
  });

export const referenceSchema = z.object({
  name: required("Name"),
  address: required("Address"),
  telephone: requiredPhone("Telephone"),
  occupation: required("Occupation"),
});

/* ------------------------------------------------------------------ */
/* The application                                                     */
/* ------------------------------------------------------------------ */

export const applicationSchema = z
  .object({
    /* Step 1 — Your Information */
    firstName: required("First name").max(50),
    lastName: required("Last name").max(50),
    middleName: z.string().trim().max(50),
    primaryPhone: requiredPhone("Primary phone"),
    secondaryPhone: phoneShape,
    email: optionalEmail,
    mailingAddress: required("Mailing address"),
    city: required("City"),
    state: required("State"),
    zipCode: zipShape,

    /* Step 2 — Position & Availability */
    applicationPosition: required("Position"),
    howSoonAvailable: required("Availability"),
    employmentTypeSought: z
      .array(z.enum(EMPLOYMENT_TYPES))
      .min(1, { message: "Choose at least one type of employment." }),
    shiftsAvailable: z
      .array(z.enum(SHIFTS))
      .min(1, { message: "Choose at least one shift." }),
    availableWeekends: yesNo,
    ageVerified: z.literal(true, {
      errorMap: () => ({
        message: "You must confirm you're of legal age to work.",
      }),
    }),

    /* Step 3 — Schmidbauer History */
    previouslyEmployedByCompany: yesNo,
    datesPreviouslyEmployed: z.string().trim(),
    positionsPreviouslyHeld: z.string().trim(),
    relatedToCompanyEmployee: yesNo,
    relatedTo: z.string().trim(),

    /* Step 4 — Education */
    highschoolName: z.string().trim(),
    highschoolLocation: z.string().trim(),
    hsGradStatus: z.string().trim(),
    colleges: z.array(schoolSchema).max(3),

    /* Step 5 — Trade Schools & Licenses */
    tradeSchools: z.array(schoolSchema).max(3),
    licenses: z.array(licenseSchema).max(3),

    /* Step 6 — Skills & Experience */
    training: z.string().trim(),
    specialSkills: z.string().trim(),
    experienceAndActivities: z.string().trim(),

    /* Step 7 — Work Experience */
    employmentHistory: z
      .array(employmentSchema)
      .min(1, { message: "Add at least one job." })
      .max(3),

    /* Step 8 — References */
    references: z.array(referenceSchema).length(3),

    /* Step 9 — Certify */
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must certify your application before submitting.",
      }),
    }),

    /* Step 10 — Voluntary survey. Every field optional, always. */
    eeoRacialEthnic: z.string().trim(),
    eeoVeteran: z.string().trim(),
    eeoSelfIdentification: z.array(z.enum(EEO_SELF_IDENTIFICATION)),
  })
  .superRefine((app, ctx) => {
    if (app.previouslyEmployedByCompany === "yes") {
      if (!app.datesPreviouslyEmployed) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["datesPreviouslyEmployed"],
          message: "Tell us roughly when you worked here.",
        });
      }
      if (!app.positionsPreviouslyHeld) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["positionsPreviouslyHeld"],
          message: "Tell us what position you held.",
        });
      }
    }
    if (app.relatedToCompanyEmployee === "yes" && !app.relatedTo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["relatedTo"],
        message: "Tell us who you're related to.",
      });
    }
  });

export type ApplicationValues = z.infer<typeof applicationSchema>;
export type EmploymentEntry = z.infer<typeof employmentSchema>;
export type SchoolEntry = z.infer<typeof schoolSchema>;
export type LicenseEntry = z.infer<typeof licenseSchema>;
export type ReferenceEntry = z.infer<typeof referenceSchema>;

/* ------------------------------------------------------------------ */
/* Defaults                                                            */
/* ------------------------------------------------------------------ */

export const emptySchool: SchoolEntry = {
  name: "",
  location: "",
  dates: "",
  courseOfStudy: "",
  credential: "",
};

export const emptyLicense: LicenseEntry = {
  name: "",
  issuedBy: "",
  expirationDate: "",
};

export const emptyEmployment: EmploymentEntry = {
  employer: "",
  employerAddress: "",
  employerPhone: "",
  supervisorName: "",
  employmentDateFrom: "",
  employmentDateTo: "",
  jobTitle: "",
  hrsPerWeek: "",
  dutiesPerformed: "",
  reasonForLeaving: "",
  mayWeContactEmployer: "yes",
  mayWeContactReason: "",
};

export const emptyReference: ReferenceEntry = {
  name: "",
  address: "",
  telephone: "",
  occupation: "",
};

/**
 * `ageVerified` and `agreeToTerms` are typed `z.literal(true)` but must start
 * unchecked, so the defaults are deliberately widened here.
 */
export const defaultValues = {
  firstName: "",
  lastName: "",
  middleName: "",
  primaryPhone: "",
  secondaryPhone: "",
  email: "",
  mailingAddress: "",
  city: "",
  state: "CA",
  zipCode: "",

  applicationPosition: "",
  howSoonAvailable: "",
  employmentTypeSought: [],
  shiftsAvailable: [],
  availableWeekends: undefined,
  ageVerified: false,

  previouslyEmployedByCompany: undefined,
  datesPreviouslyEmployed: "",
  positionsPreviouslyHeld: "",
  relatedToCompanyEmployee: undefined,
  relatedTo: "",

  highschoolName: "",
  highschoolLocation: "",
  hsGradStatus: "",
  colleges: [],

  tradeSchools: [],
  licenses: [],

  training: "",
  specialSkills: "",
  experienceAndActivities: "",

  employmentHistory: [{ ...emptyEmployment }],

  references: [
    { ...emptyReference },
    { ...emptyReference },
    { ...emptyReference },
  ],

  agreeToTerms: false,

  eeoRacialEthnic: "",
  eeoVeteran: "",
  eeoSelfIdentification: [],
} as unknown as ApplicationValues;
