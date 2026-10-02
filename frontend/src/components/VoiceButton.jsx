import React, { useState, useCallback } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { sendVoiceTranscript } from '../api/ai';

// Uses the browser's built-in SpeechRecognition/SpeechSynthesis APIs for
// STT/TTS on the client, then sends the transcript through the same
// intent-detection pipeline as text chat. Gracefully degrades if the
// browser doesn't support the Web Speech API.
export default function VoiceButton({ onResponse }) {
  const [listening, setListening] = useState(false);
  const [processing, setProcessing] = useState(false);
  const supported = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }, []);

  const handleClick = useCallback(() => {
    if (!supported) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setProcessing(true);
      try {
        const data = await sendVoiceTranscript(transcript);
        onResponse?.({ transcript, ...data });
        speak(data.response);
      } catch {
        speak('Kuch gadbad ho gayi.');
      } finally {
        setProcessing(false);
      }
    };

    recognition.start();
  }, [supported, onResponse, speak]);

  if (!supported) {
    return <p className="text-xs text-gray-400">Voice input is not supported in this browser. Use text chat instead.</p>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={processing}
      className={`flex h-14 w-14 items-center justify-center rounded-full shadow-md transition-colors ${
        listening ? 'bg-accent-500 text-white' : 'bg-primary-600 text-white'
      }`}
      aria-label="Talk to coach"
    >
      {processing ? <Loader2 size={22} className="animate-spin" /> : listening ? <MicOff size={22} /> : <Mic size={22} />}
    </button>
  );
}
