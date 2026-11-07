import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(join(root, path), 'utf8');
const expectedSkills = [
  'fyllut-approve-github-stack',
  'fyllut-bug-triage-and-fix',
  'fyllut-create-pr',
  'fyllut-dependency-upgrade',
  'fyllut-dependency-upgrade-stack',
  'fyllut-follow-up-issue',
  'fyllut-form-text-history',
  'fyllut-investigate-incident',
  'fyllut-observability-debugging',
  'fyllut-playwright-best-practices',
  'fyllut-pr-review',
  'fyllut-pr-review-follow-up',
  'fyllut-release',
  'fyllut-review-before-pr',
  'fyllut-review-core',
  'fyllut-sendinn-specification',
  'fyllut-unslop',
];
const releaseScript = join(root, 'skills/fyllut-release/scripts/list-releasable-fyllut-commits.sh');
const generator = join(root, 'skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs');

test('Tier 1 layout includes every team skill and a startable persona', () => {
  const manifest = JSON.parse(read('.nav-pilot/agentpakke.json'));
  const base = JSON.parse(read('.nav-pilot/agentpakke.lock.json'));
  assert.equal(manifest.name, 'fyllut-agentpakke');
  assert.equal(manifest.contractVersion, '1');
  assert.deepEqual(manifest.layout, { agents: 'agents', skills: 'skills', instructions: 'instructions' });
  assert.equal(base.source, 'navikt/copilot');
  assert.match(base.sha, /^[0-9a-f]{40}$/);
  for (const client of ['copilot', 'opencode', 'pi']) {
    assert.equal(manifest.clients[client].payloads, undefined);
    assert.deepEqual(manifest.clients[client].primaryAgents, ['fyllut']);
    assert.equal(manifest.clients[client].defaultModel, 'inherit');
  }
  assert.match(read('instructions/fyllut-sandbox.instructions.md'), /^---\napplyTo: "\*\*"\n---\n/);
  assert.match(read('agents/fyllut.agent.md'), /^---\nname: fyllut\n/);
  for (const workflow of ['fyllut-review-before-pr', 'fyllut-create-pr', 'fyllut-review-core', 'fyllut-pr-review']) {
    assert.ok(read('agents/fyllut.agent.md').includes(`\`${workflow}\``), `${workflow} missing from persona`);
  }
  assert.deepEqual(readdirSync(join(root, 'skills')).sort(), expectedSkills);
  for (const skill of expectedSkills) {
    assert.ok(skill.startsWith('fyllut-'));
    assert.ok(read('README.md').includes(`](skills/${skill}/SKILL.md)`), `${skill} missing from README`);
    assert.match(read(`skills/${skill}/SKILL.md`), new RegExp(`^---\\nname: ${skill}\\n`));
  }
  for (const reference of [
    'functional-discovery-question-bank.md',
    'technical-discovery-question-bank.md',
    'prototype-validation.md',
  ]) {
    assert.ok(read(`skills/fyllut-sendinn-specification/references/${reference}`).length > 0);
  }
});

test('both review workflows load shared criteria and retain their own entry policies', () => {
  const core = read('skills/fyllut-review-core/SKILL.md');
  const localReview = read('skills/fyllut-review-before-pr/SKILL.md');
  const prReview = read('skills/fyllut-pr-review/SKILL.md');
  const createPr = read('skills/fyllut-create-pr/SKILL.md');
  assert.match(core, /^---\nname: fyllut-review-core\n/);
  for (const workflow of [localReview, prReview]) {
    assert.match(workflow, /Load\s+`fyllut-review-core`/);
  }
  assert.match(prReview, /disable-model-invocation: true/);
  assert.match(prReview, /Do not run the full build unless the user asks/);
  assert.match(localReview, /Run the tests, lint, type checks and build/);
  assert.match(createPr, /Use `fyllut-review-before-pr`, which loads `fyllut-review-core`/);
});

