import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, CalendarDays, MessageCircle, Pencil, Plus, Sparkles } from 'lucide-react';
import { DashboardShell, DashboardHead, Empty } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { appointmentsApi } from '@/lib/resources';
import { Status, formatDateLabel } from '@/lib/ui-helpers';
import type { PopulatedDoctor, PopulatedService } from '@/lib/types';

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ['my-appointments'], queryFn: () => appointmentsApi.my() });
  const appointments = data?.appointments ?? [];

  const upcoming = appointments
    .filter((a) => a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'rejected')
    .sort((a, b) => a.appointmentDate.localeCompare(b.appointmentDate))[0];

  const doctorName = (d: PopulatedDoctor | string | undefined) => (typeof d === 'object' && d ? d.name : '');
  const serviceName = (s: PopulatedService | string | undefined) => (typeof s === 'object' && s ? s.name : '');

  return (
    <DashboardShell>
      <DashboardHead
        eyebrow={`Good to see you, ${user?.name.split(' ')[0]}`}
        title="Your care, at a glance."
        copy="A little overview of what's coming up and where things stand."
        action={
          <Link href="/patient/appointments" className="button button-quiet" data-testid="button-view-all-appointments">
            View all appointments <ArrowRight size={15} />
          </Link>
        }
      />
      <div className="dashboard-grid">
        <div className="panel">
          {isLoading ? (
            <p className="muted">Loading…</p>
          ) : upcoming ? (
            <>
              <div className="panel-head"><h2>Your next visit</h2><Status status={upcoming.status} /></div>
              <div className="summary-box">
                <div className="summary-row"><span>Service</span><strong>{serviceName(upcoming.service)}</strong></div>
                <div className="summary-row"><span>With</span><strong>{doctorName(upcoming.doctor)}</strong></div>
                <div className="summary-row"><span>When</span><strong>{formatDateLabel(upcoming.appointmentDate)} · {upcoming.startTime}</strong></div>
                <div className="summary-row"><span>Reference</span><strong className="mono">{upcoming.bookingReference}</strong></div>
              </div>
              <Link href={`/patient/appointments/${upcoming._id}`} className="button button-quiet button-small" style={{ marginTop: 16 }} data-testid="link-next-appointment">
                View appointment details <ArrowRight size={13} />
              </Link>
            </>
          ) : (
            <Empty
              icon={<CalendarDays />}
              title="Nothing booked yet"
              copy="When you are ready, find a time that works for you."
              action={<Link href="/book" className="button button-primary button-small" data-testid="button-empty-book">Book a visit</Link>}
            />
          )}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Quick actions</h2><Sparkles size={17} color="hsl(var(--accent))" /></div>
          <div style={{ display: 'grid', gap: 9 }}>
            <Link href="/book" className="button button-primary button-block" data-testid="button-quick-book">Book a new visit <Plus size={14} /></Link>
            <Link href="/patient/profile" className="button button-quiet button-block" data-testid="button-quick-profile">Update my details <Pencil size={14} /></Link>
            <Link href="/contact" className="button button-quiet button-block" data-testid="button-quick-contact">Message the clinic <MessageCircle size={14} /></Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
