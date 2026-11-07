const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const start = html.indexOf('<script>');
const end = html.indexOf('</script>', start);
const script = start >= 0 && end > start ? html.slice(start + 8, end) : '';

test('application JavaScript parses', () => {
  assert.ok(script, 'Expected inline application script');
  assert.doesNotThrow(() => new vm.Script(script));
});

test('required application controls exist', () => {
  for (const id of ['save', 'export', 'journalArea', 'tasks', 'clock', 'start', 'reset', 'entries', 'toast']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing element: ' + id);
  }
});

test('journal write checks persistence before clearing input', () => {
  assert.ok(script.includes('if(!persist()){data.entries.pop();return}'));
});

test('timer uses absolute deadline and handles failed persistence', () => {
  assert.ok(script.includes('deadline=Date.now()+remaining*1000'));
  assert.ok(script.includes('Math.ceil((deadline-Date.now())/1000)'));
  assert.ok(script.includes('if(!persist()){data.sessions.pop()'));
});

test('backup and restore controls exist', () => {
  for (const id of ['backup', 'restore', 'restoreFile']) {
    assert.ok(html.includes('id="' + id + '"'), 'Missing element: ' + id);
  }
});

test('backup schema and confirmation are present', () => {
  assert.ok(script.includes("format:'mind-search-backup'"));
  assert.ok(script.includes('version:1'));
  assert.ok(script.includes('function validBackup(v)'));
  assert.ok(script.includes('window.confirm('));
});

test('restore rejects malformed data and rolls back failed saves', () => {
  assert.ok(script.includes('if(!validBackup(parsed))'));
  assert.ok(script.includes('if(!persist()){data=previous;return}'));
  assert.ok(script.includes('file.size>10*1024*1024'));
});
