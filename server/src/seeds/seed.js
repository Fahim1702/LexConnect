import '../config/env.js';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import Service from '../models/Service.js';
import FAQ from '../models/FAQ.js';

const services = [
  { title: 'Corporate & Company Law', slug: 'corporate-company-law', category: 'Business', summary: 'Company formation, contracts, and corporate advisory.', description: 'Legal assistance with company formation, contracts, and business matters.', icon: 'Building2', isFeatured: true },
  { title: 'Family & Divorce Law', slug: 'family-divorce-law', category: 'Personal', summary: 'Support for family disputes, divorce, and custody.', description: 'Legal assistance with divorce, child custody, maintenance, and other family matters.', icon: 'HeartHandshake', isFeatured: true },
  { title: 'Property & Land Law', slug: 'property-land-law', category: 'Property', summary: 'Land verification, registration, and property disputes.', description: 'Legal assistance with title verification, deeds, registration, and property disputes.', icon: 'Landmark', isFeatured: true }
];

// $setOnInsert adds missing examples without replacing anyone's existing edits.
export async function seedPublicData() {
  for (const service of services) {
    await Service.findOneAndUpdate(
      { $or: [{ slug: service.slug }, { title: service.title }] },
      { $setOnInsert: service },
      { upsert: true, runValidators: true }
    );
  }
  await FAQ.findOneAndUpdate(
    { question: 'How do I request a consultation?' },
    { $setOnInsert: { question: 'How do I request a consultation?', answer: 'Choose a legal service and submit your contact information and a brief description using the consultation form.', category: 'Consultations' } },
    { upsert: true, runValidators: true }
  );
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await connectDatabase();
    await seedPublicData();
    console.log('Starter services and FAQ added. Existing records were preserved.');
  } catch {
    console.error('Starter data could not be added. Check server/.env and MongoDB access.');
    process.exitCode = 1;
  } finally {
    await disconnectDatabase();
  }
}
