#!/usr/bin/env tsx
/**
 * radarmemo — Stage 1 CLI
 *
 * Usage:
 *   npm run digest:once -- --workspace=csi
 *   npm run digest:once -- --workspace=personal --days=14
 */
import "dotenv/config";
import { getWorkspace } from "../lib/sources/seed";
import { fetchAllSources } from "../lib/ingest/rss";
import { summarizeDigest } from "../lib/ai/summarize";

function parseArgs(): { workspace: string; sinceDays: number } {
  let workspace = "personal";
  let sinceDays = 7;
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith("--workspace=")) workspace = arg.split("=")[1];
    if (arg.startsWith("--days=")) sinceDays = Number.parseInt(arg.split("=")[1], 10);
  }
  return { workspace, sinceDays };
}

async function main() {
  const { workspace: wsSlug, sinceDays } = parseArgs();
  const workspace = getWorkspace(wsSlug);

  console.error(
    `[radarmemo] fetching ${workspace.sources.length} sources for "${workspace.name}" (last ${sinceDays} days)...`,
  );
  const articles = await fetchAllSources(workspace.sources, sinceDays);
  console.error(`[radarmemo] got ${articles.length} articles. summarizing...\n`);

  const digest = await summarizeDigest({ workspace, articles });

  const today = new Date().toISOString().split("T")[0];
  console.log(`# ${workspace.name} — Week of ${today}\n`);
  console.log(digest);
  console.log(
    `\n---\n_${articles.length} articles ingested from ${workspace.sources.length} sources._`,
  );
}

main().catch((err) => {
  console.error("[radarmemo] error:", err);
  process.exit(1);
});
