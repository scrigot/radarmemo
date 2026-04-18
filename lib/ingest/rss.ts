import Parser from "rss-parser";
import type { Source } from "../sources/seed";

const parser = new Parser({ timeout: 10_000 });

export type Article = {
  title: string;
  link: string;
  source: string;
  publishedAt: Date;
  contentSnippet: string;
};

export async function fetchSource(source: Source, sinceDays = 7): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const cutoff = Date.now() - sinceDays * 24 * 60 * 60 * 1000;

    return (feed.items ?? [])
      .map((item) => {
        const published = item.isoDate
          ? new Date(item.isoDate)
          : item.pubDate
            ? new Date(item.pubDate)
            : new Date();
        return {
          title: (item.title ?? "Untitled").trim(),
          link: item.link ?? "",
          source: source.name,
          publishedAt: published,
          contentSnippet: (item.contentSnippet ?? item.summary ?? "").slice(0, 800),
        };
      })
      .filter((a) => a.publishedAt.getTime() >= cutoff && a.link);
  } catch (err) {
    console.error(
      `[rss] failed to fetch ${source.name} (${source.url}): ${(err as Error).message}`,
    );
    return [];
  }
}

export async function fetchAllSources(
  sources: Source[],
  sinceDays = 7,
): Promise<Article[]> {
  const results = await Promise.all(sources.map((s) => fetchSource(s, sinceDays)));
  return results.flat().sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}
