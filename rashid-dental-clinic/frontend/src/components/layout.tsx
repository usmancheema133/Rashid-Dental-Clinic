import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowRight, CalendarDays, Clock3, LayoutDashboard, Menu,
  Plus, Settings, Sparkles, Stethoscope, UserRound, Users, X,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { availabilityApi } from '@/lib/resources';
import { formatOpeningHoursCompact } from '@/lib/ui-helpers';

function useClickOutside(onOutside: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onOutside]);
  return ref;
}

function UserMenu({ profileHref }: { profileHref?: string }) {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useClickOutside(() => setOpen(false));

  if (!user) return null;
  const initial = user.name?.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="user-menu" ref={ref}>
      <button
        className="user-avatar"
        onClick={() => setOpen((o) => !o)}
        data-testid="button-user-menu"
        aria-label={`Account menu for ${user.name}`}
      >
        {initial}
      </button>
      {open && (
        <div className="user-menu-dropdown" data-testid="menu-user-dropdown">
          <div className="user-menu-header">
            <span className="user-avatar user-avatar-small">{initial}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{user.email}</span>
            </div>
          </div>
          {profileHref && (
            <Link href={profileHref} onClick={() => setOpen(false)} className="user-menu-item" data-testid="link-user-menu-profile">
              <UserRound size={15} /> My profile
            </Link>
          )}
          <button
            className="user-menu-item user-menu-item-danger"
            onClick={() => {
              setOpen(false);
              logout();
              setLocation('/');
            }}
            data-testid="button-sign-out"
          >
            <ArrowLeft size={15} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function Brand() {
  return (
    <Link href="/" className="brand" data-testid="link-brand">
      <span className="brand-mark"><Stethoscope size={18} /></span>
      <span>
        <span className="brand-name">Rashid Dental</span>
        <span className="brand-sub">Clinic · since 2008</span>
      </span>
    </Link>
  );
}

const navPublic: [string, string][] = [
  ['/', 'Home'],
  ['/about', 'Our clinic'],
  ['/services', 'Services'],
  ['/doctors', 'Doctors'],
  ['/contact', 'Contact'],
];

export function PublicShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });
  const settings = data?.settings;
  const phoneHref = settings?.phone ? `tel:${settings.phone.replace(/[^\d+]/g, '')}` : undefined;
  const hoursCompact = formatOpeningHoursCompact(settings?.workingHours);

  return (
    <div className="app">
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Comfort-first dentistry for the whole family</span>
          <span>{settings?.phone ? <a href={phoneHref}>{settings.phone}</a> : 'Phone not set'} · {hoursCompact || 'Hours not set'}</span>
        </div>
      </div>
      <header className="nav">
        <div className="container nav-inner">
          <Brand />
          <nav className={`nav-links ${open ? 'open' : ''}`}>
            {navPublic.map(([href, label]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={location === href ? 'active' : ''}
                data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="nav-actions">
            {user ? (
              <Link
                href={user.role === 'admin' ? '/admin' : '/patient'}
                className="button button-quiet button-small"
                data-testid="link-dashboard"
              >
                <UserRound size={15} /> Dashboard
              </Link>
            ) : (
              <Link href="/login" className="button button-quiet button-small" data-testid="link-login">
                Patient login
              </Link>
            )}
            <Link href="/book" className="button button-primary button-small" data-testid="button-header-book">
              Book a visit <ArrowRight size={14} />
            </Link>
            <button className="mobile-menu" onClick={() => setOpen(!open)} data-testid="button-mobile-menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      <main className="page-enter">{children}</main>
      <Footer />
    </div>
  );
}

export function Footer() {
  const { data } = useQuery({ queryKey: ['clinic-settings'], queryFn: () => availabilityApi.getSettings() });
  const settings = data?.settings;

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p style={{ maxWidth: 285, marginTop: 18 }}>
            Modern family dentistry with a softer approach. Clear advice, thoughtful treatment and a
            team who remembers your name.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          {navPublic.slice(1, 4).map(([href, label]) => (
            <Link key={href} href={href} data-testid={`link-footer-${label}`}>{label}</Link>
          ))}
        </div>
        <div>
          <h4>For patients</h4>
          <Link href="/book" data-testid="link-footer-book">Book a visit</Link>
          <Link href="/login" data-testid="link-footer-login">Patient portal</Link>
          <Link href="/contact" data-testid="link-footer-contact">Contact us</Link>
        </div>
        <div>
          <h4>Visit us</h4>
          <p>{settings?.address || 'Address not set yet.'}</p>
          <p>{settings?.phone || 'Phone not set'}<br />{settings?.email || 'Email not set'}</p>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 {settings?.clinicName || 'Rashid Dental Clinic'}</span>
        <span>Care that feels like you.</span>
      </div>
    </footer>
  );
}

export function PageHero({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section className="page-hero">
      <div className="container">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
    </section>
  );
}

export function Empty({
  icon,
  title,
  copy,
  action,
}: {
  icon: ReactNode;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      {icon}
      <strong>{title}</strong>
      <span style={{ display: 'block', marginBottom: 15 }}>{copy}</span>
      {action}
    </div>
  );
}

export function DashboardHead({
  eyebrow,
  title,
  copy,
  action,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  action?: ReactNode;
}) {
  return (
    <div className="dashboard-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action}
    </div>
  );
}

export function DashboardShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const [location] = useLocation();
  const [mobile, setMobile] = useState(false);

  const links = admin
    ? ([
        ['/admin', 'Overview', LayoutDashboard],
        ['/admin/appointments', 'Appointments', CalendarDays],
        ['/admin/doctors', 'Doctors', Stethoscope],
        ['/admin/services', 'Services', Sparkles],
        ['/admin/availability', 'Availability', Clock3],
        ['/admin/patients', 'Patients', Users],
        ['/admin/settings', 'Settings', Settings],
      ] as const)
    : ([
        ['/patient', 'Overview', LayoutDashboard],
        ['/patient/appointments', 'My appointments', CalendarDays],
        ['/patient/profile', 'My profile', UserRound],
      ] as const);

  return (
    <div className="app">
      <header className="nav">
        <div className="container nav-inner">
          <Brand />
          <div className="nav-actions">
            <Link href="/book" className="button button-primary button-small" data-testid="button-dashboard-book">
              <Plus size={14} /> Book a visit
            </Link>
            <UserMenu profileHref={admin ? undefined : '/patient/profile'} />
            <button className="mobile-menu" onClick={() => setMobile(!mobile)} data-testid="button-dashboard-menu">
              <Menu size={17} />
            </button>
          </div>
        </div>
      </header>
      <div className="dashboard">
        <aside className={`side-nav ${mobile ? 'mobile-open' : ''}`}>
          <div className="side-greeting">
            <span className="eyebrow" style={{ color: 'hsl(43 42% 77%)' }}>
              {admin ? 'Clinic workspace' : 'Patient portal'}
            </span>
            <p>{admin ? 'A clear view of today’s care.' : 'Your care, in your hands.'}</p>
          </div>
          <div className="side-links">
            {links.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobile(false)}
                className={location === href ? 'active' : ''}
                data-testid={`link-side-${label.toLowerCase().replaceAll(' ', '-')}`}
              >
                <Icon size={16} /> {label}
              </Link>
            ))}
          </div>
        </aside>
        <main className="dashboard-main page-enter">{children}</main>
      </div>
    </div>
  );
}
