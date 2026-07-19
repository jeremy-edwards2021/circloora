import { randomUUID } from "node:crypto";

import {
  PublicAgentEventSchema,
  publicSummary,
  type PublicAgentEvent,
  type PublicEventType,
} from "../contracts/public-events";

export class PublicEventFactory {
  private sequence: number;

  constructor(
    private readonly runId: string,
    private readonly investigationId: string,
    private readonly now: () => Date,
    initialSequence = 0,
  ) {
    this.sequence = initialSequence;
  }

  create(
    eventType: PublicEventType,
    options: Pick<PublicAgentEvent, "agent" | "status" | "userActionRequired"> &
      Partial<Pick<PublicAgentEvent, "toolName" | "objectId">>,
  ): PublicAgentEvent {
    this.sequence += 1;
    return PublicAgentEventSchema.parse({
      eventId: randomUUID(),
      sequence: this.sequence,
      timestamp: this.now().toISOString(),
      runId: this.runId,
      investigationId: this.investigationId,
      eventType,
      summary: publicSummary(eventType),
      ...options,
    });
  }
}
