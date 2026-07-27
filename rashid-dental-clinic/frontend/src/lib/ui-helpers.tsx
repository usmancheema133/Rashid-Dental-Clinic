import { Baby, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import type { AppointmentStatus, ClinicDayHours } from '@/lib/types';

const SERVICE_ICONS = [Sparkles, ShieldCheck, Baby, Zap];

const DAY_ABBR: Record<string, string> = {
  Sunday: 'Sun', Monday: 'Mon', Tuesday: 'Tue', Wednesday: 'Wed',
  Thursday: 'Thu', Friday: 'Fri', Saturday: 'Sat',
};
const WEEK_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

/** Converts a "HH:MM" 24-hour string to a 12-hour string like "9:00 am" */
function to12Hour(time: string): string {
  const [hStr, mStr] = time.split(':');
  const h = Number(hStr);
  const period = h >= 12 ? 'pm' : 'am';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr} ${period}`;
}

/** Groups consecutive open days that share the same hours, e.g. ["Mon–Fri: 9:00 am–7:00 pm", "Sat: 9:00 am–2:00 pm"] */
export function formatOpeningHoursLines(workingHours: ClinicDayHours[] | undefined): string[] {
  if (!workingHours || workingHours.length === 0) return [];
  const ordered = WEEK_ORDER.map((day) => workingHours.find((w) => w.day === day)).filter(
    (w): w is ClinicDayHours => Boolean(w) && w!.isOpen
  );
  const lines: string[] = [];
  let i = 0;
  while (i < ordered.length) {
    let j = i;
    while (
      j + 1 < ordered.length &&
      ordered[j + 1].openTime === ordered[i].openTime &&
      ordered[j + 1].closeTime === ordered[i].closeTime
    ) {
      j += 1;
    }
    const range = i === j ? DAY_ABBR[ordered[i].day] : `${DAY_ABBR[ordered[i].day]}–${DAY_ABBR[ordered[j].day]}`;
    lines.push(`${range}: ${to12Hour(ordered[i].openTime)}–${to12Hour(ordered[i].closeTime)}`);
    i = j + 1;
  }
  return lines;
}

/** Compact single-line version for the top banner, e.g. "Mon–Fri, 8:00–18:00 · Sat, 9:00–14:00" */
export function formatOpeningHoursCompact(workingHours: ClinicDayHours[] | undefined): string {
  return formatOpeningHoursLines(workingHours)
    .map((line) => line.replace(': ', ', '))
    .join(' · ');
}

export function serviceIconFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash + seed.charCodeAt(i)) % SERVICE_ICONS.length;
  return SERVICE_ICONS[hash];
}

export function IconService({ seed }: { seed: string }) {
  const Icon = serviceIconFor(seed);
  return (
    <span className="service-icon">
      <Icon size={19} />
    </span>
  );
}

export function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function Status({ status }: { status: AppointmentStatus }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`status status-${status}`} data-testid={`status-${status}`}>
      {label}
    </span>
  );
}

export function formatDateLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function todayIsoDate() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}
