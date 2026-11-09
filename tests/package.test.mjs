import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const releaseScript = join(root, 'skills/fyllut-release/scripts/list-releasable-fyllut-commits.sh');
const generator = join(root, 'skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs');

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
