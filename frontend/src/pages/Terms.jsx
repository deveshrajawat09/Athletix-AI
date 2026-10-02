import React from 'react';
import { Link } from 'react-router-dom';

export default function Terms() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#18312c] sm:px-6">
      <article className="mx-auto max-w-3xl rounded-[1.35rem] border border-[#dce8df] bg-white p-6 shadow-sm sm:p-10">
        <Link to="/login" className="text-sm font-semibold text-primary-700">Back to Athletix AI</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#82958d]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold">Terms of Service</h1>
        <p className="mt-2 text-sm text-[#647a72]">Last updated: October 2, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-[#46635a]">
          <section><h2 className="font-bold text-[#18312c]">Using Athletix AI</h2><p className="mt-1">Use the service for personal fitness tracking. Keep your login credentials private and provide accurate information when you create an account.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Fitness guidance</h2><p className="mt-1">Coaching, predictions, and metrics are informational. They do not replace advice from a qualified healthcare professional.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Your content</h2><p className="mt-1">You retain responsibility for the health and workout information you enter or connect from another service.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Integrations</h2><p className="mt-1">Connected services may have their own terms and privacy policies. You can revoke access from the connected provider or your Athletix profile.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Service changes</h2><p className="mt-1">Features may change as the product develops. We will keep these terms updated when material changes are made.</p></section>
        </div>
      </article>
    </main>
  );
}
