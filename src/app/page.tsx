import { ApplicationWizard } from "@/components/wizard/application-wizard";
import { parsePublicKey } from "@/lib/encryption";

export default function Page() {
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

  return <ApplicationWizard portalPublicKey={portalPublicKey} />;
}
