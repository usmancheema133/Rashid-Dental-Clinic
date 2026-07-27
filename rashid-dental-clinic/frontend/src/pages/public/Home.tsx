import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import {
  ArrowRight, Award, CalendarDays, HeartHandshake, Sparkles, ShieldCheck,
} from 'lucide-react';
import { PublicShell } from '@/components/layout';
import { servicesApi } from '@/lib/resources';
import { IconService } from '@/lib/ui-helpers';

export default function Home() {
  const { data } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.list() });
  const services = data?.services ?? [];

  return (
    <PublicShell>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Dentistry, with a human touch</span>
            <h1>Come for your smile.<br /><em>Stay for the care.</em></h1>
            <p className="hero-copy">
              A calm, modern dental clinic in the heart of Islington. We take the time to listen,
              explain every option and make your next visit feel a little easier.
            </p>
            <div className="hero-actions">
              <Link href="/book" className="button button-primary" data-testid="button-hero-book">
                Book your visit <ArrowRight size={16} />
              </Link>
              <Link href="/about" className="button button-quiet" data-testid="button-hero-about">
                Get to know us
              </Link>
            </div>
            <div className="hero-note">
              <HeartHandshake size={16} /> Gentle care for nervous patients, children and every smile in between.
            </div>
          </div>
          <div className="hero-art">
            <div className="art-panel">
              <span className="art-spark"><Sparkles size={27} /></span>
              <span className="art-sun" />
              <span className="art-arch" />
              <span className="art-chair" />
              <span className="art-leaf" />
              <span className="art-caption">A different kind of dental visit</span>
            </div>
            <div className="floating-card">
              <span className="avatar">SB</span>
              <span><strong>"I felt looked after."</strong><span>Sofia, a patient since 2019</span></span>
            </div>
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="container trust-items">
          <span className="trust-item"><ShieldCheck size={16} /> GDC-registered clinicians</span>
          <span className="trust-item"><HeartHandshake size={16} /> Anxious-patient friendly</span>
          <span className="trust-item"><Award size={16} /> 4.9/5 patient rating</span>
          <span className="trust-item"><CalendarDays size={16} /> Evening appointments</span>
        </div>
      </div>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Good things, gently done</span>
              <h2>Care that looks<br />beyond the chair.</h2>
            </div>
            <p className="section-intro">
              From your first hello to the follow-up call, every detail is designed around feeling
              informed, comfortable and genuinely cared for.
            </p>
          </div>
          <div className="service-grid">
            {services.slice(0, 4).map((s) => (
              <Link href="/services" className="service-card" key={s._id} data-testid={`card-service-${s._id}`}>
                <div>
                  <IconService seed={s._id} />
                  <h3>{s.name}</h3>
                  <p className="muted" style={{ fontSize: '.78rem', lineHeight: 1.5, margin: 0 }}>
                    {s.description.slice(0, 75)}…
                  </p>
                </div>
                <div className="service-meta">
                  <span>{s.duration} min</span>
                  <span> PKR {s.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="container story-grid">
          <div className="story-aside">
            <span className="mono">Our promise</span>
            <p>"You should leave feeling clearer than when you arrived — about your health, your options and your next step."</p>
          </div>
          <div>
            <span className="eyebrow">The Rashid difference</span>
            <div className="story-points">
              <div className="story-point">
                <span className="number">01</span>
                <div><h3>We make time</h3><p>Appointments never feel rushed. We listen first, explain without jargon and leave room for questions.</p></div>
              </div>
              <div className="story-point">
                <span className="number">02</span>
                <div><h3>We keep it clear</h3><p>Thoughtful treatment plans, transparent pricing and no pressure — just the information you need.</p></div>
              </div>
              <div className="story-point">
                <span className="number">03</span>
                <div><h3>We remember the human</h3><p>Your preferences, your worries and the small things that help you settle in are part of your care.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="testimonial">
        <div className="container quote">
          <div className="quote-mark">"</div>
          <blockquote>The first time in years I didn't feel nervous about going to the dentist. Everyone was warm, patient and incredibly clear.</blockquote>
          <cite>— Naomi T. · patient review</cite>
        </div>
      </section>
      <section className="section">
        <div className="container cta-band">
          <h2>Ready for a more comfortable dental visit?</h2>
          <Link href="/book" className="button" data-testid="button-home-cta">
            Find a time that suits you <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
