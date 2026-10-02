import React, { useState, useEffect } from 'react';
import {
  Activity,
  Calendar,
  Mail,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  getIntegrationStatus,
  updatePreferences,
  disconnectGoogle,
  syncGoogleFit,
  triggerDailyBriefingEmail,
} from '../api/integrations';

export default function IntegrationsCard({ onSyncSuccess }) {
  const [loading, setLoading] = useState(true);
  const [syncingFit, setSyncingFit] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [status, setStatus] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [previewLink, setPreviewLink] = useState(null);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const data = await getIntegrationStatus();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch integration status', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleTogglePref(key) {
    if (!status) return;
    const current = status.automationPreferences[key];
    const newPrefs = { ...status.automationPreferences, [key]: !current };
    setStatus({ ...status, automationPreferences: newPrefs });
    try {
      await updatePreferences(newPrefs);
      showFeedback('Preferences updated successfully!');
    } catch (e) {
      showFeedback('Failed to update preferences', 'error');
    }
  }

  async function handleConnectGoogle() {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/integrations/google/oauth`;
  }

  async function handleDisconnectGoogle() {
    try {
      setLoading(true);
      await disconnectGoogle();
      setStatus((prev) => ({
        ...prev,
        googleAuth: { connected: false, lastFitSyncAt: null },
      }));
      showFeedback('Google account disconnected.');
    } catch (e) {
      showFeedback('Failed to disconnect Google account', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncFit() {
    setSyncingFit(true);
    setPreviewLink(null);
    try {
      const res = await syncGoogleFit();
      setStatus((prev) => ({
        ...prev,
        googleAuth: { ...prev.googleAuth, connected: true, lastFitSyncAt: res.syncedAt },
      }));
      showFeedback(`Synced ${res.steps.toLocaleString()} steps and ${res.calories} kcal from Google Fit.`);
      if (onSyncSuccess) onSyncSuccess();
    } catch (e) {
      showFeedback('Failed to sync Google Fit steps', 'error');
    } finally {
      setSyncingFit(false);
    }
  }

  async function handleTestEmailBriefing() {
    setSendingEmail(true);
    setPreviewLink(null);
    try {
      const res = await triggerDailyBriefingEmail();
      showFeedback(`📨 Daily briefing email sent to ${res.recipient}!`);
      if (res.previewUrl) {
        setPreviewLink(res.previewUrl);
      }
    } catch (e) {
      showFeedback('Failed to send daily briefing email', 'error');
    } finally {
      setSendingEmail(false);
    }
  }

  function showFeedback(msg, type = 'success') {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 5000);
  }

  if (loading) {
    return (
      <div className="card text-center py-4 text-gray-400">
        <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1.5 text-primary-500" />
        <p className="text-xs">Loading integration settings...</p>
      </div>
    );
  }

  const isGoogleConnected = status?.googleAuth?.connected;
  const prefs = status?.automationPreferences || {};

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-1.5 bg-primary-50 text-primary-600 rounded-lg">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Automation Agent</h2>
            <p className="text-[11px] text-gray-500">Fit, Calendar and email tools</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setShowPreferences((open) => !open)} className="text-[11px] font-semibold text-primary-700 hover:underline">
            {showPreferences ? 'Done' : 'Manage settings'}
          </button>
          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
            <Zap className="h-3 w-3" /> Active
          </span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
            feedback.type === 'error'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? <AlertCircle className="h-4 w-4 shrink-0" /> : <Check className="h-4 w-4 shrink-0" />}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* 1. Google Fit Card */}
      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="p-1.5 bg-rose-100/70 text-rose-600 rounded-lg">
              <Activity className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-gray-900">Google Fit steps</span>
                {isGoogleConnected ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">Connected</span>
                ) : (
                  <span className="text-[9px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-medium">Not connected</span>
                )}
              </div>
              <p className="text-[11px] leading-4 text-gray-500">
                {status?.googleAuth?.lastFitSyncAt
                  ? `Last synced: ${new Date(status.googleAuth.lastFitSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : 'Auto-syncs live daily steps & calories to health metrics'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSyncFit}
            disabled={syncingFit}
            className="btn-secondary w-full shrink-0 px-2.5 py-1.5 text-[11px] sm:w-auto"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingFit ? 'animate-spin text-primary-600' : ''}`} />
            {syncingFit ? 'Syncing…' : 'Sync Steps Now'}
          </button>
        </div>

        <div className="flex flex-col items-start gap-1.5 pt-1 text-xs sm:flex-row sm:items-center sm:justify-between">
          {showPreferences ? (
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700 font-medium">
              <input
                type="checkbox"
                checked={prefs.autoFitSync ?? true}
                onChange={() => handleTogglePref('autoFitSync')}
                className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
              />
              Auto-sync steps in background
            </label>
          ) : <span className="text-[11px] text-gray-500">{isGoogleConnected ? 'Google Fit is connected' : 'Connect Google Fit to sync steps'}</span>}
          {!isGoogleConnected ? (
            <button type="button" onClick={handleConnectGoogle} className="text-xs font-medium text-primary-600 hover:underline">Connect Google Fit</button>
          ) : (
            <button type="button" onClick={handleDisconnectGoogle} className="text-[10px] text-gray-400 hover:text-gray-600">Disconnect</button>
          )}
        </div>
      </div>

      {/* 2. Google Calendar Card */}
      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100/70 text-blue-600 rounded-lg">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-gray-900">Google Calendar</span>
              <p className="text-[11px] leading-4 text-gray-500">Schedule completed workouts automatically</p>
            </div>
          </div>
        </div>

        {showPreferences && (
          <div className="pt-1 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700 font-medium">
              <input type="checkbox" checked={prefs.autoCalendarSync ?? true} onChange={() => handleTogglePref('autoCalendarSync')} className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
              Automatically sync completed workouts
            </label>
          </div>
        )}
      </div>

      {/* 3. Email Notification Card */}
      <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 space-y-2.5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2">
            <div className="p-1.5 bg-amber-100/70 text-amber-600 rounded-lg">
              <Mail className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-gray-900">Email reports</span>
              <p className="text-[11px] leading-4 text-gray-500">Workout summaries and daily briefings</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTestEmailBriefing}
            disabled={sendingEmail}
            className="btn-secondary w-full shrink-0 px-2.5 py-1.5 text-[11px] sm:w-auto"
          >
            <Mail className="h-3.5 w-3.5 text-amber-600" />
            {sendingEmail ? 'Sending…' : 'Send Test Briefing'}
          </button>
        </div>

        {showPreferences && (
          <div className="space-y-1.5 pt-1 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700 font-medium">
              <input type="checkbox" checked={prefs.emailWorkoutSummary ?? true} onChange={() => handleTogglePref('emailWorkoutSummary')} className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
              Email workout summary on completion
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-700 font-medium">
              <input type="checkbox" checked={prefs.emailDailyBriefing ?? true} onChange={() => handleTogglePref('emailDailyBriefing')} className="rounded text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
              Send morning briefing at 7:00 AM
            </label>
          </div>
        )}

        {previewLink && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs flex items-center justify-between">
            <span className="text-blue-800">Email preview generated (Ethereal test mail):</span>
            <a
              href={previewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              View Email <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
