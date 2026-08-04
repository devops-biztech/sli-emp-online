# Schmidbauer Lumber — Online Employment Application

A ten-step application wizard replacing the printed
`assets/SLI-Employment-Application.pdf`. Built to make it hard to reach the end
with fields missed: each step validates before it will let you advance.

## Status

**Phase 1 complete.** All 10 steps built, all fields from `FIELD-INVENTORY.md`
implemented, full flow verified end-to-end in a real browser at 1280px and
390px with no console errors. Typecheck, lint, and production build all clean.

**Not implemented, by design:** client-side encryption and DynamoDB writes are
stubbed at clearly marked seams (see *Submission pipeline* below). Draft
save/resume is out of scope.

## Run it

```bash
npm install
npm run dev
```

## Documents

| File | What it is |
|---|---|
| `FIELD-INVENTORY.md` | **Authoritative.** Every field, its type, validation, step, and conditional logic — plus the confirmed decisions (A–K) about how the PDF and the sister-app schema were reconciled. |
| `PRODUCT.md` | Product truth: users, purpose, constraints, brand commitments. |
| `DESIGN.md` | The visual system as built: tokens, layout rules, a11y commitments. |

## Architecture

```
src/lib/schema.ts       Zod schema + types — the single source of truth
src/lib/steps.ts        Step definitions, incl. which fields each step validates
src/lib/flatten.ts      toFlatRecord(): nested form state → flat portal record
src/lib/encryption.ts   encrypt(): STUBBED client-side encryption hook
src/components/fields.tsx        Field primitives (carry the a11y contract)
src/components/steps/*.tsx       One component per step
src/components/wizard/*.tsx      Shell, stepper, repeatable-entry chrome
src/app/api/applications/route.ts  STUBBED submit endpoint
```

### Adding or changing a field

1. Update `FIELD-INVENTORY.md` first — it's the spec, and it records *why*.
2. Add it to `applicationSchema` and `defaultValues` in `src/lib/schema.ts`.
3. **Add it to that step's `fields` array in `src/lib/steps.ts`.** A field
   missing from this array can never block advancement, which is exactly how a
   required field goes missing in production.
4. Render it in the step component.
5. Map it in `toFlatRecord()`.
6. Add it to the review-step summary.

## Submission pipeline

```
FormValues (nested, Zod-validated)
  └─ toFlatRecord()          nested → flat, sister-app field names
      └─ encrypt()           ⚠️ STUB: base64 pass-through, no confidentiality
          └─ POST /api/applications   ⚠️ STUB: accepts blob, returns receipt
              └─ DynamoDB    ❌ NOT IMPLEMENTED
```

**Not yet implemented, by design:** real encryption and any datastore writes.

`src/lib/encryption.ts` is the only place real crypto goes. Its header
documents the intended scheme (per-submission AES-GCM content key, wrapped with
the portal's public key). The `EncryptedPayload` envelope already carries
`iv`, `encryptedKey`, `keyId`, and an `algorithm` discriminator, so swapping the
stub for the real implementation touches no callers.

The endpoint validates envelope *shape* only and never inspects `ciphertext`.
In production it only ever sees ciphertext, so any field-level logic there
would be dead code.

`toFlatRecord()` is the single module that knows the admin portal's field
names. If the portal schema moves, it moves there and nowhere else.

## Known gaps for follow-up

- **EEO categories are outdated.** The voluntary survey reproduces the printed
  form exactly: no "Two or more races", no "Native Hawaiian/Pacific Islander",
  Hispanic treated as a race rather than a separate ethnicity question, and the
  term "Handicapped individual". Built as-printed on purpose; needs HR
  compliance review before changing.
- **The certification text says "My signature below certifies…"** but the form
  collects no signature (signatures happen in person at interview). The
  checkbox is presented as the electronic equivalent. Worth a legal read.
- **References and the EEO survey have no sister-app fields.** `toFlatRecord()`
  emits new names (`referenceOneName`, `eeoRacialEthnic`, …) that the admin
  portal will need to learn.
- **No draft save / resume.** Explicitly out of scope; a long form with no
  resume will lose some applicants who get interrupted.

## Notes for whoever picks this up

**Dates are dropdowns on purpose.** `<input type="month">` was tried and
removed: its typed format varies by browser and locale, so applicants typing
`04/2020` got rejected with no discoverable correct format. Don't "simplify"
it back to a native month input.

**A hydration warning about `disabled` on the stepper buttons is a browser
extension**, not a bug. The server HTML contains `disabled=""`; some extensions
strip it before React hydrates. Verified clean in a browser with no extensions.
The stepper's click handler guards on `isReachable` independently of the
attribute, so behavior is safe either way. It is deliberately **not** silenced
with `suppressHydrationWarning`, which would mask real mismatches later.

**`src/lib/steps.ts` is easy to forget.** A field missing from a step's `fields`
array can never block advancement — that's the most likely way a required field
silently goes missing.
