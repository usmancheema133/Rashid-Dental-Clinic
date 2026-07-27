import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, Loader2, MessageCircle } from 'lucide-react';
import { PublicShell, PageHero, Empty } from '@/components/layout';
import { doctorsApi } from '@/lib/resources';
import { initials } from '@/lib/ui-helpers';
import { CalendarDays } from 'lucide-react';

export default function Doctors() {
  const { data, isLoading } = useQuery({ queryKey: ['doctors'], queryFn: () => doctorsApi.list() });
  const doctors = data?.doctors ?? [];

  return (
    <PublicShell>
      <PageHero eyebrow="Meet the team" title="People who put you at ease.">
        Experienced clinicians, thoughtful listeners and a shared belief that a dental visit should
        leave you feeling looked after.
      </PageHero>
      <section className="section">
        <div className="container">
          {isLoading ? (
            <div className="empty panel"><Loader2 className="animate-spin" /><strong>Loading doctors…</strong></div>
          ) : doctors.length ? (
            <div className="doctor-grid">
              {doctors.map((d) => (
                <div className="doctor-card" key={d._id} data-testid={`card-doctor-${d._id}`}>
                  <div className="doctor-cover"><div className="doctor-avatar">{initials(d.name)}</div></div>
                  <div className="doctor-body">
                    <h3>{d.name}</h3>
                    <span className="doctor-role">{d.specialization}</span>
                    <p>{d.biography}</p>
                    <div className="availability">
                      <i /> Usually here {d.availableDays.join(' · ') || 'by appointment'}
                    </div>
                    <Link href="/book" className="button button-quiet button-small" style={{ marginTop: 17 }} data-testid={`button-book-doctor-${d._id}`}>
                      Book with {d.name.replace(/^Dr\.?\s*/i, '').split(' ')[0]} <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={<CalendarDays />} title="No doctors listed yet" copy="Please check back soon." />
          )}
        </div>
      </section>
      <section className="section section-tint">
        <div className="container cta-band">
          <h2>Not sure who is right for you?</h2>
          <Link href="/contact" className="button" data-testid="button-doctors-contact">
            Talk to our team <MessageCircle size={15} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
