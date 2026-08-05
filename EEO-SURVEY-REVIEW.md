# Voluntary Survey — Compliance Review

**Status: IMPLEMENTED 2026-08-05.** Prepared for HR review; the recommended
changes were then approved and built. Not legal advice — the reasoning below
should still be confirmed with counsel or an HR compliance advisor.

**What was built, and the assumption it rests on:**

| Change | Status |
|---|---|
| Combined SPD 15 race/ethnicity question, multi-select, incl. MENA | ✅ built |
| `eeoSex` added | ✅ built |
| Disability question removed | ✅ built |
| Veteran question simplified to plain language | ✅ built |
| Reporting view | ❌ not built — waits on HR |

> ⚠️ **This rests on SLI not being a covered federal contractor, which is
> UNCONFIRMED.** The user could not verify it at the time of the change.
> If SLI *is* covered, the disability question must be restored using CC-305
> verbatim and the veteran question must use the VEVRAA categories. See
> "If YES — federal contractor" below, and Step 10 of `FIELD-INVENTORY.md`
> for the exact list of what to change back.

The current survey reproduces the printed application verbatim, including
terminology that is decades out of date. This document sets out what the
current rules actually require, what SLI is likely obligated to do, and a
proposed replacement.

---

## The finding that changes the shape of this

**The EEO-1 report does not use applicant data.** It is a snapshot of
*employees*, taken from HR records during any pay period in Q4, reported by
job category, sex, and race/ethnicity. Nothing on a job application feeds it.

So collecting demographics on the application form does *not* satisfy the
EEO-1 obligation, and dropping the survey entirely would not jeopardise it.

Applicant-level demographic collection served a different purpose: **applicant
flow data**, required of federal contractors under the affirmative action
regulations implementing Executive Order 11246. **EO 11246 was revoked on
21 January 2025** by EO 14173. The applicant-flow requirement went with it.

What survives — because they are statutes, not executive orders — is
Section 503 of the Rehabilitation Act (disability) and VEVRAA (veterans).
Both apply **only to federal contractors**, and both require *inviting*
applicants to self-identify.

## Therefore: one question decides everything

> **Is Schmidbauer Lumber a federal contractor or subcontractor?**

Coverage generally begins at $10,000 in federal contracts for Section 503,
and $150,000 for VEVRAA. Selling lumber to a federal or state agency, or
supplying a prime contractor on a federally funded project, can bring a
company in scope. HR or whoever manages contracts will know.

### If NO — not a federal contractor

None of the three current questions is legally required from applicants.

- **Race/ethnicity** — optional. Worth keeping *only* if SLI intends to
  actually audit its own hiring for adverse-impact patterns. Collecting it and
  never analysing it has cost and no benefit.
- **Veteran status** — not required. Reasonable to keep a simple, plainly
  voluntary version if SLI wants to do veteran outreach.
- **Disability** — **recommend removing.** Without a Section 503 obligation
  there is no reason to ask, and asking about disability pre-offer is the most
  legally sensitive question on the form.

### If YES — federal contractor

- **Disability** — must use OFCCP **Form CC-305 verbatim**. The wording is
  OMB-approved and may not be edited, reformatted into your own phrasing, or
  paraphrased. On 16 July 2026 OMB re-approved it unchanged through
  **31 July 2029**. A rule to eliminate the requirement has been proposed but
  is *not final*, so the obligation stands today.
  Copy the current text from the official source rather than from this
  document or the old paper form:
  <https://www.dol.gov/sites/dolgov/files/OFCCP/regs/compliance/sec503/Self_ID_Forms/503Self-IDForm.pdf>
- **Veteran status** — VEVRAA invitation, using the protected-veteran
  categories.
- **Race/ethnicity/sex** — no longer required post-EO 11246, but many
  contractors continue collecting it for self-audit.

---

## What is wrong with the survey as it stands

| Problem | Detail |
|---|---|
| "Handicapped individual" | Pre-ADA terminology. Replace regardless of the answer above. |
| Missing categories | No "Native Hawaiian or Other Pacific Islander", no "Two or More Races". |
| Hispanic treated as a race | It is an **ethnicity**, asked as its own question under the current standard. |
| No sex/gender field | Absent from the paper form, so never added. Needed for any workforce-vs-applicant-pool comparison. |
| Answers were discarded | Fixed 2026-08-05 — now stored in `ApplicantDemographics`. |

