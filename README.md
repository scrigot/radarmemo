# radarmemo

Curated weekly intelligence brief. AI-powered news digest for any workspace.

Multi-workspace by design: one app, separate sources and recipients per use case (personal AI tracking, industry watch for a specific company, etc.).

## Status

**Stage 1 — Core engine (CLI)**

A command-line script that pulls RSS feeds for a given workspace, summarizes the past week with Claude, and prints a 5-bullet markdown brief.

No UI, no cron, no DB, no email yet. Those land in Stages 2-4.

## Quickstart

```bash
npm install
cp .env.example .env.local
# fill in AI_GATEWAY_API_KEY (preferred) or ANTHROPIC_API_KEY

npm run digest:once -- --workspace=personal
npm run digest:once -- --workspace=csi
npm run digest:once -- --workspace=csi --days=14
```

## Workspaces

Defined in `lib/sources/seed.ts`. Add or edit there.

- **`personal`** — Anthropic, Vercel, OpenAI, Latent Space
- **`csi`** — Data Center Frontier, ENR, AWS, Azure, Reuters Tech

## Stack

- Next.js 16 App Router + TypeScript
- AI SDK v6 + Vercel AI Gateway (or direct Anthropic)
- `rss-parser` for feed ingestion
- `zod` for schema validation
- `tsx` for running TypeScript scripts

## Roadmap

- **Stage 2** — Vercel Cron (Friday 9am), Supabase storage, Resend email delivery
- **Stage 3** — Public dashboard with per-workspace branding and shareable issue pages
- **Stage 4** — Trend detection across past N issues ("Vertiv mentioned 4 weeks in a row")
