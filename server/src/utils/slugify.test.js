import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from './slugify.js';

test('slugify creates URL-safe slugs', () => {
  assert.equal(slugify('  Corporate & Company Law  '), 'corporate-company-law');
});

test('slugify removes leading and trailing separators', () => {
  assert.equal(slugify('---Tax Advice---'), 'tax-advice');
});
