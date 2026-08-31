# SLI Employment Application — Field Inventory & Data Model

**Status:** Confirmed by Luis Ruiz, 2026-08-04. This is the authoritative spec for the Phase 1 build.

**Build status:** Phases 1 and 2 complete and verified end-to-end (desktop + mobile). All fields below are implemented, and submissions encrypt and persist for real — see `README.md`.

**Sources reconciled:**
1. `assets/SLI-Employment-Application.pdf` — the current paper form (5 pages, scanned)
2. The sister-app DynamoDB record shape (81 applicant fields + 6 system fields)

**Reconciliation decision (H): parity.** The schema is a superset — every sister-app field is present so records drop cleanly into the existing admin portal, plus every SLI-specific field from the PDF.

---

## Confirmed decisions

| # | Decision | Resolution |
|---|---|---|
| A | Contact block | **Structured** into `primaryPhone` / `mailingAddress` / `city` / `state` / `zipCode`, using sister-app field names |
| B | Email | **Added, and required as of 2026-08-05.** Originally optional on the reasoning that nothing off the paper form should be required; overridden by the user, since email is now the primary way HR reaches an applicant |
| C | Work experience entries | **Max 3** (1 current + 2 previous), matching sister apps |
| D | "How soon available" | **Free text** — accepts "immediately", "2 weeks" |
| E | Education | **Structured**, sister-app names as backbone + `Location`/`Dates` companions so the PDF's "dates of enrollment, cities and states" isn't lost |
| F | Required fields | As marked below |
| G | Middle name | `middleName`, optional, free text (an initial is a valid value) |
| H | Parity scope | **Full parity**, including `ageVerified` (legal working age confirmation) and `relatedToCompanyEmployee` (transparency only) |
| I | Signature | **Omitted.** Admin portal's PDF generator handles wet signature at interview. `documentLink` / `envelopeId` reserved as nullable for future e-sign |
| J | Schema shape | **Nested arrays internally**, flattened by `toFlatRecord()` at the encryption boundary |
| K | High school | **Included**, per parity — the PDF's "except for high school" was a paper-space concession, not policy |
| L | Employment date entry | **Month + year dropdowns**, not `<input type="month">`. Rationale below under Step 7 |

### Knock-on from (I)
The EEO survey's own *"Signed / Date / Address / Phone"* block existed solely to authenticate the wet signature. With signatures removed it is dropped; the survey's substantive checkboxes remain. Address and phone were already captured in Step 1.

### Recorded but not acted on
- The survey intro references reporting on **"sex"** — but no sex/gender field exists anywhere on the PDF. **Not added originally; added 2026-08-05** as `eeoSex`, one of the few deliberate departures from the paper form.
- EEO race categories and the term **"Handicapped individual"** were 1970s-era and did not match current categories. Originally **built exactly as printed** pending review. **Resolved 2026-08-05:** survey rewritten to the SPD 15 (2024) combined race/ethnicity question, sex added, disability question removed. See Step 10 and `EEO-SURVEY-REVIEW.md`.

---

## Legend

✅ required · ⬜ optional · ⚡ conditionally required · 🔒 system (no UI)

---

## System fields — 🔒 no UI

| Field | Type | Value |
|---|---|---|
| `id` | string | generated UUID |
| `package` | string \| null | reserved |
| `companyName` | string | constant `"SLI"` |
| `date` | ISO date string | autofilled at load, **not editable** |
| `documentLink` | string \| null | reserved for e-sign |
| `envelopeId` | string \| null | reserved for e-sign |
| `receivedByCompany` | boolean | default `false`, admin-managed |
| `dismissApplicant` | boolean | default `false`, admin-managed |

---

## Step 1 — Your Information

