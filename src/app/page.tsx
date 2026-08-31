import { ApplicationWizard } from "@/components/wizard/application-wizard";
import { parsePublicKey } from "@/lib/encryption";
import { resolvePosition } from "@/lib/positions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ position?: string | string[] }>;
}) {
  /*
   * Only the PUBLIC half ever reaches the browser — the portal's secret key
   * is not needed here and must never be added to this app's environment.
   *
   * Validated here, on the server, on purpose: if the key is missing or
   * malformed the page fails to render at all. The alternative is an
   * applicant discovering it after filling out all ten steps, which is the
   * single worst place in this app to surface a configuration error.
   */
  const portalPublicKey = process.env.SLI_PUB ?? "";
  parsePublicKey(portalPublicKey);

  /*
   * `?position=Entry%20Level%20Full-time%20Floater` preselects step 2's
   * position dropdown, so a careers-page posting can link straight to an
   * application for that opening.
   *
   * This IS an allowlist now: the value is matched against `OPEN_POSITIONS`
   * and anything else — a stale link to a role that has since closed, a
   * hand-edited URL — resolves to `undefined`, which leaves the applicant on
   * the default entry-level selection. A closed role cannot be re-opened
   * through the query string.
   */
  const { position } = await searchParams;
  const initialPosition = resolvePosition(
    Array.isArray(position) ? position[0] : position,
  );

  return (
    <ApplicationWizard
      portalPublicKey={portalPublicKey}
      initialPosition={initialPosition}
    />
  );
}
