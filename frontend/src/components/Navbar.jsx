import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Zap, User, Sparkles } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="flex items-center justify-between border-b border-[#dce8df] bg-[#f7f5ef]/90 backdrop-blur-md px-4 py-3 md:hidden sticky top-0 z-30">
      {/* Brand & Logo */}
      <NavLink to="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-xl bg-[#2c9d82] text-white flex items-center justify-center font-black text-base shadow-sm">
          <Zap className="h-4 w-4 fill-white" />
        </div>
        <div>
          <span className="text-base font-extrabold tracking-tight text-slate-900">
            Athletix<span className="text-[#2c9d82]">AI</span>
          </span>
          <p className="text-[10px] font-medium text-[#82958d] -mt-0.5">{todayStr}</p>
        </div>
      </NavLink>

      {/* Action Chips */}
      {user && (
        <div className="flex items-center gap-1.5">
          <NavLink
            to="/coach"
            className={({ isActive }) =>
              `flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#2c9d82] text-white shadow-xs'
                  : 'bg-[#e3f2e6] text-[#287861] hover:bg-[#d7eddd]'
              }`
            }
          >
            <Sparkles size={13} />
            <span className="hidden xs:inline">Coach</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `p-2 rounded-xl text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-white text-[#18312c] border border-[#dce8df]'
                  : 'text-[#647a72] hover:bg-white'
              }`
            }
            title="Profile"
          >
            <User size={16} />
          </NavLink>

          <button
            onClick={logout}
            className="p-2 text-[#82958d] hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      )}
    </header>
  );
}
