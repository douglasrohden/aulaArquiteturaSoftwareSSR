const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";

export const openRouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY,
  model: process.env.OPENROUTER_MODEL ?? "x-ai/grok-build-0.1",
  baseUrl: OPENROUTER_BASE_URL,
} as const;

export function getOpenRouterApiKey(): string {
  const key = openRouterConfig.apiKey?.trim();
  if (!key) {
    throw new Error(
      "OPENROUTER_API_KEY não configurada. Defina em .env.local (veja .env.example)."
    );
  }
  return key;
}
