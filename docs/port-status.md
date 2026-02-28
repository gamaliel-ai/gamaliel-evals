# Chat-Agent Eval Suite – First Release Tracking (gamaliel-evals)

This doc tracks porting **internal ChatAgent evals** (`evals/chat_agent*`, main repo `gamaliel evals run`) into the **public promptfoo-based suite** in this repo (Gamaliel Public API). It doubles as the design reference for what we port and what we leave out.

---

## WIP stats (current state)

| Metric | Value |
|--------|--------|
| **Eval suites in place** | 3 (smoke, passage-citation, language) |
| **Test files** | 3 (`smoke.yaml`, `passage_citation.yaml`, `language_compliance.yaml`) |
| **Total test cases** | 37 (4 smoke + 21 passage citation + 12 language) |
| **Configs** | **One main config:** `eval/promptfooconfig.yaml` runs smoke + passage citation (same providers). **One optional:** `eval/configs/chat-language.yaml` for language-only (different providers per bible_id). |
| **Default `bun run eval`** | Runs main suite against **prod** only (25 tests × 1 provider). |
| **Run against staging** | `bun run eval:staging` or `--filter-providers staging`. |
| **Run against local** | `bun run eval:local` or `--filter-providers local`. |
| **Run language suite** | `bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50` |

**Implemented so far:** Smoke, passage citation, language. Theology, profile adaptation, and guardrails are not yet ported. **Design:** One config applied to the test suite; no parallel hierarchy of per-eval-type configs. Language is the only separate config because it needs different providers (bible_id per language).

---

## Evals we will port

Evals that only need **prompt + response** (and optional theology/profile/bible_id via passthrough). Status and source below.

| Eval | Source (main repo) | What it checks | Status | Notes |
|------|--------------------|----------------|--------|--------|
| **passage-cite** | passage_citation.json | Cited passages, min count, must_include_book; LLM rubrics | **Ported** | 21 tests in passage_citation.yaml; config chat-passage-citation.yaml |
| **language** | language_compliance.json | Response in expected language (es/ko/pt); bible_id → language | Ported, currently failing¹ | 12 tests in language_compliance.yaml |
| **theology** | theology_compliance.json | Theology-specific rubrics (Reformed, Catholic, default, egalitarian) | Not started | vars (prompt, theology) + llm-rubric |
| **profile-adaptation** | profile_adaptation.json | Response style/depth per profile; LLM rubrics | Not started | vars (prompt, profile) + llm-rubric |
| **guardrails** | — | Core doctrines; optional multi-theology | Optional | New suite; not a direct port |

¹ **Language evals** currently fail when run against the public API (e.g. `api.gamaliel.ai`). Likely cause: promptfoo may not send passthrough fields (`bible_id`, etc.) at the top level of the request body, so the API defaults to English. See section **"Why internal language evals pass but public API (promptfoo) evals fail"** below. We will re-test later once request shape is verified or fixed.

---

## Evals we will not port (out of scope)

These depend on **ChatAgent internals** or **app state** the public API does not expose.

| Eval | Why it doesn't apply |
|------|----------------------|
| **tool-params** | Asserts correct tool and parameters (e.g. `bible_id`). Requires SSE/tool_calls/stream_end_data; public API returns only the final assistant message. |
| **query-transform** | Asserts quality of the transformed semantic search query. The transformed query is internal and never returned. |
| **adaptive** | Asserts tool choice and `n_results` for "list all X" questions. Internal tool/parameter behavior. |
| **chat-title** | Asserts chat title set from first message. DB/chat state; completion API does not expose chat metadata. |

**Summary:** The public suite only has **prompt → API → response text** (plus theology/profile/bible_id via passthrough). Any eval that needs **tool calls**, **internal query**, or **chat/session state** is out of scope.

---

## Internal ChatAgent evals (reference)

**Internal harness:** `evals/chat_agent/harness.py` (real ChatAgent, DB, streaming, returns `response` + events). **Scoring:** `evals/chat_agent_eval.py` (Python scorers). The tables above map which internal evals we port vs. omit.

---

## What promptfoo can do here

- **Same as API:** prompt (user message) + optional theology/profile (and bible_id) via passthrough → one response text.
- **Assertions:** contains, icontains, llm-rubric, javascript, etc. No tool-call or DB access.

We **port** evals that only need **prompt + response (+ theology/profile/bible_id)**. We **omit** evals that depend on tool calls, transformed queries, or chat state.

---

## Providers (prod, staging, local)

