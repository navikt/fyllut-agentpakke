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
  'fyllut-dependency-upgrade',
  'fyllut-dependency-upgrade-stack',
  'fyllut-form-text-history',
  'fyllut-playwright-best-practices',
  'fyllut-pr-review-follow-up',
  'fyllut-release',
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
  assert.deepEqual(manifest.layout, { agents: 'agents', skills: 'skills' });
  assert.equal(base.source, 'navikt/copilot');
  assert.match(base.sha, /^[0-9a-f]{40}$/);
  for (const client of ['copilot', 'opencode']) {
    assert.equal(manifest.clients[client].payloads, undefined);
    assert.deepEqual(manifest.clients[client].primaryAgents, ['fyllut']);
  }
  assert.match(read('agents/fyllut.agent.md'), /^---\nname: fyllut\n/);
  assert.deepEqual(readdirSync(join(root, 'skills')).sort(), expectedSkills);
  for (const skill of expectedSkills) {
    assert.ok(skill.startsWith('fyllut-'));
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

test('Playwright skill bundles its referenced guides, license, and pinned origin', () => {
  const directory = 'skills/fyllut-playwright-best-practices';
  const skill = read(`${directory}/SKILL.md`);
  const references = [...skill.matchAll(/\]\(([^)]+\.md)\)/g)].map((match) => match[1]);
  assert.ok(new Set(references).size > 50);
  for (const reference of references) {
    assert.ok(!reference.startsWith('/') && !reference.split('/').includes('..'));
    assert.ok(read(`${directory}/${reference}`).length > 0, reference);
  }
  const license = read(`${directory}/LICENSE.md`);
  assert.match(license, /Copyright © 2026 Currents Software Inc\./);
  assert.match(license, /Permission is hereby granted/);
  assert.match(read('README.md'), /283d5cbc5d11aac1abda058b16ad22c317d54dc0/);
  assert.match(skill, /## Nav integration/);
  assert.match(skill, /Never use production credentials or real personal data/);
});

test('Unslop preserves local invocation settings and includes its upstream license', () => {
  const skill = read('skills/fyllut-unslop/SKILL.md');
  assert.match(skill, /description: Cut AI tells from any writing\. Must always apply\./);
  assert.match(skill, /disable-model-invocation: true/);
  assert.match(skill, /Scan for the patterns below, then rewrite\./);
  const license = read('skills/fyllut-unslop/LICENSE');
  assert.match(license, /MIT License/);
  assert.match(license, /Copyright \(c\) 2026 Lauren Tan/);
  assert.match(license, /Permission is hereby granted/);
  assert.match(read('README.md'), /f713f14203cd6420cec13cd7c55c32d598dbab68/);
});

test('bundled script instructions use the launch-provided skills directory', () => {
  for (const skill of ['fyllut-release', 'fyllut-form-text-history']) {
    const text = read(`skills/${skill}/SKILL.md`);
    assert.ok(text.includes(': "${NAV_PILOT_SKILLS_DIR:?'));
    assert.ok(text.includes(`"$NAV_PILOT_SKILLS_DIR/${skill}/scripts/`));
    assert.ok(!text.includes('plugins/'));
    assert.ok(!text.includes('<skill-directory>'));
  }
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
