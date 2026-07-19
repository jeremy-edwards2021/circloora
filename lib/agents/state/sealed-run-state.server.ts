import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { z } from "zod";

export const SealedRunStateEnvelopeSchema = z
  .object({
    envelopeVersion: z.literal("circloora-run-state-v1"),
    investigationId: z.string().uuid(),
    runId: z.string().uuid(),
    stateRevision: z.number().int().nonnegative(),
    agentGraphVersion: z.string().min(1).max(80),
    sdkVersion: z.string().min(1).max(80),
    promptBundleVersion: z.string().min(1).max(80),
    modelPolicyVersion: z.string().min(1).max(80),
    createdAt: z.string().datetime({ offset: true }),
    expiresAt: z.string().datetime({ offset: true }),
    principalBindingHash: z.string().min(32).max(128),
    ciphertext: z.string().min(1),
    nonce: z.string().min(1),
    authTag: z.string().min(1),
    plaintextDigest: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export type SealedRunStateEnvelope = z.infer<
  typeof SealedRunStateEnvelopeSchema
>;

type SealMetadata = Omit<
  SealedRunStateEnvelope,
  "ciphertext" | "nonce" | "authTag" | "plaintextDigest"
>;

export function sealRunState(
  serializedState: string,
  metadata: SealMetadata,
  encryptionKey: Buffer,
): SealedRunStateEnvelope {
  assertKey(encryptionKey);
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey, nonce);
  cipher.setAAD(Buffer.from(aad(metadata)));
  const ciphertext = Buffer.concat([
    cipher.update(serializedState, "utf8"),
    cipher.final(),
  ]);
  return SealedRunStateEnvelopeSchema.parse({
    ...metadata,
    ciphertext: ciphertext.toString("base64url"),
    nonce: nonce.toString("base64url"),
    authTag: cipher.getAuthTag().toString("base64url"),
    plaintextDigest: createHash("sha256").update(serializedState).digest("hex"),
  });
}

export function openRunState(
  rawEnvelope: unknown,
  expected: {
    principalBindingHash: string;
    investigationId: string;
    runId: string;
    stateRevision: number;
    agentGraphVersion: string;
    now: Date;
  },
  encryptionKey: Buffer,
): string {
  assertKey(encryptionKey);
  const envelope = SealedRunStateEnvelopeSchema.parse(rawEnvelope);
  if (
    envelope.principalBindingHash !== expected.principalBindingHash ||
    envelope.investigationId !== expected.investigationId ||
    envelope.runId !== expected.runId ||
    envelope.stateRevision !== expected.stateRevision ||
    envelope.agentGraphVersion !== expected.agentGraphVersion ||
    Date.parse(envelope.expiresAt) <= expected.now.getTime()
  ) {
    throw new Error("Sealed state binding is invalid or expired");
  }
  const metadata: SealMetadata = {
    envelopeVersion: envelope.envelopeVersion,
    investigationId: envelope.investigationId,
    runId: envelope.runId,
    stateRevision: envelope.stateRevision,
    agentGraphVersion: envelope.agentGraphVersion,
    sdkVersion: envelope.sdkVersion,
    promptBundleVersion: envelope.promptBundleVersion,
    modelPolicyVersion: envelope.modelPolicyVersion,
    createdAt: envelope.createdAt,
    expiresAt: envelope.expiresAt,
    principalBindingHash: envelope.principalBindingHash,
  };
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey,
    Buffer.from(envelope.nonce, "base64url"),
  );
  decipher.setAAD(Buffer.from(aad(metadata)));
  decipher.setAuthTag(Buffer.from(envelope.authTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  if (
    createHash("sha256").update(plaintext).digest("hex") !==
    envelope.plaintextDigest
  ) {
    throw new Error("Sealed state digest mismatch");
  }
  return plaintext;
}

function aad(metadata: SealMetadata): string {
  return [
    metadata.envelopeVersion,
    metadata.investigationId,
    metadata.runId,
    metadata.stateRevision,
    metadata.agentGraphVersion,
    metadata.principalBindingHash,
    metadata.expiresAt,
  ].join("|");
}

function assertKey(key: Buffer): void {
  if (key.byteLength !== 32)
    throw new Error("Agent state encryption key must be 32 bytes");
}
