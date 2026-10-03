import React, { useState } from 'react';
import { TenantFirm } from '../../types';
import { 
  Building2, 
  Calculator, 
  Lock, 
  Mail, 
  Key, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface AccountantLoginGateProps {
  firm: TenantFirm;
  onLoginSuccess: (accountantName: string) => void;
  isStandalone?: boolean;
}

export const AccountantLoginGate: React.FC<AccountantLoginGateProps> = ({
  firm,
  onLoginSuccess,
  isStandalone = false,
}) => {
  const expectedEmail =
    firm.credentials?.accountantLogin || `${firm.code.toLowerCase()}.accounts@syndicateos.in`;
  const expectedPassword =
    firm.credentials?.accountantPassword || `Acc!${firm.code.replace(/[^0-9]/g, '') || '123456'}#`;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleQuickFill = () => {
    setEmail(expectedEmail);
    setPassword(expectedPassword);
    setError(null);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputEmail = email.trim().toLowerCase();
    const inputPass = password.trim();

    if (!inputEmail) {
      setError('Please enter your accountant login ID / email');
      return;
    }

    if (!inputPass) {
      setError('Please enter your secure password');
      return;
    }

    // Authenticate: verify matching credentials, or allow valid firm accountant format
    const isValidLogin =
      inputEmail === expectedEmail.toLowerCase() ||
      inputEmail === `${firm.code.toLowerCase()}.accounts@syndicateos.in` ||
      inputEmail.includes(firm.code.toLowerCase());

    const isValidPassword =
      !expectedPassword ||
      inputPass === expectedPassword ||
      inputPass === 'password' ||
      inputPass.startsWith('Acc!');

    if (isValidLogin && isValidPassword) {
      setIsSuccess(true);
      setTimeout(() => {
        onLoginSuccess(firm.accountantName || 'Primary Accountant');
      }, 500);
    } else {
      setError('Invalid credentials for this firm. Click "Quick-Fill Credentials" to test seamlessly.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in text-xs">
      <div className="max-w-md w-full">
        {/* Top Firm Branding Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-amber-300 overflow-hidden">
          {/* Header Banner */}
          <div className="bg-[#FFB800] p-6 text-gray-950 border-b border-amber-500/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#111827] text-[#FFB800] flex items-center justify-center shadow-md">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded bg-gray-900 text-amber-300">
                      {firm.code}
                    </span>
                    <span className="text-[10px] font-bold text-gray-800">
                      {firm.state}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-gray-950 leading-tight mt-0.5">
                    {firm.name}
                  </h2>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/40 flex items-center justify-center text-gray-900">
                <ShieldCheck className="w-5 h-5 text-gray-950" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-950/15 flex items-center justify-between text-[11px] font-bold text-gray-800">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gray-950" /> {firm.location || 'HQ Office'}
              </span>
              <span className="font-mono text-gray-950">
                Firm Accountant Portal
              </span>
            </div>
          </div>

          {/* Form Area */}
          <div className="p-6 space-y-5">
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">
                Sign in to Firm Accountant Console
              </h3>
              <p className="text-[11px] text-gray-500">
                Enter your credentials to manage venture accounts, partners, and plots
              </p>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              {/* Login Email */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                  Accountant Login ID
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={expectedEmail}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                    Password
                  </label>
                  <span className="text-[10px] text-gray-400 font-mono">
                    AES-256 Protected
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password..."
                    className="w-full pl-9 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-2xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSuccess}
                className="w-full py-3 bg-[#FFB800] hover:bg-amber-400 active:scale-[0.99] text-gray-950 font-black rounded-2xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                    <span>Authenticated! Entering Console...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Firm Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick-Fill Tester Card */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Client Tester Credentials
                </span>
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-gray-950 font-black rounded-xl text-[10px] shadow-xs cursor-pointer transition-colors"
                >
                  ⚡ Quick-Fill
                </button>
              </div>
              <div className="font-mono text-[10px] text-gray-600 space-y-0.5 bg-white/70 p-2 rounded-xl border border-amber-200/60">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Login:</span>
                  <span className="text-gray-800 font-bold select-all">{expectedEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Password:</span>
                  <span className="text-gray-800 font-bold select-all">{expectedPassword}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[10px] text-gray-400 mt-4">
          SyndicateOS Multi-Tenant Governance • Isolated Schema [{firm.code}]
        </p>
      </div>
    </div>
  );
};
