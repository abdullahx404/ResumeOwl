type AiProviderConfig = {
  provider: "gemini" | "groq" | "openrouter";
  model: string;
  apiKey: string;
};

function providerFromEnv(): AiProviderConfig | null {
  const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();

  if (process.env.GEMINI_API_KEY && (!explicitProvider || explicitProvider === "gemini")) {
    return {
      provider: "gemini",
      model: process.env.AI_MODEL || "gemini-1.5-flash",
      apiKey: process.env.GEMINI_API_KEY,
    };
  }

  if (process.env.GROQ_API_KEY && (!explicitProvider || explicitProvider === "groq")) {
    return {
      provider: "groq",
      model: process.env.AI_MODEL || "llama-3.1-8b-instant",
      apiKey: process.env.GROQ_API_KEY,
    };
  }

  if (process.env.OPENROUTER_API_KEY && (!explicitProvider || explicitProvider === "openrouter")) {
    return {
      provider: "openrouter",
      model: process.env.AI_MODEL || "openai/gpt-oss-20b:free",
      apiKey: process.env.OPENROUTER_API_KEY,
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

async function callGemini(config: AiProviderConfig, prompt: string): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`,
    {
      method: "POST",
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
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      }),
    },
  );

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const data = (await response.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");

  if (!text) {
    throw new Error("AI provider returned an empty response.");
  }

  return text;
}

async function callChatProvider(config: AiProviderConfig, prompt: string): Promise<string> {
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
    headers,
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You are ResumeOwl. Return valid JSON only and never fabricate resume facts.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error("AI provider request failed.");
  }

  const data = (await response.json()) as ChatResponse;
  const text = data.choices?.[0]?.message?.content;

  if (!text) {
    throw new Error("AI provider returned an empty response.");
  }

  return text;
}

export function hasAiProvider(): boolean {
  return providerFromEnv() !== null;
}

export async function generateAiText(prompt: string): Promise<string> {
  const config = providerFromEnv();

  if (!config) {
    throw new Error("AI is not configured.");
  }

  if (config.provider === "gemini") {
    return callGemini(config, prompt);
  }

  return callChatProvider(config, prompt);
}