test('PR handoff reuses review evidence and supports human-written code', () => {
  const core = read('skills/fyllut-review-core/SKILL.md');
  const localReview = read('skills/fyllut-review-before-pr/SKILL.md');
  const createPr = read('skills/fyllut-create-pr/SKILL.md');
  assert.match(core, /## Reuse completed review/);
  assert.match(core, /same scope, base and actual content/);
  assert.match(core, /including the independence\s+the calling workflow requires/);
  assert.match(core, /A statement that review passed is not sufficient evidence/);
  assert.match(localReview, /## Reuse evidence first/);
  assert.match(localReview, /If independent review is still needed/);
  assert.match(createPr, /human-written, agent-written and mixed changes/);
  assert.match(createPr, /A PR request alone never permits code changes/);
});

test('review mode decides whether PR creation may fix findings', () => {
  const createPr = read('skills/fyllut-create-pr/SKILL.md');
  const core = read('skills/fyllut-review-core/SKILL.md');
  const localReview = read('skills/fyllut-review-before-pr/SKILL.md');
  assert.match(createPr, /1\. Review and report findings\. Do not edit code\./);
  assert.match(createPr, /2\. Review and fix findings\./);
  assert.match(createPr, /3\. No review, under the exception below\./);
  assert.match(createPr, /\*\*Started by another skill\.\*\* Always review\. Fix verified findings within\s+that skill's task scope/);
  assert.match(createPr, /\*\*Any other start\.\*\* Always review, report findings and do not edit code/);
  assert.match(createPr, /If unsure which case applies, review and report findings without editing/);
  assert.doesNotMatch(createPr, /who wrote the code decides|Code the user wrote|Code you wrote/i, 'fix permission must not depend on guessing authorship');
  assert.match(createPr, /## Handle findings/);
  assert.match(createPr, /Fix findings only when the\s+review mode permits it/);
  assert.match(createPr, /Continuation prompts, tool approvals and silence are\s+not approval/);
  assert.match(createPr, /Rød findings block a ready PR\. Gul findings do not block/);
  assert.match(createPr, /Open gul findings from the review/);
  assert.match(createPr, /Fix only as Handle findings allows/);
  assert.match(core, /`fyllut-create-pr` decides when\s+PR creation permits fixes/);
  assert.match(localReview, /Gul findings do not block/);
  assert.match(localReview, /Author-side fixes need permission from the\s+calling workflow/);
});

test('PR creation permits an explicit review exception without waiving required checks', () => {
  const createPr = read('skills/fyllut-create-pr/SKILL.md');
  assert.match(createPr, /## Choose review mode/);
  const description = createPr.match(/^description: (.*)$/m)[1];
  assert.doesNotMatch(description, /\bask\b|explicit/i, 'review-mode instructions belong in the body');
  assert.ok(
    createPr.indexOf('## Choose review mode first') < createPr.indexOf('## Permission and target'),
    'review mode must be decided before the rest of the workflow',
  );
  assert.match(createPr, /\*\*Explicit invocation\.\*\*[\s\S]*Ask one\s+question with these choices, and recommend the first/);
  assert.match(createPr, /applies only when the user invoked this skill explicitly/);
  assert.match(createPr, /## Review by default/);
  assert.match(createPr, /## Explicit exception for agent review/);
  assert.match(createPr, /Do not invoke `fyllut-review-before-pr`/);
  assert.match(createPr, /does not waive mandatory repository or caller checks/);
  assert.match(createPr, /Under the exception, always state the agent-review status under Verification/);
  assert.match(createPr, /skips an additional PR-creation review, not that delivery requirement/);
  assert.match(createPr, /Skipping agent review alone does not force draft status/);
});

test('task skills that deliver PRs route review and publication through the shared workflows', () => {
  for (const skill of ['fyllut-bug-triage-and-fix', 'fyllut-dependency-upgrade']) {
    const text = read(`skills/${skill}/SKILL.md`);
    assert.match(text, /`fyllut-review-before-pr`/, `${skill} skips local review`);
    assert.match(text, /`fyllut-create-pr`/, `${skill} skips PR creation workflow`);
    assert.match(text, /fix-round limit in `fyllut-review-core`/, `${skill} lacks fix-round limit`);
  }
  const followUp = read('skills/fyllut-pr-review-follow-up/SKILL.md');
  assert.match(followUp, /Before pushing, review the new commits with `fyllut-review-before-pr`/);
});

test('local review scales follow-up review and shortens low-risk reports', () => {
  const localReview = read('skills/fyllut-review-before-pr/SKILL.md');
  assert.match(localReview, /## Scale review for follow-up changes/);
  for (const level of ['Small', 'Moderate', 'Extensive']) {
    assert.match(localReview, new RegExp(`\\*\\*${level}\\.\\*\\*`));
  }
  assert.match(localReview, /When unsure,\s+choose the broader level/);
  assert.match(localReview, /does not change observable\s+behavior/);
  assert.match(localReview, /CI,\s+deployment, configuration or dependency change that affects production/);
  assert.match(localReview, /independent review of the whole PR\s+at its new head/);
  assert.match(localReview, /At low risk, give the risk level in one line/);
});

test('review core is not an entry point and PR review keeps its own provenance', () => {
  const core = read('skills/fyllut-review-core/SKILL.md');
  const prReview = read('skills/fyllut-pr-review/SKILL.md');
  assert.match(core, /^description: .*Not an entry point/m);
  assert.match(core, /If none of these workflows loaded this skill, do not review with it alone/);
  assert.match(core, /Apply this section only when the calling workflow permits reuse/);
  assert.match(prReview, /Do not reuse conclusions from\s+earlier agent reviews/);
  assert.match(prReview, /Kriterier=fyllut-review-core-v<core version>/);
  assert.match(prReview, /^Risiko: /m);
  assert.match(prReview, /^Tilbakerulling: /m);
});

test('skills do not tell the model to load skills it cannot invoke', () => {
  const hidden = expectedSkills.filter((skill) =>
    /^disable-model-invocation: true$/m.test(read(`skills/${skill}/SKILL.md`)),
  );
  assert.ok(hidden.includes('fyllut-unslop'));
  for (const skill of expectedSkills) {
    const text = read(`skills/${skill}/SKILL.md`);
    for (const target of hidden) {
      const loads = new RegExp(`(?:Load|Invoke)\\s+(?:\`[^\`]+\`\\s+(?:or|and)\\s+)?\`${target}\``);
      assert.doesNotMatch(text, loads, `${skill} loads model-hidden ${target}`);
      assert.doesNotMatch(text, new RegExp(`\`${target}\` skill is available, invoke`), `${skill} invokes ${target}`);
    }
  }
});

test('Playwright skill bundles its referenced guides and license', () => {
  const directory = 'skills/fyllut-playwright-best-practices';
  const skill = read(`${directory}/SKILL.md`);
  const references = [...skill.matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]);
  for (const reference of references) {
    assert.ok(!reference.startsWith('/') && !reference.split('/').includes('..'));
    assert.ok(read(`${directory}/${reference}`).length > 0, reference);
  }
  assert.ok(read(`${directory}/LICENSE.md`).length > 0);
});

test('Unslop bundles its license', () => {
  assert.ok(read('skills/fyllut-unslop/LICENSE').length > 0);
});

test('report generator exposes help and rejects invalid input before repository access', () => {
  const help = spawnSync(process.execPath, [generator, '--help'], { encoding: 'utf8' });
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /--repository/);
  for (const args of [
    ['--form', '../escape', '--from', '2024-01-01', '--to', '2024-12-31'],
    ['--form', 'nav190105', '--from', '2024-02-30', '--to', '2024-12-31'],
    ['--unexpected', 'value'],
  ]) {
    const result = spawnSync(process.execPath, [generator, ...args], { encoding: 'utf8' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /relative form path|valid calendar dates|Unknown option/);
  }
});

test('release candidate script works outside the package and fails closed on GitHub errors', () => {
  const directory = mkdtempSync(join(tmpdir(), 'fyllut-package-test-'));
  try {
    const deployed = 'a'.repeat(40);
    const candidate = 'b'.repeat(40);
    writeFileSync(join(directory, 'gh'), `#!/bin/sh
set -eu
if [ "\${MOCK_GH_FAIL:-}" = "1" ]; then
  printf 'Simulated GitHub failure\\n' >&2
  exit 1
fi
case "$*" in
  *contents/MONOREPO*) printf '${deployed}' | base64 ;;
  *'commits?sha=main'*) printf '${deployed}\\n${candidate}\\n' ;;
  *'run list'*) printf 'true\\n' ;;
  *commits/${deployed}*) printf '${deployed}\\n2024-01-01\\nTest author\\nTest deployed commit\\n' ;;
  *commits/${candidate}*) printf '${candidate}\\n2024-01-02\\nTest author\\nTest candidate commit\\n' ;;
  *) printf 'Unexpected mock call: %s\\n' "$*" >&2; exit 1 ;;
esac
`, { mode: 0o755 });
    const env = { ...process.env, PATH: `${directory}:${process.env.PATH}` };
    const result = spawnSync('bash', [releaseScript, 'master'], {
      cwd: directory, env, encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(result.stdout.includes(deployed));
    assert.ok(result.stdout.includes(candidate));
    assert.match(result.stdout, /Currently deployed on master/);
    const failure = spawnSync('bash', [releaseScript, 'master'], {
      cwd: directory, env: { ...env, MOCK_GH_FAIL: '1' }, encoding: 'utf8',
    });
    assert.notEqual(failure.status, 0);
    assert.match(failure.stderr, /Could not read MONOREPO/);
    assert.equal(failure.stdout, '');
  } finally {
    rmSync(directory, { recursive: true });
  }
});
