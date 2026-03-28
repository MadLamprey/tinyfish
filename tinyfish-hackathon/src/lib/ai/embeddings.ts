import OpenAI from "openai";
import { env } from "@/lib/env";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export async function generateEmbedding(input: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });

  return response.data[0]?.embedding ?? [];
}
