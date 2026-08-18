import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import User from '../models/User.js';
import Lawyer from '../models/Lawyer.js';
import Service from '../models/Service.js';
import CaseStudy from '../models/CaseStudy.js';
import BlogPost from '../models/BlogPost.js';
import FAQ from '../models/FAQ.js';
import ConsultationRequest from '../models/ConsultationRequest.js';
import Testimonial from '../models/Testimonial.js';
import ContactMessage from '../models/ContactMessage.js';

const sampleServices = [
  { title: 'Corporate & Company Law', category: 'Business', summary: 'Company formation, compliance, contracts, and corporate advisory.', description: 'Practical legal guidance for founders, companies, and investors—from incorporation and shareholder agreements to regulatory compliance.', icon: 'Building2', isFeatured: true },
  { title: 'Family & Divorce Law', category: 'Personal', summary: 'Sensitive support for family disputes, divorce, custody, and maintenance.', description: 'Confidential advice and representation for divorce, child custody, maintenance, guardianship, and related family matters.', icon: 'HeartHandshake', isFeatured: true },
  { title: 'Property & Land Law', category: 'Property', summary: 'Land verification, registration, disputes, and property documentation.', description: 'Support with title verification, deeds, registration, mutation, leasing, and property dispute resolution in Bangladesh.', icon: 'Landmark', isFeatured: true },
  { title: 'Criminal Defense', category: 'Litigation', summary: 'Professional representation and case strategy for criminal matters.', description: 'Early advice, bail support, trial preparation, representation, and clear updates throughout criminal proceedings.', icon: 'ShieldCheck', isFeatured: true },
  { title: 'Tax & VAT', category: 'Business', summary: 'Tax planning, returns, VAT compliance, and dispute support.', description: 'Advice for individuals and businesses on tax, VAT, regulatory filings, assessments, and dispute resolution.', icon: 'ReceiptText', isFeatured: false },
  { title: 'Employment Law', category: 'Business', summary: 'Employment contracts, workplace policies, and dispute resolution.', description: 'Balanced advice for employers and employees covering contracts, termination, workplace compliance, and labor disputes.', icon: 'BriefcaseBusiness', isFeatured: false }
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await connectDatabase();
  await Promise.all([User.deleteMany(), Lawyer.deleteMany(), Service.deleteMany(), CaseStudy.deleteMany(), BlogPost.deleteMany(), FAQ.deleteMany(), ConsultationRequest.deleteMany(), Testimonial.deleteMany(), ContactMessage.deleteMany()]);

  const admin = await User.create({ name: process.env.ADMIN_NAME || 'LexConnect Admin', email: process.env.ADMIN_EMAIL || 'admin@lexconnect.test', phone: '01700000000', password: process.env.ADMIN_PASSWORD || 'Admin123!', role: 'admin' });
  const client = await User.create({ name: 'Demo Client', email: 'client@lexconnect.test', phone: '01711111111', password: 'Client123!', role: 'client' });
  const lawyerUsers = await User.create([
    { name: 'Adv. Farhana Rahman', email: 'farhana@lexconnect.test', phone: '01811111111', password: 'Lawyer123!', role: 'lawyer' },
    { name: 'Barrister Imran Chowdhury', email: 'imran@lexconnect.test', phone: '01822222222', password: 'Lawyer123!', role: 'lawyer' },
    { name: 'Adv. Nusrat Jahan', email: 'nusrat@lexconnect.test', phone: '01833333333', password: 'Lawyer123!', role: 'lawyer' }
  ]);
  const services = await Service.create(sampleServices);
  const lawyers = await Lawyer.create([
    { user: lawyerUsers[0]._id, designation: 'Senior Advocate', barCouncilNumber: 'BAR-10231', experienceYears: 14, bio: 'Corporate and commercial lawyer focused on clear, practical advice for growing businesses.', education: ['LL.B., University of Dhaka', 'LL.M., University of London'], languages: ['Bangla', 'English'], services: [services[0]._id, services[4]._id, services[5]._id], chamberAddress: 'Motijheel, Dhaka', consultationFee: 2500, isFeatured: true },
    { user: lawyerUsers[1]._id, designation: 'Barrister-at-Law', barCouncilNumber: 'BAR-11882', experienceYears: 11, bio: 'Litigation counsel experienced in criminal defense and complex dispute resolution.', education: ['LL.B., University of London', 'Barrister-at-Law, Lincoln’s Inn'], languages: ['Bangla', 'English'], services: [services[3]._id, services[2]._id], chamberAddress: 'Supreme Court Bar, Dhaka', consultationFee: 3000, isFeatured: true },
    { user: lawyerUsers[2]._id, designation: 'Advocate', barCouncilNumber: 'BAR-13990', experienceYears: 9, bio: 'Family and property lawyer known for empathetic guidance and careful documentation.', education: ['LL.B. and LL.M., North South University'], languages: ['Bangla', 'English'], services: [services[1]._id, services[2]._id], chamberAddress: 'Banani, Dhaka', consultationFee: 2000, isFeatured: true }
  ]);
  const caseStudy = await CaseStudy.create({ title: 'Protecting a Family-Owned Business', summary: 'A carefully structured shareholder agreement prevented a costly ownership dispute.', challenge: 'A second-generation family business had unclear ownership rights and decision-making rules.', approach: 'We reviewed the company records, facilitated stakeholder discussions, and prepared a tailored shareholder agreement.', outcome: 'The owners agreed on transparent governance, succession, and exit procedures without litigation.', service: services[0]._id, lawyers: [lawyers[0]._id], isFeatured: true, isPublished: true });
  await BlogPost.create({ title: 'Five Checks Before Signing a Land Deed', excerpt: 'A short due-diligence checklist for property buyers in Bangladesh.', content: 'Verify the chain of title, mutation records, land development tax receipts, possession, and any pending disputes. Obtain professional advice for your specific transaction.', category: 'Property', author: lawyerUsers[2]._id, isFeatured: true, isPublished: true });
  await FAQ.create([
    { question: 'How do I request a consultation?', answer: 'Choose a service or lawyer, complete the consultation form, and our team will contact you after review.', category: 'Consultations', sortOrder: 1 },
    { question: 'Can I submit a request without an account?', answer: 'Yes. Guest users can submit requests using their name, email, and phone number.', category: 'Consultations', sortOrder: 2 },
    { question: 'Is the information I submit confidential?', answer: 'Access is restricted by role. Please avoid submitting highly sensitive evidence until a lawyer confirms a secure handover method.', category: 'Privacy', sortOrder: 1 }
  ]);
  const request = await ConsultationRequest.create({ client: client._id, guestName: client.name, guestEmail: client.email, guestPhone: client.phone, service: services[0]._id, preferredLawyer: lawyers[0]._id, assignedLawyer: lawyers[0]._id, subject: 'Review a shareholder agreement', details: 'We need a legal review before all shareholders sign next month.', status: 'resolved', statusHistory: [{ status: 'pending', changedBy: client._id }, { status: 'assigned', changedBy: admin._id }, { status: 'resolved', changedBy: lawyerUsers[0]._id }] });
  await Testimonial.create({ client: client._id, consultation: request._id, lawyer: lawyers[0]._id, rating: 5, comment: 'Clear advice, quick communication, and a very professional experience.', isApproved: true, approvedBy: admin._id, approvedAt: new Date() });

  console.log('Seed complete.');
  console.log(`Admin: ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
  console.log('Client: client@lexconnect.test / Client123!');
  console.log('Lawyer: farhana@lexconnect.test / Lawyer123!');
  await disconnectDatabase();
}

seed().catch(async (error) => {
  console.error(error);
  await disconnectDatabase();
  process.exit(1);
});
