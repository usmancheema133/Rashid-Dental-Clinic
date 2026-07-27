import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotifyContext';
import { usersApi } from '@/lib/resources';
import { ApiError } from '@/lib/api';

export default function Profile() {
  const { user, setUser } = useAuth();
  const notify = useNotify();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => usersApi.updateProfile({ name, phone }),
    onSuccess: ({ user: updated }) => {
      setUser(updated);
      setSaved(true);
      notify('Your profile has been updated.');
    },
    onError: (err) => setError(err instanceof ApiError ? err.message : 'Could not save your details.'),
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate();
  };

  return (
    <DashboardShell>
      <DashboardHead eyebrow="Patient portal" title="My profile" copy="Keep your details current so we can look after you properly." />
      <div className="panel" style={{ maxWidth: 650 }}>
        {saved && <div className="notice notice-success">Your details were saved successfully.</div>}
        {error && <div className="notice">{error}</div>}
        <form onSubmit={submit} className="form-grid">
          <div className="field full">
            <label htmlFor="profile-name">Full name</label>
            <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required data-testid="input-profile-name" />
          </div>
          <div className="field">
            <label htmlFor="profile-email">Email address</label>
            <input id="profile-email" value={user?.email || ''} disabled data-testid="input-profile-email" />
          </div>
          <div className="field">
            <label htmlFor="profile-phone">Phone number</label>
            <input id="profile-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required data-testid="input-profile-phone" />
          </div>
          <div className="field full">
            <button className="button button-primary" disabled={mutation.isPending} data-testid="button-save-profile">
              {mutation.isPending ? 'Saving…' : 'Save changes'} <Check size={14} />
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
