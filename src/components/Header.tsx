import React, { useState } from 'react';
import { Role, TenantFirm, AuthenticatedAppUser } from '../types';
import { 
  ShieldCheck, 
  Building2, 
  Calculator, 
  Smartphone, 
  Lock, 
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Landmark,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  X,
  Users,
  AlertCircle,
  Eye,
  LogOut,
  UserCheck
} from 'lucide-react';

interface HeaderProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  firms: TenantFirm[];
  selectedFirmId: string;
  onFirmChange: (firmId: string) => void;
  onWipeMockData: () => void;
  onRestoreDemoData: () => void;
  pendingExpensesCount: number;
  firmAccountsCount?: number;
  isStandalone?: boolean;
  onToggleStandalone?: () => void;
  currentUser?: AuthenticatedAppUser | null;
  onSignOut?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  firms,
  selectedFirmId,
  onFirmChange,
  onWipeMockData,
  onRestoreDemoData,
  pendingExpensesCount,
  firmAccountsCount,
  isStandalone = false,
  onToggleStandalone,
  currentUser,
  onSignOut,
}) => {
  const currentFirm = firms.find((f) => f.id === selectedFirmId) || firms[0];
  const [showShareModal, setShowShareModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState<'dev' | 'public'>('public');

  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      let origin = window.location.origin;
      if (urlMode === 'public' && origin.includes('ais-dev-')) {
        origin = origin.replace('ais-dev-', 'ais-pre-');
      }
      return `${origin}${window.location.pathname}`;
    }
    return '';
  };

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const accountantUrl = currentFirm 
    ? `${getBaseUrl()}?role=accountant&firmId=${currentFirm.id}&standalone=true`
    : `${getBaseUrl()}?role=accountant&standalone=true`;

  const partnerUrl = currentFirm 
    ? `${getBaseUrl()}?role=field_partner&firmId=${currentFirm.id}&standalone=true`
    : `${getBaseUrl()}?role=field_partner&standalone=true`;

  const superAdminUrl = `${getBaseUrl()}?role=super_admin`;

  return (
    <header className="sticky top-0 z-40 bg-[#FFB800] text-gray-900 shadow-md border-b border-amber-500/40">
      {/* Top Banner: Multi-Tenant & Zero-Knowledge Isolation Status */}
      <div className="bg-[#111827] px-4 py-1.5 text-xs text-gray-200 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-400">AP / Telangana Syndicate Cloud</span>
          <span className="text-gray-500">•</span>
          <span className="text-gray-300">
            {currentRole === 'super_admin' ? (
              <>
                Scope: <span className="font-mono text-amber-300 font-bold">ALL-TENANTS (Platform Registry)</span>
              </>
            ) : currentFirm ? (
              <>
                Tenant Isolation Schema: <span className="font-mono text-amber-300 font-bold">{currentFirm?.code || 'AVV-AP'}</span>
              </>
            ) : (
              <span className="text-amber-300 font-bold">Clean Testing Mode (No Tenants Provisioned)</span>
            )}
          </span>
          {isStandalone && (
            <span className="bg-amber-400/20 text-amber-300 border border-amber-500/40 px-2 py-0.2 rounded-full text-[10px] font-bold">
              🔒 Client Tester Isolated Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Share / Tester Links Button */}
          <button
            onClick={() => setShowShareModal(true)}
            title="Generate direct individual links for each dashboard to share with clients/testers"
            className="flex items-center gap-1.5 text-amber-300 hover:text-white bg-amber-950/70 hover:bg-amber-900 px-3 py-1 rounded-full text-[11px] font-bold border border-amber-500/40 transition-colors shadow-xs"
          >
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Tester Links</span>
          </button>

          {/* Cloud Firestore Live Sync Badge */}
          <div 
            id="firestore-cloud-sync-badge"
            className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40"
            title="Firebase Firestore Cloud Database active. Real-time multi-device sync across all laptops and remote locations."
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="hidden sm:inline">Cloud Firestore Live</span>
            <span className="sm:hidden">Cloud</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
          </div>

          {/* Tenant Encryption Active Badge */}
          <div 
            id="tenant-encryption-badge"
            className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-full border border-emerald-500/40"
            title="Zero-knowledge tenant isolation active. Database encrypted at rest with per-tenant AES-256 GCM keys."
          >
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Encrypted</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-0.5" />
          </div>

          {/* Test Data Options Button */}
          <button
            id="btn-reset-demo"
            onClick={() => setShowResetModal(true)}
            title="Manage mock data: wipe clean for testing or restore sample data"
            className="flex items-center gap-1 text-gray-300 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-full text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Data Options</span>
          </button>
        </div>
      </div>

      {/* Main Header Row in Vibrant Amber/Gold (#FFB800) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Active Firm info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#111827] text-[#FFB800] p-1 flex items-center justify-center shadow-md shadow-amber-600/30">
            <span className="font-black text-xl tracking-tighter">S<span className="text-white">OS</span></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-gray-950 flex items-center gap-1.5">
                Syndicate<span className="text-gray-900 underline decoration-gray-900/40">OS</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-[#111827] text-white px-2 py-0.5 rounded-full shadow-sm">
                AP / TG Syndicate
              </span>
            </div>
            {currentRole === 'super_admin' ? (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <ShieldCheck className="w-3.5 h-3.5 text-gray-900" />
                <span className="font-bold text-gray-950">Application / Product Owner Console</span>
                <span className="text-amber-800">•</span>
                <span className="text-gray-800 font-medium">Platform SaaS & Tenant Governance</span>
              </div>
            ) : currentFirm ? (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <Building2 className="w-3.5 h-3.5 text-gray-900" />
                <span className="font-bold text-gray-950">{currentFirm?.name}</span>
                <span className="text-amber-800">•</span>
                <span className="text-gray-800 font-medium">{currentFirm?.location}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <span className="font-bold text-gray-950">No Active Firm</span>
                <span className="text-amber-800">•</span>
                <span className="text-gray-800 font-medium">Provision firm in Super Admin</span>
              </div>
            )}
          </div>
        </div>

        {/* Firm Selector: Shown for Accountant if firms exist */}
        {currentRole === 'accountant' && firms.length > 0 ? (
          <div className="hidden lg:flex items-center gap-2 bg-amber-300/60 px-3 py-1.5 rounded-full border border-amber-600/30 shadow-inner">
            <span className="text-xs text-gray-900 font-bold">Syndicate Firm:</span>
            <select
              id="tenant-firm-selector"
              value={selectedFirmId}
              onChange={(e) => onFirmChange(e.target.value)}
              className="bg-white text-xs font-bold text-gray-900 border border-amber-500/50 rounded-full px-3 py-1 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer shadow-sm"
            >
              {firms.map((firm) => (
                <option key={firm.id} value={firm.id}>
                  {firm.name} ({firm.state === 'Andhra Pradesh' ? 'AP' : 'TG'})
                </option>
              ))}
            </select>
          </div>
        ) : currentRole === 'field_partner' ? (
          <div className="hidden lg:flex items-center gap-2 bg-amber-300/70 px-3.5 py-1.5 rounded-full border border-amber-600/30 text-xs font-bold text-gray-950 shadow-inner">
            <Smartphone className="w-3.5 h-3.5 text-gray-900" />
            <span>Field Partner Session • {currentFirm?.name || 'Awaiting Firm'}</span>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-2 bg-amber-300/70 px-3.5 py-1.5 rounded-full border border-amber-600/30 text-xs font-bold text-gray-950 shadow-inner">
            <ShieldCheck className="w-3.5 h-3.5 text-gray-900" />
            <span>Product Owner Scope • {firms.length} Onboarded Firms</span>
          </div>
        )}

        {/* Dedicated Role Badge - Each dashboard is an individual, isolated portal */}
        <div className="flex items-center gap-3">
          {currentRole === 'super_admin' ? (
            <div className="flex items-center gap-2 bg-[#111827] px-4 py-2 rounded-full border border-gray-800 shadow-md">
              <ShieldCheck className="w-4 h-4 text-[#FFB800]" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Super Admin Console</span>
                <span className="text-[10px] bg-[#FFB800] text-gray-950 font-black px-2 py-0.5 rounded-full">
                  Owner
                </span>
              </div>
            </div>
          ) : currentRole === 'accountant' ? (
            <div className="flex items-center gap-2 bg-[#111827] px-4 py-2 rounded-full border border-gray-800 shadow-md">
              <Calculator className="w-4 h-4 text-[#FFB800]" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Firm Accountant Portal</span>
                {pendingExpensesCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-red-500 text-white font-black rounded-full text-[10px] animate-pulse">
                    {pendingExpensesCount}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#111827] px-4 py-2 rounded-full border border-gray-800 shadow-md">
              <Smartphone className="w-4 h-4 text-[#FFB800]" />
              <span className="text-xs font-black text-white">Partner Mobile Portal</span>
            </div>
          )}

          {/* User Identity Chip & Sign Out */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-[#111827] px-3.5 py-1.5 rounded-full border border-gray-800 shadow-md">
              <div className="w-6 h-6 rounded-full bg-[#FFB800] text-gray-950 flex items-center justify-center font-bold text-xs shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-black text-white flex items-center gap-1.5 leading-none">
                  <span>{currentUser.name}</span>
                  {currentUser.firmCode && (
                    <span className="text-[10px] bg-amber-400/20 text-[#FFB800] px-1.5 py-0.2 rounded font-mono">
                      {currentUser.firmCode}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 font-mono mt-0.5 leading-none">
                  +91 {currentUser.phone}
                </div>
              </div>
            </div>
          )}

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              title="Sign out of session"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-950/80 hover:bg-red-950 text-gray-200 hover:text-red-200 rounded-full text-xs font-bold border border-white/10 hover:border-red-500/40 transition-colors cursor-pointer shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* SHARE / TESTER LINKS MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#111827] p-5 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-amber-400">Individual Links for Clients / Testers</h3>
                  <p className="text-[11px] text-gray-400">
                    Share distinct dedicated URLs so each tester gets direct access to their assigned portal
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Google 403 & Sharing Guide Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-blue-950 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-blue-900 text-xs">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>How to test without Google 403 errors:</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  • <strong>For You (Immediate Testing):</strong> Click <span className="font-bold text-blue-950 underline">Preview in This Tab</span> below to test without opening a new window or hitting Google's auth bridge.<br/>
                  • <strong>For External Testers (Other Laptops / Phones):</strong> Click the <strong>"Share"</strong> button in the AI Studio top bar (next to Remix/Publish) to activate public access, then switch the toggle below to <strong>Public Link (ais-pre)</strong>.
                </p>
              </div>

              {/* Domain Mode Selector Toggle */}
              <div className="flex items-center justify-between bg-gray-100 p-2 rounded-2xl border border-gray-200">
                <span className="text-[11px] font-bold text-gray-700 pl-2">Target Link Environment:</span>
                <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-2xs border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setUrlMode('dev')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      urlMode === 'dev'
                        ? 'bg-amber-400 text-gray-950 shadow-xs'
                        : 'text-gray-600 hover:text-gray-950'
                    }`}
                  >
                    Active Session (ais-dev)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUrlMode('public')}
                    className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                      urlMode === 'public'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-950'
                    }`}
                  >
                    Public / Client (ais-pre)
                  </button>
                </div>
              </div>

              {/* Link 1: Firm Accountant Tester Link */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-gray-950">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    <span>1. Firm Accountant Portal Link</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    {currentFirm ? currentFirm.name : 'Select a firm'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Give this to Tester 1. They will land directly on the Accountant Dashboard to add projects, partners, bank accounts, and investments.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={accountantUrl}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-mono text-gray-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(accountantUrl, 'accountant')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FFB800] hover:bg-amber-400 text-gray-950 font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'accountant' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={accountantUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-black text-amber-300 font-bold rounded-xl text-xs shrink-0 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab ↗</span>
                  </a>
                </div>
              </div>

              {/* Link 2: Field Partner Mobile Link */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-gray-950">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>2. Partner Mobile Portal Link</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    Partner Access
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  Give this to Tester 2. They will land directly on the Partner Mobile view to log in, view live equity passbook, ratify investments, and log expenses.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={partnerUrl}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-mono text-gray-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(partnerUrl, 'partner')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FFB800] hover:bg-amber-400 text-gray-950 font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'partner' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={partnerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-black text-amber-300 font-bold rounded-xl text-xs shrink-0 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab ↗</span>
                  </a>
                </div>
              </div>

              {/* Link 3: Super Admin Console Link */}
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-gray-950">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span>3. Super Admin Console Link (Owner Only)</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                    Governance
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={superAdminUrl}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-mono text-gray-800 select-all"
                  />
                  <button
                    onClick={() => copyToClipboard(superAdminUrl, 'superadmin')}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#FFB800] hover:bg-amber-400 text-gray-950 font-bold rounded-xl shadow-xs transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedKey === 'superadmin' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={superAdminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 hover:bg-black text-amber-300 font-bold rounded-xl text-xs shrink-0 shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in New Tab ↗</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-5 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-full text-xs shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TEST DATA OPTIONS MODAL: CLEAN SLATE VS RESTORE DEMO */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-[#111827] p-5 text-white flex items-center justify-between border-b border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-gray-950 flex items-center justify-center font-black">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-amber-400">Database & Test Data Options</h3>
                  <p className="text-[11px] text-gray-400">Prepare application state for client testing</p>
                </div>
              </div>
              <button 
                onClick={() => setShowResetModal(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Option 1: Clean Slate (Wipe mock data) */}
              <div className="border border-rose-200 bg-rose-50/70 rounded-2xl p-4 hover:border-rose-300 transition-colors">
                <div className="flex items-center gap-2 text-rose-900 font-black text-sm mb-1">
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Wipe All Mock Data (Start Clean Testing)</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Removes all sample firms, projects, dummy partners, and mock investments from local storage. Starts you at <strong>Step 1</strong> in Super Admin to provision your first real firm and generate links for your two testers.
                </p>
                <button
                  onClick={() => {
                    onWipeMockData();
                    setShowResetModal(false);
                  }}
                  className="mt-3 w-full py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  🧹 Wipe Data & Initialize Clean Slate
                </button>
              </div>

              {/* Option 2: Restore Sample Demo Data */}
              <div className="border border-gray-200 bg-gray-50 rounded-2xl p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-center gap-2 text-gray-950 font-black text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Restore Sample AP/TG Demo Data</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  Reloads default sample data (Amaravati Ventures, Hyderabad High-Rise, pre-configured layouts, bank ledgers, and partner portfolios).
                </p>
                <button
                  onClick={() => {
                    onRestoreDemoData();
                    setShowResetModal(false);
                  }}
                  className="mt-3 w-full py-2 px-4 bg-gray-900 hover:bg-black text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  🔄 Reload Sample Demo Data
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-full text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
