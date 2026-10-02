import React, { useState } from 'react';
import AIChat from '../components/AIChat';
import VoiceButton from '../components/VoiceButton';
import DailyBriefingCard from '../components/DailyBriefingCard';

export default function AICoach() {
  const [lastVoiceResponse, setLastVoiceResponse] = useState(null);

  return (
    <div className="space-y-4 pb-24">
      <div>
        <h1 className="text-xl font-bold text-gray-900">AI Coach</h1>
        <p className="text-sm text-gray-400">Connected to your actual workout, cardio, and health data.</p>
      </div>

      <DailyBriefingCard />

      <AIChat />

      <div className="flex flex-col items-center gap-2 pt-2">
        <VoiceButton onResponse={setLastVoiceResponse} />
        <p className="text-xs text-gray-400">Tap to talk to your coach</p>
        {lastVoiceResponse && (
          <p className="max-w-sm text-center text-sm text-gray-600">"{lastVoiceResponse.response}"</p>
        )}
      </div>
    </div>
  );
}
