import { db } from './index.ts';
import {
  firms,
  projects,
  plots,
  apartmentUnits,
  firmAccounts,
  firmAccountTransactions,
  projectExpenses,
  syndicatePartners,
  individualInvestments,
  fieldExpenseLogs,
  auditLogs,
  systemMeta,
  appUsers
} from './schema.ts';
import { eq, or, ilike } from 'drizzle-orm';
import {
  INITIAL_FIRMS,
  INITIAL_PROJECTS,
  INITIAL_PLOTS,
  INITIAL_PROJECT_EXPENSES,
  INITIAL_APARTMENT_UNITS,
  INITIAL_PARTNERS,
  INITIAL_FIELD_EXPENSES,
  INITIAL_AUDIT_LOGS,
  INITIAL_FIRM_ACCOUNTS,
  INITIAL_INDIVIDUAL_INVESTMENTS
} from '../data/initialData.ts';
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
} from '../types.ts';

export async function ensureDbSeeded() {
  // Fresh mode: Do not auto-seed dummy demo firms into Cloud SQL.
  // The system starts with an empty, clean database so the user can onboard their real firms.
  return;
}

export async function clearAllErpData() {
  try {
    await db.delete(apartmentUnits);
    await db.delete(auditLogs);
    await db.delete(fieldExpenseLogs);
    await db.delete(firmAccountTransactions);
    await db.delete(firmAccounts);
    await db.delete(individualInvestments);
    await db.delete(plots);
    await db.delete(projectExpenses);
    await db.delete(projects);
    await db.delete(syndicatePartners);
    await db.delete(firms);
    return { success: true, message: 'All ERP tables cleared successfully' };
  } catch (error: any) {
    console.error('Failed to clear ERP tables:', error);
    throw error;
  }
}

export async function seedDemoData() {
  try {
    console.log('Explicitly seeding sample AP/TG demo data into Cloud SQL PostgreSQL...');
    for (const f of INITIAL_FIRMS) {
      await db.insert(firms).values(f as any).onConflictDoNothing();
    }
    for (const p of INITIAL_PROJECTS) {
      await db.insert(projects).values(p as any).onConflictDoNothing();
    }
    for (const pl of INITIAL_PLOTS) {
      await db.insert(plots).values(pl as any).onConflictDoNothing();
    }
    for (const u of INITIAL_APARTMENT_UNITS) {
      await db.insert(apartmentUnits).values(u as any).onConflictDoNothing();
    }
    for (const a of INITIAL_FIRM_ACCOUNTS) {
      await db.insert(firmAccounts).values(a as any).onConflictDoNothing();
    }
    for (const pe of INITIAL_PROJECT_EXPENSES) {
      await db.insert(projectExpenses).values(pe as any).onConflictDoNothing();
    }
    for (const pt of INITIAL_PARTNERS) {
      await db.insert(syndicatePartners).values(pt as any).onConflictDoNothing();
    }
    for (const inv of INITIAL_INDIVIDUAL_INVESTMENTS) {
      await db.insert(individualInvestments).values(inv as any).onConflictDoNothing();
    }
    for (const fe of INITIAL_FIELD_EXPENSES) {
      await db.insert(fieldExpenseLogs).values(fe as any).onConflictDoNothing();
    }
    for (const al of INITIAL_AUDIT_LOGS) {
      await db.insert(auditLogs).values(al as any).onConflictDoNothing();
    }
    return { success: true, message: 'Sample demo data seeded' };
  } catch (error: any) {
    console.error('Failed to seed demo data:', error);
    throw error;
  }
}

