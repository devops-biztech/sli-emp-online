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

const requiredEmail = z
  .string()
  .trim()
  .min(1, { message: "Email address is required." })
  .refine((v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: "Enter a valid email address.",
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
/**
 * Combined race and ethnicity, following the 2024 revision to OMB Statistical
 * Policy Directive 15: one multi-select question rather than a separate
 * Hispanic-ethnicity question, with Middle Eastern or North African as a
 * category distinct from White.
 *
 * Adopted ahead of the EEO-1's own changeover (deadline 28 Sep 2029) because
 * applicant data does not feed the EEO-1 — that report is built from employee
 * records — so there is nothing to keep in lockstep with. See
 * EEO-SURVEY-REVIEW.md.
 *
 * No "prefer not to answer" option: this is a multi-select where selecting
 * nothing already means exactly that, and an explicit decline that can be
 * ticked alongside "Asian" would be incoherent. The step's intro says the
 * page may be left blank.
 */
export const EEO_RACIAL_ETHNIC = [
  "American Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Middle Eastern or North African",
  "Native Hawaiian or Other Pacific Islander",
  "White",
] as const;

/**
 * Single-select, so an explicit decline is offered and worth recording.
 * The EEO-1 itself is binary; whether to offer a non-binary option is an HR
 * policy decision, not a technical one — see EEO-SURVEY-REVIEW.md.
 */
export const EEO_SEX = ["Male", "Female", "I prefer not to answer"] as const;

/**
 * Plain-language veteran question. NOT the VEVRAA protected-veteran
 * categories, which apply only to federal contractors — a status SLI has not
 * confirmed. If SLI turns out to be a covered contractor, this question needs
 * replacing with the VEVRAA categories and the disability question needs
 * restoring. See EEO-SURVEY-REVIEW.md.
 */
export const EEO_VETERAN = [
  "I identify as a veteran of the U.S. Armed Forces",
  "I am not a veteran",
  "I prefer not to answer",
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

/**
 * Field-level shape only. Whether a given slot must be filled is decided at
 * the array level in `applicationSchema` — the first reference is required,
 * the other two are optional. `phoneShape` still enforces 10 digits on
 * anything actually typed.
 */
export const referenceSchema = z.object({
  name: z.string().trim(),
  address: z.string().trim(),
  telephone: phoneShape,
  occupation: z.string().trim(),
});

const REFERENCE_FIELDS = [
  ["name", "Name"],
  ["address", "Address"],
  ["telephone", "Telephone"],
  ["occupation", "Occupation"],
] as const;

/**
 * Reference 1 is required. References 2 and 3 may be left entirely blank —
 * but once any field in one is filled, the rest of that reference is
 * required too. A name with no phone number is of no use to whoever is
 * calling references, so a half-filled slot is treated as an error rather
 * than quietly accepted.
 */
const referencesSchema = z
  .array(referenceSchema)
  .length(3)
  .superRefine((refs, ctx) => {
    refs.forEach((ref, index) => {
      const started = REFERENCE_FIELDS.some(([key]) => ref[key].trim() !== "");
      if (index !== 0 && !started) return;

      for (const [key, label] of REFERENCE_FIELDS) {
        if (ref[key].trim() === "") {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [index, key],
            message: `${label} is required.`,
          });
        }
      }
    });
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
    /*
     * No input renders for `secondaryPhone` — it was removed from the form.
     * The field stays in the schema, in `defaultValues`, and in
     * `toFlatRecord()` so the record shape the portal receives is unchanged;
     * it simply always submits as "". Do not delete it without coordinating
     * a portal-side change.
     */
    secondaryPhone: phoneShape,
    email: requiredEmail,
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
    references: referencesSchema,

    /* Step 9 — Certify */
    agreeToTerms: z.literal(true, {
      errorMap: () => ({
        message: "You must certify your application before submitting.",
      }),
    }),

    /* Step 10 — Voluntary survey. Every field optional, always. */
    /*
     * All optional, always. Nothing on this step may block submission —
     * see the `optional: true` step definition and `skipSurveyAndSubmit`.
     */
    eeoRacialEthnic: z.array(z.enum(EEO_RACIAL_ETHNIC)),
    eeoSex: z.string().trim(),
    eeoVeteran: z.string().trim(),
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

  eeoRacialEthnic: [],
  eeoSex: "",
  eeoVeteran: "",
} as unknown as ApplicationValues;
