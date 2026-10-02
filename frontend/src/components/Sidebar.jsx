import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Dumbbell,
  HeartPulse,
  Activity,
  History,
  CalendarDays,
  Sparkles,
  User,
  Target,
  Zap,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const items = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/workout', label: 'Workouts & PRs', icon: Dumbbell },
  { to: '/cardio', label: 'Cardio Tracker', icon: Activity },
  { to: '/health', label: 'Health Metrics', icon: HeartPulse },
  { to: '/history', label: 'Activity History', icon: History },
  { to: '/calendar', label: 'Training Calendar', icon: CalendarDays },
  { to: '/goals', label: 'Fitness Goals', icon: Target },
  { to: '/coach', label: 'AI Voice Coach', icon: Sparkles, badge: 'AI' },
  { to: '/profile', label: 'Profile & Agent', icon: User },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:border-[#dce8df] md:bg-[#f7f5ef] md:h-screen md:sticky md:top-0 md:p-4 z-20">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-2 py-2 mb-6">
        <div className="h-10 w-10 rounded-2xl bg-[#2c9d82] text-white flex items-center justify-center font-black shadow-md shadow-[#2c9d82]/20">
          <Zap className="h-5 w-5 fill-white" />
        </div>
        <div>
          <p className="text-lg font-black tracking-tight text-slate-900 leading-none">
            Athletix<span className="text-[#2c9d82]">AI</span>
          </p>
          <p className="text-[11px] font-medium text-[#82958d] mt-1">Smart Athletic OS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
        {items.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-[#e3f2e6] text-[#287861] shadow-2xs font-bold border-l-4 border-[#2c9d82]'
                  : 'text-[#647a72] hover:bg-white hover:text-[#18312c]'
              }`
            }
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className="shrink-0" />
              <span>{label}</span>
            </div>
            {badge && (
                <span className="text-[10px] bg-[#f2a47f] text-white font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                {badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Profile & Logout */}
      {user && (
        <div className="pt-4 border-t border-[#dce8df] mt-auto space-y-2">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/70 border border-[#dce8df]">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-[#dff1e5] text-[#287861] flex items-center justify-center font-bold text-xs shrink-0">
                {user.name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
