import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Mail, Lock, ChevronDown, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth, type Role } from '@/context/AuthContext';

const roles: Role[] = [
  'Thermal Intelligence Analyst',
  'Industrial Safety Officer',
  'Administrator',
];

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('analyst@thermoscope.io');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<Role>('Thermal Intelligence Analyst');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    signIn(email, role);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-[#0F2537]">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, #147D7E 0%, transparent 50%), radial-gradient(circle at 80% 70%, #147D7E 0%, transparent 40%)',
        }} />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#147D7E]">
              <Satellite className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-wide">THERMOSCOPE</h1>
              <p className="text-xs text-white/50 tracking-wider uppercase">Thermal Event Intelligence & Forensics</p>
            </div>
          </div>
        </div>

        <div className="relative space-y-6">
          <h2 className="text-3xl font-light text-white leading-tight max-w-md">
            Satellite-detected thermal events,<br />
            <span className="text-[#147D7E] font-normal">investigated with precision.</span>
          </h2>
          <p className="text-white/50 text-sm max-w-sm leading-relaxed">
            A geospatial intelligence platform for classifying thermal anomalies, resolving evidence conflicts, and directing human verification where it matters most.
          </p>
          <div className="flex items-center gap-2 text-white/40 text-xs">
            <ShieldCheck className="h-4 w-4 text-[#147D7E]" />
            <span>SIH 2026 · Problem Statement 26162</span>
          </div>
        </div>

        <div className="relative" />
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center bg-[#EEF3F5] p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200/60 p-8">
            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#147D7E]">
                <Satellite className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-[#0F2537] tracking-wide">THERMOSCOPE</h1>
            </div>

            <h2 className="text-2xl font-semibold text-[#203040] mb-1">Welcome back</h2>
            <p className="text-sm text-gray-500 mb-8">Sign in to the Thermal Intelligence Console.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#203040] mb-1.5 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-[#EEF3F5]/50 pl-10 pr-4 py-2.5 text-sm text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40 focus:border-[#147D7E] transition-all"
                    placeholder="you@thermoscope.io"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#203040] mb-1.5 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-[#EEF3F5]/50 pl-10 pr-4 py-2.5 text-sm text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40 focus:border-[#147D7E] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#203040] mb-1.5 uppercase tracking-wider">Role</label>
                <div className="relative">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full appearance-none rounded-lg border border-gray-200 bg-[#EEF3F5]/50 pl-4 pr-10 py-2.5 text-sm text-[#203040] focus:outline-none focus:ring-2 focus:ring-[#147D7E]/40 focus:border-[#147D7E] transition-all cursor-pointer"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#147D7E] hover:bg-[#126B6C] text-white font-medium text-sm py-2.5 transition-all shadow-lg shadow-[#147D7E]/20"
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <p className="text-center text-xs text-gray-400 mt-6">
              Demo authentication — no credentials needed. Click Sign In to enter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
