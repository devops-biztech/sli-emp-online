import { ApplicationWizard } from "@/components/wizard/application-wizard";
import { resolvePosition } from "@/lib/positions";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ position?: string | string[] }>;
}) {
  /*
   * `?position=Entry%20Level%20Full-time%20Floater` preselects step 2's
   * position dropdown, so a careers-page posting can link straight to an
   * application for that opening. Anything that isn't in `OPEN_POSITIONS`
   * resolves to `undefined` and the applicant lands on the default role.
   */
  const { position } = await searchParams;
  const initialPosition = resolvePosition(
    Array.isArray(position) ? position[0] : position,
  );

  return <ApplicationWizard initialPosition={initialPosition} />;
}
