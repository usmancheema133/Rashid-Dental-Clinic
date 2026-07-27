import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail } from 'lucide-react';
import { DashboardShell, DashboardHead, Empty } from '@/components/layout';
import { adminApi } from '@/lib/resources';
import { initials } from '@/lib/ui-helpers';
import { Users } from 'lucide-react';

export default function AdminPatients() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['admin-patients', search],
    queryFn: () => adminApi.patients(search || undefined),
  });
  const patients = data?.patients ?? [];

  return (
    <DashboardShell admin>
      <DashboardHead eyebrow="Clinic workspace" title="Patients" copy="The people behind every appointment." />
      <div className="panel">
        <div className="filter-bar">
          <input placeholder="Search patients" value={search} onChange={(e) => setSearch(e.target.value)} data-testid="input-search-patients" />
          <span className="button button-quiet button-small" style={{ cursor: 'default' }}>{patients.length} patients</span>
        </div>
        <div className="table-wrap">
          {isLoading ? (
            <p className="muted" style={{ padding: 20 }}>Loading…</p>
          ) : patients.length ? (
            <table className="data-table">
              <thead><tr><th>Patient</th><th>Contact</th><th>Status</th><th /></tr></thead>
              <tbody>
                {patients.map((p, i) => (
                  <tr key={p.id} data-testid={`row-patient-${i}`}>
                    <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><span className="avatar">{initials(p.name)}</span><strong>{p.name}</strong></div></td>
                    <td>{p.email}<br /><span className="muted">{p.phone}</span></td>
                    <td>{p.accountStatus}</td>
                    <td>
                      <a className="icon-button" href={`mailto:${p.email}`} data-testid={`button-contact-patient-${i}`}>
                        <Mail size={13} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Empty icon={<Users />} title="No patients found" copy="Try a different search." />
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
