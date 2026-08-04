/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  CLIENT-SIDE ENCRYPTION HOOK — STUBBED                               │
 * │                                                                      │
 * │  This is the seam where real end-to-end encryption drops in. Today   │
 * │  `encrypt()` is a pass-through that only base64-encodes, so the      │
 * │  pipeline is fully wired and testable without any crypto.            │
 * │                                                                      │
 * │  DO NOT put real encryption anywhere else. The contract below is     │
 * │  the whole integration surface:                                      │
 * │                                                                      │
 * │      assemble → encrypt(payload) → POST ciphertext → store           │
 * │                                                                      │
 * │  When implementing for real:                                         │
 * │    1. Fetch/pin the admin portal's public key.                       │
 * │    2. Generate a fresh AES-GCM content key per submission.           │
 * │    3. Encrypt the JSON with it; wrap the content key with the        │
 * │       portal's public key (RSA-OAEP or ECDH via WebCrypto).          │
 * │    4. Return the wrapped key + IV + ciphertext in `EncryptedPayload`.│
 * │    5. Bump `algorithm` so the portal can route by version.           │
 * │                                                                      │
 * │  Nothing downstream — the endpoint, the transport, the datastore —   │
 * │  may ever read inside `ciphertext`. That is the point.               │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import type { ApplicationRecord } from "./flatten";

/**
 * The envelope that travels over the wire. Deliberately opaque: the only
 * plaintext is routing metadata the server needs to store the blob at all.
 */
export interface EncryptedPayload {
  /** Bump when the scheme changes so the portal can route by version. */
  algorithm: "none-passthrough-v0" | "aes-gcm-256-rsa-oaep-v1";
  /** Schema version of the *plaintext* inside, for portal-side migrations. */
  schemaVersion: 1;
  /** Base64. Opaque to every consumer. */
  ciphertext: string;
  /** Base64 initialization vector. Empty while stubbed. */
  iv: string;
  /** Base64 content key wrapped with the portal's public key. Empty while stubbed. */
  encryptedKey: string;
  /** Identifies which portal keypair to decrypt with. Null while stubbed. */
  keyId: string | null;
  /** Client-side timestamp; the server records its own receipt time too. */
  submittedAt: string;
}

function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

/**
 * STUB. Serializes and base64-encodes — no confidentiality whatsoever.
 *
 * The async signature is deliberate: WebCrypto is promise-based, so the real
 * implementation slots in here without touching a single caller.
 */
export async function encrypt(
  record: ApplicationRecord,
): Promise<EncryptedPayload> {
  const plaintext = JSON.stringify(record);

  // ── REPLACE FROM HERE ──────────────────────────────────────────────
  const ciphertext = toBase64(plaintext);
  // ── TO HERE ────────────────────────────────────────────────────────

  return {
    algorithm: "none-passthrough-v0",
    schemaVersion: 1,
    ciphertext,
    iv: "",
    encryptedKey: "",
    keyId: null,
    submittedAt: new Date().toISOString(),
  };
}

/** Mirror of `encrypt`, for local verification only. Never runs in production. */
export function decryptStub(payload: EncryptedPayload): ApplicationRecord {
  if (payload.algorithm !== "none-passthrough-v0") {
    throw new Error(
      `decryptStub cannot read '${payload.algorithm}'. Use the real client.`,
    );
  }
  const binary = atob(payload.ciphertext);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as ApplicationRecord;
}
