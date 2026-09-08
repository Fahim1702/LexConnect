export const adminConfigs = {
  lawyers: {
    description: 'Ask the lawyer to register and sign in first, then select their account below. They should sign in again after their profile is created.',
    title: 'Lawyers', singular: 'lawyer', endpoint: '/admin/lawyers',
    columns: [['Name', 'user.name'], ['Designation', 'designation'], ['Bar no.', 'barCouncilNumber'], ['Experience', 'experienceYears'], ['Active', 'isActive']],
    fields: [
      { name: 'user', label: 'Registered account', type: 'select', lookup: 'users', createOnly: true, requiredOnCreate: true },
      { name: 'designation', label: 'Designation', required: true }, { name: 'barCouncilNumber', label: 'Bar Council number', required: true },
      { name: 'experienceYears', label: 'Years of experience', type: 'number' }, { name: 'consultationFee', label: 'Consultation fee (BDT)', type: 'number' },
      { name: 'services', label: 'Services', type: 'multiselect', lookup: 'services' }, { name: 'chamberAddress', label: 'Chamber address' },
      { name: 'education', label: 'Education (comma separated)', type: 'array' }, { name: 'languages', label: 'Languages (comma separated)', type: 'array' },
      { name: 'bio', label: 'Biography', type: 'textarea', required: true }, { name: 'photoUrl', label: 'Photo URL', type: 'url' },
      { name: 'isFeatured', label: 'Featured lawyer', type: 'boolean' }, { name: 'isActive', label: 'Active', type: 'boolean' }
    ]
  },
  services: {
    title: 'Services', singular: 'service', endpoint: '/admin/content/services',
    columns: [['Title', 'title'], ['Category', 'category'], ['Featured', 'isFeatured'], ['Active', 'isActive']],
    fields: [
      { name: 'title', label: 'Title', required: true }, { name: 'category', label: 'Category', required: true },
      { name: 'summary', label: 'Short summary', type: 'textarea', required: true }, { name: 'description', label: 'Full description', type: 'textarea', required: true },
      { name: 'icon', label: 'Lucide icon name' }, { name: 'isFeatured', label: 'Featured service', type: 'boolean' }, { name: 'isActive', label: 'Active', type: 'boolean' }
    ]
  },
  'case-studies': {
    title: 'Case Studies', singular: 'case study', endpoint: '/admin/content/case-studies',
    columns: [['Title', 'title'], ['Service', 'service.title'], ['Published', 'isPublished'], ['Featured', 'isFeatured']],
    fields: [
      { name: 'title', label: 'Title', required: true }, { name: 'service', label: 'Service', type: 'select', lookup: 'services', required: true },
      { name: 'lawyers', label: 'Lawyers', type: 'multiselect', lookup: 'lawyers' }, { name: 'summary', label: 'Summary', type: 'textarea', required: true },
      { name: 'challenge', label: 'Challenge', type: 'textarea', required: true }, { name: 'approach', label: 'Approach', type: 'textarea', required: true },
      { name: 'outcome', label: 'Outcome', type: 'textarea', required: true }, { name: 'imageUrl', label: 'Image URL', type: 'url' },
      { name: 'isFeatured', label: 'Featured case', type: 'boolean' }, { name: 'isPublished', label: 'Published', type: 'boolean' }
    ]
  },
  blog: {
    title: 'Blog', singular: 'blog post', endpoint: '/admin/content/blog',
    columns: [['Title', 'title'], ['Category', 'category'], ['Author', 'author.name'], ['Published', 'isPublished']],
    fields: [
      { name: 'title', label: 'Title', required: true }, { name: 'category', label: 'Category', required: true },
      { name: 'excerpt', label: 'Excerpt', type: 'textarea', required: true }, { name: 'content', label: 'Article content', type: 'textarea', required: true },
      { name: 'coverUrl', label: 'Cover image URL', type: 'url' }, { name: 'isFeatured', label: 'Featured post', type: 'boolean' },
      { name: 'isPublished', label: 'Published', type: 'boolean' }
    ]
  },
  faqs: {
    title: 'FAQs', singular: 'FAQ', endpoint: '/admin/content/faqs',
    columns: [['Question', 'question'], ['Category', 'category'], ['Order', 'sortOrder'], ['Active', 'isActive']],
    fields: [
      { name: 'question', label: 'Question', required: true }, { name: 'answer', label: 'Answer', type: 'textarea', required: true },
      { name: 'category', label: 'Category', required: true }, { name: 'sortOrder', label: 'Sort order', type: 'number' }, { name: 'isActive', label: 'Active', type: 'boolean' }
    ]
  }
};