| Field | Type | Req | Validation |
|---|---|---|---|
| `lastName` | text | ✅ | 1–50 chars |
| `firstName` | text | ✅ | 1–50 chars |
| `middleName` | text | ⬜ | max 50 |
| `primaryPhone` | tel | ✅ | US 10-digit, formatted on blur |
| `secondaryPhone` | — | — | **No input. Removed from the form 2026-08-05.** Still in the schema, `defaultValues`, and `toFlatRecord()`, always submitting `""`, so the portal record shape is unchanged. Do not delete without a coordinated portal change |
| `email` | email | ✅ | RFC-ish email. Required as of 2026-08-05 — see decision B |
| `mailingAddress` | text | ✅ | |
| `city` | text | ✅ | |
| `state` | select | ✅ | US states + territories, default CA |
| `zipCode` | text | ✅ | 5 or 5+4 |

## Step 2 — Position & Availability

| Field | Type | Req | Notes |
|---|---|---|---|
| `applicationPosition` | select | ✅ | PDF: "Job applied for". **Changed 2026-08-31 from free text to a dropdown of open roles** (`OPEN_POSITIONS` in `src/lib/positions.ts`), defaulting to *Entry Level Full-time Floater*. Free text produced applications for roles that were not open. `?position=` is now matched against this list, not trusted. |
| `howSoonAvailable` | text | ✅ | PDF: "How soon are you available for employment?" |
| `employmentTypeSought` | string[] | ✅ | min 1 — Full-time, Part-time, Temporary, Summer. Checkboxes on paper, so multi-select |
| `shiftsAvailable` | string[] | ✅ | min 1 — Day, Swing, Night, Rotating |
| `availableForAnyShift` | boolean | 🔒 | **derived**: true when all four shifts selected. Not a separate question |
| `availableWeekends` | boolean | ✅ | sister-app field, Yes/No |
| `ageVerified` | boolean | ✅ | "I am of legal age to work." Must be checked |

## Step 3 — Schmidbauer History

| Field | Type | Req | Conditional |
|---|---|---|---|
| `previouslyEmployedByCompany` | radio Y/N | ✅ | |
| `datesPreviouslyEmployed` | text | ⚡ | required iff `previouslyEmployedByCompany` = Yes |
| `positionsPreviouslyHeld` | text | ⚡ | required iff Yes. PDF: "In what job position(s)?" |
| `relatedToCompanyEmployee` | radio Y/N | ✅ | |
| `relatedTo` | text | ⚡ | required iff `relatedToCompanyEmployee` = Yes |

## Step 4 — Education: High School & College

All optional. PDF asks for names, **dates of enrollment, cities and states**.

| Field | Type | Req |
|---|---|---|
| `highschoolName` | text | ⬜ |
| `highschoolLocation` | text | ⬜ |
| `hsGradStatus` | select | ⬜ — Graduated / GED / Currently attending / Did not graduate |
| `colleges[0..2].name` | text | ⬜ |
| `colleges[0..2].location` | text | ⬜ |
| `colleges[0..2].dates` | text | ⬜ |
| `colleges[0..2].courseOfStudy` | text | ⬜ |
| `colleges[0..2].degree` | text | ⬜ |

Repeatable, add/remove, max 3. `location` and `dates` are the PDF-fidelity additions.

## Step 5 — Trade Schools & Licenses

All optional.

| Field | Type | Req |
|---|---|---|
| `tradeSchools[0..2].name` | text | ⬜ |
| `tradeSchools[0..2].location` | text | ⬜ |
| `tradeSchools[0..2].dates` | text | ⬜ |
| `tradeSchools[0..2].courseOfStudy` | text | ⬜ |
| `tradeSchools[0..2].certificate` | text | ⬜ |
| `licenses[0..2].name` | text | ⬜ |
| `licenses[0..2].issuedBy` | text | ⬜ |
| `licenses[0..2].expirationDate` | date | ⬜ |

Both repeatable, add/remove, max 3 each.

## Step 6 — Skills & Experience

Three compact textareas (4 rows each), verbatim PDF prompts. All optional.

