/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │  CLIENT-SIDE ENCRYPTION                                              │
 * │                                                                      │
 * │  Real end-to-end encryption to the admin portal, using tweetnacl     │
 * │  `box` (Curve25519 + XSalsa20-Poly1305) — the same primitive the     │
 * │  portal already decrypts with for the other mills.                   │
 * │                                                                      │
 * │  The one deliberate difference from the older sister apps: the       │
 * │  sender keypair is EPHEMERAL, generated fresh per submission and     │
 * │  discarded immediately after. This is the sealed-box construction.   │
 * │                                                                      │
 * │  Why it matters: `nacl.box` needs a sender secret key. The older     │
 * │  apps satisfied that by shipping a long-lived one to the browser,    │
 * │  which put every mill's secret key in public page source. An         │
 * │  ephemeral key means this client holds only the portal's PUBLIC      │
 * │  key — safe to ship — and nothing here can decrypt anything.         │
 * │                                                                      │
 * │  The ephemeral public key travels in the envelope so the portal can  │
 * │  decrypt; it is public by construction and carries no secret.        │
 * │                                                                      │
 * │      assemble → encrypt(record, portalPublicKey) → POST → store      │
 * │                                                                      │
 * │  Nothing downstream — the endpoint, the transport, the datastore —   │
 * │  can read inside `cipher_text`. Not even this app's own server.      │
 * └──────────────────────────────────────────────────────────────────────┘
 */
import nacl from "tweetnacl";

import type { ApplicationRecord } from "./flatten";

/** Company code the portal routes on to pick a decryption keypair. */
export const COMPANY_CODE = "SLI";

/**
 * The envelope inside `package`. Field names are inherited from the sister
 * apps so the portal's existing parser reads them unchanged — `cipher_text`
 * and `one_time_code` (the nonce) are load-bearing spellings, not choices.
 *
 * Byte arrays are plain JSON arrays. The portal rebuilds them with
 * `Object.values()`, which handles arrays and the older apps' numeric-keyed
 * objects identically, so this stays compatible while being about half
 * the size on the wire.
 */
export interface EncryptedEnvelope {
  /** Lets the portal tell ephemeral-sender records from the legacy ones. */
  algorithm: "nacl-box-ephemeral-v1";
  /** Schema version of the *plaintext* inside, for portal-side migrations. */
  schemaVersion: 1;
  /** Opaque to every consumer. */
  cipher_text: number[];
  /** The 24-byte nonce. Named for the sister apps' wire format. */
  one_time_code: number[];
  /** Ephemeral public key for this one submission. Public by construction. */
  sender_public_key: number[];
}

/**
 * What actually gets POSTed. `date` and `companyName` are plaintext routing
 * metadata — the portal needs the company code to choose a keypair, and it
 * cannot read the ciphertext to find it. They reveal only that *somebody*
 * applied to SLI at a given time, never who.
 */
export interface Submission {
  date: string;
  companyName: string;
  /** JSON-stringified `EncryptedEnvelope`. */
  package: string;
}

/**
 * Parses the portal's key format: 32 space-separated byte values, e.g.
 * "244 203 31 ...". Kept identical to `keys.ts` in the portal so one
 * env var can be copied between the two without reformatting.
 */
export function parsePublicKey(raw: string | undefined): Uint8Array {
  if (!raw?.trim()) {
    throw new Error(
      "Missing the portal public key. Set SLI_PUB in the environment.",
    );
  }

  const bytes = raw.trim().split(/\s+/).map(Number);

  if (bytes.some((b) => !Number.isInteger(b) || b < 0 || b > 255)) {
    throw new Error("SLI_PUB is not a space-separated list of byte values.");
  }
  if (bytes.length !== nacl.box.publicKeyLength) {
    throw new Error(
      `SLI_PUB must be ${nacl.box.publicKeyLength} bytes, got ${bytes.length}.`,
    );
  }

  return new Uint8Array(bytes);
}

/**
 * Encrypts one application to the portal's public key.
 *
 * The ephemeral secret key exists only inside this function and is zeroed
 * before returning, so a heap snapshot taken afterwards cannot recover it.
 * That is belt-and-braces: even if it leaked it would compromise exactly
 * one submission, which is the whole point of it being ephemeral.
 */
export async function encrypt(
  record: ApplicationRecord,
  portalPublicKey: Uint8Array,
): Promise<EncryptedEnvelope> {
  const plaintext = new TextEncoder().encode(JSON.stringify(record));

  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  try {
    const cipherText = nacl.box(
      plaintext,
      nonce,
      portalPublicKey,
      ephemeral.secretKey,
    );

    // nacl.box returns null only on malformed key material.
    if (!cipherText) {
      throw new Error("Encryption failed. The portal key may be invalid.");
    }

    return {
      algorithm: "nacl-box-ephemeral-v1",
      schemaVersion: 1,
      cipher_text: Array.from(cipherText),
      one_time_code: Array.from(nonce),
      sender_public_key: Array.from(ephemeral.publicKey),
    };
  } finally {
    ephemeral.secretKey.fill(0);
    plaintext.fill(0);
  }
}

/** Wraps an envelope in the outer record the submit endpoint stores. */
export function toSubmission(envelope: EncryptedEnvelope): Submission {
  return {
    date: new Date().toISOString(),
    companyName: COMPANY_CODE,
    package: JSON.stringify(envelope),
  };
}