## Which race/ethnicity standard to use

There are two, and the changeover is years out:

- **Current EEO-1 standard (1997 SPD 15).** Separate Hispanic/Latino ethnicity
  question, then five race categories, plus "Two or More Races".
- **Revised SPD 15 (finalised 2024).** One combined question, multi-select,
  adding **Middle Eastern or North African (MENA)** as a category distinct
  from White. **The EEO-1 compliance deadline was extended to 28 September
  2029.**

Since applicant data does not feed the EEO-1 anyway, SLI is free to adopt the
revised format now. Recommended, because it is the better instrument and
avoids re-asking everyone in a couple of years.

### Proposed question — race and ethnicity

> The following is voluntary and will not be used in any hiring decision.
> Select all that apply.
>
> - American Indian or Alaska Native
> - Asian
> - Black or African American
> - Hispanic or Latino
> - Middle Eastern or North African
> - Native Hawaiian or Other Pacific Islander
> - White
> - I prefer not to answer

### Proposed question — sex

> - Male
> - Female
> - I prefer not to answer

Only add this if the demographic reporting is actually going to be used. Note
the EEO-1 itself is binary; a non-binary option can be offered to applicants
and reported in the EEO-1 comments field, but that is a policy decision for HR.

### Veteran status

Use the VEVRAA protected-veteran categories if SLI is a contractor. If not and
SLI still wants the question, keep it to a single plain item:

> - I identify as a veteran of the U.S. Armed Forces
> - I am not a veteran
> - I prefer not to answer

### Disability

Either **CC-305 verbatim from the DOL link above** (if a contractor), or
**remove the question entirely** (if not). Do not write a custom disability
question — there is no upside and considerable risk.

---

## Sequencing

1. HR confirms federal contractor status. Everything else follows from it.
2. HR confirms which report, if any, this data is meant to produce.
3. Categories are finalised — including whether to add sex.
4. Only then build the reporting view.

Building the storage first (done) is safe and reversible. Building *reporting*
before step 2 risks producing numbers that match no form anyone has to file.

## Reporting: cell suppression

Whatever gets built, aggregate counts are not automatically anonymous at
SLI's volume. If eleven people apply and one selects a given category, a
count of `1` identifies them to anyone who knows the applicant pool.

Suppress any bucket below a threshold (5 is the common choice) and do not
offer date filters narrow enough to isolate individuals.

## Sources

- [OMB revisions to SPD 15 — Littler](https://www.littler.com/publication-press/publication/omb-announces-new-agency-standards-maintaining-collecting-and)
- [EEO-1 race/ethnicity expansion — Nixon Peabody](https://www.nixonpeabody.com/insights/alerts/2024/04/12/eeoc-form-eeo-1-update-expands-race-and-ethnicity-data-collection)
- [MENA category and 2029 deadline — Fisher Phillips](https://www.fisherphillips.com/en/news-insights/employers-should-prepare-new-race-ethnicity-categories.html)
- [CC-305 extended through July 2029 — DirectEmployers](https://directemployers.org/2026/07/20/ofccp-form-cc-305-self-id-extension-2029/)
- [Form CC-305, official DOL copy](https://www.dol.gov/sites/dolgov/files/OFCCP/regs/compliance/sec503/Self_ID_Forms/503Self-IDForm.pdf)
- [EO 11246 rescission and what survives — Seyfarth Shaw](https://www.seyfarth.com/news-insights/ofccp-issues-proposals-to-rescind-eo-11246-regulations-and-modify-section-503-and-vevraa-regulations.html)
- [VEVRAA and Section 503 today — Berkshire Associates](https://www.berkshireassociates.com/blog/what-federal-contractors-need-to-know-about-vevraa-and-section-503-today)
- [EEO-1 Component 1 who must file — EEOC](https://www.eeoc.gov/data/eeo-data-collections)
- [2026 reporting requirements — Jackson Lewis](https://www.jacksonlewis.com/insights/2026-employee-data-reporting-requirements-are-employers-ready)
