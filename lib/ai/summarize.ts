import { generateText } from "ai";
import { gateway } from "@ai-sdk/gateway";
import { anthropic } from "@ai-sdk/anthropic";
import type { Article } from "../ingest/rss";
import type { Workspace } from "../sources/seed";
import { buildDigestPrompt } from "./prompts";

function getModel() {
  if (process.env.AI_GATEWAY_API_KEY) {
    // Vercel AI Gateway — preferred. Matches KithNode setup.
    return gateway("anthropic/claude-sonnet-4.6");
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return anthropic("claude-sonnet-4-6");
  }
  throw new Error(
    "Missing AI credentials. Set AI_GATEWAY_API_KEY (preferred) or ANTHROPIC_API_KEY in .env.local.",
  );
}

export async function summarizeDigest({
  workspace,
  articles,
}: {
  workspace: Workspace;
  articles: Article[];
}): Promise<string> {
  if (articles.length === 0) {
    return "_No new articles in the last 7 days._";
  }

  const { system, user } = buildDigestPrompt({ workspace, articles });
  const { text } = await generateText({
    model: getModel(),
    system,
    prompt: user,
    temperature: 0.3,
  });
  return text.trim();
}