export async function getFullErpData() {
  await ensureDbSeeded();
  try {
    const [
      allFirms,
      allProjects,
      allPlots,
      allApartments,
      allAccounts,
      allAccountTxns,
      allExpenses,
      allPartners,
      allInvestments,
      allFieldExpenses,
      allAuditLogs
    ] = await Promise.all([
      db.select().from(firms),
      db.select().from(projects),
      db.select().from(plots),
      db.select().from(apartmentUnits),
      db.select().from(firmAccounts),
      db.select().from(firmAccountTransactions),
      db.select().from(projectExpenses),
      db.select().from(syndicatePartners),
      db.select().from(individualInvestments),
      db.select().from(fieldExpenseLogs),
      db.select().from(auditLogs),
    ]);

    // Reconcile and merge account transactions with accurate running balances
    const reconciledAccounts = (allAccounts as FirmAccount[]).map((acc) => {
      const existingTxns: FirmAccountTransaction[] = Array.isArray(acc.recentTransactions)
        ? (acc.recentTransactions as FirmAccountTransaction[])
        : [];
      
      const dbTxns = (allAccountTxns as any[]).filter((t) => t.accountId === acc.id);
      
      // Merge unique transactions by id and referenceNo
      const txMap = new Map<string, FirmAccountTransaction>();
      existingTxns.forEach((tx) => {
        if (tx && tx.id) txMap.set(tx.id, tx);
      });
      dbTxns.forEach((raw) => {
        const tx: FirmAccountTransaction = {
          id: raw.id,
          accountId: raw.accountId,
          date: raw.date || new Date().toISOString().split('T')[0],
          type: raw.type as 'credit' | 'debit',
          amount: Number(raw.amount) || 0,
          description: raw.description || '',
          referenceNo: raw.referenceNo || raw.id,
          category: raw.category || 'general_banking',
          partnerName: raw.partnerName,
          projectName: raw.projectName,
          balanceAfter: Number(raw.balanceAfter) || 0,
          enrolledBy: raw.enrolledBy,
          approvedBy: raw.approvedBy,
          status: (raw.status as 'approved' | 'pending' | 'cleared') || 'approved',
          paymentMode: raw.paymentMode,
          notes: raw.notes,
        };
        txMap.set(tx.id, tx);
      });

      const mergedTxns = Array.from(txMap.values()).sort((a, b) => {
        const dateA = new Date(a.date).getTime() || 0;
        const dateB = new Date(b.date).getTime() || 0;
        return dateB - dateA;
      });

      // Calculate mathematically accurate balance from opening balance and all verified transactions
      const totalCredits = mergedTxns
        .filter((t) => t.type === 'credit' && t.status !== 'pending')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const totalDebits = mergedTxns
        .filter((t) => t.type === 'debit' && t.status !== 'pending')
        .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      
      const openingBal = Number(acc.openingBalance) || 0;
      const computedBalance = openingBal + totalCredits - totalDebits;
      
      // If transactions exist, use computed balance to prevent stale balance overwrites
      const accurateBalance = mergedTxns.length > 0 ? computedBalance : (Number(acc.currentBalance) || 0);

      return {
        ...acc,
        currentBalance: accurateBalance,
        recentTransactions: mergedTxns,
      };
    });

    return {
      firms: allFirms as TenantFirm[],
      projects: allProjects as Project[],
      plots: allPlots as Plot[],
      apartmentUnits: allApartments as ApartmentUnit[],
      firmAccounts: reconciledAccounts,
      projectExpenses: allExpenses as ProjectExpense[],
      partners: allPartners as SyndicatePartner[],
      individualInvestments: allInvestments as IndividualInvestmentRecord[],
      fieldExpenses: allFieldExpenses as FieldExpenseLog[],
      auditLogs: allAuditLogs as AuditLogEntry[],
    };
  } catch (error) {
    console.error('Error fetching full ERP data from Cloud SQL:', error);
    throw new Error('Database query failed. Please try again later.', { cause: error });
  }
}

