# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router) + TypeScript + React + Tailwind v4 + shadcn/ui. Pinned by the user to stay consistent with the existing Schmidbauer admin portal, which shares the Radix + Tailwind foundation.

## Users

Job applicants to Schmidbauer Lumber Inc., a lumber mill in Eureka, CA employing ~110 people. The source form is titled "Employment Application for **Entry-Level Worker**," so the primary applicant is a yard, mill, or production candidate — not an office professional. Confirmed device split: **mixed mobile and desktop**, both first-class.

Secondary user: Schmidbauer HR staff, who receive submissions in a separate admin portal. They do not touch this surface.

## Product Purpose

Replace a 5-page printed PDF application with an online form that applicants can complete without printing, scanning, or visiting the office. Success is a **completed, valid submission** — the form's core job is to prevent an applicant from reaching the end with fields missed, which is the failure mode of both the paper form and a naive single-page web form.

The explicit UX mandate: it must **not feel like a long scroll**. Delivered as a multi-step wizard, one logical section per step, with per-step validation blocking advancement.

## Positioning

Not a job board or an ATS. A single company's application form, replacing one specific paper document, feeding one specific admin portal. Its differentiator is fidelity: it captures exactly what the paper form captures plus what the sister apps' schema captures, and nothing invented.

## Operating Context

- The company site (schmidbauerlumber.com) is industrial and utilitarian, with a "Join Our Team" nav item this form will hang off. Tagline: "Locally Owned and Operated Since 1971."
- Applicants may fill this out on a phone, possibly on-site or in a parking lot. Typing is expensive; interruption is likely.
- Submissions flow to an existing admin portal that has its own PDF generator. Signatures are collected in person at interview, not in this form.
- Draft save / resume is explicitly **out of scope** for this build.

## Capabilities and Constraints

- **10 steps**, one logical section each. Per-step validation; the user cannot advance past invalid required fields.
- Repeatable sections: colleges (≤3), trade schools (≤3), licenses (≤3), work experience (≥1, ≤3), references (exactly 3).
- Conditional fields driven by prior answers.
- Final review step: read-only summary, per-section edit links, certification checkbox.
- Voluntary EEO survey is **legally segregated**, entirely optional, and may never block submission.
- WCAG AA. Real `<label>`s, full keyboard navigation, ARIA on the stepper and error messages, visible focus.
- Submission is **scaffolded only**: assemble typed schema → `toFlatRecord()` → stubbed `encrypt()` pass-through → stubbed endpoint accepting an opaque blob. No real encryption, no DynamoDB. The endpoint must never inspect or destructure payload fields, because in production it only ever sees ciphertext.
- The complete confirmed field inventory and data model lives in `FIELD-INVENTORY.md`. It is authoritative; this file does not duplicate it.

**Delivery status (2026-08-04):** Phase 1 shipped. All 10 steps built and verified end-to-end at desktop and mobile widths. Encryption and DynamoDB remain stubbed pending confirmation that the data model captures everything.

## Brand Commitments

- Assets in `assets/`: `sli-logo-color.png`, `sli-logo.png`, `SLIlogoboth.png`, `SLIwhitereversal.png` (for dark grounds), `sliicon.png` / `sliicon.ico`.
- Brand colors sampled from the logo: **gold `#FCCC24`**, **green `#24843C`**, deep green `#306030`, light green `#90CC60`.
- The logo mark is a stylized saw blade paired with a bold gold wordmark.
- Company voice is plain, factual, and unadorned. No marketing warmth, no hype, no exclamation points.
- Legal text from the source PDF (certification paragraph, EEO assurances) must render **verbatim**.
- Confirmed register: **branded and warm** — green as structural color, gold reserved for progress and primary action. Task clarity wins every conflict.

## Evidence on Hand

- `assets/SLI-Employment-Application.pdf` — the real 5-page paper form, fully transcribed into `FIELD-INVENTORY.md`.
- The sister-app DynamoDB record shape (81 applicant fields + 6 system fields), supplied by the user.
- Real company facts: Eureka CA, P.O. Box 152, 95502, phone 707-443-7025, fax 707-443-2356, "An Equal Opportunity Employer," est. 1971, ~110 employees, mills Douglas Fir, Hemlock, Redwood, Pine, Spruce.
- **Absent, must not be fabricated:** open positions or job listings, salary or benefit figures, hiring timelines, application status or response-time promises, employee testimonials.

## Product Principles

1. **Fidelity over invention.** Every field traces to the paper PDF or the sister-app schema. Nothing is added without explicit sign-off, and every addition is recorded in `FIELD-INVENTORY.md`.
2. **The form's job is to prevent omission.** Validation is the product, not a nicety. Blocking advancement is a feature.
3. **Cheap for the applicant.** Minimal typing, short steps, obvious progress, no dead ends. An entry-level applicant on a phone is the design target.
4. **The voluntary survey is visibly voluntary.** It sits after certification, is skippable in one action, and never gates submission — legally and visually separated.
5. **The payload is opaque by design.** The client owns assembly and encryption; the transport layer knows nothing about the contents.

## Accessibility & Inclusion

WCAG 2.1 AA, required. Specific obligations: labeled stepper with `aria-current`; errors associated via `aria-describedby` and announced through a live region; focus moved to the first invalid field on failed advancement; visible focus rings throughout; 16px minimum input font on mobile to prevent iOS zoom-on-focus; 44px minimum touch targets. The applicant population includes people with limited computer familiarity, so plain-language labels and error messages outrank terseness.
