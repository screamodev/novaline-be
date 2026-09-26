import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatLeadMessage } from '../../src/api/lead/utils/telegram';

test('formats a connection lead with address, context and admin link', () => {
  const text = formatLeadMessage(
    {
      documentId: 'abc',
      type: 'connect',
      name: 'Олена',
      phone: '+380985060609',
      reasonLabel: 'Підключення інтернету',
      settlement: 'Харків',
      neighbourhood: 'Центр',
      district: 'Харківський район',
      region: 'Харківська область',
      context: { label: 'Максимум · 1000 Мбіт/с' },
      message: 'Після 18:00',
      locale: 'uk',
      sourcePath: '/',
    },
    'http://cms/admin/x/abc',
  );
  assert.match(text, /<b>🟣 Нове підключення<\/b>/);
  assert.match(text, /<a href="tel:\+380985060609">\+380985060609<\/a>/);
  assert.match(text, /Харків, Центр, Харківський район, Харківська область/);
  assert.match(text, /Максимум · 1000 Мбіт\/с/);
  assert.match(text, /Відкрити в адмінці/);
});

test('escapes HTML from visitor input and skips empty fields', () => {
  const text = formatLeadMessage({ type: 'callback', phone: '+380991112233', message: '<script>x</script> & co' });
  assert.ok(text.includes('&lt;script&gt;x&lt;/script&gt; &amp; co'));
  assert.ok(!text.includes('Імʼя'));
  assert.equal(escapeHtml('<a>'), '&lt;a&gt;');
});