- **Default:** Suite runs against **production** only (`api.gamaliel.ai`). Script passes `--filter-providers prod` ([promptfoo command-line](https://www.promptfoo.dev/docs/usage/command-line/)).
- **Staging:** `bun run eval:staging` or `--filter-providers staging` → `https://api.staging.gamaliel.ai/v1`.
- **Local:** `bun run eval:local` or `--filter-providers local` → `http://api.localhost:8000/v1`. Same as main-repo browser tests: add `127.0.0.1 api.localhost` to `/etc/hosts`, run `make dev`, then run evals. The `eval:local` script uses `--no-cache` so results are always from the local API (avoiding stale cached empty outputs from earlier runs).

**Model name convention:** The Gamaliel Public API accepts model names with optional trailing environment/alias suffixes (e.g. `gpt-4o-mini:local`, `gpt-4o-mini:staging`). It strips `:local`, `:staging`, `:prod`, `:default`, `:primary` before forwarding to the upstream LLM, so clients (promptfoo, gateways) can use the same base model name with different suffixes without 404s.

**Local evals use the same setup as browser tests.** Both talk to `http://api.localhost:8000` over HTTP. For local evals to pass you must:

1. **Backend running** – e.g. `make dev` in the main repo (backend on port 8000).
2. **Hosts entry** – `127.0.0.1 api.localhost` in `/etc/hosts` (required for API subdomain).
3. **OPENAI_API_KEY** – set in the environment (or in `.env` when using `bun run eval:local`).

If you see **"The output is empty"** for local runs, the API is likely not reachable or not returning content: run the main-repo browser tests first to confirm (`TEST_ENV=local PYTHONPATH=. pytest tests/browser/test_public_api.py -v -m browser -n auto`), or `curl -s -o /dev/null -w "%{http_code}" http://api.localhost:8000/v1/theologies`.

---

## File layout (current + planned)

```
gamaliel-evals/
├── eval/
│   ├── promptfooconfig.yaml          # One config: smoke + passage citation (+ theology/profile when ported)
│   ├── configs/
│   │   └── chat-language.yaml       # Language only (different providers per bible_id)
│   ├── tests/
│   │   ├── smoke.yaml               # 4 tests
│   │   ├── passage_citation.yaml    # 21 tests
│   │   ├── language_compliance.yaml # 12 tests (use with chat-language.yaml)
│   │   ├── theology_compliance.yaml # Planned
│   │   ├── profile_adaptation.yaml  # Planned
│   │   └── guardrails.yaml          # Optional
│   ├── theologies.yaml              # Exists (provider matrix)
│   ├── profiles.yaml                # Exists
│   └── providers-matrix.yaml        # Generated (optional)
├── scripts/
│   ├── check-env.ts                 # Exists
│   └── generate-providers-matrix.ts # Exists
├── docs/
│   └── port-status.md  # This file – WIP port/development of first suite
└── package.json                     # "eval" → promptfoo (main suite)
```

**Why one config + one optional:** Promptfoo supports multiple test files in a single config (`tests: [file://tests/smoke.yaml, file://tests/passage_citation.yaml, ...]`). The same prompt template and providers apply to all. We use one config for everything that shares the same providers (production + local). Language evals need different providers (spa/kor/por with different bible_id passthrough), so they stay in a separate config. No parallel hierarchy of chat-passage-citation, chat-theology, etc.

---

## First-release checklist (tracking)

### Test files (the suite)

| # | File | Status | Notes |
|---|------|--------|--------|
| 1 | `eval/tests/smoke.yaml` | Done | 4 tests; default config |
| 2 | `eval/tests/language_compliance.yaml` | Done | 12 tests; es/ko/pt, contains + js for Hangul; currently failing vs public API¹ |
| 3 | `eval/tests/passage_citation.yaml` | Done | 21 tests; contains/icontains + llm-rubric |
| 4 | `eval/tests/theology_compliance.yaml` | Not started | Port theology_compliance.json → vars (prompt, theology) + llm-rubric |
| 5 | `eval/tests/profile_adaptation.yaml` | Not started | Port profile_adaptation.json → vars (prompt, profile) + llm-rubric |
| 6 | `eval/tests/guardrails.yaml` | Optional | New: core doctrines; theology: all or multi-provider |

### Configs

| # | File | Status | Notes |
|---|------|--------|--------|
| 1 | `eval/promptfooconfig.yaml` | Done | **Main config:** smoke + passage_citation (and later theology, profile). One config, multiple test files. |
| 2 | `eval/configs/chat-language.yaml` | Done | Language-only; different providers (spa/kor/por + local) for bible_id. |

### Wiring default suite

| # | Task | Status | Notes |
|---|------|--------|--------|
| 1 | Default `promptfooconfig.yaml` runs main suite | Done | `tests: [smoke.yaml, passage_citation.yaml]` |
| 2 | Add npm/bun script for language suite | Optional | e.g. `bun run eval:language` |
| 3 | Run all (main + language) | Manual | `bun run eval` then `bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50` |

**Minimal for first release:** Test files 1–5 (smoke, passage, language, theology, profile). One main config; add new test files to its `tests:` list. Optional: guardrails; run language config when you need language evals.

---

## Mapping from internal JSON to promptfoo YAML

| Main-repo JSON | promptfoo YAML | Notes |
|----------------|----------------|--------|
| `input` | `vars.prompt` | User message. |
| `bible_id` | Provider passthrough (e.g. in config or vars) | language_compliance uses per-provider passthrough in chat-language.yaml. |
| `user_theology_slug` | `vars.theology` | Passthrough to API. |
| `user_profile_slug` | `vars.profile` | Passthrough to API. |
| `expected_passages`, `min_passage_count`, `must_include_book` | `assert` contains/icontains or llm-rubric | Port to assertions. |
| `expected_language`, `language_indicators`, `min_indicator_count` | `assert` contains or llm-rubric | Done in language_compliance.yaml. |
| `evaluation_criteria` | `assert - type: llm-rubric value: "..."` | Direct port of criteria text. |
| `expected_tool`, `expected_bible_id` (tool-params) | Omit | No agent internals. |
| Transformed query, adaptive (n_results/tool) | Omit | No access. |

---

## How to run (current)

```bash
# Main suite against production (default)
bun run eval

# Same suite against staging
bun run eval:staging

# Same suite against local API (make dev in main repo first)
bun run eval:local
# or: bunx promptfoo eval -c eval/promptfooconfig.yaml -j 50 --filter-providers local

# Language compliance (separate config – different providers)
bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50

# Inspect outputs (after running any eval above)
bun run eval:view          # open promptfoo web UI for last run (prompts, responses, assertions)
bun run eval:inspect       # run prod eval and write eval/output.html (open in browser)

# Local debugging: start Gamaliel backend (main repo), then run evals with local provider
# In main repo: make dev
# Then in gamaliel-evals: use providers that include openai:chat:gpt-4o-mini:local
```

Concurrency: default in configs is 50; evals are network-bound so 50–100 is reasonable.

---

## Reusability (promptfoo vs main repo)

| Concern | Main repo | promptfoo (gamaliel-evals) |
|--------|-----------|----------------------------|
| Where "prompt" lives | Test case `input` in JSON | Test case `vars.prompt` in YAML |
| Where criteria live | Python scorers + sometimes `evaluation_criteria` in JSON | Test case `assert` in YAML (llm-rubric, contains, etc.) |
| How to run | harness + runner + EVAL_REGISTRY | promptfooconfig.yaml + optional configs per suite |
| Per-eval-type run | `gamaliel evals run passage-cite` | `bunx promptfoo eval -c eval/configs/chat-<type>.yaml` or filter |
| Theology/profile matrix | harness expands slugs | providers-matrix + test-level `providers` or vars |

This structure keeps a **parallel ChatAgent-style eval suite** in promptfoo that matches the main repo's eval types (passage, language, theology, profile, guardrails) while staying within what the public API can observe.

---

## Why internal language evals pass but public API (promptfoo) evals fail

**Internal evals** (main repo `gamaliel evals run language`):

- The harness runs the full **ChatAgent** in-process with DB (User, Chat).
- The test case supplies `bible_id` (e.g. `spa-niv-2022`); the harness passes it into the agent.
- ChatAgent calls `get_language_from_bible_id(effective_bible_id)` and puts **`preferred_language`** (code + name) into the **context** passed to the LLM (`gamaliel/agents/chat_agent.py` ~567–588).
- The prompt template therefore instructs the model to respond in that language. So internal language evals pass.

**Public API** (server code path):

- The route reads `bible_id = body.get("bible_id", "eng-web")` and passes it to **PublicChatAgent**.
- PublicChatAgent extends ChatAgent and passes `bible_id` into the parent constructor; **ChatAgent._build_context()** uses `self.bible_id` to set `preferred_language` the same way as internal.
- So **in code**, the public API supports "bible_id → response language" the same way as the internal agent.

**Why promptfoo language evals still fail:**

- The request body that promptfoo sends to `https://api.gamaliel.ai/v1/chat/completions` may **not** include `bible_id` (or theology/profile) at the **top level**. Many OpenAI-compatible clients send only standard fields (`model`, `messages`, `stream`, etc.). Provider **passthrough** in promptfoo may be sent as a **nested** object (e.g. `body.passthrough` or under another key) that the Gamaliel API does not read. The API then uses the default `bible_id = "eng-web"` and responds in English, so language assertions fail.

**What to do:**

1. **Verify the request body** – Log or inspect the actual JSON body that promptfoo sends (e.g. in the API or via a proxy). Confirm whether `bible_id`, `theology`, and `profile` appear at the top level or only inside a nested object.
2. **If passthrough is nested** – Either:
   - Update the public API to also read from that nested object (e.g. `body.get("passthrough", {}).get("bible_id")`), or
   - Use a promptfoo/provider option that merges passthrough fields into the top-level request body.
3. **Until then** – Treat **language compliance** as validated only by **internal evals**; document that public (promptfoo) language tests are expected to fail until the API receives `bible_id` at the level it reads. Use the **local provider** (api.localhost:8000) to debug against a running Gamaliel backend; requires `/etc/hosts`: `127.0.0.1 api.localhost`.
