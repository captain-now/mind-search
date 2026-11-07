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

test('PWA manifest and service worker are wired', () => {
  const manifest = JSON.parse(fs.readFileSync('manifest.webmanifest', 'utf8'));
  const sw = fs.readFileSync('sw.js', 'utf8');
  const icon = fs.readFileSync('icons/icon.svg', 'utf8');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './');
  assert.ok(html.includes('rel="manifest"'));
  assert.ok(script.includes('navigator.serviceWorker.register("./sw.js")'));
  assert.doesNotThrow(() => new vm.Script(sw));
  assert.ok(icon.includes('<svg'));
  assert.ok(sw.includes("request.mode==='navigate'"));
});

test('stable version is visible in page footer', () => {
  assert.ok(html.includes('정식 버전 v0.4.0'));
});

test('service worker serves cached homepage when navigation is offline', async () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const handlers = {};
  const scope = 'https://example.test/mind-search/';
  const offlinePage = { status: 200, text: async () => '<html>offline-ready</html>' };
  const cache = {
    addAll: async () => {},
    put: async () => {},
  };
  const context = {
    self: {
      location: { origin: 'https://example.test' },
      registration: { scope },
      addEventListener: (type, handler) => { handlers[type] = handler; },
      skipWaiting: async () => {},
      clients: { claim: async () => {} },
    },
    caches: {
      open: async () => cache,
      keys: async () => [],
      delete: async () => true,
      match: async request => request === './index.html' ? offlinePage : undefined,
    },
    fetch: async () => { throw new Error('offline'); },
    URL,
    Response: { error: () => ({ status: 0 }) },
  };
  vm.runInNewContext(sw, context);
  assert.equal(typeof handlers.fetch, 'function');
  let responsePromise;
  handlers.fetch({
    request: { method: 'GET', url: scope, mode: 'navigate' },
    respondWith: promise => { responsePromise = promise; },
    waitUntil: () => {},
  });
  assert.ok(responsePromise, 'Navigation should be intercepted');
  const response = await responsePromise;
  assert.equal(await response.text(), '<html>offline-ready</html>');
});

test('service worker does not intercept non-GET or cross-origin requests', () => {
  const sw = fs.readFileSync('sw.js', 'utf8');
  const handlers = {};
  vm.runInNewContext(sw, {
    self: {
      location: { origin: 'https://example.test' },
      registration: { scope: 'https://example.test/mind-search/' },
      addEventListener: (type, handler) => { handlers[type] = handler; },
    },
    URL,
  });
  let intercepted = 0;
  for (const request of [
    { method: 'POST', url: 'https://example.test/mind-search/', mode: 'navigate' },
    { method: 'GET', url: 'https://external.test/', mode: 'navigate' },
  ]) {
    handlers.fetch({ request, respondWith: () => { intercepted++; } });
  }
  assert.equal(intercepted, 0);
});

test('backup validator accepts valid data and rejects malformed or oversized records', () => {
  const begin = script.indexOf('function validBackup(v)');
  const end = script.indexOf("$('backup').onclick", begin);
  assert.ok(begin >= 0 && end > begin, 'Backup validator not found');
  const validBackup = vm.runInNewContext(script.slice(begin, end) + ';validBackup', {});
  const good = {
    format: 'mind-search-backup',
    version: 1,
    data: {
      sessions: ['2026-11-08T00:00:00.000Z'],
      entries: [{ time: '2026-11-08T00:00:00.000Z', text: 'test entry' }],
      tasks: { '2026-11-08': [0, 9] },
    },
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  assert.equal(validBackup(good), true);
  for (const mutate of [
    v => { v.version = 999; },
    v => { v.data.sessions = ['invalid-date']; },
    v => { v.data.entries[0].text = 'x'.repeat(5001); },
    v => { v.data.tasks['2026-11-08'] = [10]; },
    v => { v.data.tasks['bad-key'] = [0]; },
    v => { v.data.tasks = []; },
    v => { v.data.entries = null; },
  ]) {
    const invalid = clone(good);
    mutate(invalid);
    assert.equal(validBackup(invalid), false);
  }
});
