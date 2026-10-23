# Chat-Agent Eval Suite – Port Status (gamaliel-evals)

This doc tracks porting **internal ChatAgent evals** (`evals/chat_agent*`, main repo `gamaliel evals run`) into the **public promptfoo-based suite** in this repo (Gamaliel Public API). It doubles as the design reference for what we port and what we leave out.

---

## Current State

| Metric | Value |
|--------|--------|
| **Eval suites in place** | 8 (smoke, passage-citation, theology, familiarity adaptation, familiarity guardrails, language, Nicene, marriage/family) |
| **Test files in the main suite** | 7 (`passage_citation.yaml`, `theology_compliance.yaml`, `profile_adaptation.yaml`, `familiarity_guardrails.yaml`, `language_compliance.yaml`, `nicene_guardrails.yaml`, `marriage_family_guardrails.yaml`) |
| **Total main-suite cases** | 125 (21 passage + 18 theology + 14 familiarity adaptation + 28 familiarity guardrails + 12 language + 12 Nicene + 20 marriage/family). Smoke is separate (1). |
| **Default profile** | `read_regularly` when a case does not set one |
| **Configs** | **Four configs:** `promptfooconfig.yaml` (production), `promptfooconfig.staging.yaml` (internal), `promptfooconfig.local.yaml` (internal), `promptfooconfig.openai.yaml` (comparison) |
| **Request model** | `gpt-5.6-luna` on the Gamaliel HTTP configs and the OpenAI comparison |
| **llm-rubric grader** | `openai:chat:gpt-5.6-luna` via `defaultTest.options.provider` on every config |
| **Default `bun run eval`** | Runs full suite against **production** (all main-suite tests × 1 provider). |
| **Run against staging** | `bun run eval:staging` or `-c promptfooconfig.staging.yaml` |
| **Run against local** | `bun run eval:local` or `-c promptfooconfig.local.yaml` |
| **Run against OpenAI** | `bun run eval:openai` or `-c promptfooconfig.openai.yaml` (passage citation, Nicene guardrails, and marriage/family guardrails) |

**Architecture:** Tests are **provider-agnostic** (no hardcoded providers). Gamaliel configs (prod/staging/local) use template variables (`theology`, `profile`, `bible_id` from test vars). OpenAI config only includes general tests that don't require Gamaliel-specific parameters. Separate config files for each environment/comparison define the provider endpoint.

---

## Evals Ported

Evals that only need **prompt + response** (and optional theology/profile/bible_id via passthrough). Status and source below.

| Eval | Source (main repo) | What it checks | Status | Notes |
|------|--------------------|----------------|--------|--------|
| **passage-cite** | passage_citation.json | Cited passages, min count, must_include_book; LLM rubrics | **✅ Ported** | 21 tests in `passage_citation.yaml` |
| **language** | language_compliance.json | Response in expected language (es/ko/pt); bible_id → language | **✅ Ported** | 12 tests in `language_compliance.yaml` |
| **theology** | theology_compliance.json | Theology-specific rubrics (Reformed, Catholic, default, egalitarian) | **✅ Ported** | 18 tests in `theology_compliance.yaml`, default profile `read_regularly` |
| **profile-adaptation** | profile_adaptation.json | Response style/depth per Bible familiarity level | **✅ Ported** | 14 tests in `profile_adaptation.yaml` for the four-rung ladder |
| **familiarity guardrails** | — | Same doctrine prompts across all four familiarity levels | **✅ Added** | 28 tests in `familiarity_guardrails.yaml` |
| **smoke** | — | Quick validation that API responds | **✅ Ported** | 1 test in `smoke.yaml` |
| **Nicene guardrails** | — | Core doctrines affirmed unequivocally | **✅ Ported** | 12 tests in `nicene_guardrails.yaml` |
| **marriage/family guardrails** | — | Marriage, sex, and adversarial framing by theology | **✅ Ported** | 20 tests in `marriage_family_guardrails.yaml` |

---

## Evals We Will Not Port (Out of Scope)

These depend on **ChatAgent internals** or **app state** the public API does not expose.

| Eval | Why it doesn't apply |
|------|----------------------|
| **tool-params** | Asserts correct tool and parameters (e.g. `bible_id`). Requires SSE/tool_calls/stream_end_data; public API returns only the final assistant message. |
| **query-transform** | Asserts quality of the transformed semantic search query. The transformed query is internal and never returned. |
| **adaptive** | Asserts tool choice and `n_results` for "list all X" questions. Internal tool/parameter behavior. |
| **chat-title** | Asserts chat title set from first message. DB/chat state; completion API does not expose chat metadata. |

