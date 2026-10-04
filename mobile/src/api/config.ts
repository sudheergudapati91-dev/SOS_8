// SyndicateOS Mobile API Client
// Connects to your unified Express backend server

// In production on your custom domain, set this to:
export const API_BASE_URL = 'https://sos.krishisetu9.in/api';

// For local testing on Wi-Fi or LAN, you can point to your dev machine:
// export const API_BASE_URL = 'http://192.168.1.100:3000/api';

export interface MobileAuthUser {
  id: string;
  phone: string;
  name: string;
  role: 'super_admin' | 'accountant' | 'field_partner' | 'managing_partner';
  firmId: string | null;
  firmCode: string | null;
  partnerId: string | null;
  mustChangePin: boolean;
}

export async function verifyFirm(firmCode: string) {
  const res = await fetch(`${API_BASE_URL}/auth/validate-firm/${encodeURIComponent(firmCode.toUpperCase())}`);
  if (!res.ok) throw new Error('Failed to reach validation service');
  return await res.json();
}

export async function loginWithPin(phone: string, pin: string, firmCode?: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin, firmCode: firmCode ? firmCode.toUpperCase() : undefined }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Authentication failed');
  }
  return data.user as MobileAuthUser;
}

export async function changePin(phone: string, newPin: string) {
  const res = await fetch(`${API_BASE_URL}/auth/change-pin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, newPin }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'PIN update failed');
  }
  return data;
}

export async function fetchFullErpData() {
  const res = await fetch(`${API_BASE_URL}/erp/all`);
  if (!res.ok) throw new Error('Failed to fetch ERP data from server');
  return await res.json();
}

export async function submitMobileExpense(expenseData: any) {
  const res = await fetch(`${API_BASE_URL}/field-expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(expenseData),
  });
  return await res.json();
}
