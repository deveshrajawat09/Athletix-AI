import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { Chrome } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const googleError = searchParams.get('error');
  const [error, setError] = useState(
    googleError === 'google_not_configured'
      ? 'Google login is not configured yet. Add Google OAuth credentials to the backend environment.'
      : googleError === 'google_failed'
        ? 'Google login could not be completed. Please try again.'
        : googleError === 'google_state_invalid'
          ? 'Google login session expired. Please try again.'
          : ''
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Athletix AI</h1>
          <p className="mt-1 text-sm text-gray-400">Your Health. Your Performance. Your Progress.</p>
        </div>
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Log in</h2>
          {error && <ErrorMessage message={error} />}
          <div>
            <label className="label">Email</label>
            <input
              type="email" required className="input-field" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password" required className="input-field" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-gray-300"><span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" /></div>
          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`} className="btn-secondary w-full gap-2">
            <Chrome size={16} className="text-[#4285f4]" /> Continue with Google
          </a>
          <p className="text-center text-sm text-gray-400">
            No account? <Link to="/signup" className="font-medium text-primary-600">Sign up</Link>
          </p>
          <p className="text-center text-[11px] leading-5 text-gray-400">
            By continuing, you agree to our <Link to="/terms" className="font-semibold text-primary-700">Terms</Link> and <Link to="/privacy" className="font-semibold text-primary-700">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
