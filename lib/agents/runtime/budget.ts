export const DEFAULT_RUN_LIMITS = Object.freeze({
  objects: 8,
  imagesPerObject: 4,
  modelTurns: 8,
  toolCalls: 12,
  retriesPerTool: 2,
});

export type BudgetCounter = keyof typeof DEFAULT_RUN_LIMITS;

export class RunLimitError extends Error {
  constructor(
    readonly limitKind: BudgetCounter,
    readonly limit: number,
  ) {
    super(`Run limit reached: ${limitKind}`);
    this.name = "RunLimitError";
  }
}

export interface RunBudgetSnapshot {
  limits: typeof DEFAULT_RUN_LIMITS;
  used: Record<BudgetCounter, number>;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  startedAt: string;
}

export class RunBudget {
  readonly limits: typeof DEFAULT_RUN_LIMITS;
  private readonly used: Record<BudgetCounter, number> = {
    objects: 0,
    imagesPerObject: 0,
    modelTurns: 0,
    toolCalls: 0,
    retriesPerTool: 0,
  };
  private inputTokens = 0;
  private outputTokens = 0;
  private cachedTokens = 0;
  private readonly startedAt: string;

  constructor(
    limits: Partial<typeof DEFAULT_RUN_LIMITS> = {},
    now: Date = new Date(),
  ) {
    this.limits = Object.freeze({ ...DEFAULT_RUN_LIMITS, ...limits });
    this.startedAt = now.toISOString();
  }

  reserve(counter: BudgetCounter, amount = 1): void {
    if (!Number.isInteger(amount) || amount < 0) {
      throw new TypeError("Budget reservation must be a nonnegative integer");
    }
    const next = this.used[counter] + amount;
    if (next > this.limits[counter]) {
      throw new RunLimitError(counter, this.limits[counter]);
    }
    this.used[counter] = next;
  }

  reconcileUsage(usage: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
  }): void {
    this.inputTokens += boundedTokenCount(usage.inputTokens);
    this.outputTokens += boundedTokenCount(usage.outputTokens);
    this.cachedTokens += boundedTokenCount(usage.cachedTokens);
  }

  snapshot(): RunBudgetSnapshot {
    return {
      limits: this.limits,
      used: { ...this.used },
      inputTokens: this.inputTokens,
      outputTokens: this.outputTokens,
      cachedTokens: this.cachedTokens,
      startedAt: this.startedAt,
    };
  }
}

function boundedTokenCount(value: number | undefined): number {
  if (value === undefined) return 0;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError("Token usage must be a nonnegative safe integer");
  }
  return value;
}
