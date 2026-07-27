import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'wouter';
import { Activity, ArrowLeft, Copy, Info } from 'lucide-react';
import { DashboardShell, DashboardHead, Empty } from '@/components/layout';
import { appointmentsApi } from '@/lib/resources';
import { Status, formatDateLabel } from '@/lib/ui-helpers';
import type { PopulatedDoctor, PopulatedService } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';

export default function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const backHref = user?.role === 'admin' ? '/admin/appointments' : '/patient/appointments';

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', params.id],
    queryFn: () => appointmentsApi.get(params.id),
    enabled: Boolean(params.id),
  });
  const appointment = data?.appointment;

  const doctorName = (d: PopulatedDoctor | string | undefined) => (typeof d === 'object' && d ? d.name : '');
  const serviceName = (s: PopulatedService | string | undefined) => (typeof s === 'object' && s ? s.name : '');

  if (isLoading) {
    return <DashboardShell admin={user?.role === 'admin'}><p className="muted">Loading…</p></DashboardShell>;
  }

  if (!appointment) {
    return (
      <DashboardShell admin={user?.role === 'admin'}>
        <Empty
          icon={<Info />}
          title="Appointment not found"
          copy="This appointment may have been removed or the link is out of date."
          action={<Link href={backHref} className="button button-primary button-small">Back to appointments</Link>}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell admin={user?.role === 'admin'}>
      <Link href={backHref} className="button button-quiet button-small" data-testid="link-back-appointments">
        <ArrowLeft size={14} /> All appointments
      </Link>
      <div style={{ marginTop: 22, maxWidth: 780 }}>
        <DashboardHead
          eyebrow="Appointment details"
          title={serviceName(appointment.service)}
          copy={`${formatDateLabel(appointment.appointmentDate)} · ${appointment.startTime} with ${doctorName(appointment.doctor)}`}
        />
        <div className="two-col">
          <div className="panel">
            <div className="panel-head"><h2>Booking summary</h2><Status status={appointment.status} /></div>
            <div className="summary-box">
              <div className="summary-row"><span>Booking reference</span><strong className="mono">{appointment.bookingReference}</strong></div>
              <div className="summary-row"><span>Service</span><strong>{serviceName(appointment.service)}</strong></div>
              <div className="summary-row"><span>Clinician</span><strong>{doctorName(appointment.doctor)}</strong></div>
              <div className="summary-row"><span>Reason</span><strong>{appointment.reason || '—'}</strong></div>
              {appointment.cancellationReason && (
                <div className="summary-row"><span>Note</span><strong>{appointment.cancellationReason}</strong></div>
              )}
            </div>
            <button
              className="button button-quiet button-small"
              style={{ marginTop: 17 }}
              onClick={() => navigator.clipboard?.writeText(appointment.bookingReference)}
              data-testid="button-copy-reference"
            >
              <Copy size={13} /> Copy reference
            </button>
          </div>
          <div className="panel">
            <div className="panel-head"><h2>Status history</h2><Activity size={17} color="hsl(var(--primary))" /></div>
            <div className="timeline">
              {[...appointment.statusHistory].reverse().map((h, i) => (
                <div className="timeline-item" key={`${h.status}-${i}`}>
                  <div className="timeline-rail"><div className="timeline-dot" /></div>
                  <div className="timeline-content">
                    <strong>{h.status.charAt(0).toUpperCase() + h.status.slice(1)}</strong>
                    <p>{new Date(h.changedAt).toLocaleString('en-GB')}</p>
                    {h.note && <p>{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