**Summary:** The public suite only has **prompt → API → response text** (plus theology/profile/bible_id via passthrough). Any eval that needs **tool calls**, **internal query**, or **chat/session state** is out of scope.

---

## Internal ChatAgent Evals (Reference)

**Internal harness:** `evals/chat_agent/harness.py` (real ChatAgent, DB, streaming, returns `response` + events). **Scoring:** `evals/chat_agent_eval.py` (Python scorers). The tables above map which internal evals we port vs. omit.

---

## What Promptfoo Can Do Here

- **Same as API:** prompt (user message) + optional theology/profile (and bible_id) via passthrough → one response text.
- **Assertions:** contains, icontains, llm-rubric, javascript, etc. No tool-call or DB access.

We **port** evals that only need **prompt + response (+ theology/profile/bible_id)**. We **omit** evals that depend on tool calls, transformed queries, or chat state.

---

## Config Architecture

**Four separate config files** (three for environments, one for comparison):

- **`promptfooconfig.yaml`** - Production (default, auto-discovered by promptfoo)
- **`promptfooconfig.staging.yaml`** - Staging (internal use only)
- **`promptfooconfig.local.yaml`** - Local development (internal use only)
- **`promptfooconfig.openai.yaml`** - OpenAI GPT-5.6-luna comparison (passage citation, Nicene guardrails, and marriage/family guardrails)

**Key design decisions:**

1. **Provider-agnostic tests:** All test files have **no hardcoded providers**. They use template variables (`theology`, `profile`, `bible_id`) from test vars.
2. **HTTP providers:** Gamaliel configs (prod/staging/local) use HTTP providers with URLs as provider IDs (required by promptfoo) and request `model: gpt-5.6-luna`.
3. **OpenAI provider:** OpenAI config uses native `openai:chat:gpt-5.6-luna` (no Gamaliel-specific params). Same model as the Gamaliel request, so the comparison isolates prompt and guardrails.
4. **Grader:** Every config sets `defaultTest.options.provider` to `openai:chat:gpt-5.6-luna`, which promptfoo uses as the `llm-rubric` judge.
5. **Template variables:** Gamaliel provider configs use `{{ theology | default('default') }}`, `{{ profile | default('read_regularly') }}`, `{{ bible_id | default('eng-web') }}` to pick up values from test vars.
6. **Test suite selection:** Gamaliel configs reference the main suite, including familiarity adaptation and cross-tier doctrine checks. OpenAI config includes passage citation, Nicene guardrails, and marriage/family guardrails. It excludes tests that require Gamaliel `theology`, `profile`, or `bible_id` behavior.

**Why separate configs:** Each environment has a different API endpoint. OpenAI config enables comparison with standard OpenAI while excluding Gamaliel-specific functionality. Using separate configs makes it clear which environment/comparison you're testing against.

---

## File Layout

```
gamaliel-evals/
├── promptfooconfig.yaml              # Production config (default)
├── promptfooconfig.staging.yaml      # Staging config (internal)
├── promptfooconfig.local.yaml        # Local config (internal)
├── promptfooconfig.openai.yaml       # OpenAI comparison (passage, Nicene, marriage/family)
├── eval/
│   ├── tests/
│   │   ├── smoke.yaml                     # 1 test - quick validation
│   │   ├── passage_citation.yaml          # 21 tests
│   │   ├── theology_compliance.yaml       # 18 tests
│   │   ├── profile_adaptation.yaml        # 14 tests
│   │   ├── familiarity_guardrails.yaml    # 28 tests
│   │   ├── language_compliance.yaml       # 12 tests
│   │   ├── nicene_guardrails.yaml         # 12 tests
│   │   └── marriage_family_guardrails.yaml # 20 tests
│   ├── validate-env.js               # Environment validation hook
│   ├── theologies.yaml               # Theology definitions (if exists)
│   └── profiles.yaml                 # Profile definitions (if exists)
├── scripts/
│   └── report-evals.ts                # Eval report generator
├── docs/
│   └── port-status.md                # This file
└── package.json                      # Scripts: eval, eval:staging, eval:local, etc.
```

---

## How to Run

```bash
# Production (default config)
bun run eval

# Staging (internal)
bun run eval:staging

# Local (internal - requires backend running)
bun run eval:local

# OpenAI comparison (passage citation, Nicene, marriage/family)
bun run eval:openai

# Smoke tests only
bun run eval:smoke                    # Production
bun run eval:smoke:staging            # Staging
bun run eval:smoke:local              # Local

# View results
bun run eval:view                     # Open promptfoo web UI

# Generate report
bun run eval:report /tmp/results.json
```

