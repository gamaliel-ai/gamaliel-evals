# Chat-Agent Eval Suite – First Release Tracking (gamaliel-evals)

This doc tracks porting **internal ChatAgent evals** (`evals/chat_agent*`, main repo `gamaliel evals run`) into the **public promptfoo-based suite** in this repo (Gamaliel Public API). It doubles as the design reference for what we port and what we leave out.

---

## WIP stats (current state)

| Metric | Value |
|--------|--------|
| **Eval suites in place** | 2 (smoke, language) |
| **Test files** | 2 (`smoke.yaml`, `language_compliance.yaml`) |
| **Total test cases** | 16 (4 smoke + 12 language) |
| **Configs** | Default: `eval/promptfooconfig.yaml` (smoke only). Language: `eval/configs/chat-language.yaml`. |
| **Default `bun run eval`** | Runs smoke only (4 tests) |
| **Run language suite** | `bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50` |
| **Local debugging** | Use provider `openai:chat:gpt-4o-mini:local` (localhost:8000); run Gamaliel backend with `make dev`. |

**Implemented so far:** Language compliance only. Smoke is a minimal sanity check. Passage citation, theology, profile adaptation, and guardrails are not yet ported.

---

## Evals we will port

Evals that only need **prompt + response** (and optional theology/profile/bible_id via passthrough). Status and source below.

| Eval | Source (main repo) | What it checks | Status | Notes |
|------|--------------------|----------------|--------|--------|
| **passage-cite** | passage_citation.json | Cited passages, min count, must_include_book; LLM rubrics | Not started | Port to vars + contains/llm-rubric |
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

## Providers (including local debugging)

- **Production:** `api.gamaliel.ai` – used by default in configs.
- **Local:** `openai:chat:gpt-4o-mini:local` – points at `http://localhost:8000/v1` for debugging against a local Gamaliel backend. Run the backend with `make dev` (from the main repo), then run evals with the local provider (e.g. override providers in a config or use the local config). See `eval/promptfooconfig.yaml` and `eval/configs/chat-language.yaml` for the `:local` provider definition.

---

## File layout (current + planned)

```
gamaliel-evals/
├── eval/
│   ├── promptfooconfig.yaml          # Default suite: smoke only (+ local provider)
│   ├── configs/
│   │   ├── chat-language.yaml        # Language compliance (+ local provider)
│   │   ├── chat-passage-citation.yaml   # Planned
│   │   ├── chat-theology.yaml           # Planned
│   │   ├── chat-profile-adaptation.yaml # Planned
│   │   └── chat-smoke.yaml              # Optional: explicit smoke config
│   ├── tests/
│   │   ├── smoke.yaml                # 4 tests
│   │   ├── language_compliance.yaml  # 12 tests (es/ko/pt)
│   │   ├── passage_citation.yaml     # Port from passage_citation.json
│   │   ├── theology_compliance.yaml  # Port from theology_compliance.json
│   │   ├── profile_adaptation.yaml   # Port from profile_adaptation.json
│   │   └── guardrails.yaml           # New: core doctrines (optional)
│   ├── theologies.yaml              # Exists (provider matrix)
│   ├── profiles.yaml                # Exists
│   └── providers-matrix.yaml        # Generated (optional)
├── scripts/
│   ├── check-env.ts                 # Exists
│   └── generate-providers-matrix.ts # Exists
├── docs/
│   └── chat-agent-eval-suite-structure.md  # This file
└── package.json                     # "eval" → promptfoo (smoke)
```

---

## First-release checklist (tracking)

### Test files (the suite)

| # | File | Status | Notes |
|---|------|--------|--------|
| 1 | `eval/tests/smoke.yaml` | Done | 4 tests; default config |
| 2 | `eval/tests/language_compliance.yaml` | Done | 12 tests; es/ko/pt, contains + js for Hangul; currently failing vs public API¹ |
| 3 | `eval/tests/passage_citation.yaml` | Not started | Port passage_citation.json → vars + contains/llm-rubric |
| 4 | `eval/tests/theology_compliance.yaml` | Not started | Port theology_compliance.json → vars (prompt, theology) + llm-rubric |
| 5 | `eval/tests/profile_adaptation.yaml` | Not started | Port profile_adaptation.json → vars (prompt, profile) + llm-rubric |
| 6 | `eval/tests/guardrails.yaml` | Optional | New: core doctrines; theology: all or multi-provider |

### Configs (per-suite runs)

| # | File | Status | Notes |
|---|------|--------|--------|
| 1 | `eval/configs/chat-language.yaml` | Done | Loads language_compliance.yaml; 3 providers (spa/kor/por) + local |
| 2 | `eval/configs/chat-passage-citation.yaml` | Not started | tests → passage_citation.yaml |
| 3 | `eval/configs/chat-theology.yaml` | Not started | tests → theology_compliance.yaml |
| 4 | `eval/configs/chat-profile-adaptation.yaml` | Not started | tests → profile_adaptation.yaml |
| 5 | `eval/configs/chat-smoke.yaml` | Optional | Explicit smoke-only config |

### Wiring default suite

| # | Task | Status | Notes |
|---|------|--------|--------|
| 1 | Default `promptfooconfig.yaml` runs smoke | Done | `tests: file://tests/smoke.yaml` |
| 2 | Add npm/bun script for language suite | Optional | e.g. `bun run eval:language` |
| 3 | Unify "run all" (smoke + language + …) | Planned | Single config with multiple test files or script that runs configs in sequence |

**Minimal for first release:** Test files 1–5 (smoke + language + passage + theology + profile). Configs 1–4 so each suite can be run separately. Optional: guardrails, chat-smoke config, eval scripts, unified "run all".

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
# Smoke only (default)
bun run eval

# Language compliance (separate config)
bunx promptfoo eval -c eval/configs/chat-language.yaml -j 50

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
3. **Until then** – Treat **language compliance** as validated only by **internal evals**; document that public (promptfoo) language tests are expected to fail until the API receives `bible_id` at the level it reads. Use the **local provider** (localhost:8000) to debug against a running Gamaliel backend.
