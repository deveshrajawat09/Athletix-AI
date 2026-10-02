import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, CornerDownLeft } from 'lucide-react';
import { sendChatMessage } from '../api/ai';

const SUGGESTIONS = [
  'Aaj ka plan kya hai?',
  'Kal maine kya kiya tha?',
  'Mera progress kaisa hai?',
  'Save 5km running',
  'Bench press 80kg x 6 reps save karo',
];

export default function AIChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! Main tumhara Athletix AI coach hoon. Main tumhare actual logged data ke basis par plan aur progress mein help kar sakta hoon.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || sending) return;

    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setSending(true);

    try {
      const data = await sendChatMessage(text);
      setMessages((m) => [...m, { role: 'assistant', text: data.response }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: 'Kuch gadbad ho gayi. Dobara try karo.' }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex h-[72vh] flex-col rounded-2xl border border-surface-border bg-white shadow-sm overflow-hidden">
      {/* Messages Feed */}
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-xs'
                  : 'bg-surface-muted text-gray-800 border border-surface-border/50 rounded-bl-xs'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-primary-600">
                  <Sparkles size={12} /> Coach
                </div>
              )}
              {m.text}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface-muted px-3.5 py-2 text-xs text-gray-400 animate-pulse flex items-center gap-1.5">
              <Sparkles size={12} className="text-primary-500" /> Coach is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Suggested Quick Prompts */}
      <div className="border-t border-surface-border bg-surface-muted/30 px-3 py-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[11px] font-medium text-gray-400 whitespace-nowrap">Suggested:</span>
          {SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              type="button"
              disabled={sending}
              onClick={() => handleSend(s)}
              className="rounded-lg border border-surface-border bg-white px-3 py-1.5 text-gray-600 hover:border-primary-300 hover:text-primary-700 whitespace-nowrap transition-colors shadow-2xs"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 border-t border-surface-border p-3 bg-white"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Aaj kya plan hai? ya 5km running save karo..."
          className="input-field flex-1 text-sm py-2"
          disabled={sending}
        />
        <button
          type="submit"
          className="btn-primary px-3.5 py-2 flex items-center justify-center gap-1"
          disabled={sending || !input.trim()}
          aria-label="Send"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
