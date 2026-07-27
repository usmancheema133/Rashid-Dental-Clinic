import { useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Clock3, Mail, MapPin, Phone, Send } from 'lucide-react';
import { PublicShell, PageHero } from '@/components/layout';
import { useNotify } from '@/context/NotifyContext';
import { availabilityApi } from '@/lib/resources';
import { formatOpeningHoursLines } from '@/lib/ui-helpers';

export default function Contact() {
  const notify = useNotify();
  const [sent, setSent] = useState(false);
  const { data } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });
  const settings = data?.settings;
  const hoursLines = formatOpeningHoursLines(settings?.workingHours);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    notify('Message received — we’ll be in touch soon.');
  };

  return (
    <PublicShell>
      <PageHero eyebrow="We are here to help" title="Let’s talk about your care.">
        Questions about a service, a nervous first visit or finding the right appointment? Send us a
        note and our team will get back to you within one working day.
      </PageHero>
      <section className="section">
        <div className="container contact-grid">
          <div className="panel">
            <span className="eyebrow">Find us</span>
            <div className="contact-list">
              <div className="contact-item"><MapPin size={19} /><div><strong>Clinic address</strong><span>{settings?.address || 'Address not set yet.'}</span></div></div>
              <div className="contact-item"><Phone size={19} /><div><strong>Call the team</strong><span>{settings?.phone || 'Phone not set yet.'}</span></div></div>
              <div className="contact-item"><Mail size={19} /><div><strong>Email us</strong><span>{settings?.email || 'Email not set yet.'}<br />We reply within one working day.</span></div></div>
              <div className="contact-item"><Clock3 size={19} /><div><strong>Opening hours</strong><span>{hoursLines.length ? hoursLines.map((l) => <span key={l}>{l}<br /></span>) : 'Hours not set yet.'}</span></div></div>
            </div>
          </div>
          <div className="panel">
            <span className="eyebrow">Send a message</span>
            <h2 style={{ fontFamily: 'var(--app-font-serif)', fontSize: '2rem', letterSpacing: '-.04em', margin: '11px 0 22px' }}>
              What’s on your mind?
            </h2>
            {sent ? (
              <div className="success-card">
                <span className="success-icon"><Check size={29} /></span>
                <h3>Thank you for reaching out.</h3>
                <p className="muted">A member of our team will be in touch shortly.</p>
                <button onClick={() => setSent(false)} className="button button-quiet button-small" data-testid="button-send-another">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="form-grid">
                <div className="field"><label htmlFor="contact-name">Your name</label><input id="contact-name" required placeholder="Your name" data-testid="input-contact-name" /></div>
                <div className="field"><label htmlFor="contact-email">Email address</label><input id="contact-email" required type="email" placeholder="you@example.com" data-testid="input-contact-email" /></div>
                <div className="field"><label htmlFor="contact-phone">Phone (optional)</label><input id="contact-phone" placeholder="020 0000 0000" data-testid="input-contact-phone" /></div>
                <div className="field">
                  <label htmlFor="contact-topic">Topic</label>
                  <select id="contact-topic" data-testid="select-contact-topic">
                    <option>General question</option><option>Appointment</option><option>New patient</option><option>Feedback</option>
                  </select>
                </div>
                <div className="field full"><label htmlFor="contact-message">Your message</label><textarea id="contact-message" required placeholder="Tell us how we can help…" data-testid="textarea-contact-message" /></div>
                <div className="field full"><button className="button button-primary" type="submit" data-testid="button-submit-contact">Send message <Send size={15} /></button></div>
              </form>
            )}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
