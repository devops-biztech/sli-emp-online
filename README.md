# Schmidbauer Lumber — Online Employment Application

A nine-step application wizard replacing the printed
`assets/SLI-Employment-Application.pdf`. Built to make it hard to reach the end
with fields missed: each step validates before it will let you advance.

## Status

**Phase 1 complete.** All 10 steps built, all fields from `FIELD-INVENTORY.md`
implemented, full flow verified end-to-end in a real browser at 1280px and
390px with no console errors. Typecheck, lint, and production build all clean.

**Phase 2 complete.** Client-side encryption and DynamoDB persistence are both
implemented and verified against the real table (see *Submission pipeline*).

**Changed 2026-08-31, at SLI's request.** Two things, both below:

- **Position is a dropdown, not a text box.** Applicants were applying for
  roles that were not open. The list lives in `src/lib/positions.ts` and
  defaults to *Entry Level Full-time Floater*.
- **The voluntary EEO survey is out of the flow** — ten steps became nine.
  SLI is not a federal contractor and collects demographics only from people
  it has hired. The step was unwired, not deleted; see *The voluntary survey*.

**Before applicants are pointed at this form:** the `mill-jobs-portal-v2`
decrypt change must be committed and deployed, or submissions will be stored
and never ingested. See *Portal dependency*. Draft save/resume remains out of
scope.

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
src/lib/positions.ts    The open roles the step-2 dropdown offers
src/lib/flatten.ts      toFlatRecord(): nested form state → flat portal record
src/lib/encryption.ts   encrypt(): client-side nacl.box to the portal's key
src/components/fields.tsx        Field primitives (carry the a11y contract)
src/components/steps/*.tsx       One component per step
src/components/wizard/*.tsx      Shell, stepper, repeatable-entry chrome
src/app/api/applications/route.ts  Submit endpoint → DynamoDB `storages`
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
      └─ encrypt()           nacl.box to the portal's public key
          └─ POST /api/applications
              └─ DynamoDB `storages`   { id, company, date, package,
                                         receivedByCompany: false }
                  └─ admin portal sync, via TRL's /api/item endpoint
```

The whole chain is implemented and was verified end to end against the real
table: encrypt → POST → DynamoDB → read back → decrypt with the portal's own
module → matches the original. The test record was deleted afterwards.

Note the portal does **not** read DynamoDB directly. It fetches
`APPS_PUBLIC_HOST` — currently `apply.trinityriverlumbercompany.com/api/item`
— which scans `storages` for `receivedByCompany = false` and returns every
mill's records. SLI submissions reach the portal through TRL's deployment, so
that site being down stops SLI ingestion too.

**A failed write never reports success.** If DynamoDB rejects the put, the
endpoint returns 503 and the applicant sees a retry message with the office
phone number, because an applicant who sees a false confirmation will not
submit again — that loses the application outright.

### Encryption

`src/lib/encryption.ts` is the only place crypto goes. It uses tweetnacl `box`
(Curve25519 + XSalsa20-Poly1305) — the same primitive `mill-jobs-portal-v2`
already decrypts with, so submissions land in the existing admin sync.

The one deliberate difference from the older TRL/SRM forms: **the sender
keypair is ephemeral**, generated per submission and zeroed immediately. This
is the sealed-box construction.

It matters because `nacl.box` requires a sender secret key. The older apps
satisfied that by shipping a long-lived one to the browser — `trl-jobs`
hardcodes every mill's secret key in `next.config.js` and inlines it into the
client bundle, so those keys are readable in page source. An ephemeral key
means this app holds only the portal's **public** key.

To verify that claim after a build:

```bash
grep -rl "$(head -c40 <<<"$SLI_SEC")" .next/   # must find nothing
```

`SLI_PUB` is read server-side in `src/app/page.tsx` and passed to the client as
a prop. It's validated there, at render, so a misconfigured key fails before an
applicant can fill out a form they'd be unable to submit — rather than after
all ten steps. **`SLI_SEC` is not needed by this app and should not be in its
environment.**

### Wire format

The envelope inside `package` is `{cipher_text, one_time_code,
sender_public_key, algorithm, schemaVersion}`. The first two spellings are
inherited from the sister apps and are load-bearing — the portal's parser reads
those exact names. Byte arrays are emitted as JSON arrays rather than the older
apps' numeric-keyed objects; the portal's `Object.values()` handles both, and
arrays are about half the size.

The endpoint validates envelope *shape* only and never inspects `package` — it
could not read it if it tried, since the payload is encrypted to the portal's
key, not this server's.

`toFlatRecord()` is the single module that knows the admin portal's field
names. If the portal schema moves, it moves there and nowhere else.

## Open positions

The step-2 dropdown is `OPEN_POSITIONS` in `src/lib/positions.ts`. To open a
role, add its title; to close one, delete the line. Redeploy either way.

Titles must match `OPENINGS` in
`schmidbauer-lumber-site-v2/src/data/stations.ts` **exactly** — the careers
page links here as `?position=<title>` and `resolvePosition()` matches against
the open roles case- and whitespace-insensitively but otherwise literally. A
link naming a role that isn't open (a closed job, an old posting, a
hand-edited URL) resolves to nothing and the applicant lands on the
entry-level default. The query string cannot introduce a role that isn't in
the list, which is the point: that was the old free-text field's failure mode.

Applications already submitted keep the title they were sent with. Nothing
downstream re-validates against this list.

## The voluntary survey

Removed from the flow 2026-08-31 at SLI's request. SLI is a small site, is not
a federal contractor, and collects demographic data only from people it has
hired; TRL, which is contractor-bound, still runs its own copy of the step.

It was unwired, not deleted. `step-voluntary.tsx`, the `eeo*` fields in
`schema.ts` and `defaultValues`, the option sets, and the step definition
(`VOLUNTARY_STEP` in `steps.ts`) all remain. Restoring it is two edits, listed
at the top of `src/components/steps/step-voluntary.tsx`.

One detail that is easy to get wrong: `toFlatRecord()` now **omits** the three
`eeo*` keys rather than sending them blank. The portal's `mapDemographics()`
treats the presence of those keys as "this applicant was asked and may have
declined", so blank values would write an `ApplicantDemographics` row for
every SLI application and dilute the response-rate reporting TRL depends on.
Absent keys write no row at all.

`EEO-SURVEY-REVIEW.md` still holds the regulatory analysis, and stays relevant
if SLI's contractor status ever changes.

## Known gaps for follow-up

- **A wrong `SLI_PUB` fails silently and unrecoverably.** An earlier keypair
  had a hand-edited public key that matched no secret; applications would
  have encrypted fine and been permanently undecryptable, showing up only as
  `failedDecrypt` climbing in the portal sync. Keys were regenerated
  2026-08-05 and round-trip verified. **Whenever these keys are rotated,
  verify the pair before deploying:**

  ```bash
  node -e 'const n=require("tweetnacl");
  const b=s=>new Uint8Array(s.trim().split(/\s+/).map(Number));
  console.log([...n.box.keyPair.fromSecretKey(b(process.env.SLI_SEC)).publicKey].join(" ")
    ===b(process.env.SLI_PUB).join(" ")?"MATCH":"MISMATCH")'
  ```

- **A missing `<CODE>_PUB` in the portal crashes the entire sync.**
  `getReceiverKeys` throws on a missing key, and `sync-applications.ts` calls
  it outside any `try`, so one unconfigured company aborts the run for every
  other mill too. Worth hardening — the receiver's public key isn't even used
  for decryption, only its secret is.
- **`toFlatRecord()` emits fields the portal's `mapDecryptedFields` drops.**
  References have no column in the portal's `Application` model, so they
  decrypt successfully and are then discarded on write.
- **The open-roles list is duplicated.** `src/lib/positions.ts` here and
  `OPENINGS` in `schmidbauer-lumber-site-v2/src/data/stations.ts` must agree,
  by exact title, or a careers-page apply link lands on the default role
  instead of the one it advertised. Two repos, two deploys, no enforcement.
- **The certification text says "My signature below certifies…"** but the form
  collects no signature (signatures happen in person at interview). The
  checkbox is presented as the electronic equivalent. Worth a legal read.
- **References have no sister-app fields.** `toFlatRecord()` emits new names
  (`referenceOneName`, …) that the admin portal will need to learn.
- **No draft save / resume.** Explicitly out of scope; a long form with no
  resume will lose some applicants who get interrupted.

## Portal dependency

This app requires a matching change in `mill-jobs-portal-v2`, already made in
that repo but **not yet committed or deployed**:

| File | Change |
|---|---|
| `src/lib/aws-sync/decrypt.ts` | `decryptSubmission` takes the sender public key from the message when present, falling back to the env keypair for legacy TRL/SRM records |
| `src/lib/aws-sync/sync-applications.ts` | `parseRawItem` reads `sender_public_key`; legacy sender keys resolve lazily so an ephemeral-only deployment doesn't need `S_PUB`/`S_SEC` |

Backward compatible: existing TRL/SRM records take the unchanged path.
**Deploy the portal change before pointing applicants at this form**, or
submissions will pile up undecryptable.

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
