# Gamaliel Evals

Agent instructions for this repo. Eval suite for the [Gamaliel Public API](https://api.gamaliel.ai) (promptfoo). Edit this file only for context/conventions; do not duplicate into CLAUDE.md.

## Promptfoo reference

When authoring or editing promptfoo test YAML, modifying the eval harness, or adding assertions (e.g. contains, llm-rubric, javascript): **consult the promptfoo docs at https://www.promptfoo.dev/llms.txt**. Use that document as the authoritative reference for config, providers, test cases, and expected-outputs.

## Project structure

- **eval/** – promptfoo config, `tests/` (YAML suites), theologies, profiles.
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
| `bun run eval:local` | Evals vs local API (api.localhost:8000) |
| `bun run eval:openai` | Evals vs OpenAI GPT-4.1 (passage citation only, for comparison) |
| `bun run eval:view` | Open promptfoo web UI |
| `bun run dev` | Next.js dev server |
| `bun run build` | Production build |
| `bun run lint` | Lint app |

**Inspecting results:** Always output to JSON (`-o /tmp/results.json`), then run the report script:

```bash
bunx promptfoo eval -c promptfooconfig.staging.yaml -j 50 --no-cache -o /tmp/results.json \
  && bun scripts/report-evals.ts /tmp/results.json
```

`scripts/report-evals.ts` prints a compact, LLM-readable report: summary stats, per-provider pass counts, and full details for each failure (prompt, vars, failed assertions, truncated response). Pass any results JSON file as the argument.

Language tests are included in the main config and work via template variables (`bible_id` from test vars).

**Workers:** Always use a large number of workers (recommend 50+) for faster iteration; pass `-j 50` or higher to `promptfoo eval` or in npm scripts.

For local evals: backend on 8000, `127.0.0.1 api.localhost` in `/etc/hosts`, and `OPENAI_API_KEY` set.

## Conventions

- Use Bun only for scripts (no Node).
- Main config: `promptfooconfig.yaml` (repo root; auto-discovered by promptfoo). Separate configs: `promptfooconfig.staging.yaml`, `promptfooconfig.local.yaml`, and `promptfooconfig.openai.yaml` for different environments.
- Test suites: YAML in `eval/tests/`. Register new suites in the relevant config.
- OpenAI config (`promptfooconfig.openai.yaml`): Only includes `passage_citation.yaml` tests (general prompts). Excludes tests requiring Gamaliel-specific params (`theology`, `profile`, `bible_id`, etc.).
- When adding suites or changing providers, update `docs/port-status.md`.

## Adding or changing evals

1. Add or edit YAML in `eval/tests/`.
2. Add test file to `promptfooconfig.yaml` under `tests` (tests are provider-agnostic and work with all configs).
3. Update `docs/port-status.md`.

For assertion syntax and provider config, use https://www.promptfoo.dev/llms.txt.

## When to use `--tests` vs `--filter-providers`

### Use default config (production)

**When:** Running the full test suite against production (default config).

**Examples:**
```bash
# Run all tests from main config (production)
bunx promptfoo eval -j 50

# Run all tests against staging (internal)
bunx promptfoo eval -c promptfooconfig.staging.yaml -j 50

# Run all tests against local (internal)
bunx promptfoo eval -c promptfooconfig.local.yaml -j 50
```

**Why:** Each config file defines its provider and test files. Tests are provider-agnostic and use template variables (theology, profile, bible_id) from test vars.

### Use `--tests` (with optional `--filter-providers`)

**When:** You want to run specific test files that are:
- Not in the main config (like smoke tests)
- A subset of tests from the config
- Need different providers than what's in the main config

**Examples:**
```bash
# Run smoke tests only (not in main config)
bunx promptfoo eval --tests eval/tests/smoke.yaml

# Run smoke tests against staging
bunx promptfoo eval -c promptfooconfig.staging.yaml --tests eval/tests/smoke.yaml

# Run a single test file from the suite
bunx promptfoo eval --tests eval/tests/passage_citation.yaml
```

**Why:** Smoke tests aren't in the main config (they're quick validation tests run separately). The `--tests` flag overrides the config's test list.

### Use `-c` (different config file)

**When:** You want to run tests against a different environment (staging or local).

**Examples:**
```bash
# Run against staging (internal use only)
bunx promptfoo eval -c promptfooconfig.staging.yaml -j 50

# Run against local (internal use only)
bunx promptfoo eval -c promptfooconfig.local.yaml -j 50
```

**Why:** Separate config files (`promptfooconfig.staging.yaml` and `promptfooconfig.local.yaml`) are used for internal testing against staging and local environments. All tests are provider-agnostic and work with any config.

### Decision Tree

```
Which environment?
├─ Production → Use default config (bun run eval)
│
├─ Staging → Use -c promptfooconfig.staging.yaml (bun run eval:staging)
│
└─ Local → Use -c promptfooconfig.local.yaml (bun run eval:local)

Want to run specific tests?
→ Add --tests flag: bunx promptfoo eval --tests eval/tests/smoke.yaml
```

**Current setup:**
- **Main config:** `promptfooconfig.yaml` (production) - auto-discovered, use `bun run eval`
- **Staging config:** `promptfooconfig.staging.yaml` (internal) - use `bun run eval:staging` or `-c promptfooconfig.staging.yaml`
- **Local config:** `promptfooconfig.local.yaml` (internal) - use `bun run eval:local` or `-c promptfooconfig.local.yaml`
- **OpenAI config:** `promptfooconfig.openai.yaml` (comparison) - use `bun run eval:openai` or `-c promptfooconfig.openai.yaml`. Only includes `passage_citation.yaml` (excludes tests requiring Gamaliel-specific params).
- **Test files:** `passage_citation.yaml`, `theology_compliance.yaml`, `profile_adaptation.yaml`, `language_compliance.yaml`, `smoke.yaml`
- **Gamaliel configs:** All tests are provider-agnostic and work via template variables (theology, profile, bible_id from test vars)
- **OpenAI config:** Only general tests that don't require Gamaliel-specific parameters

## Scope vs main repo

- **This repo:** Evals that need only prompt + API response (+ theology/profile/bible_id). Use contains, icontains, llm-rubric, javascript, etc. (see promptfoo llms.txt).
- **Main repo (`gamaliel evals run`):** Evals that need tool calls, transformed queries, or chat state (tool-params, query-transform, adaptive, chat-title).



## References

- **Promptfoo (authoritative for tests/harness):** https://www.promptfoo.dev/llms.txt
- Gamaliel Public API (authoritative): https://developer.gamaliel.ai/llms.txt
- Project Development status: `docs/port-status.md`
