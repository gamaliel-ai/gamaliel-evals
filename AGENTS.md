# Gamaliel Evals

Agent instructions for this repo. Eval suite for the [Gamaliel Public API](https://api.gamaliel.ai) (promptfoo). Edit this file only for context/conventions; do not duplicate into CLAUDE.md.

## Promptfoo reference

When authoring or editing promptfoo test YAML, modifying the eval harness, or adding assertions (e.g. contains, llm-rubric, javascript): **consult the promptfoo docs at https://www.promptfoo.dev/llms.txt**. Use that document as the authoritative reference for config, providers, test cases, and expected-outputs.

## Project structure

- **eval/** – promptfoo config, `configs/` (e.g. language suite), `tests/` (YAML suites), theologies, profiles.
- **scripts/** – one-off scripts (e.g. providers matrix).
- **docs/** – design and porting status.
- **app/** – Next.js app (Phase 2 web UI).

## Prerequisites

- Bun 1.3+ (see `package.json` engines).
- `OPENAI_API_KEY`: set in `.env` (Bun loads it) or in environment.

## Setup

```bash
cp .env.example .env   # set OPENAI_API_KEY
bun install
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run eval` | Evals vs prod (api.gamaliel.ai) |
| `bun run eval:staging` | Evals vs staging |
| `bun run eval:local` | Evals vs local API (api.localhost:8000); `--no-cache` |
| `bun run eval:view` | Open promptfoo web UI |
| `bun run eval:inspect` | Run evals, write `eval/output.html` |
| `bun run dev` | Next.js dev server |
| `bun run build` | Production build |
| `bun run lint` | Lint app |

Output to file: append `-o <path>` (e.g. `-o /tmp/results.json` or `-o /tmp/results.html`).

Language suite only (different providers per bible_id):

```bash
bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50
```

**Workers:** Always use a large number of workers (recommend 50+) for faster iteration; pass `-j 50` or higher to `promptfoo eval` or in npm scripts.

For local evals: backend on 8000, `127.0.0.1 api.localhost` in `/etc/hosts`, and `OPENAI_API_KEY` set.

## Conventions

- Use Bun only for scripts (no Node).
- Main config: `eval/promptfooconfig.yaml`. Language suite: `eval/configs/chat-language.yaml` (different providers per `bible_id`).
- Test suites: YAML in `eval/tests/`. Register new suites in the relevant config.
- When adding suites or changing providers, update `docs/port-status.md`.

## Adding or changing evals

1. Add or edit YAML in `eval/tests/`.
2. Same providers as main config → add test file to `eval/promptfooconfig.yaml` under `tests`.
3. Different providers (e.g. per bible_id) → add config in `eval/configs/` and run `bunx promptfoo eval -c eval/configs/<name>.yaml -j 50`.
4. Update `docs/port-status.md`.

For assertion syntax and provider config, use https://www.promptfoo.dev/llms.txt.

## Scope vs main repo

- **This repo:** Evals that need only prompt + API response (+ theology/profile/bible_id). Use contains, icontains, llm-rubric, javascript, etc. (see promptfoo llms.txt).
- **Main repo (`gamaliel evals run`):** Evals that need tool calls, transformed queries, or chat state (tool-params, query-transform, adaptive, chat-title).



## References

- **Promptfoo (authoritative for tests/harness):** https://www.promptfoo.dev/llms.txt
- Gamaliel Public API (authoritative): https://developer.gamaliel.ai/llms.txt
- Project Development status: `docs/port-status.md`
