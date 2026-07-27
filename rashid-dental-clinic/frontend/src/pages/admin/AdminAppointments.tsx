import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarDays, Check, X } from 'lucide-react';
import { DashboardShell, DashboardHead, Empty } from '@/components/layout';
import { adminApi, doctorsApi, servicesApi } from '@/lib/resources';
import { Status, formatDateShort } from '@/lib/ui-helpers';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';

export default function AdminAppointments() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');

  const { data: doctorsData } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorsApi.list(true) });
  const { data: servicesData } = useQuery({ queryKey: ['services-all'], queryFn: () => servicesApi.list(true) });
  const doctors = doctorsData?.doctors ?? [];
  const services = servicesData?.services ?? [];

  const { data, isLoading } = useQuery({
    queryKey: ['admin-appointments', status, doctorId, serviceId, date],
    queryFn: () => adminApi.appointments({ status: status || undefined, doctorId: doctorId || undefined, serviceId: serviceId || undefined, date: date || undefined }),
  });
  const appointments = data?.appointments ?? [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-appointments'] });
    queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const onError = (err: unknown) => notify(err instanceof ApiError ? err.message : 'Something went wrong.');

  const confirmMutation = useMutation({
    mutationFn: (id: string) => adminApi.confirm(id),
    onSuccess: () => { notify('Appointment confirmed.'); invalidate(); },
    onError,
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.reject(id),
    onSuccess: () => { notify('Appointment rejected.'); invalidate(); },
    onError,
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => adminApi.cancel(id),
    onSuccess: () => { notify('Appointment cancelled.'); invalidate(); },
    onError,
  });
  const completeMutation = useMutation({
    mutationFn: (id: string) => adminApi.complete(id),
    onSuccess: () => { notify('Appointment marked completed.'); invalidate(); },
    onError,
  });
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, newDate, newTime }: { id: string; newDate: string; newTime: string }) =>
      adminApi.reschedule(id, newDate, newTime),
    onSuccess: () => { notify('Appointment rescheduled.'); invalidate(); },
    onError,
  });

  const handleReschedule = (id: string) => {
    const newDate = window.prompt('New date (YYYY-MM-DD):');
    if (!newDate) return;
    const newTime = window.prompt('New start time (HH:mm):');
    if (!newTime) return;
    rescheduleMutation.mutate({ id, newDate, newTime });
  };

  return (
    <DashboardShell admin>
      <DashboardHead eyebrow="Clinic workspace" title="Appointments" copy="Review, update and keep every visit moving." />
      <div className="panel">
        <div className="filter-bar">
          <select value={status} onChange={(e) => setStatus(e.target.value)} data-testid="select-filter-status">
            <option value="">All statuses</option>
            {['pending', 'confirmed', 'rescheduled', 'completed', 'cancelled', 'rejected'].map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)} data-testid="select-filter-doctor">
            <option value="">All doctors</option>
            {doctors.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} data-testid="select-filter-service">
            <option value="">All services</option>
            {services.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} data-testid="input-filter-date" />
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <p className="muted" style={{ padding: 20 }}>Loading…</p>
          ) : appointments.length ? (
            <table className="data-table">
              <thead><tr><th>Date & time</th><th>Patient</th><th>Service</th><th>Clinician</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {appointments.map((a) => {
                  const patientName = typeof a.patient === 'object' ? a.patient.name : '';
                  const doctorName = typeof a.doctor === 'object' ? a.doctor.name : '';
                  const serviceName = typeof a.service === 'object' ? a.service.name : '';
                  return (
                    <tr key={a._id}>
                      <td><strong>{formatDateShort(a.appointmentDate)}</strong><br /><span className="muted">{a.startTime}</span></td>
                      <td><strong>{patientName}</strong><br /><span className="muted">{a.bookingReference}</span></td>
                      <td>{serviceName}</td>
                      <td>{doctorName}</td>
                      <td><Status status={a.status} /></td>
                      <td>
                        <div className="table-actions">
                          {a.status === 'pending' && (
                            <>
                              <button className="button button-primary button-small" onClick={() => confirmMutation.mutate(a._id)} data-testid={`button-confirm-${a._id}`}>
                                <Check size={12} /> Confirm
                              </button>
                              <button className="icon-button" onClick={() => rejectMutation.mutate(a._id)} title="Reject" data-testid={`button-reject-${a._id}`}>
                                <Ban size={13} />
                              </button>
                            </>
                          )}
                          {(a.status === 'confirmed' || a.status === 'rescheduled') && (
                            <>
                              <button className="button button-quiet button-small" onClick={() => completeMutation.mutate(a._id)} data-testid={`button-complete-${a._id}`}>
                                Complete
                              </button>
                              <button className="icon-button" onClick={() => handleReschedule(a._id)} title="Reschedule" data-testid={`button-reschedule-${a._id}`}>
                                <CalendarDays size={13} />
                              </button>
                              <button className="icon-button" onClick={() => cancelMutation.mutate(a._id)} title="Cancel" data-testid={`button-admin-cancel-${a._id}`}>
                                <X size={13} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <Empty icon={<CalendarDays />} title="No appointments found" copy="Try widening the filters." />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
