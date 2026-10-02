import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f7f5ef] md:flex antialiased selection:bg-[#2c9d82] selection:text-white">
      {/* Desktop & Tablet Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Navbar */}
        <Navbar />

        {/* Dynamic Responsive Page Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-7 md:py-9 pb-28 md:pb-12">
          <Outlet />
        </main>

        {/* Mobile Floating Bottom Dock */}
        <BottomNav />
      </div>
    </div>
  );
}
