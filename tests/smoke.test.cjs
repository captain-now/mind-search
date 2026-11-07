const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script(?:\\s[^>]*)?>([\\s\\S]*?)<\\/script>/i)?.[1];

test('HTML includes an executable inline application script', () => {
  assert.ok(script, 'Expected application script');
  assert.doesNotThrow(() => new vm.Script(script));
});

test('DOM IDs used by application code exist in HTML', () => {
  const ids = [...script.matchAll(/\\$\\('([^']+)'\\)/g)].map(m => m[1]);
  for (const id of new Set(ids)) {
    assert.match(html, new RegExp('id=["\\\']' + id + '["\\\']'), 'Missing element: ' + id);
  }
});

test('journal write checks persistence before clearing input', () => {
  assert.match(script, /data\\.entries\\.push\\([\\s\\S]*?if\\(!persist\\(\\)\\)\\{data\\.entries\\.pop\\(\\);return\\}/);
});

test('timer uses absolute deadline and handles failed persistence', () => {
  assert.match(script, /deadline=Date\\.now\\(\\)\\+remaining\\*1000/);
  assert.match(script, /Math\\.ceil\\(\\(deadline-Date\\.now\\(\\)\\)\\/1000\\)/);
  assert.match(script, /if\\(!persist\\(\\)\\)\\{data\\.sessions\\.pop\\(\\)/);
});
