import React, { useState } from 'react';
import {
  ShieldAlert,
  Building2,
  Smartphone,
  Calculator,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  HelpCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { AuthenticatedAppUser } from '../../types';

interface ProductionAuthGateProps {
  onLoginSuccess: (user: AuthenticatedAppUser) => void;
  availableFirmsCount?: number;
}

type AuthStep = 'welcome' | 'firm_code' | 'member_login' | 'super_admin_login' | 'set_pin';

export const ProductionAuthGate: React.FC<ProductionAuthGateProps> = ({
  onLoginSuccess,
  availableFirmsCount = 1,
}) => {
  const [step, setStep] = useState<AuthStep>('welcome');
  
  // Firm Code step state
  const [firmCodeInput, setFirmCodeInput] = useState('SC-AP');
  const [verifyingFirm, setVerifyingFirm] = useState(false);
  const [verifiedFirm, setVerifiedFirm] = useState<{
    id: string;
    name: string;
    code: string;
    location: string;
    state: string;
  } | null>(null);
  const [firmCodeError, setFirmCodeError] = useState('');

  // Member Login state
  const [memberPhone, setMemberPhone] = useState('');
  const [memberPin, setMemberPin] = useState('');
  const [memberLoading, setMemberLoading] = useState(false);
  const [memberError, setMemberError] = useState('');

  // Super Admin Login state
  const [adminPhone, setAdminPhone] = useState('9550247162');
  const [adminPin, setAdminPin] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  // Set PIN state (First-time login)
  const [pendingUser, setPendingUser] = useState<AuthenticatedAppUser | null>(null);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeLoading, setPinChangeLoading] = useState(false);
  const [pinChangeError, setPinChangeError] = useState('');

  // Helper toggle
  const [showQuickRef, setShowQuickRef] = useState(true);

  // Validate Firm Code
  const handleVerifyFirmCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFirmCodeError('');
    const code = firmCodeInput.trim().toUpperCase();
    if (!code) {
      setFirmCodeError('Please enter a valid Firm Code (e.g. SC-AP).');
      return;
    }

    setVerifyingFirm(true);
    try {
      const res = await fetch(`/api/auth/validate-firm/${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.valid && data.firm) {
        setVerifiedFirm(data.firm);
        setStep('member_login');
      } else {
        setVerifiedFirm(null);
        setFirmCodeError(data.error || `Firm Code "${code}" not found. Verify with your Super Admin.`);
      }
    } catch {
      setFirmCodeError('Network error connecting to live Cloud SQL database. Please try again.');
    } finally {
      setVerifyingFirm(false);
    }
  };

  // Submit Member Login (Accountant / Partner / Managing Partner)
  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberError('');

    const cleanPhone = memberPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setMemberError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!memberPin || memberPin.length !== 4) {
      setMemberError('Please enter your 4-digit security PIN (default: 9999).');
      return;
    }

    setMemberLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          pin: memberPin.trim(),
          firmCode: verifiedFirm?.code,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.user.mustChangePin) {
          setPendingUser(data.user);
          setStep('set_pin');
        } else {
          onLoginSuccess(data.user);
        }
      } else {
        setMemberError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setMemberError('Server error while authenticating. Please try again.');
    } finally {
      setMemberLoading(false);
    }
  };

  // Submit Super Admin Login
  const handleSuperAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');

    const cleanPhone = adminPhone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAdminError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!adminPin || adminPin.length !== 4) {
      setAdminError('Please enter your 4-digit security PIN (default: 9999).');
      return;
    }

    setAdminLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          pin: adminPin.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.user) {
        if (data.user.mustChangePin) {
          setPendingUser(data.user);
          setStep('set_pin');
        } else {
          onLoginSuccess(data.user);
        }
      } else {
        setAdminError(data.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setAdminError('Server error while authenticating. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  };

  // Submit PIN Change (Mandatory for first-time login)
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError('');

    if (!pendingUser) return;

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinChangeError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (newPin === '9999') {
      setPinChangeError('Please choose a personal PIN different from default 9999.');
      return;
    }

    if (newPin !== confirmPin) {
      setPinChangeError('PIN confirmation does not match. Please re-enter.');
      return;
    }

    setPinChangeLoading(true);
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: pendingUser.phone,
          newPin: newPin.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onLoginSuccess({
          ...pendingUser,
          mustChangePin: false,
        });
      } else {
        setPinChangeError(data.error || 'Failed to update PIN. Please try again.');
      }
    } catch {
      setPinChangeError('Connection error while updating PIN. Please try again.');
    } finally {
      setPinChangeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950 text-gray-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Brand Bar */}
      <div className="max-w-5xl w-full mx-auto flex items-center justify-between py-2 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FFB800] text-gray-950 font-black text-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
            S<span className="text-gray-800">OS</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                Syndicate<span className="text-[#FFB800]">OS</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-400/20 text-[#FFB800] border border-amber-400/30">
                Live Cloud SQL
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Enterprise Multi-Tenant Real Estate & Venture Syndicate Core
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 bg-emerald-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-full text-xs text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold">PostgreSQL Relational DB Connected</span>
        </div>
      </div>

      {/* Main Form Centerpiece */}
      <div className="max-w-xl w-full mx-auto my-auto py-8">
        {/* STEP 1: WELCOME SCREEN */}
        {step === 'welcome' && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FFB800] text-gray-950 shadow-md">
                <Lock className="w-3.5 h-3.5" />
                Production Security Gate
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Syndicate Portal Access
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-md mx-auto leading-relaxed">
                Direct phone number authentication with 4-digit security PIN. No external links or tokens required.
              </p>
            </div>

            {/* Portal Option Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {/* Option 1: Firm Portal */}
              <button
                type="button"
                onClick={() => setStep('firm_code')}
                className="group relative bg-gradient-to-b from-slate-800/90 to-slate-800/50 hover:from-amber-950/60 hover:to-amber-900/40 border border-white/10 hover:border-[#FFB800] p-5 rounded-2xl text-left transition-all shadow-md hover:shadow-amber-500/10 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/20 text-[#FFB800] flex items-center justify-center border border-amber-400/30 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white group-hover:text-[#FFB800] transition-colors">
                      Firm Member Portal
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      For Field Partners, Firm Accountants & Managing Partners. Access via unique <strong>Firm Code</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-[#FFB800]">
                  <span>Enter Firm Code</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Option 2: Super Admin Console */}
              <button
                type="button"
                onClick={() => setStep('super_admin_login')}
                className="group relative bg-gradient-to-b from-slate-800/90 to-slate-800/50 hover:from-slate-800 hover:to-slate-700/60 border border-white/10 hover:border-amber-400/60 p-5 rounded-2xl text-left transition-all shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 group-hover:scale-105 transition-transform">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                      Super Admin Console
                    </h2>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Platform Owner governance for tenant provisioning, SaaS settings & sectors. Phone: <strong>9550247162</strong>.
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-bold text-indigo-300">
                  <span>Sign In as Admin</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIRM CODE VALIDATION */}
        {step === 'firm_code' && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Welcome</span>
              </button>
              <span className="text-xs font-bold text-amber-400">Step 1 of 2</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Enter Your Firm Code</h2>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Each syndicate operates under an isolated Firm Code (e.g. <code className="text-[#FFB800] font-bold">SC-AP</code>) registered by the Super Admin.
              </p>
            </div>

            <form onSubmit={handleVerifyFirmCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Firm Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={firmCodeInput}
                    onChange={(e) => {
                      setFirmCodeInput(e.target.value.toUpperCase());
                      setFirmCodeError('');
                    }}
                    placeholder="e.g. SC-AP"
                    className="w-full bg-slate-950 border border-white/20 focus:border-[#FFB800] rounded-2xl px-4 py-3 text-lg font-mono font-black text-white uppercase placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/20 tracking-wider"
                    autoFocus
                  />
                  {verifiedFirm && (
                    <div className="absolute right-3.5 top-3.5 text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </div>

              {firmCodeError && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{firmCodeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingFirm || !firmCodeInput.trim()}
                className="w-full bg-[#FFB800] hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-black rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {verifyingFirm ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-gray-950 border-t-transparent animate-spin"></span>
                    <span>Verifying Code in Cloud Database...</span>
                  </span>
                ) : (
                  <>
                    <span>Verify Firm & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 3: MEMBER MOBILE NUMBER & PIN */}
        {step === 'member_login' && verifiedFirm && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('firm_code')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Change Firm Code</span>
              </button>
              <span className="text-xs font-bold text-amber-400">Step 2 of 2</span>
            </div>

            {/* Verified Firm Banner */}
            <div className="bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFB800] text-gray-950 flex items-center justify-center font-black shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300">
                    Verified Firm Registry
                  </div>
                  <h3 className="text-sm font-black text-white">{verifiedFirm.name}</h3>
                  <div className="text-xs text-gray-400">
                    Code: <strong className="text-white">{verifiedFirm.code}</strong> • {verifiedFirm.location}
                  </div>
                </div>
              </div>
              <div className="text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Sign In with Mobile & PIN</h2>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Enter your enrolled 10-digit mobile number and 4-digit security PIN.
              </p>
            </div>

            <form onSubmit={handleMemberLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Mobile Number (User ID)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xs font-bold text-gray-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={memberPhone}
                    onChange={(e) => {
                      setMemberPhone(e.target.value);
                      setMemberError('');
                    }}
                    placeholder="9848011111"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-white/20 focus:border-[#FFB800] rounded-2xl pl-13 pr-4 py-3 text-base font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/20 tracking-wider"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    4-Digit Security PIN
                  </label>
                  <span className="text-[11px] text-amber-400/90 font-medium">
                    Default PIN: <strong className="text-white">9999</strong>
                  </span>
                </div>
                <input
                  type="password"
                  value={memberPin}
                  onChange={(e) => {
                    setMemberPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setMemberError('');
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-white/20 focus:border-[#FFB800] rounded-2xl px-4 py-3 text-xl font-mono text-center tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/20"
                />
              </div>

              {memberError && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{memberError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={memberLoading || memberPhone.length < 10 || memberPin.length < 4}
                className="w-full bg-[#FFB800] hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-black rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {memberLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-gray-950 border-t-transparent animate-spin"></span>
                    <span>Validating User with PostgreSQL...</span>
                  </span>
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 4: SUPER ADMIN LOGIN */}
        {step === 'super_admin_login' && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Welcome</span>
              </button>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Root Governance
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">Super Admin Console</h2>
              <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                Authorized for Platform Owner. Enter your registered mobile number and security PIN.
              </p>
            </div>

            <form onSubmit={handleSuperAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Mobile Number (Owner ID)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-xs font-bold text-gray-500 font-mono">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => {
                      setAdminPhone(e.target.value);
                      setAdminError('');
                    }}
                    placeholder="9550247162"
                    maxLength={10}
                    className="w-full bg-slate-950 border border-white/20 focus:border-indigo-400 rounded-2xl pl-13 pr-4 py-3 text-base font-mono font-bold text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/20 tracking-wider"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    4-Digit Security PIN
                  </label>
                  <span className="text-[11px] text-indigo-300 font-medium">
                    Default PIN: <strong className="text-white">9999</strong>
                  </span>
                </div>
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => {
                    setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setAdminError('');
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-white/20 focus:border-indigo-400 rounded-2xl px-4 py-3 text-xl font-mono text-center tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400/20"
                />
              </div>

              {adminError && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{adminError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={adminLoading || adminPhone.length < 10 || adminPin.length < 4}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                {adminLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                    <span>Authorizing Root Console...</span>
                  </span>
                ) : (
                  <>
                    <span>Enter Super Admin Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* STEP 5: MANDATORY SET PIN (First login) */}
        {step === 'set_pin' && pendingUser && (
          <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-400/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#FFB800] text-gray-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-white">
                Set Your Personal 4-Digit PIN
              </h2>
              <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                Welcome, <strong className="text-[#FFB800]">{pendingUser.name}</strong>! Because this is your initial login with default PIN 9999, please establish your confidential 4-digit PIN to secure your dashboard.
              </p>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  New 4-Digit Security PIN
                </label>
                <input
                  type="password"
                  value={newPin}
                  onChange={(e) => {
                    setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinChangeError('');
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-white/20 focus:border-[#FFB800] rounded-2xl px-4 py-3 text-xl font-mono text-center tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5 uppercase tracking-wider">
                  Confirm 4-Digit PIN
                </label>
                <input
                  type="password"
                  value={confirmPin}
                  onChange={(e) => {
                    setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4));
                    setPinChangeError('');
                  }}
                  placeholder="••••"
                  maxLength={4}
                  className="w-full bg-slate-950 border border-white/20 focus:border-[#FFB800] rounded-2xl px-4 py-3 text-xl font-mono text-center tracking-widest text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#FFB800]/20"
                />
              </div>

              {pinChangeError && (
                <div className="p-3 bg-red-950/80 border border-red-500/40 rounded-2xl text-xs text-red-200 flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={pinChangeLoading || newPin.length < 4 || confirmPin.length < 4}
                className="w-full bg-[#FFB800] hover:bg-amber-400 disabled:opacity-50 text-gray-950 font-black rounded-2xl py-3.5 text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                {pinChangeLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-gray-950 border-t-transparent animate-spin"></span>
                    <span>Saving Secure PIN in Database...</span>
                  </span>
                ) : (
                  <>
                    <span>Confirm PIN & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Registered User Quick Reference Drawer */}
      <div className="max-w-4xl w-full mx-auto bg-slate-900/60 border border-white/10 rounded-2xl p-4 text-xs">
        <button
          type="button"
          onClick={() => setShowQuickRef(!showQuickRef)}
          className="w-full flex items-center justify-between text-gray-300 hover:text-white font-bold"
        >
          <span className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-[#FFB800]" />
            <span>Registered Testing Profiles (Direct Mobile & Default PIN: 9999)</span>
          </span>
          {showQuickRef ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showQuickRef && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/10">
            {/* Super Admin */}
            <div 
              onClick={() => {
                setStep('super_admin_login');
                setAdminPhone('9550247162');
                setAdminPin('9999');
              }}
              className="bg-slate-950/80 p-3 rounded-xl border border-white/5 hover:border-indigo-400 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-300">Super Admin</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 rounded font-mono">Owner</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-bold">9550247162</div>
              <div className="text-[11px] text-gray-400">PIN: 9999 • All Tenants</div>
            </div>

            {/* Firm Accountant */}
            <div 
              onClick={() => {
                setFirmCodeInput('SC-AP');
                setVerifiedFirm({
                  id: 'firm-1791025604395',
                  name: 'Sri Chakra Associates',
                  code: 'SC-AP',
                  location: 'Amaravati / CRDA',
                  state: 'Andhra Pradesh'
                });
                setMemberPhone('9440156789');
                setMemberPin('9999');
                setStep('member_login');
              }}
              className="bg-slate-950/80 p-3 rounded-xl border border-white/5 hover:border-[#FFB800] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#FFB800]">Firm Accountant</span>
                <span className="text-[10px] bg-amber-400/20 text-[#FFB800] px-1.5 py-0.2 rounded font-mono">SC-AP</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-bold">9440156789</div>
              <div className="text-[11px] text-gray-400">PIN: 9999 • K. S. Narayana</div>
            </div>

            {/* Field Partner */}
            <div 
              onClick={() => {
                setFirmCodeInput('SC-AP');
                setVerifiedFirm({
                  id: 'firm-1791025604395',
                  name: 'Sri Chakra Associates',
                  code: 'SC-AP',
                  location: 'Amaravati / CRDA',
                  state: 'Andhra Pradesh'
                });
                setMemberPhone('9848011111');
                setMemberPin('9999');
                setStep('member_login');
              }}
              className="bg-slate-950/80 p-3 rounded-xl border border-white/5 hover:border-emerald-400 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300">Field Partner</span>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.2 rounded font-mono">SC-AP</span>
              </div>
              <div className="mt-1 font-mono text-white text-xs font-bold">9848011111</div>
              <div className="text-[11px] text-gray-400">PIN: 9999 • Partner: srini</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
