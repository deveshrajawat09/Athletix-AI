import React, { useState } from 'react';
import { Sunrise, Sunset, Sparkles, Loader2 } from 'lucide-react';
import { getDailyBriefing } from '../api/ai';

// Fetches a morning or evening briefing on demand. The text is generated
// server-side from real stored data (see ai-service/main.py daily_briefing)
// This component displays server-generated text and never invents copy.
export default function DailyBriefingCard() {
  const [briefing, setBriefing] = useState(null);
  const [loadingType, setLoadingType] = useState(null);

  async function fetchBriefing(type) {
    setLoadingType(type);
    try {
      const data = await getDailyBriefing(type);
      setBriefing({ type, text: data.response });
    } catch {
      setBriefing({ type, text: 'Briefing load nahi ho paayi. Dobara try karo.' });
    } finally {
      setLoadingType(null);
    }
  }

  return (
    <div className="card">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={16} className="text-primary-600" />
        <p className="text-sm font-semibold text-gray-700">Daily Briefing</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => fetchBriefing('morning')}
          disabled={loadingType !== null}
          className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm"
        >
          {loadingType === 'morning' ? <Loader2 size={15} className="animate-spin" /> : <Sunrise size={15} />}
          Morning
        </button>
        <button
          onClick={() => fetchBriefing('evening')}
          disabled={loadingType !== null}
          className="btn-secondary flex flex-1 items-center justify-center gap-1.5 text-sm"
        >
          {loadingType === 'evening' ? <Loader2 size={15} className="animate-spin" /> : <Sunset size={15} />}
          Evening
        </button>
      </div>
      {briefing && (
        <div className="mt-3 rounded-xl bg-primary-50/60 px-3.5 py-3 text-sm text-gray-700">
          {briefing.text}
        </div>
      )}
    </div>
  );
}
