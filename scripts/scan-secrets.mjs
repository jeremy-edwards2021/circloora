import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const result = spawnSync("git", ["ls-files", "-co", "--exclude-standard"], {
  encoding: "utf8",
});

if (result.status !== 0) {
  process.stderr.write(
    "Unable to enumerate repository files for secret scanning.\n",
  );
  process.exit(1);
}

const sourceRoots = /^(app|components|lib|public|scripts)\//;
const sourceFiles = result.stdout
  .split("\n")
  .filter(Boolean)
  .filter(
    (path) =>
      sourceRoots.test(path) ||
      path === "proxy.ts" ||
      path === "next.config.ts",
  )
  .filter((path) => path !== "scripts/scan-secrets.mjs");

const forbidden = [
  { label: "public OpenAI secret", pattern: /NEXT_PUBLIC_OPENAI/ },
  {
    label: "public provider secret",
    pattern: /NEXT_PUBLIC_.*(?:SECRET|SERVICE_ROLE|PRIVATE_KEY)/,
  },
  {
    label: "private key material",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    label: "OpenAI key-shaped value",
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  },
];

const findings = [];
for (const path of sourceFiles) {
  if (/\.(?:png|jpg|jpeg|ico|webp|woff2?)$/i.test(path)) continue;
  const content = readFileSync(path, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(content)) findings.push(`${path}: ${rule.label}`);
  }
}

if (findings.length > 0) {
  process.stderr.write(
    `Secret scan failed:\n${findings.map((item) => `- ${item}`).join("\n")}\n`,
  );
  process.exit(1);
}

process.stdout.write(
  `Secret scan passed (${sourceFiles.length} source files checked).\n`,
);
