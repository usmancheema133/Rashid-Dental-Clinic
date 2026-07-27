import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Settings } from 'lucide-react';
import { DashboardShell, DashboardHead } from '@/components/layout';
import { availabilityApi } from '@/lib/resources';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';
import type { ClinicDayHours } from '@/lib/types';

export default function AdminAvailability() {
  const notify = useNotify();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });

  const [hours, setHours] = useState<ClinicDayHours[]>([]);
  const [slotDuration, setSlotDuration] = useState(30);
  const [onlineBooking, setOnlineBooking] = useState(true);

  useEffect(() => {
    if (data?.settings) {
      setHours(data.settings.workingHours);
      setSlotDuration(data.settings.slotDurationMinutes);
      setOnlineBooking(data.settings.onlineBookingEnabled);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      availabilityApi.updateSettings({
        workingHours: hours,
        slotDurationMinutes: slotDuration,
        onlineBookingEnabled: onlineBooking,
      }),
    onSuccess: () => {
      notify('Availability settings saved.');
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
    onError: (err) => notify(err instanceof ApiError ? err.message : 'Could not save settings.'),
  });

  const updateDay = (day: string, patch: Partial<ClinicDayHours>) => {
    setHours((list) => list.map((d) => (d.day === day ? { ...d, ...patch } : d)));
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  if (isLoading) {
    return <DashboardShell admin><p className="muted">Loading…</p></DashboardShell>;
  }

  return (
    <DashboardShell admin>
      <DashboardHead eyebrow="Clinic workspace" title="Availability" copy="Shape clinic hours and the appointment slots patients can see." />
      <form onSubmit={save} className="settings-grid">
        <div className="panel">
          <div className="panel-head"><h2>Clinic hours</h2><Clock3 size={17} color="hsl(var(--primary))" /></div>
          {hours.map((d) => (
            <div className="toggle-row" key={d.day}>
              <div>
                <strong>{d.day}</strong>
                <span>
                  {d.isOpen ? (
                    <>
                      <input type="time" value={d.openTime} onChange={(e) => updateDay(d.day, { openTime: e.target.value })} style={{ width: 90 }} />
                      {' – '}
                      <input type="time" value={d.closeTime} onChange={(e) => updateDay(d.day, { closeTime: e.target.value })} style={{ width: 90 }} />
                    </>
                  ) : (
                    'Closed'
                  )}
                </span>
              </div>
              <button
                type="button"
                className={`toggle ${d.isOpen ? 'on' : ''}`}
                onClick={() => updateDay(d.day, { isOpen: !d.isOpen })}
                data-testid={`button-toggle-${d.day.toLowerCase()}`}
              />
            </div>
          ))}
        </div>
        <div className="panel">
          <div className="panel-head"><h2>Booking preferences</h2><Settings size={17} color="hsl(var(--primary))" /></div>
          <div className="toggle-row">
            <div><strong>Online booking</strong><span>Allow patients to request visits online</span></div>
            <button
              type="button"
              className={`toggle ${onlineBooking ? 'on' : ''}`}
              onClick={() => setOnlineBooking((v) => !v)}
              data-testid="button-toggle-online"
            />
          </div>
          <div className="field" style={{ marginTop: 20 }}>
            <label htmlFor="slot-duration">Default appointment slot</label>
            <select
              id="slot-duration"
              value={slotDuration}
              onChange={(e) => setSlotDuration(Number(e.target.value))}
              data-testid="select-slot-duration"
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
          <button className="button button-primary button-block" style={{ marginTop: 17 }} disabled={mutation.isPending} data-testid="button-save-availability">
            {mutation.isPending ? 'Saving…' : 'Save availability'} <Check size={14} />
          </button>
        </div>
      </form>
    </DashboardShell>
  );
}
