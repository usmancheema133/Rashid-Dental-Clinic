import { Fragment, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { servicesApi } from '@/lib/resources';
import { IconService } from '@/lib/ui-helpers';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';

export default function AdminServices() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['services-all'], queryFn: () => servicesApi.list(true) });
  const list = data?.services ?? [];

  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(50);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDuration, setEditDuration] = useState(30);
  const [editPrice, setEditPrice] = useState(50);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['services-all'] });
  const onError = (err: unknown) => notify(err instanceof ApiError ? err.message : 'Something went wrong.');

  const createMutation = useMutation({
    mutationFn: () => servicesApi.create({ name, description, duration, price }),
    onSuccess: () => {
      notify('Service added.');
      setName(''); setDescription(''); setDuration(30); setPrice(50); setShow(false);
      invalidate();
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => servicesApi.remove(id),
    onSuccess: () => { notify('Service removed.'); invalidate(); },
    onError,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      servicesApi.update(editingId as string, {
        name: editName,
        description: editDescription,
        duration: editDuration,
        price: editPrice,
      }),
    onSuccess: () => {
      notify('Service updated.');
      setEditingId(null);
      invalidate();
    },
    onError,
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name) createMutation.mutate();
  };

  const startEdit = (s: { _id: string; name: string; description?: string; duration: number; price: number }) => {
    setEditingId(s._id);
    setEditName(s.name);
    setEditDescription(s.description ?? '');
    setEditDuration(s.duration);
    setEditPrice(s.price);
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (editName) updateMutation.mutate();
  };

  return (
    <DashboardShell admin>
      <DashboardHead
        eyebrow="Clinic workspace"
        title="Services & fees"
        copy="Keep your care menu clear and up to date."
        action={<button onClick={() => setShow(!show)} className="button button-primary" data-testid="button-add-service"><Plus size={15} /> Add service</button>}
      />
      {show && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <form onSubmit={submit} className="form-grid">
            <div className="field"><label htmlFor="new-service-name">Service name</label><input id="new-service-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Service name" data-testid="input-new-service-name" /></div>
            <div className="field"><label htmlFor="new-service-duration">Duration (minutes)</label><input id="new-service-duration" type="number" min={5} value={duration} onChange={(e) => setDuration(Number(e.target.value))} data-testid="input-new-service-duration" /></div>
            <div className="field"><label htmlFor="new-service-price">Price (PKR)</label><input id="new-service-price" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} data-testid="input-new-service-price" /></div>
            <div className="field full"><label htmlFor="new-service-desc">Description</label><textarea id="new-service-desc" value={description} onChange={(e) => setDescription(e.target.value)} data-testid="textarea-new-service-description" /></div>
            <div className="field" style={{ alignSelf: 'end' }}>
              <button className="button button-primary" disabled={createMutation.isPending} data-testid="button-save-service">
                {createMutation.isPending ? 'Saving…' : 'Save service'} <Check size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="panel">
        <div className="table-wrap">
          {isLoading ? (
            <p className="muted" style={{ padding: 20 }}>Loading…</p>
          ) : (
            <table className="data-table">
              <thead><tr><th>Service</th><th>Duration</th><th>Price</th><th /></tr></thead>
              <tbody>
                {list.map((s) => (
                  <Fragment key={s._id}>
                    <tr>
                      <td><div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><IconService seed={s._id} /><strong>{s.name}</strong></div></td>
                      <td>{s.duration} min</td>
                      <td>PKR {s.price}</td>
                      <td>
                        <div className="table-actions">
                          <button
                            className="icon-button"
                            onClick={() => (editingId === s._id ? setEditingId(null) : startEdit(s))}
                            data-testid={`button-edit-service-${s._id}`}
                          >
                            <Pencil size={13} />
                          </button>
                          <button className="icon-button" onClick={() => removeMutation.mutate(s._id)} data-testid={`button-delete-service-${s._id}`}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                    {editingId === s._id && (
                      <tr key={`${s._id}-edit`}>
                        <td colSpan={4}>
                          <form onSubmit={submitEdit} className="form-grid" style={{ padding: '12px 0' }}>
                            <div className="field"><label htmlFor={`edit-name-${s._id}`}>Service name</label><input id={`edit-name-${s._id}`} value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-service-name-${s._id}`} /></div>
                            <div className="field"><label htmlFor={`edit-duration-${s._id}`}>Duration (minutes)</label><input id={`edit-duration-${s._id}`} type="number" min={5} value={editDuration} onChange={(e) => setEditDuration(Number(e.target.value))} data-testid={`input-edit-service-duration-${s._id}`} /></div>
                            <div className="field"><label htmlFor={`edit-price-${s._id}`}>Price ()</label><input id={`edit-price-${s._id}`} type="number" min={0} value={editPrice} onChange={(e) => setEditPrice(Number(e.target.value))} data-testid={`input-edit-service-price-${s._id}`} /></div>
                            <div className="field full"><label htmlFor={`edit-desc-${s._id}`}>Description</label><textarea id={`edit-desc-${s._id}`} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} data-testid={`textarea-edit-service-description-${s._id}`} /></div>
                            <div className="field" style={{ alignSelf: 'end', display: 'flex', gap: 8 }}>
                              <button className="button button-primary" disabled={updateMutation.isPending} data-testid={`button-save-edit-service-${s._id}`}>
                                {updateMutation.isPending ? 'Saving…' : 'Save changes'} <Check size={14} />
                              </button>
                              <button type="button" className="button" onClick={() => setEditingId(null)}>Cancel</button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
