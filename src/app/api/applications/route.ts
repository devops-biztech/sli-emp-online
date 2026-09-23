/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  SUBMIT ENDPOINT                                                     │
 * │                                                                      │
 * │  A relay. It accepts an opaque encrypted envelope, writes it whole   │
 * │  to DynamoDB, and returns a receipt. It deliberately does NOT        │
 * │  inspect, destructure, or log the application fields — it *cannot*,  │
 * │  since the payload is encrypted to the admin portal's public key     │
 * │  and this server holds no secret key. Any field-level logic here     │
 * │  would be dead code.                                                 │
 * │                                                                      │
 * │  The only validation is envelope shape: are the routing fields       │
 * │  present and is the blob within size limits.                         │
 * │                                                                      │
 * │  The item shape is dictated by the admin portal's sync, which scans  │
 * │  this table and reads exactly these attributes — see `parseRawItem`  │
 * │  in mill-jobs-portal-v2/src/lib/aws-sync/sync-applications.ts.       │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { NextResponse } from "next/server";
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

/** 1 MB. A text-only application is orders of magnitude smaller. */
const MAX_PAYLOAD_BYTES = 1_000_000;

interface SubmitResponse {
  success: boolean;
  id?: string;
  receivedAt?: string;
  error?: string;
}

/**
 * Built per-request rather than at module load so a missing credential is a
 * 500 on submit, not a crash at import time that takes the whole route down.
 */
function dynamoConfig() {
  const {
    TABLE_NAME: tableName,
    REGION: region,
    DB_ACCESS_KEY_ID: accessKeyId,
    DB_SECRET_ACCESS_KEY: secretAccessKey,
  } = process.env;

  if (!tableName || !region || !accessKeyId || !secretAccessKey) {
    const missing = [
      ["TABLE_NAME", tableName],
      ["REGION", region],
      ["DB_ACCESS_KEY_ID", accessKeyId],
      ["DB_SECRET_ACCESS_KEY", secretAccessKey],
    ]
      .filter(([, v]) => !v)
      .map(([k]) => k)
      .join(", ");
    throw new Error(`Submission storage is not configured (missing ${missing})`);
  }

  return {
    tableName,
    client: new DynamoDBClient({
      region,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json<SubmitResponse>(
      { success: false, error: "Malformed request body." },
      { status: 400 },
    );
  }

  // Envelope-shape check only. We never look inside `package`, and could
  // not read it if we tried — it is encrypted to the portal's key, not ours.
  const envelope = body as Record<string, unknown> | null;
  if (
    !envelope ||
    typeof envelope.package !== "string" ||
    envelope.package.length === 0 ||
    typeof envelope.companyName !== "string" ||
    typeof envelope.date !== "string"
  ) {
    return NextResponse.json<SubmitResponse>(
      { success: false, error: "Missing or malformed encrypted payload." },
      { status: 400 },
    );
  }

  if (envelope.package.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json<SubmitResponse>(
      { success: false, error: "Payload too large." },
      { status: 413 },
    );
  }

  const id = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  try {
    const { client, tableName } = dynamoConfig();

    // The envelope is stored whole. No field-level mapping exists, or could.
    await client.send(
      new PutItemCommand({
        TableName: tableName,
        Item: {
          id: { S: id },
          company: { S: envelope.companyName },
          date: { S: envelope.date },
          package: { S: envelope.package },
          receivedByCompany: { BOOL: false },
        },
        // Refuse to clobber an existing row. A UUID collision is effectively
        // impossible; this guards against a bug, not against chance.
        ConditionExpression: "attribute_not_exists(id)",
      }),
    );
  } catch (error) {
    /*
     * Never report success on a failed write. The applicant sees a
     * confirmation screen and will not submit twice — a silent failure here
     * loses the application outright, which is the worst outcome this app
     * has. Log the reason server-side, tell the applicant something
     * actionable, and keep the ciphertext out of the log either way.
     */
    console.error(
      `[applications] FAILED to persist ${id} for ${envelope.companyName}:`,
      error instanceof Error ? error.message : error,
    );

    return NextResponse.json<SubmitResponse>(
      {
        success: false,
        error:
          "We could not save your application. Please try again in a moment. " +
          "If this keeps happening, call us at 707-443-7025.",
      },
      { status: 503 },
    );
  }

  console.info(
    `[applications] stored ${id} for ${envelope.companyName} — ` +
      `${envelope.package.length} bytes ciphertext`,
  );

  return NextResponse.json<SubmitResponse>({ success: true, id, receivedAt });
}
