import { getServiceClient } from "./supabase";
import type { Article } from "../ingest/rss";

export type SavedIssue = {
  id: string;
  workspace_id: string;
  week_of: string;
  summary_markdown: string;
  article_count: number;
  published_at: string;
};

/** Compute week_of as Monday of the current week (UTC). */
export function weekOfDate(d: Date = new Date()): string {
  const date = new Date(d);
  const day = date.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  date.setUTCDate(date.getUTCDate() - diff);
  return date.toISOString().slice(0, 10);
}

export async function saveIssue({
  workspaceId,
  summaryMarkdown,
  articles,
  weekOf,
  sourceLookup,
}: {
  workspaceId: string;
  summaryMarkdown: string;
  articles: Article[];
  weekOf: string;
  sourceLookup: Map<string, string>; // name -> source.id
}): Promise<SavedIssue | null> {
  const db = getServiceClient();

  const { data: issue, error } = await db
    .from("issues")
    .upsert(
      {
        workspace_id: workspaceId,
        week_of: weekOf,
        summary_markdown: summaryMarkdown,
        article_count: articles.length,
        published_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,week_of" },
    )
    .select()
    .single();

  if (error || !issue) {
    console.error("[db] saveIssue failed:", error);
    return null;
  }

  if (articles.length > 0) {
    await db.from("articles").delete().eq("issue_id", issue.id);
    const rows = articles.map((a) => ({
      issue_id: issue.id,
      source_id: sourceLookup.get(a.source) ?? null,
      title: a.title,
      link: a.link,
      raw_content: a.contentSnippet,
      published_at: a.publishedAt.toISOString(),
      included_in_summary: true,
    }));
    const { error: artErr } = await db.from("articles").insert(rows);
    if (artErr) console.error("[db] articles insert failed:", artErr);
  }

  return issue as SavedIssue;
}

export async function getLatestIssue(workspaceSlug: string): Promise<SavedIssue | null> {
  const db = getServiceClient();
  const { data: ws } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (!ws) return null;

  const { data: issue } = await db
    .from("issues")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("week_of", { ascending: false })
    .limit(1)
    .single();

  return (issue as SavedIssue) ?? null;
}

export async function listIssues(workspaceSlug: string, limit = 20): Promise<SavedIssue[]> {
  const db = getServiceClient();
  const { data: ws } = await db
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (!ws) return [];

  const { data: issues } = await db
    .from("issues")
    .select("*")
    .eq("workspace_id", ws.id)
    .order("week_of", { ascending: false })
    .limit(limit);

  return (issues ?? []) as SavedIssue[];
}
