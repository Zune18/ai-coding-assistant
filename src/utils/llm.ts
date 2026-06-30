import axios from "axios";
import 'dotenv/config';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

if (!OPENROUTER_API_KEY) {
  throw new Error("OPENROUTER_API_KEY environment variable is not set");
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function chatJSON<T>(
  messages: ChatMessage[],
  schema?: { type: string; properties: Record<string, unknown> },
  model: string = "google/gemma-4-26b-a4b-it:free"
): Promise<T> {
  const payload: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.7,
  };

  if (schema) {
    payload.response_format = {
      type: "json_schema",
      json_schema: {
        name: "response",
        schema,
      },
    };
  }

  try {
    const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, payload, {
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const content = response.data.choices[0].message.content;

    if (schema) {
      return JSON.parse(content) as T;
    }

    return content as T;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`OpenRouter API error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

export async function chatText(
  messages: ChatMessage[],
  model: string = "openrouter/auto"
): Promise<string> {
  const response = await axios.post(`${OPENROUTER_BASE_URL}/chat/completions`, {
    model,
    messages,
    temperature: 0.7,
  }, {
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
  });

  return response.data.choices[0].message.content;
}

// For Testing ----
// async function main() {
//   const resp = await chatJSON<{ answer: string }>([
//     { role: "system", content: "You are a helpful assistant." },
//     { role: "user", content: "What is the capital of India?" }
//   ]);

//   console.log(resp);
// }

// main().catch(console.error);
