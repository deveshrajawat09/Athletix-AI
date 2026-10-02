import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Dumbbell, Activity, HeartPulse, Sparkles, User, CalendarDays } from 'lucide-react';

const items = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/workout', label: 'Workout', icon: Dumbbell },
  { to: '/cardio', label: 'Cardio', icon: Activity },
  { to: '/health', label: 'Health', icon: HeartPulse },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/coach', label: 'AI Coach', icon: Sparkles, isAi: true },
  { to: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-3 pt-1 md:hidden pointer-events-none">
      <div className="mx-auto max-w-md bg-[#18312c]/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-xl shadow-[#18312c]/20 pointer-events-auto px-2 py-1.5">
        <ul className="flex justify-around items-center">
          {items.map(({ to, label, icon: Icon, end, isAi }) => (
            <li key={to} className="flex-1 text-center">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `relative flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 ${
                    isActive
                      ? isAi
                        ? 'text-[#f6b69a] font-bold'
                        : 'text-[#72c9ae] font-bold'
                      : 'text-[#a1b9ae] hover:text-white font-medium'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`p-1.5 rounded-xl transition-all ${
                        isActive
                          ? isAi
                            ? isAi
                              ? 'bg-[#f2a47f] text-white shadow-sm'
                              : 'bg-[#2c9d82] text-white'
                            : ''
                          : ''
                      }`}
                    >
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight">{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
