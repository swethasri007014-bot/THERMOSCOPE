import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Map, FolderSearch, LogOut, Satellite } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { to: '/', label: 'Command Center', icon: LayoutDashboard, end: true },
  { to: '/map', label: 'Thermal Map', icon: Map, end: false },
  { to: '/queue', label: 'Investigations', icon: FolderSearch, end: false },
];

export default function Sidebar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/login');
  };

  return (
    <aside className="flex h-full w-60 flex-col bg-[#0F2537] text-white">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#147D7E]">
          <Satellite className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-semibold tracking-wide leading-tight">THERMOSCOPE</h1>
          <p className="text-[10px] text-white/50 tracking-wider uppercase">Thermal Intelligence</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? 'bg-[#147D7E] text-white shadow-lg'
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Signed in as</p>
          <p className="text-sm text-white truncate">{user?.email ?? 'analyst@thermoscope.io'}</p>
          <p className="text-xs text-[#147D7E] mt-0.5">{user?.role ?? 'Analyst'}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
