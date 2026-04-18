import type { Article } from "../ingest/rss";
import type { Workspace } from "../sources/seed";

export function buildDigestPrompt({
  workspace,
  articles,
}: {
  workspace: Workspace;
  articles: Article[];
}): { system: string; user: string } {
  const system = `You are an editor writing a curated weekly intelligence brief for ${workspace.name}.

Output a 5-bullet markdown brief covering the most important developments from the past week, drawn from the source articles below.

Rules:
- Exactly 5 bullets, each 1-2 sentences max.
- Lead with the most concrete fact in each bullet (announcements, dollar figures, signed deals, product releases, named players).
- End each bullet with a parenthetical source attribution like (Data Center Frontier).
- No emojis. No filler. No "exciting times ahead" closers. No "stands as a testament" inflation.
- Skip pure marketing fluff or vendor self-promotion unless materially newsworthy.
- Tone: dense, factual, scannable. Like a Bloomberg terminal headline crawl.

Output ONLY the 5 bullets. No header, no preamble, no afterword.`;

  const articlesText = articles
    .slice(0, 40)
    .map(
      (a, i) =>
        `[${i + 1}] (${a.source}) ${a.title}\n${a.contentSnippet || "(no snippet)"}\nURL: ${a.link}`,
    )
    .join("\n\n");

  const user = `Articles from the past week:\n\n${articlesText}\n\nWrite the 5-bullet brief now.`;

  return { system, user };
}
