import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { renameWorker } from '../src/server/workers/identity.js';
import { newWorker } from '../src/server/workers/worker.js';
import { newTracker } from '../src/server/usage.js';
import { saveWorkers, restoreWorkers } from '../src/server/workers/persist.js';
import { identityHandlers } from '../src/server/ws/handlers/identity.js';
import type { WorkerHandle, Worker } from '../src/server/workers/types.js';
import type { WorkerInfo } from '../src/shared/protocol.js';

test('renaming survives persistence without replacing session, worker, or worktree', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'office-identity-'));
  try {
    const file = path.join(dir, 'workers.json');
    const info = { id: 'synthetic-worker', name: 'Pixel', kind: 'agent', provider: 'custom', deskId: 'desk-1', status: 'idle', sessionId: 'synthetic-session', worktree: { path: 'work', branch: 'office/pixel', base: 'abc' } } as WorkerInfo;
    const worker = newWorker(info, newTracker(), 'synthetic-test-token');
    let emitted = 0;
    const h = { info, persist: () => saveWorkers(file, [worker], false), emit: () => emitted++ } as unknown as WorkerHandle;
    assert.equal(renameWorker(h, '  Flora · Coordinadora agrícola  '), undefined);
    const restored = new Map<string, Worker>();
    restoreWorkers(file, restored, 'custom', () => false);
    const saved = restored.get(info.id)!.info;
    assert.equal(saved.name, 'Flora · Coordinadora agrícola');
    assert.equal(saved.sessionId, 'synthetic-session');
    assert.deepEqual(saved.worktree, info.worktree);
    assert.equal(saved.id, info.id);
    assert.equal(emitted, 1);
    renameWorker(h, saved.name);
    assert.equal(emitted, 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('malformed identity input cannot inject terminal controls or mutate worker metadata', () => {
  const info = { name: 'Atlas' } as WorkerInfo;
  const h = { info, persist: () => assert.fail('invalid name persisted'), emit: () => assert.fail('invalid name emitted') } as unknown as WorkerHandle;
  for (const name of [null, 7, '', '  ', 'a'.repeat(65), 'X\nY', '\x1b[31mAtlas', 'A\u202eB']) {
    assert.equal(typeof renameWorker(h, name), 'string');
    assert.equal(info.name, 'Atlas');
  }
});

test('identity requests require an admin on the actual worker floor', () => {
  let admin = false;
  let here: object = {};
  let renamed = 0;
  const floor = { workers: { get: () => ({ id: 'w' }), rename: () => { renamed++; } } };
  const warnings: unknown[] = [];
  const ctx = { meOf: () => ({ admin }), workerFloor: () => floor, floorOf: () => here, warn: (_c: unknown, error: unknown) => warnings.push(error) };
  const c = { accountId: 'account' };
  const run = () => identityHandlers['worker.rename'](ctx as never, c as never, { t: 'worker.rename', workerId: 'w', name: 'Atlas' });
  run();
  assert.match(String(warnings.pop()), /admins/);
  admin = true;
  run();
  assert.match(String(warnings.pop()), /floor/);
  assert.equal(renamed, 0);
  here = floor;
  run();
  assert.equal(renamed, 1);
});
