import '../config/env.js';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { seedPublicData } from './seed.js';
import User from '../models/User.js';
import Lawyer from '../models/Lawyer.js';
import Service from '../models/Service.js';
import ConsultationRequest from '../models/ConsultationRequest.js';
import BlogPost from '../models/BlogPost.js';
import CaseStudy from '../models/CaseStudy.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';

const demoId = key => new mongoose.Types.ObjectId(createHash('sha256').update(`lexconnect-fictional-demo-v1:${key}`).digest('hex').slice(0, 24));
async function insert(model, key, fields) {
  const _id = demoId(key);
  const existing = await model.findById(_id);
  if (existing) return existing; // Preserve edits, publication choices and account state on reruns.
  return model.create({ _id, ...fields });
}

export async function seedDemoData() {
  if (process.env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production.');
  await seedPublicData();
  const serviceSlugs = ['corporate-company-law', 'family-divorce-law', 'property-land-law'];
  const names = ['Arif Hasan', 'Mira Ahmed', 'Samira Rahman'];
  const clientNames = ['Rafi Karim', 'Nila Akter', 'Imran Chowdhury'];
  for (let i = 0; i < names.length; i++) {
    const service = await Service.findOne({ slug: serviceSlugs[i] });
    if (!service) throw new Error('A starter service is missing; restore its slug before seeding demo data.');
    const user = await insert(User, `lawyer-user-${i}`, { firebaseUid: `demo:lexconnect:lawyer:${i}`, name: `${names[i]} (Demo)`, email: `lawyer${i + 1}@lexconnect.example.test`, phone: 'Demo - no phone', role: 'lawyer' });
    const lawyer = await insert(Lawyer, `lawyer-${i}`, { user: user._id, designation: 'Advocate (fictional demo)', barCouncilNumber: `DEMO-ONLY-${i + 1}`, experienceYears: 5 + i * 3, bio: `Fictional profile for testing LexConnect. ${names[i]} is a sample lawyer for ${service.title}. This is not a real practitioner.`, education: ['Sample LL.B qualification'], languages: ['Bangla', 'English'], services: [service._id], chamberAddress: 'Demo chamber, Dhaka - not a real address', consultationFee: 1000 + i * 500, photoUrl: '/demo/lawyer-avatar.svg', isFeatured: true });
    const client = await insert(User, `client-${i}`, { firebaseUid: `demo:lexconnect:client:${i}`, name: `${clientNames[i]} (Demo)`, email: `client${i + 1}@lexconnect.example.test`, phone: 'Demo - no phone', role: 'client' });
    const status = ['pending', 'assigned', 'resolved'][i];
    const consultation = await insert(ConsultationRequest, `consultation-${i}`, { client: client._id, guestName: client.name, guestEmail: client.email, guestPhone: client.phone, service: service._id, subject: `Demo: ${service.title} inquiry`, details: 'Fictional consultation for the project demonstration. No real client or case information.', preferredLawyer: lawyer._id, assignedLawyer: i ? lawyer._id : undefined, status, statusHistory: [{ status, assignedLawyer: i ? lawyer._id : undefined, note: 'Fictional demo record' }] });
    await insert(CaseStudy, `case-${i}`, { title: `Demo case: ${service.title}`, service: service._id, lawyers: [lawyer._id], summary: 'Fictional case study illustrating the consultation workflow.', challenge: 'A sample client needed help organizing a fictional matter.', approach: 'The demo lawyer reviewed the sample information and recorded the next steps.', outcome: 'The sample request was completed for demonstration purposes. No real legal outcome is claimed.', isPublished: true, isFeatured: true });
    await insert(BlogPost, `blog-${i}`, { title: `Demo article: preparing for ${service.title}`, author: user._id, category: service.category, excerpt: 'Sample content for testing the blog page; not legal advice.', content: 'This fictional article demonstrates publishing in LexConnect. For a consultation, describe your question clearly and ask the assigned lawyer what information they need. This sample is not legal advice.', isPublished: true });
    if (status === 'resolved') await insert(Testimonial, `review-${i}`, { client: client._id, consultation: consultation._id, lawyer: lawyer._id, rating: 5, comment: 'Demo review: the sample consultation workflow was easy to follow. This is fictional feedback.', isApproved: true, approvedAt: new Date() });
  }
  for (const [i, category] of ['Accounts', 'Consultations', 'Privacy'].entries()) {
    await insert(FAQ, `faq-${i}`, { question: `Demo FAQ: ${category}`, category, answer: 'This is sample FAQ content. Use the project setup guide for testing instructions.' });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await connectDatabase();
    await seedDemoData();
    console.log('Demo data ready: 3 fictional lawyers, 3 clients, 3 consultations, 3 articles, 3 case studies, 3 FAQs and 1 review. Existing records preserved.');
    console.log('Demo users cannot sign in. Register real test accounts through Firebase to test authenticated workflows.');
  } catch {
    console.error('Demo seed failed. Check database access, starter service slugs and that NODE_ENV is not production.');
    process.exitCode = 1;
  } finally { await disconnectDatabase(); }
}