| Field | Prompt |
|---|---|
| `training` | "Have you completed any training or classes relevant to the job for which you are applying? (Examples: On-the-job safety training, military training, production training, etc.) Be specific." |
| `specialSkills` | "Do you have any special skills or experiences that are relevant to the job for which you are applying? (Examples: Experience operating plant or office machines, computer skills, experience in warehouse jobs, skills in maintaining or repairing office or plant machines, etc.) Be specific." |
| `experienceAndActivities` | "We want employees to advance. Describe any job experience, school or other activities that demonstrate your desire and ability to advance or learn new skills." |

## Step 7 — Work Experience — 🔁 repeatable, max 3

Index 0 = current/most recent → flattens to `current*`. Indices 1–2 → `previousOne*` / `previousTwo*`.
PDF: *"Please list your work experience beginning with your most recent job held. If you were self-employed, give company name."*

| Field (per entry) | Type | Req |
|---|---|---|
| `employer` | text | ✅ |
| `employerAddress` | textarea | ✅ |
| `employerPhone` | tel | ⬜ |
| `supervisorName` | text | ⬜ |
| `employmentDateFrom` | month + year selects | ✅ |
| `employmentDateTo` | month + year selects | ✅ |
| `jobTitle` | text | ✅ |
| `hrsPerWeek` | number | ⬜ |
| `dutiesPerformed` | textarea | ⬜ |
| `reasonForLeaving` | text | ✅ |
| `mayWeContactEmployer` | radio Y/N | ✅ |
| `mayWeContactReason` | textarea | ⚡ required iff `mayWeContactEmployer` = No |

**Min 1 entry required.** Validation: `To` ≥ `From`, neither in the future.

`mayWeContactReason` is the PDF's *"No, because (please state reason)"* — additive to the sister schema, which stores the boolean only. The PDF asks contact permission once for the present employer; sister apps ask per-employer, so per-entry wins under parity.

`employmentDateFrom`/`To` flatten to a single `…EmploymentDates` string as `"MM/YYYY – MM/YYYY"`.

**Date entry (decision L, 2026-08-04).** Stored as `YYYY-MM`, but collected via two
dropdowns rather than `<input type="month">`. The native control's typed format
varies by browser and locale — Chrome expects segment entry, Firefox degrades to
a bare text box — so an applicant typing `04/2020` or `April 2020` was rejected
with no way to discover the expected format. Dropdowns remove the guess entirely
and need no keyboard on a phone. A half-answer (month picked, year not) is held
as a deliberately invalid marker so it can be reported as "Choose both a month
and a year" rather than silently passing.

## Step 8 — References — 🔁 3 slots, 1 required

PDF: *"Please list three references who can provide us with information about your qualifications to perform the job for which you are applying. Business or job-related references are preferable."*

**Changed 2026-08-05:** the paper form asks for three, but only the **first is
required**. Slots 2 and 3 may be left entirely blank. Once any field in an
optional slot is filled, the remaining three become required for that slot — a
name with no phone number is of no use to whoever makes the calls. Enforced by
`referencesSchema` in `src/lib/schema.ts`, not by the per-field shapes.

| Field (per entry) | Type | Req (ref 1) | Req (refs 2–3) |
|---|---|---|---|
| `name` | text | ✅ | ⬜ unless the slot is started |
| `address` | text | ✅ | ⬜ unless the slot is started |
| `telephone` | tel | ✅ | ⬜ unless the slot is started; 10-digit if typed |
| `occupation` | text | ✅ | ⬜ unless the slot is started |

**Not present in the sister-app schema** — new field names required in the admin portal.

## Step 9 — Review & Certify

Read-only summary of every section with an "Edit" link per section that jumps to that step.

| Field | Type | Req |
|---|---|---|
| `agreeToTerms` | checkbox | ✅ |

The full certification text from PDF page 4 renders verbatim above the checkbox: accuracy attestation; refusal or termination for false, inaccurate, incomplete or misleading information; authorization to verify employment, education, character and qualifications; release of all entities from liability; agreement to conform to company rules, policies and procedures; and acknowledgement of **at-will employment**.

No signature field — see Decision I.

