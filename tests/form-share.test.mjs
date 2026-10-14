import { test } from 'node:test';
import assert from 'node:assert/strict';
import { embedSnippet } from '../src/lib/form-share.ts';

test('embed snippet escapes the form title', () => {
  const html = embedSnippet('https://x.test/f/abc', 'Say "hi" <b>&</b>');
  assert.match(html, /title="Say &quot;hi&quot; &lt;b&gt;&amp;&lt;\/b&gt;"/);
  assert.match(html, /^<iframe src="https:\/\/x\.test\/f\/abc"/);
});
