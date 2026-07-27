import { useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowRight, Stethoscope } from 'lucide-react';
import { PublicShell } from '@/components/layout';
import { useAuth } from '@/context/AuthContext';
import { useNotify } from '@/context/NotifyContext';
import { ApiError } from '@/lib/api';

export default function Auth({ register = false }: { register?: boolean }) {
  const { login, register: doRegister } = useAuth();
  const notify = useNotify();
  const [, setLocation] = useLocation();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get('email') ?? '').trim() || email.trim();
    const passwordValue = String(formData.get('password') ?? '') || password;
    const nameValue = (String(formData.get('name') ?? '').trim() || name.trim());
    const phoneValue = (String(formData.get('phone') ?? '').trim() || phone.trim());

    if (register && !nameValue) return setError('Please enter your name.');
    if (!emailValue.includes('@')) return setError('Please enter a valid email address.');
    if (register && !phoneValue) return setError('Please enter a phone number.');
    if (passwordValue.length < 6) return setError('Password should be at least 6 characters.');

    setSubmitting(true);
    try {
      const user = register
        ? await doRegister(nameValue, emailValue, phoneValue, passwordValue)
        : await login(emailValue, passwordValue);
      notify(`Welcome${register ? '' : ' back'}, ${user.name.split(' ')[0]}.`);
      setLocation(user.role === 'admin' ? '/admin' : '/patient');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
      <div className="auth-wrap">
        <div className="auth-card">
          <span className="brand-mark"><Stethoscope size={18} /></span>
          <h1>{register ? 'A better way to care for your smile.' : 'Welcome back.'}</h1>
          <p>
            {register
              ? 'Create your patient account to book visits, see upcoming appointments and keep your details in one place.'
              : 'Sign in to manage your visits and keep your care moving forward.'}
          </p>
          <form onSubmit={submit} className="form-grid">
            {register && (
              <div className="field full">
                <label htmlFor="auth-name">Full name</label>
                <input id="auth-name" name="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" data-testid="input-auth-name" />
              </div>
            )}
            <div className="field full">
              <label htmlFor="auth-email">Email address</label>
              <input id="auth-email" name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" data-testid="input-auth-email" />
            </div>
            {register && (
              <div className="field full">
                <label htmlFor="auth-phone">Phone number</label>
                <input id="auth-phone" name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="020 0000 0000" data-testid="input-auth-phone" />
              </div>
            )}
            <div className="field full">
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" data-testid="input-auth-password" />
            </div>
            {error && <span className="error-text field full">{error}</span>}
            <div className="field full">
              <button type="submit" className="button button-primary button-block" disabled={submitting} data-testid="button-auth-submit">
                {submitting ? 'Please wait…' : register ? 'Create patient account' : 'Sign in'} <ArrowRight size={15} />
              </button>
            </div>
          </form>
          <p style={{ textAlign: 'center', marginTop: 25, marginBottom: 0 }}>
            {register ? 'Already a patient?' : 'New to Rashid Dental?'}{' '}
            <Link href={register ? '/login' : '/register'} style={{ color: 'hsl(var(--primary))', fontWeight: 700 }} data-testid="link-auth-switch">
              {register ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </PublicShell>
  );
}
