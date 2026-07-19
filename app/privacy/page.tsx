import type { Metadata } from "next";

import { Container } from "@/components/layout/container";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Circloora protects your privacy and handles your data.",
};

const sections = [
  {
    title: "Local by default",
    content:
      "Circloora stores all your data locally on your device using IndexedDB. No account is required, and no data leaves your device unless you explicitly choose to export or sync it.",
  },
  {
    title: "Images are ephemeral",
    content:
      "Raw images captured during investigations are processed in memory and are not stored by default. You must separately opt in to retain sanitized thumbnails or evidence images.",
  },
  {
    title: "No analytics without consent",
    content:
      "Circloora does not send analytics, telemetry, or usage data to any server unless you have explicitly consented and a configuration is active.",
  },
  {
    title: "Cloud sync is optional",
    content:
      "Cloud account creation and synchronization are entirely optional feature gates. They are disabled until you configure credentials and choose to enable them.",
  },
  {
    title: "Your data, your control",
    content:
      "You can export, import, or delete all your local data at any time. Local deletion clears IndexedDB and all cached data from your device.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader title="Privacy" />
      <Container className="pt-2 pb-12 sm:pt-4">
        <p className="max-w-2xl text-base leading-7 text-carbon-muted">
          Circloora is designed with privacy as a foundation. Your things, your data, your device.
        </p>

        <div className="mt-8 grid gap-4">
          {sections.map((section) => (
            <Card key={section.title} className="p-5">
              <h2 className="text-base font-semibold tracking-[-0.01em]">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-carbon-muted">{section.content}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-carbon-subtle uppercase">
            Security
          </p>
          <p className="mt-3 text-sm leading-6 text-carbon-muted">
            All API communication uses same-origin requests with session-based CSRF protection.
            Uploaded content is validated, decoded, and sanitized. Third-party scripts are blocked
            by default. For more detail, see the full security documentation.
          </p>
        </Card>
      </Container>
    </>
  );
}
