import { NextResponse } from "next/server";
import { workspaces as seedWorkspaces } from "@/lib/sources/seed";
import { fetchAllSources } from "@/lib/ingest/rss";
import { summarizeDigest } from "@/lib/ai/summarize";
import { getWorkspaceBySlug } from "@/lib/db/workspaces";
import { saveIssue, weekOfDate } from "@/lib/db/issues";
import { sendDigestEmail } from "@/lib/email/resend";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

type WorkspaceResult =
  | { slug: string; status: "sent"; articlesCount: number; issueId: string; emailId: string | null }
  | { slug: string; status: "no_articles" }
  | { slug: string; status: "error"; error: string };

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekOf = weekOfDate();
  const results: WorkspaceResult[] = [];

  for (const [slug, ws] of Object.entries(seedWorkspaces)) {
    try {
      const dbWs = await getWorkspaceBySlug(slug);
      if (!dbWs) throw new Error(`Workspace "${slug}" not seeded in DB`);

      const articles = await fetchAllSources(ws.sources, 7);

      if (articles.length === 0) {
        results.push({ slug, status: "no_articles" });
        continue;
      }

      const summary = await summarizeDigest({ workspace: ws, articles });

      const issue = await saveIssue({
        workspaceId: dbWs.id,
        summaryMarkdown: summary,
        articles: articles.slice(0, 20),
        weekOf,
        sourceLookup: new Map(),
      });

      if (!issue) throw new Error("saveIssue returned null");

      const { id: emailId } = await sendDigestEmail({
        to: dbWs.email_recipients,
        workspaceName: dbWs.name,
        weekOf,
        summaryMarkdown: summary,
      });

      results.push({
        slug,
        status: "sent",
        articlesCount: articles.length,
        issueId: issue.id,
        emailId,
      });
    } catch (err) {
      console.error(`[cron] workspace ${slug} failed:`, err);
      results.push({ slug, status: "error", error: (err as Error).message });
    }
  }

  return NextResponse.json({ ok: true, weekOf, results });
}
