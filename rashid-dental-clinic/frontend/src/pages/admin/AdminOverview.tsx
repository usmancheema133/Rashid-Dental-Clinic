import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, Info } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { adminApi } from '@/lib/resources';
import { useAuth } from '@/context/AuthContext';

export default function AdminOverview() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => adminApi.dashboard() });
  const { data: todayList } = useQuery({
    queryKey: ['admin-appointments-today'],
    queryFn: () => adminApi.appointments({ date: new Date().toISOString().slice(0, 10) }),
  });

  const today = (todayList?.appointments ?? []).filter((a) => a.status !== 'cancelled' && a.status !== 'rejected');

  return (
    <DashboardShell admin>
      <DashboardHead
        eyebrow={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`Good morning, ${user?.name.split(' ')[0]}.`}
        copy="Here's the shape of the day at Rashid Dental Clinic."
        action={<Link href="/admin/appointments" className="button button-primary" data-testid="button-admin-manage">Manage appointments <ArrowRight size={15} /></Link>}
      />
      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat"><span className="stat-label">Today's visits</span><div className="stat-value">{stats?.appointments.today ?? 0}</div><span className="stat-note">Across {stats?.totalDoctors ?? 0} clinicians</span></div>
            <div className="stat"><span className="stat-label">Awaiting confirmation</span><div className="stat-value">{stats?.appointments.pending ?? 0}</div><span className="stat-note">Needs your attention</span></div>
            <div className="stat"><span className="stat-label">Completed</span><div className="stat-value">{stats?.appointments.completed ?? 0}</div><span className="stat-note">All-time</span></div>
            <div className="stat"><span className="stat-label">Patients</span><div className="stat-value" style={{ fontSize: '1.45rem' }}>{stats?.totalPatients ?? 0}</div><span className="stat-note">Registered accounts</span></div>
          </div>
          <div className="dashboard-grid">
            <div className="panel">
              <div className="panel-head"><h2>Today's schedule</h2><Link href="/admin/appointments" className="button button-quiet button-small" data-testid="link-admin-schedule">Full schedule</Link></div>
              {today.length ? (
                today
                  .slice()
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((a) => {
                    const patientName = typeof a.patient === 'object' ? a.patient.name : '';
                    const doctorName = typeof a.doctor === 'object' ? a.doctor.name : '';
                    const serviceName = typeof a.service === 'object' ? a.service.name : '';
                    return (
                      <div className="appointment-row" key={a._id}>
                        <span className="time">{a.startTime}</span>
                        <span className="appointment-info"><strong>{patientName}</strong><span>{serviceName} · {doctorName.replace('Dr. ', '')}</span></span>
                        <Link href={`/patient/appointments/${a._id}`} className="icon-button" data-testid={`link-admin-appointment-${a._id}`}>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    );
                  })
              ) : (
                <p className="muted">Nothing scheduled for today.</p>
              )}
            </div>
            <div className="panel">
              <div className="panel-head"><h2>Needs attention</h2><Info size={17} color="hsl(var(--accent))" /></div>
              <div className="notice notice-success">{stats?.appointments.pending ?? 0} booking requests are waiting for review.</div>
              <Link href="/admin/appointments" className="button button-primary button-block button-small" data-testid="button-review-requests">
                Review requests <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  );
}
