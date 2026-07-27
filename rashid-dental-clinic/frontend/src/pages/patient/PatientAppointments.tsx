import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { CalendarDays, ChevronRight, Plus, X } from 'lucide-react';
import { DashboardShell, DashboardHead, Empty } from '@/components/layout';
import { appointmentsApi } from '@/lib/resources';
import { useNotify } from '@/context/NotifyContext';
import { Status, formatDateShort } from '@/lib/ui-helpers';
import type { PopulatedDoctor, PopulatedService } from '@/lib/types';
import { ApiError } from '@/lib/api';

export default function PatientAppointments() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['my-appointments'], queryFn: () => appointmentsApi.my() });
  const appointments = data?.appointments ?? [];

  const cancelMutation = useMutation({
    mutationFn: (id: string) => appointmentsApi.cancel(id),
    onSuccess: () => {
      notify('Appointment cancelled.');
      queryClient.invalidateQueries({ queryKey: ['my-appointments'] });
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : 'Could not cancel this appointment.'),
  });

  const doctorName = (d: PopulatedDoctor | string | undefined) => (typeof d === 'object' && d ? d.name : '');
  const serviceName = (s: PopulatedService | string | undefined) => (typeof s === 'object' && s ? s.name : '');

  return (
    <DashboardShell>
      <DashboardHead
        eyebrow="Patient portal"
        title="My appointments"
        copy="Everything booked, past and upcoming, in one place."
        action={<Link href="/book" className="button button-primary" data-testid="button-appointments-book"><Plus size={15} /> Book a visit</Link>}
      />
      {isLoading ? (
        <div className="panel"><p className="muted">Loading…</p></div>
      ) : appointments.length ? (
        <div className="panel">
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>Date & time</th><th>Service</th><th>Clinician</th><th>Status</th><th /></tr></thead>
              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id} data-testid={`row-patient-appointment-${a._id}`}>
                    <td><strong>{formatDateShort(a.appointmentDate)}</strong><br /><span className="muted">{a.startTime}</span></td>
                    <td>{serviceName(a.service)}</td>
                    <td>{doctorName(a.doctor)}</td>
                    <td><Status status={a.status} /></td>
                    <td>
                      <div className="table-actions">
                        <Link href={`/patient/appointments/${a._id}`} className="icon-button" data-testid={`link-appointment-detail-${a._id}`}>
                          <ChevronRight size={14} />
                        </Link>
                        {(a.status === 'confirmed' || a.status === 'pending' || a.status === 'rescheduled') && (
                          <button
                            className="icon-button"
                            onClick={() => cancelMutation.mutate(a._id)}
                            title="Cancel appointment"
                            data-testid={`button-cancel-appointment-${a._id}`}
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="panel"><Empty icon={<CalendarDays />} title="No appointments yet" copy="Your upcoming visits will appear here." /></div>
      )}
    </DashboardShell>
  );
}
