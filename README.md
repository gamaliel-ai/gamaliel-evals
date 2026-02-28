# gamaliel-evals

> **Work in progress — not yet open for contributions.**
> This project is public for visibility, but we are still in early development. We plan to open it for community contributions in Q2 2026. Watch this repo to be notified when that happens.

Open-source eval suite for the [Gamaliel Public API](https://developer.gamaliel.ai). Evaluate biblical AI quality across theologies, profiles, and languages. Built on [promptfoo](https://github.com/promptfoo/promptfoo).


## Prerequisites

- **Bun 1.3+** – [bun.sh](https://bun.sh)
- **OPENAI_API_KEY** – set in `.env` or in your environment (Bun loads `.env` automatically)

## Setup

```bash
cp .env.example .env   # set OPENAI_API_KEY
bun install
```

## Running evals

```bash
bun run eval            # prod (api.gamaliel.ai)
bun run eval:staging    # staging
bun run eval:local      # local API (api.localhost:8000)
bun run eval:view       # open promptfoo web UI
```

See [AGENTS.md](./AGENTS.md) for full documentation.

## License

MIT
