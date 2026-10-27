import { test } from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, formatLeadMessage } from '../../src/api/lead/utils/telegram';

test('formats a connection lead: local copyable phone, address from region down, no admin link or page', () => {
  const text = formatLeadMessage({
    documentId: 'abc',
    type: 'connect',
    name: 'Олена',
    phone: '+380985060609',
    reasonLabel: 'Підключення інтернету',
    street: 'вул. Сумська, 10, кв. 5',
    settlement: 'Харків',
    neighbourhood: 'Центр',
    district: 'Харківський район',
    region: 'Харківська область',
    context: { label: 'Максимум · 1000 Мбіт/с' },
    message: 'Після 18:00',
    locale: 'uk',
    sourcePath: '/',
  });
  assert.equal(
    text,
    [
      '<b>🟣 Нове підключення</b>',
      '<b>Імʼя:</b> Олена',
      '<b>Телефон:</b> <code>0985060609</code>',
      '<b>Тема:</b> Підключення інтернету',
      '<b>Адреса:</b> Харківська область → Харківський район → Харків → Центр → вул. Сумська, 10, кв. 5',
      '<b>Обрано:</b> Максимум · 1000 Мбіт/с',
      '<b>Коментар:</b> Після 18:00',
    ].join('\n'),
  );
});

test('skips missing address parts and keeps non-UA numbers as stored', () => {
  const text = formatLeadMessage({ type: 'connect', phone: '+48123456789', region: 'Харківська область', settlement: 'Лозова', street: ' ' });
  assert.match(text, /<code>\+48123456789<\/code>/);
  assert.match(text, /<b>Адреса:<\/b> Харківська область → Лозова$/m);
});

test('escapes HTML from visitor input and skips empty fields', () => {
  const text = formatLeadMessage({ type: 'callback', phone: '+380991112233', message: '<script>x</script> & co' });
  assert.ok(text.includes('&lt;script&gt;x&lt;/script&gt; &amp; co'));
  assert.ok(!text.includes('Імʼя'));
  assert.equal(escapeHtml('<a>'), '&lt;a&gt;');
});
