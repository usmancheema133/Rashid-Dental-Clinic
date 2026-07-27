import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { ArrowRight, Clock3, Loader2 } from 'lucide-react';
import { PublicShell, PageHero, Empty } from '@/components/layout';
import { servicesApi } from '@/lib/resources';
import { IconService } from '@/lib/ui-helpers';

function SearchIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="11" cy="11" r="7" /><path d="m16.5 16.5 4 4" />
    </svg>
  );
}

export default function Services() {
  const [query, setQuery] = useState('');
  const { data, isLoading } = useQuery({ queryKey: ['services'], queryFn: () => servicesApi.list() });
  const services = data?.services ?? [];
  const filtered = services.filter((s) => `${s.name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <PublicShell>
      <PageHero eyebrow="Services & fees" title="Care, without the guesswork.">
        A considered range of dental care for real life — with clear starting prices and enough time to
        do things properly.
      </PageHero>
      <section className="section">
        <div className="container">
          <div className="filter-bar">
            <input
              aria-label="Search services"
              placeholder="Search services"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              data-testid="input-search-services"
            />
            <span className="button button-quiet button-small" style={{ cursor: 'default' }}>
              Prices include consultation
            </span>
          </div>
          {isLoading ? (
            <div className="empty panel"><Loader2 className="animate-spin" /><strong>Loading services…</strong></div>
          ) : filtered.length ? (
            <div className="three-col">
              {filtered.map((s) => (
                <div className="panel" key={s._id} data-testid={`card-service-${s._id}`}>
                  <IconService seed={s._id} />
                  <h3 style={{ fontSize: '1.2rem', marginTop: 15 }}>{s.name}</h3>
                  <p>{s.description}</p>
                  <div className="service-meta" style={{ marginTop: 20 }}>
                    <span><Clock3 size={13} style={{ verticalAlign: 'middle' }} /> {s.duration} min</span>
                    <strong style={{ color: 'hsl(var(--foreground))' }}>PKR {s.price}</strong>
                  </div>
                  <Link href="/book" className="button button-primary button-small" style={{ marginTop: 18 }} data-testid={`button-book-service-${s._id}`}>
                    Book this care <ArrowRight size={13} />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <Empty icon={<SearchIcon />} title="No services match that search" copy="Try a broader term or browse the full list." />
          )}
        </div>
      </section>
    </PublicShell>
  );
}
