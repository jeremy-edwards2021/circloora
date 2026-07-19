import { Container } from "@/components/layout/container";
import { ViewStatePanel } from "@/components/states/view-state";

export default function NotFound() {
  return (
    <Container className="flex min-h-[70dvh] items-center justify-center py-12">
      <ViewStatePanel
        action={{ href: "/", label: "Go home" }}
        description="This Circloora page or record is no longer available. Your other saved work has not been changed."
        state="blocking_error"
        title="We couldn’t find that"
      />
    </Container>
  );
}
