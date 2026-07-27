import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { PublicShell } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotifyContext';
import { doctorsApi, servicesApi, availabilityApi, appointmentsApi } from '@/lib/resources';
import { IconService, initials } from '@/lib/ui-helpers';
import { ApiError } from '@/lib/api';

function nextDays(count: number) {
  const days = [];
  const today = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    days.push({
      day: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      num: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      value: d.toISOString().slice(0, 10),
    });
  }
  return days;
}

export default function Booking() {
  const { user } = useAuth();
  const notify = useNotify();
  const [, setLocation] = useLocation();

  const [step, setStep] = useState(1);
  const [serviceId, setServiceId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState<{ reference: string } | null>(null);
  const [submitError, setSubmitError] = useState('');

  const dates = useMemo(() => nextDays(10), []);

  const { data: servicesData } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.list() });
  const { data: doctorsData } = useQuery({ queryKey: ['doctors'], queryFn: () => doctorsApi.list() });
  const { data: settingsData } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });
  const services = servicesData?.services ?? [];
  const doctors = doctorsData?.doctors ?? [];
  const clinicSettings = settingsData?.settings;

  const { data: slotsData, isFetching: loadingSlots } = useQuery({
    queryKey: ['slots', doctorId, date, serviceId],
    queryFn: () => availabilityApi.getSlots(doctorId, date, serviceId),
    enabled: Boolean(doctorId && date && serviceId),
  });
  const slots = slotsData?.slots ?? [];

  const selectedService = services.find((s) => s._id === serviceId);
  const selectedDoctor = doctors.find((d) => d._id === doctorId);

  const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const selectedWeekday = date ? WEEKDAY_NAMES[new Date(`${date}T00:00:00`).getDay()] : '';
  const doctorWorksThisDay = selectedDoctor ? selectedDoctor.availableDays.includes(selectedWeekday) : true;

  const isToday = date === new Date().toISOString().slice(0, 10);
  const clinicDayHours = clinicSettings?.workingHours.find((w) => w.day === selectedWeekday);
  const clinicClosedThisDay = clinicDayHours ? !clinicDayHours.isOpen : false;

  const bookMutation = useMutation({
    mutationFn: () => appointmentsApi.create({ doctorId, serviceId, date, startTime, reason }),
  });

  const canNext =
    (step === 1 && serviceId) ||
    (step === 2 && doctorId) ||
    (step === 3 && date && startTime) ||
    (step === 4 && true);

  const goNext = async () => {
    if (!canNext) return;
    if (step < 4) {
      setStep(step + 1);
      return;
    }
    if (!user) {
      notify('Please sign in or create an account to request this appointment.');
      setLocation('/login');
      return;
    }
    setSubmitError('');
    try {
      const { appointment } = await bookMutation.mutateAsync();
      setConfirmed({ reference: appointment.bookingReference });
      notify('Your appointment request has been sent.');
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : 'Could not submit your request. Please try again.');
    }
  };

  if (confirmed) {
    return (
      <PublicShell>
        <section className="section">
          <div className="container">
            <div className="booking-card panel success-card" style={{ margin: '35px auto 80px' }}>
              <span className="success-icon"><Check size={30} /></span>
              <span className="eyebrow">Request received</span>
              <h2 style={{ marginTop: 12 }}>Your care is on its way.</h2>
              <p>We've sent your appointment request to the clinic team. We'll confirm it by email shortly.</p>
              <div className="summary-box" style={{ textAlign: 'left', maxWidth: 430, margin: '22px auto' }}>
                <div className="summary-row"><span>Service</span><strong>{selectedService?.name}</strong></div>
                <div className="summary-row"><span>With</span><strong>{selectedDoctor?.name}</strong></div>
                <div className="summary-row"><span>When</span><strong>{date} · {startTime}</strong></div>
                <div className="summary-row"><span>Reference</span><strong className="mono">{confirmed.reference}</strong></div>
              </div>
              <Link href="/patient/appointments" className="button button-primary" data-testid="button-booking-home">
                View my appointments <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>
      </PublicShell>
    );
  }

  const titles = ['What can we help with?', 'Who would you like to see?', 'Find a time that works', 'A little more detail'];
  const descriptions = [
    'Choose the kind of care you are looking for. You can always talk it through with us first.',
    'Our clinicians all share the same calm approach. Pick whoever fits your schedule.',
    'These are the next available times. Your appointment is not confirmed until we review your request.',
    'Tell us anything that would help us prepare for your visit.',
  ];

  return (
    <PublicShell>
      <section className="section">
        <div className="container booking-layout">
          <div className="steps">
            {titles.map((t, i) => (
              <div className={`step ${step === i + 1 ? 'active' : ''} ${step > i + 1 ? 'done' : ''}`} key={t}>
                <span className="step-dot">{step > i + 1 ? <Check size={13} /> : i + 1}</span>
                <span>{t}</span>
              </div>
            ))}
          </div>
          <div className="booking-card">
            <span className="eyebrow">Book a visit · step {step} of 4</span>
            <h2>{titles[step - 1]}</h2>
            <p>{descriptions[step - 1]}</p>

            {step === 1 && (
              <div className="choice-grid">
                {services.map((s) => (
                  <button
                    className={`choice ${serviceId === s._id ? 'selected' : ''}`}
                    onClick={() => setServiceId(s._id)}
                    key={s._id}
                    data-testid={`button-booking-service-${s._id}`}
                  >
                    <IconService seed={s._id} />
                    <strong style={{ marginTop: 13 }}>{s.name}</strong>
                    <span>{s.duration} min . Cost PKR {s.price}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="choice-grid">
                {doctors.map((d) => (
                  <button
                    className={`choice ${doctorId === d._id ? 'selected' : ''}`}
                    onClick={() => setDoctorId(d._id)}
                    key={d._id}
                    data-testid={`button-booking-doctor-${d._id}`}
                  >
                    <span className="avatar" style={{ marginBottom: 10 }}>{initials(d.name)}</span>
                    <strong>{d.name}</strong>
                    <span>{d.specialization}</span>
                  </button>
                ))}
              </div>
            )}

            {step === 3 && (
              <>
                <div className="date-grid">
                  {dates.map((d) => (
                    <button
                      className={`date-chip ${date === d.value ? 'selected' : ''}`}
                      key={d.value}
                      onClick={() => { setDate(d.value); setStartTime(''); }}
                      data-testid={`button-booking-date-${d.value}`}
                    >
                      <b>{d.day}</b><span>{d.num}</span>
                    </button>
                  ))}
                </div>
                <span className="eyebrow" style={{ display: 'block', marginBottom: 12 }}>Available times</span>
                {!date ? (
                  <p className="muted">Pick a date to see available times.</p>
                ) : loadingSlots ? (
                  <p className="muted">Checking availability…</p>
                ) : slots.length ? (
                  <div className="time-grid">
                    {slots.map((t) => (
                      <button
                        className={`time-slot ${startTime === t.startTime ? 'selected' : ''}`}
                        key={t.startTime}
                        onClick={() => setStartTime(t.startTime)}
                        data-testid={`button-booking-time-${t.startTime}`}
                      >
                        {t.startTime}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="muted">
                    {clinicClosedThisDay
                      ? isToday
                        ? 'Sorry, the clinic is closed today.'
                        : `Sorry, the clinic will be closed on ${selectedWeekday}, ${date}.`
                      : !doctorWorksThisDay && selectedDoctor
                        ? `${selectedDoctor.name} is not available on ${selectedWeekday}s. Working days: ${selectedDoctor.availableDays.join(', ') || 'not set'}.`
                        : 'No times available on this date — please try another day.'}
                  </p>
                )}
              </>
            )}

            {step === 4 && (
              <div className="form-grid">
                <div className="field full">
                  <label htmlFor="booking-reason">What would you like us to know?</label>
                  <textarea
                    id="booking-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="For example: I have a sensitive tooth, or I'm a little nervous…"
                    data-testid="textarea-booking-reason"
                  />
                  <span className="muted" style={{ fontSize: '.68rem' }}>This helps us make your visit as comfortable as possible.</span>
                </div>
                <div className="summary-box field full">
                  <div className="summary-row"><span>Service</span><strong>{selectedService?.name}</strong></div>
                  <div className="summary-row"><span>Clinician</span><strong>{selectedDoctor?.name}</strong></div>
                  <div className="summary-row"><span>Time</span><strong>{date} · {startTime}</strong></div>
                </div>
                {!user && (
                  <div className="notice field full">You'll need to sign in or create a patient account on the next step to confirm this request.</div>
                )}
                {submitError && <span className="error-text field full">{submitError}</span>}
              </div>
            )}

            <div className="booking-footer">
              {step > 1 ? (
                <button className="button button-quiet" onClick={() => setStep(step - 1)} data-testid="button-booking-back">
                  <ArrowLeft size={15} /> Back
                </button>
              ) : <span />}
              {step < 4 ? (
                <button className="button button-primary" disabled={!canNext} onClick={goNext} data-testid="button-booking-next">
                  Continue <ArrowRight size={15} />
                </button>
              ) : (
                <button className="button button-primary" disabled={bookMutation.isPending} onClick={goNext} data-testid="button-booking-submit">
                  {bookMutation.isPending ? 'Submitting…' : 'Request appointment'} <Check size={15} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
