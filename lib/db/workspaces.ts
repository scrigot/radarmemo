import { getServiceClient } from "./supabase";
import type { Source } from "../sources/seed";

export type DbWorkspace = {
  id: string;
  slug: string;
  name: string;
  email_recipients: string[];
  sources: Array<Source & { id: string; active: boolean }>;
};

export async function getWorkspaceBySlug(slug: string): Promise<DbWorkspace | null> {
  const db = getServiceClient();
  const { data: ws, error } = await db
    .from("workspaces")
    .select("id, slug, name, email_recipients")
    .eq("slug", slug)
    .single();

  if (error || !ws) return null;

  const { data: sources } = await db
    .from("sources")
    .select("id, name, url, type, active")
    .eq("workspace_id", ws.id)
    .eq("active", true);

  return {
    ...ws,
    sources: (sources ?? []) as DbWorkspace["sources"],
  };
}

export async function listActiveWorkspaces(): Promise<DbWorkspace[]> {
  const db = getServiceClient();
  const { data: wsList, error } = await db
    .from("workspaces")
    .select("id, slug, name, email_recipients")
    .order("created_at", { ascending: true });

  if (error || !wsList) return [];

  const out: DbWorkspace[] = [];
  for (const ws of wsList) {
    const { data: sources } = await db
      .from("sources")
      .select("id, name, url, type, active")
      .eq("workspace_id", ws.id)
      .eq("active", true);
    out.push({
      ...ws,
      sources: (sources ?? []) as DbWorkspace["sources"],
    });
  }
  return out;
}
