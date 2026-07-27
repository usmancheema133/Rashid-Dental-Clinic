import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import { Route, Router as WouterRouter, Switch } from 'wouter';

import { AuthProvider } from '@/context/AuthContext';
import { NotifyProvider } from '@/context/NotifyContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

import Home from '@/pages/public/Home';
import About from '@/pages/public/About';
import Services from '@/pages/public/Services';
import Doctors from '@/pages/public/Doctors';
import Booking from '@/pages/public/Booking';
import Contact from '@/pages/public/Contact';
import Auth from '@/pages/public/Auth';
import NotFoundPage from '@/pages/public/NotFoundPage';

import PatientDashboard from '@/pages/patient/PatientDashboard';
import PatientAppointments from '@/pages/patient/PatientAppointments';
import AppointmentDetail from '@/pages/patient/AppointmentDetail';
import Profile from '@/pages/patient/Profile';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminAppointments from '@/pages/admin/AdminAppointments';
import AdminDoctors from '@/pages/admin/AdminDoctors';
import AdminServices from '@/pages/admin/AdminServices';
import AdminAvailability from '@/pages/admin/AdminAvailability';
import AdminPatients from '@/pages/admin/AdminPatients';
import AdminSettings from '@/pages/admin/AdminSettings';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/doctors" component={Doctors} />
      <Route path="/book" component={Booking} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={() => <Auth />} />
      <Route path="/register" component={() => <Auth register />} />

      {/* Appointment detail is shared by patient + admin; the page itself
          checks ownership/role via the API response. */}
      <Route path="/patient/appointments/:id" component={() => (
        <ProtectedRoute role="patient"><AppointmentDetail /></ProtectedRoute>
      )} />
      <Route path="/patient/appointments" component={() => (
        <ProtectedRoute role="patient"><PatientAppointments /></ProtectedRoute>
      )} />
      <Route path="/patient/profile" component={() => (
        <ProtectedRoute role="patient"><Profile /></ProtectedRoute>
      )} />
      <Route path="/patient" component={() => (
        <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
      )} />

      <Route path="/admin/appointments" component={() => (
        <ProtectedRoute role="admin"><AdminAppointments /></ProtectedRoute>
      )} />
      <Route path="/admin/doctors" component={() => (
        <ProtectedRoute role="admin"><AdminDoctors /></ProtectedRoute>
      )} />
      <Route path="/admin/services" component={() => (
        <ProtectedRoute role="admin"><AdminServices /></ProtectedRoute>
      )} />
      <Route path="/admin/availability" component={() => (
        <ProtectedRoute role="admin"><AdminAvailability /></ProtectedRoute>
      )} />
      <Route path="/admin/patients" component={() => (
        <ProtectedRoute role="admin"><AdminPatients /></ProtectedRoute>
      )} />
      <Route path="/admin/settings" component={() => (
        <ProtectedRoute role="admin"><AdminSettings /></ProtectedRoute>
      )} />
      <Route path="/admin" component={() => (
        <ProtectedRoute role="admin"><AdminOverview /></ProtectedRoute>
      )} />

      {/* Admin viewing a specific appointment reuses the same detail page
          under the patient path above; give admins a matching alias too. */}
      <Route path="/admin/appointments/:id" component={() => (
        <ProtectedRoute role="admin"><AppointmentDetail /></ProtectedRoute>
      )} />

      <Route component={NotFoundPage} />
    </Switch>
  );
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <NotifyProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
          </NotifyProvider>
        </AuthProvider>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