export async function saveFirm(firmData: TenantFirm) {
  try {
    await db
      .insert(firms)
      .values(firmData as any)
      .onConflictDoUpdate({
        target: firms.id,
        set: firmData as any,
      });

    // Auto-enroll / sync Accountant into app_users
    if (firmData.accountantPhone) {
      const cleanAcc = cleanPhone(firmData.accountantPhone);
      if (cleanAcc && cleanAcc.length >= 10) {
        await db
          .insert(appUsers)
          .values({
            id: `user-acc-${cleanAcc}`,
            phone: cleanAcc,
            name: `${firmData.accountantName || 'Primary Accountant'} (Accountant)`,
            role: 'accountant',
            firmId: firmData.id,
            firmCode: firmData.code,
            partnerId: null,
            pinCode: '9999',
            mustChangePin: true,
            status: 'active',
          } as any)
          .onConflictDoUpdate({
            target: appUsers.phone,
            set: {
              name: `${firmData.accountantName || 'Primary Accountant'} (Accountant)`,
              firmId: firmData.id,
              firmCode: firmData.code,
              updatedAt: new Date(),
            },
          });
      }
    }

    // Auto-enroll / sync Managing Partner / Proprietor into app_users
    const mpPhone = firmData.managingPartnerPhone || firmData.proprietorPhone;
    if (mpPhone) {
      const cleanMp = cleanPhone(mpPhone);
      if (cleanMp && cleanMp.length >= 10) {
        await db
          .insert(appUsers)
          .values({
            id: `user-mp-${cleanMp}`,
            phone: cleanMp,
            name: firmData.managingPartnerName || firmData.proprietorName || 'Managing Partner',
            role: 'managing_partner',
            firmId: firmData.id,
            firmCode: firmData.code,
            partnerId: null,
            pinCode: '9999',
            mustChangePin: true,
            status: 'active',
          } as any)
          .onConflictDoUpdate({
            target: appUsers.phone,
            set: {
              name: firmData.managingPartnerName || firmData.proprietorName || 'Managing Partner',
              firmId: firmData.id,
              firmCode: firmData.code,
              updatedAt: new Date(),
            },
          });
      }
    }

    return firmData;
  } catch (error) {
    console.error('Error saving firm to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function deleteFirm(firmId: string) {
  try {
    await db.delete(firms).where(eq(firms.id, firmId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting firm from Cloud SQL:', error);
    throw new Error('Database delete failed.', { cause: error });
  }
}

export async function saveProject(projectData: Project) {
  try {
    await db
      .insert(projects)
      .values(projectData as any)
      .onConflictDoUpdate({
        target: projects.id,
        set: projectData as any,
      });
    return projectData;
  } catch (error) {
    console.error('Error saving project to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function deleteProject(projectId: string) {
  try {
    await db.delete(projects).where(eq(projects.id, projectId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting project from Cloud SQL:', error);
    throw new Error('Database delete failed.', { cause: error });
  }
}

export async function savePlot(plotData: Plot) {
  try {
    if (plotData.id && typeof plotData.id === 'number') {
      await db
        .insert(plots)
        .values(plotData as any)
        .onConflictDoUpdate({
          target: plots.id,
          set: plotData as any,
        });
    } else {
      await db.insert(plots).values(plotData as any);
    }
    return plotData;
  } catch (error) {
    console.error('Error saving plot to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function saveApartmentUnit(unitData: ApartmentUnit) {
  try {
    await db
      .insert(apartmentUnits)
      .values(unitData as any)
      .onConflictDoUpdate({
        target: apartmentUnits.id,
        set: unitData as any,
      });
    return unitData;
  } catch (error) {
    console.error('Error saving apartment unit to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function saveFirmAccount(accountData: FirmAccount) {
  try {
    await db
      .insert(firmAccounts)
      .values(accountData as any)
      .onConflictDoUpdate({
        target: firmAccounts.id,
        set: accountData as any,
      });
    return accountData;
  } catch (error) {
    console.error('Error saving firm account to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function addAccountTransaction(txnData: FirmAccountTransaction) {
  try {
    await db
      .insert(firmAccountTransactions)
      .values(txnData as any)
      .onConflictDoUpdate({
        target: firmAccountTransactions.id,
        set: txnData as any,
      });

    // Also update parent firm_accounts balance and transactions list
    if (txnData.accountId) {
      const existingAccounts = await db
        .select()
        .from(firmAccounts)
        .where(eq(firmAccounts.id, txnData.accountId));
      
      if (existingAccounts.length > 0) {
        const acc = existingAccounts[0];
        const existingTxns: FirmAccountTransaction[] = Array.isArray(acc.recentTransactions)
          ? (acc.recentTransactions as FirmAccountTransaction[])
          : [];
        
        const filtered = existingTxns.filter((t) => t.id !== txnData.id);
        const updatedTxns = [txnData, ...filtered];

        const totalCredits = updatedTxns
          .filter((t) => t.type === 'credit' && t.status !== 'pending')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        const totalDebits = updatedTxns
          .filter((t) => t.type === 'debit' && t.status !== 'pending')
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        
        const newBalance = (Number(acc.openingBalance) || 0) + totalCredits - totalDebits;

        await db
          .update(firmAccounts)
          .set({
            currentBalance: newBalance,
            recentTransactions: updatedTxns as any,
          })
          .where(eq(firmAccounts.id, txnData.accountId));
      }
    }

    return txnData;
  } catch (error) {
    console.error('Error adding transaction to Cloud SQL:', error);
    throw new Error('Database transaction failed.', { cause: error });
  }
}

export async function saveProjectExpense(expenseData: ProjectExpense) {
  try {
    await db
      .insert(projectExpenses)
      .values(expenseData as any)
      .onConflictDoUpdate({
        target: projectExpenses.id,
        set: expenseData as any,
      });
    return expenseData;
  } catch (error) {
    console.error('Error saving project expense to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function savePartner(partnerData: SyndicatePartner) {
  try {
    await db
      .insert(syndicatePartners)
      .values(partnerData as any)
      .onConflictDoUpdate({
        target: syndicatePartners.id,
        set: partnerData as any,
      });

    // Auto-enroll / sync Partner into app_users
    if (partnerData.phone) {
      const cleanP = cleanPhone(partnerData.phone);
      if (cleanP && cleanP.length >= 10) {
        let firmCode: string | null = null;
        if (partnerData.firmId) {
          const matchedFirm = await db.select().from(firms).where(eq(firms.id, partnerData.firmId));
          if (matchedFirm[0]) firmCode = matchedFirm[0].code;
        }

        await db
          .insert(appUsers)
          .values({
            id: `user-pt-${cleanP}`,
            phone: cleanP,
            name: partnerData.name,
            role: partnerData.userRole || 'field_partner',
            firmId: partnerData.firmId || null,
            firmCode: firmCode,
            partnerId: partnerData.id,
            pinCode: partnerData.pinCode || '9999',
            mustChangePin: !partnerData.pinCode || partnerData.pinCode === '9999',
            status: partnerData.userStatus || 'active',
          } as any)
          .onConflictDoUpdate({
            target: appUsers.phone,
            set: {
              name: partnerData.name,
              role: partnerData.userRole || 'field_partner',
              firmId: partnerData.firmId || null,
              firmCode: firmCode,
              partnerId: partnerData.id,
              updatedAt: new Date(),
            },
          });
      }
    }

    return partnerData;
  } catch (error) {
    console.error('Error saving partner to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function saveIndividualInvestment(invData: IndividualInvestmentRecord) {
  try {
    await db
      .insert(individualInvestments)
      .values(invData as any)
      .onConflictDoUpdate({
        target: individualInvestments.id,
        set: invData as any,
      });
    return invData;
  } catch (error) {
    console.error('Error saving investment to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function saveFieldExpense(feData: FieldExpenseLog) {
  try {
    await db
      .insert(fieldExpenseLogs)
      .values(feData as any)
      .onConflictDoUpdate({
        target: fieldExpenseLogs.id,
        set: feData as any,
      });
    return feData;
  } catch (error) {
    console.error('Error saving field expense to Cloud SQL:', error);
    throw new Error('Database save failed.', { cause: error });
  }
}

export async function addAuditLogEntry(entry: AuditLogEntry) {
  try {
    await db.insert(auditLogs).values(entry as any).onConflictDoNothing();
    return entry;
  } catch (error) {
    console.error('Error saving audit log to Cloud SQL:', error);
    return entry;
  }
}

export async function resetAllErpData(cleanSlate: boolean = false) {
  try {
    await db.delete(plots);
    await db.delete(apartmentUnits);
    await db.delete(firmAccounts);
    await db.delete(firmAccountTransactions);
    await db.delete(projectExpenses);
    await db.delete(individualInvestments);
    await db.delete(fieldExpenseLogs);
    await db.delete(auditLogs);
    await db.delete(syndicatePartners);
    await db.delete(projects);
    await db.delete(firms);

    if (!cleanSlate) {
      await seedDemoData();
    }
    return { success: true };
  } catch (error) {
    console.error('Error resetting Cloud SQL ERP data:', error);
    throw new Error('Database reset failed.', { cause: error });
  }
}

// -------------------------------------------------------------
// Production Authentication & App Users Management
// -------------------------------------------------------------

export function cleanPhone(rawPhone: string): string {
  const digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length > 10 && digits.startsWith('91')) return digits.slice(-10);
  return digits.slice(-10) || digits;
}

export async function validateFirmCode(firmCode: string) {
  const code = firmCode.trim().toUpperCase();
  const allFirms = await db.select().from(firms);
  const matched = allFirms.find((f) => f.code.toUpperCase() === code);
  return matched || null;
}

export async function authenticateAppUser(params: {
  phone: string;
  pin: string;
  firmCode?: string;
}) {
  const inputPhone = cleanPhone(params.phone);
  const inputPin = params.pin.trim();
  const inputFirmCode = params.firmCode ? params.firmCode.trim().toUpperCase() : undefined;

  // 1. Check Super Admin (Special root role, phone: 9550247162)
  if (inputPhone === '9550247162') {
    const saUsers = await db.select().from(appUsers).where(eq(appUsers.phone, inputPhone));
    let saUser = saUsers[0];
    if (!saUser) {
      // Auto-provision Super Admin
      const newSa = {
        id: `user-sa-${inputPhone}`,
        phone: inputPhone,
        name: 'G. Sudheer (Super Admin)',
        role: 'super_admin',
        firmId: null,
        firmCode: null,
        partnerId: null,
        pinCode: '9999',
        mustChangePin: true,
        status: 'active',
      };
      await db.insert(appUsers).values(newSa as any).onConflictDoNothing();
      saUser = newSa as any;
    }

    if (saUser.pinCode !== inputPin) {
      return { success: false, error: 'Invalid 4-Digit PIN. Default PIN is 9999 for first login.' };
    }

    await db.update(appUsers).set({ lastLoginAt: new Date() }).where(eq(appUsers.phone, inputPhone));

    return {
      success: true,
      user: {
        id: saUser.id,
        phone: saUser.phone,
        name: saUser.name,
        role: 'super_admin' as const,
        firmId: null,
        firmCode: null,
        partnerId: null,
        mustChangePin: saUser.mustChangePin ?? (inputPin === '9999'),
      },
    };
  }

  // 2. Firm Member Login (Accountant / Field Partner / Managing Partner)
  if (!inputFirmCode) {
    return { success: false, error: 'Firm Code is required to sign in as a firm member.' };
  }

  const firm = await validateFirmCode(inputFirmCode);
  if (!firm) {
    return { success: false, error: `Firm Code "${inputFirmCode}" not found in system registry.` };
  }

  // Check app_users table
  const existingUsers = await db
    .select()
    .from(appUsers)
    .where(eq(appUsers.phone, inputPhone));
  
  let targetUser = existingUsers.find((u) => !u.firmCode || u.firmCode.toUpperCase() === inputFirmCode);

  // If not found in app_users, inspect firm members dynamically
  if (!targetUser) {
    const accPhone = firm.accountantPhone ? cleanPhone(firm.accountantPhone) : '';
    const propPhone = firm.proprietorPhone ? cleanPhone(firm.proprietorPhone) : '';
    const mpPhone = firm.managingPartnerPhone ? cleanPhone(firm.managingPartnerPhone) : '';

    const allPartners = await db
      .select()
      .from(syndicatePartners)
      .where(eq(syndicatePartners.firmId, firm.id));
    
    const matchedPartner = allPartners.find((p) => cleanPhone(p.phone) === inputPhone);

    if (accPhone === inputPhone) {
      targetUser = {
        id: `user-acc-${inputPhone}`,
        phone: inputPhone,
        name: `${firm.accountantName || 'Primary Accountant'} (Accountant)`,
        role: 'accountant',
        firmId: firm.id,
        firmCode: firm.code,
        partnerId: null,
        pinCode: '9999',
        mustChangePin: true,
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(appUsers).values(targetUser as any).onConflictDoNothing();
    } else if (matchedPartner) {
      targetUser = {
        id: `user-pt-${inputPhone}`,
        phone: inputPhone,
        name: matchedPartner.name,
        role: matchedPartner.userRole || 'field_partner',
        firmId: firm.id,
        firmCode: firm.code,
        partnerId: matchedPartner.id,
        pinCode: matchedPartner.pinCode || '9999',
        mustChangePin: !matchedPartner.pinCode || matchedPartner.pinCode === '9999',
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(appUsers).values(targetUser as any).onConflictDoNothing();
    } else if (propPhone === inputPhone || mpPhone === inputPhone) {
      targetUser = {
        id: `user-mp-${inputPhone}`,
        phone: inputPhone,
        name: firm.managingPartnerName || firm.proprietorName || 'Managing Partner',
        role: 'managing_partner',
        firmId: firm.id,
        firmCode: firm.code,
        partnerId: null,
        pinCode: '9999',
        mustChangePin: true,
        status: 'active',
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.insert(appUsers).values(targetUser as any).onConflictDoNothing();
    }
  }

  if (!targetUser) {
    return {
      success: false,
      error: `Mobile number ${inputPhone} is not enrolled under firm [${firm.code} - ${firm.name}]. Contact your Firm Accountant or Super Admin to onboard your profile.`,
    };
  }

  // Validate 4-digit PIN
  if (targetUser.pinCode !== inputPin) {
    return {
      success: false,
      error: 'Invalid 4-Digit PIN. Default PIN is 9999 for first login.',
    };
  }

  await db.update(appUsers).set({ lastLoginAt: new Date() }).where(eq(appUsers.id, targetUser.id));

  return {
    success: true,
    user: {
      id: targetUser.id,
      phone: targetUser.phone,
      name: targetUser.name,
      role: targetUser.role,
      firmId: targetUser.firmId,
      firmCode: targetUser.firmCode,
      partnerId: targetUser.partnerId,
      mustChangePin: targetUser.mustChangePin ?? (inputPin === '9999'),
    },
  };
}

export async function changeUserPin(phone: string, newPin: string) {
  const normPhone = cleanPhone(phone);
  const cleanPin = newPin.trim();
  if (!cleanPin || cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
    throw new Error('PIN must be exactly 4 numeric digits.');
  }

  await db
    .update(appUsers)
    .set({
      pinCode: cleanPin,
      mustChangePin: false,
      updatedAt: new Date(),
    })
    .where(eq(appUsers.phone, normPhone));

  // If partner, also update syndicatePartners pin_code
  await db
    .update(syndicatePartners)
    .set({ pinCode: cleanPin })
    .where(eq(syndicatePartners.phone, normPhone));

  return { success: true, message: '4-Digit PIN updated successfully.' };
}

export async function getAppUsersList() {
  return await db.select().from(appUsers);
}
