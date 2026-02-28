# Gamaliel Evals

Open-source eval suite for the [Gamaliel Public API](https://api.gamaliel.ai). Evaluate biblical AI quality across theologies, profiles, and languages. Built on [promptfoo](https://github.com/promptfoo/promptfoo).

## Prerequisites

- **Bun 1.3+** – install from [bun.sh](https://bun.sh) (see `engines` in package.json)
- **OPENAI_API_KEY** – required for running evals (BYOK; same key used for the Gamaliel API)

## Scripts

| Command | Description |
|---------|-------------|
| `bun run setup` | Verify `.env` / `OPENAI_API_KEY`, then install dependencies |
| `bun install` | Install dependencies only |
| `bun run dev` | Start Next.js dev server |
| `bun run build` | Build for production |
| `bun run eval` | Run promptfoo evals against Gamaliel API (requires `.env`) |
| `bun run lint` | Lint the Next.js app |

## Setup

1. Copy the env template and set your key:

   ```bash
   cp .env.example .env
   # Edit .env and set OPENAI_API_KEY=sk-...
   ```

2. Install dependencies (requires Bun 1.3+; see `engines` in package.json):

   ```bash
   bun install
   ```

   Or run setup to verify `.env` and install in one step:

   ```bash
   bun run setup
   ```

## Run evals

From the repo root:

```bash
bun run eval
```

Runs the promptfoo suite in `eval/` against `https://api.gamaliel.ai/v1/chat/completions`. Requires `.env` with `OPENAI_API_KEY`.

## Develop

Start the Next.js dev server:

```bash
bun run dev
```

Opens the app at http://localhost:3000 (or the next available port).

## Deploy

Deploy to [Vercel](https://vercel.com): connect the repo and use build command `bun run build`. The app is static/client-side; no backend required for the planned Phase 2 web UI.

## Links

- [Gamaliel Public API docs](https://github.com/gamaliel-ai/gamaliel-api) – chat completions, theologies, profiles
- Design doc and milestones – see the main Gamaliel app repo for the open-source evals project vision

## License

MIT
