import { Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import HomePage from './pages/public/HomePage.jsx';
import { ServicesPage, ServiceDetailPage } from './pages/public/ServicesPages.jsx';
import { LawyersPage, LawyerDetailPage } from './pages/public/LawyersPages.jsx';
import { BlogDetailPage, BlogPage, CaseStudiesPage, CaseStudyDetailPage, FAQPage } from './pages/public/ContentPages.jsx';
import ContactPage from './pages/public/ContactPage.jsx';
import ConsultationPage from './pages/public/ConsultationPage.jsx';
import { LoginPage, RegisterPage } from './pages/public/AuthPages.jsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.jsx';
import AdminEntityPage from './pages/admin/AdminEntityPage.jsx';
import { AdminMessagesPage, AdminConsultationsPage, AdminTestimonialsPage, AdminUsersPage } from './pages/admin/AdminWorkflowPages.jsx';
import { ClientDashboardPage, ClientProfilePage, ClientTestimonialsPage } from './pages/client/ClientPages.jsx';
import { LawyerBlogPage, LawyerDashboardPage, LawyerProfilePage } from './pages/lawyer/LawyerPages.jsx';

function RoleArea({ role }) {
  return <ProtectedRoute roles={[role]}><DashboardLayout /></ProtectedRoute>;
}

function NotFoundPage() {
  return <div className="container-page section-pad text-center"><p className="eyebrow">404</p><h1 className="page-title">Page not found</h1><p className="mt-4 text-slate-600">The page you requested does not exist.</p><a className="btn-primary mt-7" href="/">Return home</a></div>;
}

export default function App() {
  return <Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="services" element={<ServicesPage />} />
      <Route path="services/:identifier" element={<ServiceDetailPage />} />
      <Route path="lawyers" element={<LawyersPage />} />
      <Route path="lawyers/:identifier" element={<LawyerDetailPage />} />
      <Route path="case-studies" element={<CaseStudiesPage />} />
      <Route path="case-studies/:identifier" element={<CaseStudyDetailPage />} />
      <Route path="blog" element={<BlogPage />} />
      <Route path="blog/:identifier" element={<BlogDetailPage />} />
      <Route path="faq" element={<FAQPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="consultation" element={<ConsultationPage />} />
      <Route path="login" element={<LoginPage />} />
      <Route path="register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
    <Route path="admin" element={<RoleArea role="admin" />}>
      <Route index element={<AdminDashboardPage />} />
      <Route path="lawyers" element={<AdminEntityPage resource="lawyers" />} />
      <Route path="services" element={<AdminEntityPage resource="services" />} />
      <Route path="case-studies" element={<AdminEntityPage resource="case-studies" />} />
      <Route path="blog" element={<AdminEntityPage resource="blog" />} />
      <Route path="faqs" element={<AdminEntityPage resource="faqs" />} />
      <Route path="consultations" element={<AdminConsultationsPage />} />
      <Route path="users" element={<AdminUsersPage />} />
      <Route path="messages" element={<AdminMessagesPage />} />
      <Route path="testimonials" element={<AdminTestimonialsPage />} />
    </Route>
    <Route path="client" element={<RoleArea role="client" />}>
      <Route index element={<ClientDashboardPage />} />
      <Route path="profile" element={<ClientProfilePage />} />
      <Route path="testimonials" element={<ClientTestimonialsPage />} />
    </Route>
    <Route path="lawyer" element={<RoleArea role="lawyer" />}>
      <Route index element={<LawyerDashboardPage />} />
      <Route path="profile" element={<LawyerProfilePage />} />
      <Route path="blog" element={<LawyerBlogPage />} />
    </Route>
  </Routes>;
}
