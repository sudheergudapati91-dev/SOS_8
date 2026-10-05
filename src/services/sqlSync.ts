import type {
  TenantFirm,
  Project,
  Plot,
  ApartmentUnit,
  FirmAccount,
  FirmAccountTransaction,
  ProjectExpense,
  SyndicatePartner,
  IndividualInvestmentRecord,
  FieldExpenseLog,
  AuditLogEntry
} from '../types';

export interface FullErpPayload {
  firms: TenantFirm[];
  projects: Project[];
  plots: Plot[];
  apartmentUnits: ApartmentUnit[];
  firmAccounts: FirmAccount[];
  projectExpenses: ProjectExpense[];
  partners: SyndicatePartner[];
  individualInvestments: IndividualInvestmentRecord[];
  fieldExpenses: FieldExpenseLog[];
  auditLogs: AuditLogEntry[];
}

export async function fetchErpDataFromSql(): Promise<FullErpPayload | null> {
  try {
    const res = await fetch('/api/erp/all');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Failed to load ERP data from Cloud SQL:', err);
    return null;
  }
}

export async function saveFirmToSql(firm: TenantFirm): Promise<void> {
  try {
    await fetch('/api/erp/firms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firm),
    });
  } catch (err) {
    console.error('Failed to save firm to Cloud SQL:', err);
  }
}

export async function deleteFirmFromSql(firmId: string): Promise<void> {
  try {
    await fetch(`/api/erp/firms/${encodeURIComponent(firmId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete firm from Cloud SQL:', err);
  }
}

export async function saveProjectToSql(project: Project): Promise<void> {
  try {
    await fetch('/api/erp/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project),
    });
  } catch (err) {
    console.error('Failed to save project to Cloud SQL:', err);
  }
}

export async function deleteProjectFromSql(projectId: string): Promise<void> {
  try {
    await fetch(`/api/erp/projects/${encodeURIComponent(projectId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.error('Failed to delete project from Cloud SQL:', err);
  }
}

export async function savePlotToSql(plot: Plot): Promise<void> {
  try {
    await fetch('/api/erp/plots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plot),
    });
  } catch (err) {
    console.error('Failed to save plot to Cloud SQL:', err);
  }
}

export async function saveApartmentUnitToSql(unit: ApartmentUnit): Promise<void> {
  try {
    await fetch('/api/erp/apartment-units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unit),
    });
  } catch (err) {
    console.error('Failed to save apartment unit to Cloud SQL:', err);
  }
}

export async function saveFirmAccountToSql(account: FirmAccount): Promise<void> {
  try {
    await fetch('/api/erp/firm-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(account),
    });
  } catch (err) {
    console.error('Failed to save firm account to Cloud SQL:', err);
  }
}

export async function addAccountTransactionToSql(txn: FirmAccountTransaction): Promise<void> {
  try {
    await fetch('/api/erp/account-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(txn),
    });
  } catch (err) {
    console.error('Failed to add transaction to Cloud SQL:', err);
  }
}

export async function saveProjectExpenseToSql(expense: ProjectExpense): Promise<void> {
  try {
    await fetch('/api/erp/project-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense),
    });
  } catch (err) {
    console.error('Failed to save project expense to Cloud SQL:', err);
  }
}

export async function savePartnerToSql(partner: SyndicatePartner): Promise<void> {
  try {
    await fetch('/api/erp/partners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partner),
    });
  } catch (err) {
    console.error('Failed to save partner to Cloud SQL:', err);
  }
}

export async function resetPartnerPinInSql(
  phone: string,
  partnerId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/erp/partners/reset-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, partnerId }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to reset partner PIN in Cloud SQL:', err);
    return { success: false };
  }
}

export async function togglePartnerStatusInSql(
  phone: string,
  partnerId: string | undefined,
  status: 'active' | 'inactive'
): Promise<{ success: boolean; status?: string }> {
  try {
    const res = await fetch('/api/erp/partners/toggle-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, partnerId, status }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to toggle partner status in Cloud SQL:', err);
    return { success: false };
  }
}

export async function saveIndividualInvestmentToSql(investment: IndividualInvestmentRecord): Promise<void> {
  try {
    await fetch('/api/erp/individual-investments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(investment),
    });
  } catch (err) {
    console.error('Failed to save investment to Cloud SQL:', err);
  }
}

export async function saveFieldExpenseToSql(fe: FieldExpenseLog): Promise<void> {
  try {
    await fetch('/api/erp/field-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fe),
    });
  } catch (err) {
    console.error('Failed to save field expense to Cloud SQL:', err);
  }
}

export async function addAuditLogToSql(entry: AuditLogEntry): Promise<void> {
  try {
    await fetch('/api/erp/audit-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
  } catch (err) {
    console.error('Failed to save audit log to Cloud SQL:', err);
  }
}

export async function resetSqlData(cleanSlate: boolean): Promise<void> {
  try {
    await fetch('/api/erp/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cleanSlate }),
    });
  } catch (err) {
    console.error('Failed to reset Cloud SQL data:', err);
  }
}
