import "server-only";

import OpenAI from "openai";
import { setDefaultOpenAIClient } from "@openai/agents";

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  realtimeModel?: string;
  project?: string;
  webSearchEnabled: boolean;
  realtimeEnabled: boolean;
}

export class MissingLiveConfigurationError extends Error {
  readonly code = "blocked_missing_credential";

  constructor(message: string) {
    super(message);
    this.name = "MissingLiveConfigurationError";
  }
}

export function readOpenAIConfig(
  environment: NodeJS.ProcessEnv = process.env,
): OpenAIConfig {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_MODEL?.trim();
  if (!apiKey)
    throw new MissingLiveConfigurationError(
      "Live OpenAI is unavailable because OPENAI_API_KEY is not configured.",
    );
  if (!model)
    throw new MissingLiveConfigurationError(
      "Live OpenAI is unavailable because OPENAI_MODEL is not configured.",
    );
  return {
    apiKey,
    model,
    webSearchEnabled: environment.ENABLE_WEB_SEARCH === "true",
    realtimeEnabled: environment.ENABLE_REALTIME_VOICE === "true",
    ...(environment.OPENAI_REALTIME_MODEL?.trim()
      ? { realtimeModel: environment.OPENAI_REALTIME_MODEL.trim() }
      : {}),
    ...(environment.OPENAI_PROJECT_ID?.trim()
      ? { project: environment.OPENAI_PROJECT_ID.trim() }
      : {}),
  };
}

export function configureAgentsClient(config: OpenAIConfig): OpenAI {
  const client = new OpenAI({ apiKey: config.apiKey, project: config.project });
  setDefaultOpenAIClient(client);
  return client;
}
