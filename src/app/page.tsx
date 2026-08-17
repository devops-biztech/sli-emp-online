import { ApplicationWizard } from "@/components/wizard/application-wizard";
import { parsePublicKey } from "@/lib/encryption";

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
   * `?position=Lumber%20grader` prefills step 2's position field, so job
   * postings can link straight to an application for that opening. It's a
   * convenience, not an allowlist — the field stays fully editable.
   */
  const { position } = await searchParams;
  const initialPosition = (Array.isArray(position) ? position[0] : (position ?? ""))
    .trim()
    .slice(0, 100);

  return (
    <ApplicationWizard
      portalPublicKey={portalPublicKey}
      initialPosition={initialPosition}
    />
  );
}
