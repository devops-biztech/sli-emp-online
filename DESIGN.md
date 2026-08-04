# Design

Recorded from the built interface. Tokens live in `src/app/globals.css`; this
file explains what they're for and the rules that keep the surface coherent.

**Mode: Operate.** The applicant is completing a task. Scanability, familiar
affordances, and state clarity outrank expression. Brand lives in precise
details, never in the way of the form.

## Palette

Sampled from `assets/sli-logo-color.png`. Declared in oklch.

| Token | Role | Hex ref |
|---|---|---|
| `--brand-green` | Primary. Structure, focus rings, selected states. | `#24843C` |
| `--brand-green-deep` | Header ground, headings inside cards, text on gold. | `#306030` |
| `--brand-green-light` | Reserved; sampled from the logo's saw blade. | `#90CC60` |
| `--brand-green-tint` | Selected-tile and section-header fill. | — |
| `--brand-gold` | Progress fill and the single primary action. | `#FCCC24` |
| `--brand-gold-deep` | Reserved for gold-on-light text needs. | — |

**The gold rule.** Gold is a light color — it never carries white text and
never fills a large area. Anything on gold takes `--brand-green-deep`. Gold
appears in exactly two places: the completed segments of the progress bar, and
the Next / Submit button. That scarcity is what makes it read as "forward."

**Color strategy: Restrained.** Neutrals and a faintly warm ground, with green
as structure and gold as the single accent. Chosen because the visitor came to
operate, and because an application form that shouts undermines the seriousness
of what it collects.

**Light, not dark.** The use scene decided it: an applicant on a phone,
possibly outdoors in daylight, possibly at an office kiosk. Also, this is
paperwork — it should read as paperwork.

## Type

Geist Sans throughout, Geist Mono for the confirmation number only. A workhorse
UI face is correct for Operate; the brand's own lettering lives in the logo,
which is an image, so the interface doesn't need to imitate it.

- Step title: `text-2xl` / `sm:text-3xl`, semibold, tight tracking
- Section headings inside cards: `text-sm`, semibold, `--brand-green-deep`
- Labels: `text-sm`, medium
- Body and inputs: `text-base` (16px floor, enforced globally)

## The 16px input floor

`globals.css` forces `font-size: max(1rem, 16px)` on every `input`, `select`,
and `textarea`. Below 16px, iOS Safari zooms the viewport on focus and the
applicant loses their place mid-form. This is not negotiable on a form this long.

## Layout

- Content column caps at `max-w-3xl`. Comfortable measure, and it keeps any
  single step from sprawling on desktop.
- Field pairs sit two-up from `sm:` and stack below.
- The step body is one vertical rhythm: `gap-5` between fields, `gap-4` inside
  a grouped row.
- Navigation is sticky at the bottom on every viewport, so Next is always at
  thumb reach and never requires scrolling to find.

## Components

**Choice tiles.** Radio and checkbox options render as full-width bordered
tiles, minimum 44px tall, with the control inside the label. Selected state is
a green border plus tint, not just a filled dot. Sized for work gloves and
imprecise taps.

**Entry cards.** Repeatable sections (colleges, trade schools, licenses,
references) use a card with a tinted header carrying the entry name and a
Remove control. Add is a dashed-outline button below the set. Empty states say
what the section is for rather than just "none."

**Work experience is paged, not stacked.** One job carries twelve fields;
three stacked would make it the one step that violates the no-heavy-scroll
rule. Jobs switch via tabs above the panel. A blocked Next pages to the job
that actually has the error.

**Conditional reveals** are a bordered, tinted panel directly under the
question that triggered them — never a colored left-border stripe.

**Dates are two dropdowns**, month and year, not `<input type="month">`. The
native control's typed format varies by browser and locale, so it silently
rejects the formats people actually type. Dropdowns have nothing to guess and
raise no keyboard on a phone. Same reasoning as the native `<select>` above:
for this audience, the boring OS control wins.

## Error handling

Every field renders errors through one shared shell, so the contract is uniform:

- `aria-invalid` on the control, `aria-describedby` wiring hint and error text
- error text in a `role="alert"` node with an icon, so it announces on appearance
- destructive border plus a soft ring on the control itself

A blocked Next also raises a banner above the step and moves focus to the first
invalid control. The banner clears the moment the applicant edits anything — it
describes the last Next press, not a standing state.

## Motion

One authored moment: each step arrives with a 260ms fade-and-rise on an
exponential ease-out. It reads as turning a page, which is the whole premise of
the wizard. Nothing else animates. `prefers-reduced-motion` is honored globally.

## Accessibility commitments

WCAG 2.1 AA.

- Labeled stepper with `aria-current="step"`; completed steps are reachable by
  click, upcoming ones are disabled
- A visually hidden `aria-live` region announces step position and percentage
  on change
- Focus moves to the step heading on navigation, and to the first invalid
  control on a blocked advance
- Skip-to-form link as the first focusable element
- Focus rings are green, offset, and 3px — they survive being seen 100+ times
- Native `<select>` rather than a custom listbox: on a phone the OS wheel is
  faster and more familiar for this audience

## What this surface refuses

- Cards-of-icon-plus-heading as page structure
- Gradient text, glass, decorative blur
- Colored left-border callouts
- Progress rings and sparklines
- Emoji standing in for icons (Lucide only, one stroke weight)
- Any step long enough to require sustained scrolling
