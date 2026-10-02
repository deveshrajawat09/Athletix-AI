import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/ErrorMessage';
import { Chrome } from 'lucide-react';

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Sign up failed.');
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
          <h2 className="text-lg font-semibold text-gray-900">Create your account</h2>
          {error && <ErrorMessage message={error} />}
          <div>
            <label className="label">Name</label>
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" required className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" required minLength={8} className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <p className="mt-1 text-xs text-gray-400">At least 8 characters.</p>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Sign up'}
          </button>
          <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-widest text-gray-300"><span className="h-px flex-1 bg-gray-200" />or<span className="h-px flex-1 bg-gray-200" /></div>
          <a href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/google`} className="btn-secondary w-full gap-2">
            <Chrome size={16} className="text-[#4285f4]" /> Continue with Google
          </a>
          <p className="text-center text-sm text-gray-400">
            Already have an account? <Link to="/login" className="font-medium text-primary-600">Log in</Link>
          </p>
          <p className="text-center text-[11px] leading-5 text-gray-400">
            By creating an account, you agree to our <Link to="/terms" className="font-semibold text-primary-700">Terms</Link> and <Link to="/privacy" className="font-semibold text-primary-700">Privacy Policy</Link>.
          </p>
        </form>
      </div>
    </div>
  );
}
