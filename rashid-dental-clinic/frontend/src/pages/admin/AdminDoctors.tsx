import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Pencil, Plus, Trash2 } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { doctorsApi } from '@/lib/resources';
import { initials } from '@/lib/ui-helpers';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function AdminDoctors() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['doctors-all'], queryFn: () => doctorsApi.list(true) });
  const doctorList = data?.doctors ?? [];

  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [biography, setBiography] = useState('');
  const [days, setDays] = useState<string[]>([]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['doctors-all'] });
  const onError = (err: unknown) => notify(err instanceof ApiError ? err.message : 'Something went wrong.');

  const createMutation = useMutation({
    mutationFn: () => doctorsApi.create({ name, specialization, biography, availableDays: days }),
    onSuccess: () => {
      notify('Doctor added.');
      setName(''); setSpecialization(''); setBiography(''); setDays([]); setShow(false);
      invalidate();
    },
    onError,
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => doctorsApi.remove(id),
    onSuccess: () => { notify('Doctor removed.'); invalidate(); },
    onError,
  });

  const toggleDay = (day: string) => setDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name && specialization) createMutation.mutate();
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('');
  const [editBiography, setEditBiography] = useState('');
  const [editDays, setEditDays] = useState<string[]>([]);

  const updateMutation = useMutation({
    mutationFn: () =>
      doctorsApi.update(editingId as string, {
        name: editName,
        specialization: editSpecialization,
        biography: editBiography,
        availableDays: editDays,
      }),
    onSuccess: () => {
      notify('Doctor updated.');
      setEditingId(null);
      invalidate();
    },
    onError,
  });

  const toggleEditDay = (day: string) =>
    setEditDays((d) => (d.includes(day) ? d.filter((x) => x !== day) : [...d, day]));

  const startEdit = (d: { _id: string; name: string; specialization: string; biography?: string; availableDays: string[] }) => {
    setEditingId(d._id);
    setEditName(d.name);
    setEditSpecialization(d.specialization);
    setEditBiography(d.biography ?? '');
    setEditDays(d.availableDays ?? []);
  };

  const submitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (editName && editSpecialization) updateMutation.mutate();
  };

  return (
    <DashboardShell admin>
      <DashboardHead
        eyebrow="Clinic workspace"
        title="Doctors"
        copy="Your clinical team, availability and specialties."
        action={<button onClick={() => setShow(!show)} className="button button-primary" data-testid="button-add-doctor"><Plus size={15} /> Add doctor</button>}
      />
      {show && (
        <div className="panel" style={{ marginBottom: 18 }}>
          <form onSubmit={submit} className="form-grid">
            <div className="field"><label htmlFor="new-doctor-name">Doctor name</label><input id="new-doctor-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dr. First Last" data-testid="input-new-doctor-name" /></div>
            <div className="field"><label htmlFor="new-doctor-spec">Specialization</label><input id="new-doctor-spec" value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="e.g. Orthodontics" data-testid="input-new-doctor-specialization" /></div>
            <div className="field full"><label htmlFor="new-doctor-bio">Biography</label><textarea id="new-doctor-bio" value={biography} onChange={(e) => setBiography(e.target.value)} data-testid="textarea-new-doctor-bio" /></div>
            <div className="field full">
              <label>Available days</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {WEEKDAYS.map((d) => (
                  <button
                    type="button"
                    key={d}
                    className={`button button-small ${days.includes(d) ? 'button-primary' : 'button-quiet'}`}
                    onClick={() => toggleDay(d)}
                    data-testid={`button-day-${d.toLowerCase()}`}
                  >
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field" style={{ alignSelf: 'end' }}>
              <button className="button button-primary" disabled={createMutation.isPending} data-testid="button-save-doctor">
                {createMutation.isPending ? 'Saving…' : 'Save doctor'} <Check size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
      {isLoading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="three-col">
          {doctorList.map((d) => (
            <div className="panel" key={d._id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="avatar">{initials(d.name)}</span>
                <div className="table-actions">
                  <button
                    className="icon-button"
                    onClick={() => (editingId === d._id ? setEditingId(null) : startEdit(d))}
                    data-testid={`button-edit-doctor-${d._id}`}
                  >
                    <Pencil size={13} />
                  </button>
                  <button className="icon-button" onClick={() => removeMutation.mutate(d._id)} data-testid={`button-delete-doctor-${d._id}`}><Trash2 size={13} /></button>
                </div>
              </div>

              {editingId === d._id ? (
                <form onSubmit={submitEdit} className="form-grid" style={{ marginTop: 16 }}>
                  <div className="field full"><label htmlFor={`edit-doctor-name-${d._id}`}>Doctor name</label><input id={`edit-doctor-name-${d._id}`} value={editName} onChange={(e) => setEditName(e.target.value)} data-testid={`input-edit-doctor-name-${d._id}`} /></div>
                  <div className="field full"><label htmlFor={`edit-doctor-spec-${d._id}`}>Specialization</label><input id={`edit-doctor-spec-${d._id}`} value={editSpecialization} onChange={(e) => setEditSpecialization(e.target.value)} data-testid={`input-edit-doctor-specialization-${d._id}`} /></div>
                  <div className="field full"><label htmlFor={`edit-doctor-bio-${d._id}`}>Biography</label><textarea id={`edit-doctor-bio-${d._id}`} value={editBiography} onChange={(e) => setEditBiography(e.target.value)} data-testid={`textarea-edit-doctor-bio-${d._id}`} /></div>
                  <div className="field full">
                    <label>Available days</label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {WEEKDAYS.map((day) => (
                        <button
                          type="button"
                          key={day}
                          className={`button button-small ${editDays.includes(day) ? 'button-primary' : 'button-quiet'}`}
                          onClick={() => toggleEditDay(day)}
                          data-testid={`button-edit-day-${d._id}-${day.toLowerCase()}`}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="field full" style={{ display: 'flex', gap: 8 }}>
                    <button className="button button-primary" disabled={updateMutation.isPending} data-testid={`button-save-edit-doctor-${d._id}`}>
                      {updateMutation.isPending ? 'Saving…' : 'Save changes'} <Check size={14} />
                    </button>
                    <button type="button" className="button" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <h3 style={{ marginTop: 20 }}>{d.name}</h3>
                  <span className="doctor-role">{d.specialization}</span>
                  <p>{d.biography}</p>
                  <div className="availability"><i /> {d.availableDays.join(' · ') || 'Not set'}</div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
