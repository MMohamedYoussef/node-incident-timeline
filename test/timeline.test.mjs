import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, renderHtml } from '../src/timeline.mjs';

test('sorts events and measures response and resolution time', () => {
  const result = buildTimeline([
    { id: 'c', at: '2026-09-01T11:00:00Z', type: 'RESOLVED', note: 'Fixed' },
    { id: 'a', at: '2026-09-01T10:00:00Z', type: 'OPENED', note: 'Alert' },
    { id: 'b', at: '2026-09-01T10:30:00Z', type: 'MITIGATED', note: 'Rolled back' },
  ]);
  assert.deepEqual(result.events.map(event => event.id), ['a', 'b', 'c']);
  assert.equal(result.response_minutes, 30);
  assert.equal(result.resolution_minutes, 60);
});

test('rejects impossible sequences and escapes notes in HTML', () => {
  assert.throws(() => buildTimeline([{ id: 'x', at: '2026-09-01T10:00:00Z', type: 'RESOLVED', note: 'oops' }]), /OPENED/);
  const result = buildTimeline([{ id: 'x', at: '2026-09-01T10:00:00Z', type: 'OPENED', note: '<script>' }]);
  const html = renderHtml(result);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('preserves input order when two incident updates have the same timestamp', () => {
  const at = '2026-09-01T10:00:00Z';
  const result = buildTimeline([
    { id: 'z', at, type: 'OPENED', note: 'Alert' },
    { id: 'a', at, type: 'MITIGATED', note: 'Rollback' },
  ]);
  assert.deepEqual(result.events.map(row => row.id), ['z', 'a']);
  assert.equal(result.response_minutes, 0);
});
