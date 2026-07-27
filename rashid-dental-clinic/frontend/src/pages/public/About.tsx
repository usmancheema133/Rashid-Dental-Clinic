import { Bath, Check, HeartHandshake, Leaf, ShieldCheck, Syringe, Users } from 'lucide-react';
import { PublicShell, PageHero } from '@/components/layout';

export default function About() {
  return (
    <PublicShell>
      <PageHero eyebrow="A little about us" title="The kind of clinic you notice.">
        Not because it is grand or clinical — because it is considered. Rashid Dental was built around
        a simple idea: better care starts with making people feel at ease.
      </PageHero>
      <section className="section">
        <div className="container story-grid">
          <div>
            <span className="eyebrow">Since 2008</span>
            <h2>Good dentistry is a conversation.</h2>
            <p className="section-intro" style={{ marginTop: 20 }}>
              Our founder, Dr. Amina Rahman, opened Rashid Dental after seeing too many patients put off
              care because they felt rushed, judged or left in the dark. Today, that same belief guides
              every appointment.
            </p>
            <p className="section-intro" style={{ marginTop: 16 }}>
              We combine modern clinical standards with old-fashioned attentiveness: a proper welcome, a
              listening ear and a plan that makes sense to you.
            </p>
          </div>
          <div className="story-aside">
            <span className="mono">At a glance</span>
            <ul className="feature-list" style={{ position: 'relative', zIndex: 2 }}>
              <li><Check size={16} /> Independent and family-owned</li>
              <li><Check size={16} /> Four bright, private surgeries</li>
              <li><Check size={16} /> Digital scans, less waiting</li>
              <li><Check size={16} /> Accessible ground-floor entrance</li>
            </ul>
          </div>
        </div>
      </section>
      <section className="section section-tint">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">What matters here</span><h2>Our care principles.</h2></div>
          </div>
          <div className="three-col">
            <div className="panel"><HeartHandshake size={22} color="hsl(var(--primary))" /><h3>Warmth without fuss</h3><p>A friendly voice, a calm room and no assumptions about how you feel.</p></div>
            <div className="panel"><ShieldCheck size={22} color="hsl(var(--primary))" /><h3>Clarity builds trust</h3><p>We explain what we see, what it means and what your choices are — simply.</p></div>
            <div className="panel"><Leaf size={22} color="hsl(var(--primary))" /><h3>Care that lasts</h3><p>Prevention is our favourite treatment. We help you keep small concerns small.</p></div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div><span className="eyebrow">Our space</span><h2>Designed to exhale in.</h2></div>
            <p className="section-intro">Soft natural textures, warm light and a little more room to breathe. Clinical where it matters, comfortable everywhere else.</p>
          </div>
          <div className="three-col">
            <div className="panel" style={{ minHeight: 190, background: 'hsl(176 35% 79% / .32)' }}><Bath size={23} color="hsl(var(--primary))" /><h3>Quiet rooms</h3><p>Private surgeries with noise-reducing design and a screen for your treatment plan.</p></div>
            <div className="panel" style={{ minHeight: 190, background: 'hsl(14 57% 65% / .2)' }}><Syringe size={23} color="hsl(var(--primary))" /><h3>Modern tools</h3><p>Digital imaging and gentle techniques that make appointments more precise and comfortable.</p></div>
            <div className="panel" style={{ minHeight: 190, background: 'hsl(43 46% 84% / .6)' }}><Users size={23} color="hsl(var(--primary))" /><h3>One familiar team</h3><p>A small, experienced team so you see friendly faces every time you visit.</p></div>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
