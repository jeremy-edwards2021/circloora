import { Container } from "@/components/layout/container";
import { ViewStatePanel } from "@/components/states/view-state";

export default function Loading() {
  return (
    <Container className="flex min-h-[70dvh] items-center justify-center py-12">
      <ViewStatePanel
        description="Opening your saved Circloora view."
        state="loading"
        title="Getting things ready"
      />
    </Container>
  );
}
