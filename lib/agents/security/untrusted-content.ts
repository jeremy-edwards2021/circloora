const injectionMarkers = [
  /ignore\s+(all|any|the)?\s*(previous|prior|developer|system)\s+instructions?/i,
  /reveal\s+(the\s+)?(system|developer)\s+(prompt|message)/i,
  /(?:api|secret|access)[-_ ]?key/i,
  /call\s+(?:any\s+)?(?:hidden|admin|shell|filesystem)\s+tool/i,
  /override\s+(?:the\s+)?(?:approval|safety|policy|ranking)/i,
];

export interface UntrustedText {
  text: string;
  injectionSignals: string[];
}

export function markUntrustedEvidence(
  text: string,
  maxLength = 2_000,
): UntrustedText {
  const bounded = text.slice(0, maxLength);
  return {
    text: bounded,
    injectionSignals: injectionMarkers
      .filter((marker) => marker.test(bounded))
      .map((marker) => marker.source)
      .slice(0, 4),
  };
}

export function assertNoForbiddenSnapshotData(value: unknown): void {
  visit(value, new Set(), 0);
}

const forbiddenKeys =
  /(?:apiKey|authorization|cookie|token|secret|password|prompt|reasoning|rawResponse|imageBytes|base64|signedUrl|receiptText|exactAddress)/i;

function visit(value: unknown, seen: Set<unknown>, depth: number): void {
  if (depth > 24) throw new Error("Snapshot nesting exceeds safe limit");
  if (value === null || typeof value === "number" || typeof value === "boolean")
    return;
  if (typeof value === "string") {
    if (value.length > 50_000)
      throw new Error("Snapshot string exceeds safe limit");
    if (
      /^data:/i.test(value) ||
      /(?:sk-|Bearer\s+)[A-Za-z0-9_-]{12,}/.test(value)
    ) {
      throw new Error(
        "Snapshot contains prohibited encoded or credential data",
      );
    }
    return;
  }
  if (typeof value !== "object")
    throw new Error("Snapshot contains unsupported value");
  if (seen.has(value)) throw new Error("Snapshot contains a cycle");
  seen.add(value);
  if (Array.isArray(value)) {
    if (value.length > 500)
      throw new Error("Snapshot array exceeds safe limit");
    for (const item of value) visit(item, seen, depth + 1);
  } else {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length > 500)
      throw new Error("Snapshot object exceeds safe limit");
    for (const [key, child] of entries) {
      if (forbiddenKeys.test(key))
        throw new Error(`Snapshot contains forbidden field: ${key}`);
      visit(child, seen, depth + 1);
    }
  }
  seen.delete(value);
}
