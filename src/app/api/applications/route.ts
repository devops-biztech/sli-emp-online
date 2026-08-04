/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  SUBMIT ENDPOINT — STUBBED                                           │
 * │                                                                      │
 * │  This endpoint is a relay. It accepts an opaque encrypted envelope   │
 * │  and returns a receipt. It deliberately does NOT inspect, validate,  │
 * │  destructure, or log the application fields — in production it only  │
 * │  ever sees ciphertext, so any such code would be dead on arrival.    │
 * │                                                                      │
 * │  The only validation here is envelope shape: are the routing fields  │
 * │  present and is the blob within size limits.                         │
 * │                                                                      │
 * │  TO IMPLEMENT FOR REAL: write `payload` to DynamoDB as-is, keyed by  │
 * │  the returned id. Nothing else changes.                              │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import { NextResponse } from "next/server";

/** 1 MB. A text-only application is orders of magnitude smaller. */
const MAX_PAYLOAD_BYTES = 1_000_000;

interface SubmitResponse {
  success: boolean;
  id?: string;
  receivedAt?: string;
  error?: string;
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

  // Envelope-shape check only. We never look inside `ciphertext`.
  const envelope = body as Record<string, unknown> | null;
  if (
    !envelope ||
    typeof envelope.ciphertext !== "string" ||
    envelope.ciphertext.length === 0 ||
    typeof envelope.algorithm !== "string"
  ) {
    return NextResponse.json<SubmitResponse>(
      { success: false, error: "Missing or malformed encrypted payload." },
      { status: 400 },
    );
  }

  if (envelope.ciphertext.length > MAX_PAYLOAD_BYTES) {
    return NextResponse.json<SubmitResponse>(
      { success: false, error: "Payload too large." },
      { status: 413 },
    );
  }

  const id = crypto.randomUUID();
  const receivedAt = new Date().toISOString();

  // ── STUB: real implementation writes the opaque envelope to DynamoDB ──
  //
  //   await dynamo.send(new PutItemCommand({
  //     TableName: process.env.APPLICATIONS_TABLE,
  //     Item: marshall({ id, receivedAt, ...envelope }),
  //   }));
  //
  // Note there is no field-level mapping: the envelope is stored whole.
  // ─────────────────────────────────────────────────────────────────────

  console.info(
    `[applications] accepted ${id} — ${envelope.algorithm}, ` +
      `${envelope.ciphertext.length} bytes ciphertext (not persisted; stub)`,
  );

  return NextResponse.json<SubmitResponse>({ success: true, id, receivedAt });
}
