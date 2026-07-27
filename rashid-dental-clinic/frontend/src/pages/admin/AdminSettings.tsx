import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, MapPin } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { availabilityApi } from '@/lib/resources';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';

export default function AdminSettings() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });

  const [clinicName, setClinicName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setClinicName(data.settings.clinicName);
      setAddress(data.settings.address);
      setPhone(data.settings.phone);
      setEmail(data.settings.email);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => availabilityApi.updateSettings({ clinicName, address, phone, email }),
    onSuccess: () => {
      setSaved(true);
      notify('Clinic details saved.');
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : 'Could not save clinic details.'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return <DashboardShell admin><p className="muted">Loading…</p></DashboardShell>;
  }

  return (
    <DashboardShell admin>
      <DashboardHead eyebrow="Clinic workspace" title="Clinic settings" copy="The details patients see when they book and get in touch." />
      <div className="settings-grid">
        <div className="panel">
          <div className="panel-head"><h2>Clinic details</h2><MapPin size={17} color="hsl(var(--primary))" /></div>
          <form onSubmit={submit} className="form-grid">
            <div className="field full"><label htmlFor="clinic-name">Clinic name</label><input id="clinic-name" value={clinicName} onChange={(e) => setClinicName(e.target.value)} data-testid="input-clinic-name" /></div>
            <div className="field full"><label htmlFor="clinic-address">Address</label><input id="clinic-address" value={address} onChange={(e) => setAddress(e.target.value)} data-testid="input-clinic-address" /></div>
            <div className="field"><label htmlFor="clinic-phone">Phone</label><input id="clinic-phone" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-clinic-phone" /></div>
            <div className="field"><label htmlFor="clinic-email">Email</label><input id="clinic-email" value={email} onChange={(e) => setEmail(e.target.value)} data-testid="input-clinic-email" /></div>
            <div className="field full">
              <button className="button button-primary" disabled={mutation.isPending} data-testid="button-save-clinic-settings">
                {mutation.isPending ? 'Saving…' : 'Save details'} <Check size={14} />
              </button>
            </div>
          </form>
          {saved && <div className="notice notice-success" style={{ marginTop: 15 }}>Clinic details saved.</div>}
        </div>
      </div>
    </DashboardShell>
  );
}
