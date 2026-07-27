import { Link } from 'wouter';
import { ArrowRight, Info } from 'lucide-react';
import { PublicShell } from '@/components/layout';

export default function NotFoundPage() {
  return (
    <PublicShell>
      <section className="section">
        <div className="container empty">
          <Info size={34} />
          <strong>That page isn’t here.</strong>
          <span style={{ display: 'block', marginBottom: 18 }}>Let’s get you back to somewhere useful.</span>
          <Link href="/" className="button button-primary" data-testid="link-not-found-home">
            Back home <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </PublicShell>
  );
}
