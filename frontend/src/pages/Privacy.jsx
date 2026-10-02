import React from 'react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-10 text-[#18312c] sm:px-6">
      <article className="mx-auto max-w-3xl rounded-[1.35rem] border border-[#dce8df] bg-white p-6 shadow-sm sm:p-10">
        <Link to="/login" className="text-sm font-semibold text-primary-700">Back to Athletix AI</Link>
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-[#82958d]">Legal</p>
        <h1 className="mt-2 text-3xl font-extrabold">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#647a72]">Last updated: October 2, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-[#46635a]">
          <section><h2 className="font-bold text-[#18312c]">Information we store</h2><p className="mt-1">Athletix AI stores account details, health profile information, workouts, cardio sessions, goals, and metrics that you choose to record.</p></section>
          <section><h2 className="font-bold text-[#18312c]">How we use it</h2><p className="mt-1">Your data is used to show your dashboard, calculate progress, generate grounded coaching responses, and provide requested integrations.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Connected services</h2><p className="mt-1">When you connect Google Fit or another supported service, Athletix AI receives only the permissions you approve. You can disconnect an integration from your profile.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Your choices</h2><p className="mt-1">You can update your profile, disconnect integrations, or request account deletion through the project administrator.</p></section>
          <section><h2 className="font-bold text-[#18312c]">Important note</h2><p className="mt-1">Athletix AI provides general fitness information, not medical diagnosis or treatment.</p></section>
        </div>
      </article>
    </main>
  );
}