**Local setup requirements:**
1. **Backend running** – `make dev` in main repo (backend on port 8000)
2. **Hosts entry** – `127.0.0.1 api.localhost` in `/etc/hosts`
3. **OPENAI_API_KEY** – set in environment or `.env`

---

## Mapping from Internal JSON to Promptfoo YAML

| Main-repo JSON | promptfoo YAML | Notes |
|----------------|----------------|--------|
| `input` | `vars.prompt` | User message |
| `bible_id` | `vars.bible_id` | Passed via template variable to provider |
| `user_theology_slug` | `vars.theology` | Passed via template variable to provider |
| `user_profile_slug` | `vars.profile` | Passed via template variable to provider |
| `expected_passages`, `min_passage_count`, `must_include_book` | `assert` contains/icontains or llm-rubric | Ported to assertions |
| `expected_language`, `language_indicators`, `min_indicator_count` | `assert` contains or llm-rubric | Done in language_compliance.yaml |
| `evaluation_criteria` | `assert - type: llm-rubric value: "..."` | Direct port of criteria text |
| `expected_tool`, `expected_bible_id` (tool-params) | Omit | No agent internals |
| Transformed query, adaptive (n_results/tool) | Omit | No access |

---

## Test File Status

| # | File | Status | Test Count | Notes |
|---|------|--------|------------|--------|
| 1 | `eval/tests/smoke.yaml` | ✅ Done | 1 | Quick validation test |
| 2 | `eval/tests/passage_citation.yaml` | ✅ Done | 21 | contains/icontains + llm-rubric |
| 3 | `eval/tests/theology_compliance.yaml` | ✅ Done | 18 | vars (prompt, theology); default profile `read_regularly`; threshold 1.0 |
| 4 | `eval/tests/profile_adaptation.yaml` | ✅ Done | 14 | four familiarity levels; llm-rubric; threshold 1.0 |
| 5 | `eval/tests/familiarity_guardrails.yaml` | ✅ Done | 28 | 7 doctrine prompts × 4 familiarity levels; threshold 1.0 |
| 6 | `eval/tests/language_compliance.yaml` | ✅ Done | 12 | es/ko/pt, contains + js for Hangul |
| 7 | `eval/tests/nicene_guardrails.yaml` | ✅ Done | 12 | core doctrines; default profile; threshold 1.0 |
| 8 | `eval/tests/marriage_family_guardrails.yaml` | ✅ Done | 20 | marriage, sex, adversarial framing; threshold 1.0 |

---

## Config Status

| # | File | Status | Notes |
|---|------|--------|--------|
| 1 | `promptfooconfig.yaml` | ✅ Done | **Production config:** All test files, HTTP provider requesting `gpt-5.6-luna`, luna grader |
| 2 | `promptfooconfig.staging.yaml` | ✅ Done | **Staging config:** Same tests, staging endpoint (internal), luna request and grader |
| 3 | `promptfooconfig.local.yaml` | ✅ Done | **Local config:** Same tests, local endpoint (internal), luna request and grader |
| 4 | `promptfooconfig.openai.yaml` | ✅ Done | **OpenAI comparison:** `openai:chat:gpt-5.6-luna`; passage citation, Nicene guardrails, and marriage/family guardrails |

---

## Reusability (Promptfoo vs Main Repo)

| Concern | Main repo | promptfoo (gamaliel-evals) |
|--------|-----------|----------------------------|
| Where "prompt" lives | Test case `input` in JSON | Test case `vars.prompt` in YAML |
| Where criteria live | Python scorers + sometimes `evaluation_criteria` in JSON | Test case `assert` in YAML (llm-rubric, contains, etc.) |
| How to run | harness + runner + EVAL_REGISTRY | `promptfooconfig.yaml` + separate configs per environment |
| Per-environment run | `gamaliel evals run --env staging` | `bun run eval:staging` or `-c promptfooconfig.staging.yaml` |
| Theology/profile matrix | harness expands slugs | Template variables in provider config, values from test vars |

This structure keeps a **parallel ChatAgent-style eval suite** in promptfoo that matches the main repo's eval types (passage, language, theology, profile) while staying within what the public API can observe.

---

## Language Eval Notes

**How it works:** The `language_compliance.yaml` tests set `bible_id` in test vars (e.g. `spa-niv-2022`, `kor-niv-1985`, `por-niv-23`). The HTTP provider config uses `bible_id: "{{ bible_id | default('eng-web') }}"` to pass this to the API. The API uses `bible_id` to determine the response language.

**Status:** Language tests work correctly with the HTTP provider approach. The API receives `bible_id` at the top level of the request body and responds in the appropriate language.
