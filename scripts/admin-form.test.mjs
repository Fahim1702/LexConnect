import assert from 'node:assert/strict';
import test from 'node:test';
import { initialForm, formPayload } from '../client/src/components/adminForm.js';
import { adminConfigs } from '../client/src/pages/admin/adminConfigs.js';
import { profileUpdates } from '../server/src/utils/lawyerProfile.js';

test('editing a populated case study sends IDs without reselecting its service', () => {
  const fields = adminConfigs['case-studies'].fields;
  const item = { title: 'Existing case', service: { _id: 'service-id', title: 'Service' }, lawyers: [{ _id: 'lawyer-id' }], isPublished: true };
  const form = initialForm(fields, item);
  const payload = formPayload(fields, { ...form, title: 'Revised case' }, true);
  assert.equal(payload.service, 'service-id');
  assert.deepEqual(payload.lawyers, ['lawyer-id']);
  assert.equal(payload.isPublished, true);
  assert.equal(payload.title, 'Revised case');
});

test('lawyer edits retain services, normalize numbers and lists, and omit the account', () => {
  const fields = adminConfigs.lawyers.fields;
  const form = initialForm(fields, { user: { _id: 'account-id' }, services: [{ _id: 'archived-service' }], education: ['LLB'], isActive: false });
  const payload = formPayload(fields, { ...form, consultationFee: '1500.50', languages: 'Bangla, English, ' }, true);
  assert.equal(payload.user, undefined);
  assert.equal(payload.experienceYears, 0);
  assert.equal(payload.consultationFee, 1500.5);
  assert.deepEqual(payload.languages, ['Bangla', 'English']);
  assert.deepEqual(payload.services, ['archived-service']);
  assert.equal(payload.isActive, false);
  assert.equal(formPayload(fields, { ...form, user: 'new-account' }, false).user, 'new-account');
});

test('lawyer activation and featured flags reject coercible non-booleans', async () => {
  for (const key of ['isActive', 'isFeatured']) {
    for (const value of ['false', 0, null]) {
      await assert.rejects(profileUpdates({ [key]: value }, true), error => error.statusCode === 400);
    }
    assert.equal((await profileUpdates({ [key]: false }, true))[key], false);
  }
});
