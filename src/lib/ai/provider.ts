type AiProviderConfig = {
  provider: "gemini" | "groq" | "openrouter";
  model: string;
  apiKey: string;
};

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "not-configured" | "timeout" | "provider-error" | "empty-response",
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

function envValue(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function providerFromEnv(): AiProviderConfig | null {
  const explicitProvider = envValue("AI_PROVIDER").toLowerCase();
  const geminiKey = envValue("GEMINI_API_KEY");
  const groqKey = envValue("GROQ_API_KEY");
  const openRouterKey = envValue("OPENROUTER_API_KEY");
  const configuredModel = envValue("AI_MODEL");

  if (geminiKey && (!explicitProvider || explicitProvider === "gemini")) {
    return {
      provider: "gemini",
      model: configuredModel || "gemini-2.5-flash-lite",
      apiKey: geminiKey,
    };
  }

  if (groqKey && (!explicitProvider || explicitProvider === "groq")) {
    return {
      provider: "groq",
      model: configuredModel || "llama-3.1-8b-instant",
      apiKey: groqKey,
    };
  }

  if (openRouterKey && (!explicitProvider || explicitProvider === "openrouter")) {
    return {
      provider: "openrouter",
      model: configuredModel || "openai/gpt-oss-20b:free",
      apiKey: openRouterKey,
    };
  }

  return null;
}

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
};

type ChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

async function callGemini(
  config: AiProviderConfig,
  prompt: string,
  signal?: AbortSignal,
  preferFastModel = false,
  jsonMode = true,
): Promise<string> {
  const models = preferFastModel
    ? [...new Set(["gemini-2.5-flash-lite", "gemini-2.5-flash", config.model])]
    : [...new Set([config.model, "gemini-2.5-flash-lite", "gemini-2.5-flash"])];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      return await callGeminiModel({ ...config, model }, prompt, signal, jsonMode);
    } catch (error) {
      if (error instanceof AiProviderError && error.code === "timeout") {
        throw error;
      }

      lastError = error instanceof Error ? error : new Error("AI provider request failed.");
    }
  }

  throw lastError ?? new Error("AI provider request failed.");
}

async function callGeminiModel(
  config: AiProviderConfig,
  prompt: string,
  signal?: AbortSignal,
  jsonMode = true,
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          ...(jsonMode ? { responseMimeType: "application/json" } : {}),
          temperature: 0.2,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new AiProviderError("AI provider request failed.", "provider-error", response.status);
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");

  if (!text) {
    throw new AiProviderError("AI provider returned an empty response.", "empty-response");
  }

  return text;
}

async function callChatProvider(
  config: AiProviderConfig,
  prompt: string,
  signal?: AbortSignal,
  jsonMode = true,
): Promise<string> {
  const endpoint =
    config.provider === "groq"
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://openrouter.ai/api/v1/chat/completions";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.provider === "openrouter") {
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    headers["X-Title"] = "ResumeOwl";
  }

  const response = await fetch(endpoint, {
    method: "POST",
    signal,
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content: jsonMode
            ? "You are ResumeOwl. Return valid JSON only and never fabricate resume facts."
            : "You are ResumeOwl. Follow the user's requested output format exactly and never fabricate resume facts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!response.ok) {
    throw new AiProviderError("AI provider request failed.", "provider-error", response.status);
  }

  const data = (await response.json()) as ChatResponse;
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new AiProviderError("AI provider returned an empty response.", "empty-response");
  }

  return text;
}

export function hasAiProvider(): boolean {
  return providerFromEnv() !== null;
}

export async function generateAiText(
  prompt: string,
  options: { timeoutMs?: number; preferFastModel?: boolean; jsonMode?: boolean } = {},
): Promise<string> {
  const config = providerFromEnv();

  if (!config) {
    throw new AiProviderError("AI is not configured.", "not-configured");
  }

  const controller = options.timeoutMs ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), options.timeoutMs) : null;

  try {
    if (config.provider === "gemini") {
      return await callGemini(
        config,
        prompt,
        controller?.signal,
        options.preferFastModel,
        options.jsonMode ?? true,
      );
    }

    return await callChatProvider(config, prompt, controller?.signal, options.jsonMode ?? true);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiProviderError("AI provider request timed out.", "timeout");
    }

    if (error instanceof TypeError) {
      throw new AiProviderError("AI provider network request failed.", "provider-error");
    }

    throw error;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
