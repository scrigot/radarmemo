import { z } from "zod";

export const sourceSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  type: z.enum(["rss"]),
});

export type Source = z.infer<typeof sourceSchema>;

export const workspaceSchema = z.object({
  slug: z.string(),
  name: z.string(),
  sources: z.array(sourceSchema),
});

export type Workspace = z.infer<typeof workspaceSchema>;

export const workspaces: Record<string, Workspace> = {
  personal: {
    slug: "personal",
    name: "Personal — AI Builder",
    sources: [
      { name: "Anthropic News", url: "https://www.anthropic.com/news/rss.xml", type: "rss" },
      { name: "Vercel Changelog", url: "https://vercel.com/changelog/feed.xml", type: "rss" },
      { name: "OpenAI Blog", url: "https://openai.com/blog/rss.xml", type: "rss" },
      { name: "Latent Space", url: "https://www.latent.space/feed", type: "rss" },
    ],
  },
  csi: {
    slug: "csi",
    name: "Comfort Systems USA — Innovation Watch",
    sources: [
      { name: "Data Center Frontier", url: "https://www.datacenterfrontier.com/rss.xml", type: "rss" },
      { name: "Engineering News-Record", url: "https://www.enr.com/rss/all", type: "rss" },
      { name: "AWS News", url: "https://aws.amazon.com/blogs/aws/feed/", type: "rss" },
      { name: "Microsoft Azure Blog", url: "https://azure.microsoft.com/en-us/blog/feed/", type: "rss" },
      { name: "Reuters Technology", url: "https://feeds.reuters.com/reuters/technologyNews", type: "rss" },
    ],
  },
};

export function getWorkspace(slug: string): Workspace {
  const ws = workspaces[slug];
  if (!ws) {
    throw new Error(
      `Unknown workspace: "${slug}". Available: ${Object.keys(workspaces).join(", ")}`,
    );
  }
  return ws;
}