## Step 10 — Voluntary Demographic Survey — ❌ REMOVED FROM THE FLOW 2026-08-31

**No longer part of the application.** SLI is a small site, is not a federal
contractor, and asked for the survey to be dropped; it collects demographics
only from applicants it has hired. The code is retained but unwired, and
`toFlatRecord()` omits the three `eeo*` keys entirely rather than sending them
blank — the portal treats key *presence* as "this applicant was asked". The
restore checklist is at the top of `src/components/steps/step-voluntary.tsx`.

Everything below describes the step as built, and governs it if it is ever
restored. TRL's copy is unaffected and still runs.


Originally PDF page 5, transcribed verbatim. **Rewritten 2026-08-05** — the
printed version used "Handicapped individual", treated Hispanic as a race, and
omitted Native Hawaiian/Pacific Islander and multiracial identities. Rationale,
the 2026 regulatory position, and sources are in `EEO-SURVEY-REVIEW.md`.

Still rendered visually distinct, positioned after certification, with a
prominent Skip control.

| Field | Type | Req | Options |
|---|---|---|---|
| `eeoRacialEthnic` | string[] | ⬜ | Combined race/ethnicity multi-select per **SPD 15 (2024 revision)**: American Indian or Alaska Native · Asian · Black or African American · Hispanic or Latino · **Middle Eastern or North African** · Native Hawaiian or Other Pacific Islander · White |
| `eeoSex` | radio | ⬜ | Male · Female · I prefer not to answer — **new, resolves the Decision-below gap** |
| `eeoVeteran` | radio | ⬜ | Plain-language, *not* VEVRAA protected-veteran categories |

**Removed:** `eeoSelfIdentification` (the disability / "handicapped individual"
question). OFCCP Form CC-305 is mandatory and unmodifiable, and applies only to
federal contractors — a status SLI has not confirmed. Asking about disability
pre-offer without that obligation carries risk and no benefit.

> **If SLI is confirmed to be a covered federal contractor**, three things must
> change: restore a disability question using CC-305 verbatim from the DOL
> source, replace `eeoVeteran` with the VEVRAA protected-veteran categories,
> and re-add the `eeoDisability` column to `ApplicantDemographics` in the
> portal. Nothing else on the form is affected.

**Not present in the sister-app schema.** Stored in the portal's separate
`ApplicantDemographics` table, which deliberately has no Prisma relation to
`Application` so these answers cannot reach the detail view or the PDF.

No field on this step may block submission. The step must be completable while entirely empty.

---

## Step map

| Step | Title | Weight |
|---|---|---|
| 1 | Your Information | light |
| 2 | Position & Availability | light |
| 3 | Schmidbauer History | very light, conditional |
| 4 | Education — High School & College | repeatable |
| 5 | Trade Schools & Licenses | repeatable |
| 6 | Skills & Experience | 3 compact textareas |
| 7 | Work Experience 🔁 | one card at a time |
| 8 | References | compact, ×3 |
| 9 | Review & Certify | summary + edit links, **final step** |
| ~~10~~ | ~~Voluntary Survey~~ | removed from the flow 2026-08-31 |

---

## Submission pipeline

```
FormValues (nested, Zod-validated)
  └─ toFlatRecord()        ← single adapter; the only place that knows sister-app field names
      └─ ApplicationRecord (flat)
          └─ encrypt()     ← nacl.box, ephemeral sender keypair, to the portal's public key
              └─ POST /api/applications  ← accepts the opaque envelope, returns { success, id }
                  └─ DynamoDB `storages` ← { id, company, date, package, receivedByCompany }
                      └─ admin portal sync, via TRL's /api/item endpoint
```

The endpoint never inspects or destructures payload fields — it will only ever see ciphertext.

## Brand tokens

Sampled from `assets/sli-logo-color.png`:

| Token | Hex |
|---|---|
| Gold (primary) | `#FCCC24` |
| Green (secondary) | `#24843C` |
| Deep green | `#306030` |
| Light green | `#90CC60` |
