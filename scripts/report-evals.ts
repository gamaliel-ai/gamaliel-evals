#!/usr/bin/env bun
/**
 * Parse a promptfoo eval results JSON file and print a compact, LLM-readable report to stdout.
 *
 * Usage:
 *   bun scripts/report-evals.ts <results.json>
 *   bun run eval:staging -o /tmp/results.json && bun scripts/report-evals.ts /tmp/results.json
 */

import { readFileSync } from 'fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: bun scripts/report-evals.ts <results.json>');
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, 'utf8'));
const { stats } = data.results;
const results: any[] = data.results.results;

const durationSec = (stats.durationMs / 1000).toFixed(1);
const passRate = ((stats.successes / (stats.successes + stats.failures + stats.errors)) * 100).toFixed(1);

// ── Header ────────────────────────────────────────────────────────────────────
console.log('EVAL REPORT');
console.log('===========');
console.log(`evalId:    ${data.evalId}`);
console.log(`total:     ${results.length}`);
console.log(`passed:    ${stats.successes}`);
console.log(`failed:    ${stats.failures}`);
console.log(`errors:    ${stats.errors}`);
console.log(`pass_rate: ${passRate}%`);
console.log(`duration:  ${durationSec}s`);
console.log('');

// ── Per-provider summary ──────────────────────────────────────────────────────
const byProvider: Record<string, { pass: number; fail: number }> = {};
for (const r of results) {
  const pid = r.provider?.id ?? 'unknown';
  byProvider[pid] ??= { pass: 0, fail: 0 };
  if (r.success) byProvider[pid].pass++;
  else byProvider[pid].fail++;
}

console.log('PROVIDERS');
console.log('---------');
for (const [pid, counts] of Object.entries(byProvider)) {
  const total = counts.pass + counts.fail;
  console.log(`${pid}: ${counts.pass}/${total} passed`);
}
console.log('');

// ── Failures ─────────────────────────────────────────────────────────────────
const failures = results.filter(r => !r.success);

if (failures.length === 0) {
  console.log('FAILURES: none');
} else {
  console.log(`FAILURES (${failures.length})`);
  console.log('-'.repeat(40));
  for (const [i, r] of failures.entries()) {
    console.log(`\n[${i + 1}/${failures.length}]`);
    console.log(`  provider:  ${r.provider?.id ?? 'unknown'}`);
    console.log(`  prompt:    ${(r.vars?.prompt ?? '').substring(0, 120)}`);
    console.log(`  vars:      theology=${r.vars?.theology ?? '-'} profile=${r.vars?.profile ?? '-'} bible_id=${r.vars?.bible_id ?? '-'}`);
    console.log(`  score:     ${r.score}`);
    console.log(`  reason:    ${(r.gradingResult?.reason ?? '').substring(0, 200)}`);

    const failedAssertions = (r.gradingResult?.componentResults ?? []).filter((c: any) => !c.pass);
    for (const a of failedAssertions) {
      const type = a.assertion?.type ?? '?';
      const value = a.assertion?.value !== undefined ? ` value="${a.assertion.value}"` : '';
      const reason = (a.reason ?? '').substring(0, 200);
      console.log(`  assertion: [${type}]${value} → ${reason}`);
    }

    // Truncate response to avoid overwhelming output
    const output = (r.response?.output ?? '').substring(0, 400);
    if (output) {
      console.log(`  response:  ${output}${r.response?.output?.length > 400 ? '…' : ''}`);
    }

    if (r.failureReason) {
      console.log(`  error:     ${String(r.failureReason).substring(0, 200)}`);
    }
  }
}
