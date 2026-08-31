/**
 * The roles SLI is currently hiring for.
 *
 * This list is the entire contents of the position dropdown on step 2. It
 * exists because a free-text position field invited applications for jobs
 * that were never open — the applicant spends twenty minutes on a form for a
 * role that doesn't exist, and someone at SLI has to write back and say so.
 *
 * KEEP IN SYNC with `OPENINGS` in
 * `schmidbauer-lumber-site-v2/src/data/stations.ts`, which is what the
 * careers page renders and what its "Apply for this position" buttons pass
 * as `?position=`. The two lists are matched by exact title. A title here
 * that the careers site doesn't post is simply an option nobody is linked
 * to; a title the careers site posts but that is missing here means its
 * apply link falls back to the entry-level role — see `resolvePosition`.
 *
 * Closing a role means deleting its line here and redeploying. Applications
 * already submitted keep whatever title they were sent with; nothing
 * downstream re-validates against this list.
 */

/**
 * The default selection. Always present, always first: it's the role SLI is
 * effectively always hiring for, and the one an applicant who arrived without
 * a link should land on.
 */
export const ENTRY_LEVEL_POSITION = "Entry Level Full-time Floater";

/** Every role that may be applied for right now. Order is display order. */
export const OPEN_POSITIONS = [
  ENTRY_LEVEL_POSITION,
  // Add other openings below, exactly as titled on the careers page.
] as const;

export type OpenPosition = (typeof OPEN_POSITIONS)[number];

/** Ready for `SelectField` — the title is both the value and the label. */
export const POSITION_OPTIONS = OPEN_POSITIONS.map((title) => ({
  value: title,
  label: title,
}));

/**
 * Matches a `?position=` link parameter against the open roles.
 *
 * Comparison is case- and whitespace-insensitive so a hand-typed or
 * re-encoded link still lands on the right role. Anything that doesn't match
 * an open role returns `undefined` — a stale posting for a closed job cannot
 * reintroduce it as a selectable option, which is the whole point of the
 * dropdown. The applicant just gets the default selection instead.
 */
export function resolvePosition(raw: string | undefined): OpenPosition | undefined {
  const needle = (raw ?? "").trim().replace(/\s+/g, " ").toLowerCase();
  if (!needle) return undefined;
  return OPEN_POSITIONS.find((title) => title.toLowerCase() === needle);
}
