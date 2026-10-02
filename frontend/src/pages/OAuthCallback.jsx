import React, { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const { completeOAuthLogin } = useAuth();
  const [params] = useSearchParams();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      setFailed(true);
      return;
    }
    completeOAuthLogin(token).catch(() => setFailed(true));
  }, [completeOAuthLogin, params]);

  if (failed) return <Navigate to="/login?error=google_failed" replace />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="card text-center">
        <p className="text-sm font-semibold text-gray-700">Signing you in with Google…</p>
        <p className="mt-1 text-xs text-gray-400">Please wait a moment.</p>
      </div>
    </div>
  );
}