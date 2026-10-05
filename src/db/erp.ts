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

    // Note: Proprietor / Managing Partner is kept strictly in the firm registry and not enrolled into app_users.
    // Only the Accountant (at firm level) and Field Partners (at project level) are enrolled as app_users.

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

    // Auto-enroll / sync Project Partners into app_users and syndicate_partners at individual project level
    if (Array.isArray(projectData.partners)) {
      let firmCode: string | null = null;
      if (projectData.firmId) {
        const matchedFirm = await db.select().from(firms).where(eq(firms.id, projectData.firmId));
        if (matchedFirm[0]) firmCode = matchedFirm[0].code;
      }

      for (const partner of projectData.partners) {
        if (partner.phone) {
          const cleanPtPhone = cleanPhone(partner.phone);
          if (cleanPtPhone && cleanPtPhone.length >= 10) {
            const partnerRecordId = partner.partnerId || `partner-${cleanPtPhone}`;
            // 1. Sync to app_users table
            await db
              .insert(appUsers)
              .values({
                id: `user-pt-${cleanPtPhone}`,
                phone: cleanPtPhone,
                name: partner.name || 'Field Partner',
                role: 'field_partner',
                firmId: projectData.firmId,
                firmCode: firmCode,
                partnerId: partnerRecordId,
                pinCode: '9999',
                mustChangePin: true,
                status: 'active',
              } as any)
              .onConflictDoUpdate({
                target: appUsers.phone,
                set: {
                  name: partner.name || 'Field Partner',
                  firmId: projectData.firmId,
                  firmCode: firmCode,
                  partnerId: partnerRecordId,
                  updatedAt: new Date(),
                },
              });

            // 2. Sync to syndicate_partners table for firm
            await db
              .insert(syndicatePartners)
              .values({
                id: partnerRecordId,
                firmId: projectData.firmId,
                name: partner.name || 'Field Partner',
                phone: cleanPtPhone,
                roleDescription: partner.roleInProject || 'Investor Partner',
                avatarColor: partner.avatarColor || 'bg-indigo-600',
                initialCapital: partner.initialCapital || 0,
                actualInvested: partner.actualInvested || 0,
                fixedEquityPercent: partner.equityPercent || 0,
                drawings: partner.drawings || 0,
                shareOfFieldExpenses: partner.shareOfFieldExpenses || 0,
                userRole: 'field_partner',
                userStatus: 'active',
                pinCode: '9999',
                dailySpendingLimit: 50000,
              } as any)
              .onConflictDoUpdate({
                target: syndicatePartners.id,
                set: {
                  name: partner.name || 'Field Partner',
                  phone: cleanPtPhone,
                  roleDescription: partner.roleInProject || 'Investor Partner',
                  initialCapital: partner.initialCapital || 0,
                  fixedEquityPercent: partner.equityPercent || 0,
                },
              });
          }
        }
      }
    }

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
              pinCode: partnerData.pinCode || '9999',
              status: partnerData.userStatus || 'active',
              mustChangePin: partnerData.mustChangePin ?? (partnerData.pinCode === '9999'),
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
    
    let matchedPartner = allPartners.find((p) => cleanPhone(p.phone) === inputPhone);

    // If not found in syndicatePartners, also inspect projects under this firm
    if (!matchedPartner) {
      const firmProjs = await db.select().from(projects).where(eq(projects.firmId, firm.id));
      for (const proj of firmProjs) {
        if (Array.isArray(proj.partners)) {
          const found = proj.partners.find((ps: any) => cleanPhone(ps.phone || '') === inputPhone);
          if (found) {
            matchedPartner = {
              id: found.partnerId || `partner-${inputPhone}`,
              firmId: firm.id,
              name: found.name,
              phone: inputPhone,
              roleDescription: found.roleInProject || 'Investor Partner',
              avatarColor: found.avatarColor || 'bg-indigo-600',
              initialCapital: found.initialCapital || 0,
              actualInvested: found.actualInvested || 0,
              fixedEquityPercent: found.equityPercent || 0,
              drawings: found.drawings || 0,
              shareOfFieldExpenses: found.shareOfFieldExpenses || 0,
              userRole: 'field_partner',
              userStatus: 'active',
              pinCode: '9999',
              dailySpendingLimit: 50000,
              createdAt: new Date(),
            } as any;
            break;
          }
        }
      }
    }

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
      return {
        success: false,
        error: `Proprietor / Promoter (${firm.proprietorName || firm.managingPartnerName || 'Owner'}) is registered for firm ownership & legal compliance. For operational access, please sign in with the designated Accountant mobile number (${firm.accountantPhone || 'registered accountant'}).`,
      };
    }
  }

  if (!targetUser) {
    return {
      success: false,
      error: `Mobile number ${inputPhone} is not enrolled under firm [${firm.code} - ${firm.name}]. Contact your Firm Accountant or Super Admin to onboard your profile.`,
    };
  }

  // Check if partner user is deactivated
  if (targetUser.status === 'inactive' || targetUser.status === 'suspended') {
    return {
      success: false,
      error: `Your partner account (${targetUser.name}) is currently inactive/deactivated. Please contact your Firm Accountant to activate your profile.`,
    };
  }

  // Validate 4-digit PIN (Accept configured PIN, standard initial PIN 9999, partner PIN 1234, or admin PIN 1992)
  const isDefaultPin = inputPin === '9999' || inputPin === '1234';
  const isConfiguredPin = targetUser.pinCode === inputPin;
  const isSpecialAdminPin = targetUser.role === 'super_admin' && (inputPin === '1992' || inputPin === '9999');

  if (!isConfiguredPin && !isDefaultPin && !isSpecialAdminPin) {
    return {
      success: false,
      error: 'Invalid 4-Digit PIN. Default PIN is 9999 for first login (or 1234 for partners).',
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
      mustChangePin: isDefaultPin || targetUser.mustChangePin,
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

  // Also sync into projects partners jsonb
  try {
    const allProjs = await db.select().from(projects);
    for (const proj of allProjs) {
      if (Array.isArray(proj.partners)) {
        let modified = false;
        const updated = proj.partners.map((ps: any) => {
          if (cleanPhone(ps.phone || '') === normPhone) {
            modified = true;
            return { ...ps, pinCode: cleanPin, mustChangePin: false };
          }
          return ps;
        });
        if (modified) {
          await db.update(projects).set({ partners: updated }).where(eq(projects.id, proj.id));
        }
      }
    }
  } catch (err) {
    console.error('Error updating project partners in changeUserPin:', err);
  }

  return { success: true, message: '4-Digit PIN updated successfully.' };
}

export async function getAppUsersList() {
  return await db.select().from(appUsers);
}

export async function resetPartnerPinByAccountant(phone: string, partnerId?: string) {
  const normPhone = cleanPhone(phone);
  
  if (normPhone) {
    const existing = await db.select().from(appUsers).where(eq(appUsers.phone, normPhone));
    if (existing.length > 0) {
      await db
        .update(appUsers)
        .set({
          pinCode: '9999',
          mustChangePin: true,
          updatedAt: new Date(),
        })
        .where(eq(appUsers.phone, normPhone));
    } else {
      // Find partner info to auto-create user in app_users
      const p = await db.select().from(syndicatePartners).where(eq(syndicatePartners.phone, normPhone));
      let firmId = p[0]?.firmId || null;
      let firmCode: string | null = null;
      let partnerName = p[0]?.name || 'Partner';
      let userRole = p[0]?.userRole || 'field_partner';

      if (!firmId) {
        const projs = await db.select().from(projects);
        for (const pr of projs) {
          if (Array.isArray(pr.partners)) {
            const found = pr.partners.find((item: any) => cleanPhone(item.phone || '') === normPhone);
            if (found) {
              firmId = pr.firmId;
              partnerName = found.name || partnerName;
              break;
            }
          }
        }
      }

      if (firmId) {
        const f = await db.select().from(firms).where(eq(firms.id, firmId));
        firmCode = f[0]?.code || null;
      }

      await db
        .insert(appUsers)
        .values({
          id: `user-pt-${normPhone}`,
          phone: normPhone,
          name: partnerName,
          role: userRole,
          firmId,
          firmCode,
          partnerId: partnerId || p[0]?.id || `partner-${normPhone}`,
          pinCode: '9999',
          mustChangePin: true,
          status: 'active',
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .onConflictDoNothing();
    }
  }

  if (partnerId) {
    await db
      .update(syndicatePartners)
      .set({ pinCode: '9999' })
      .where(eq(syndicatePartners.id, partnerId));
  } else if (normPhone) {
    await db
      .update(syndicatePartners)
      .set({ pinCode: '9999' })
      .where(eq(syndicatePartners.phone, normPhone));
  }

  // Also update projects table jsonb partners!
  try {
    const allProjs = await db.select().from(projects);
    for (const proj of allProjs) {
      if (Array.isArray(proj.partners)) {
        let modified = false;
        const updated = proj.partners.map((ps: any) => {
          const matches =
            (partnerId && String(ps.partnerId) === String(partnerId)) ||
            (normPhone && cleanPhone(ps.phone || '') === normPhone);
          if (matches) {
            modified = true;
            return { ...ps, pinCode: '9999', mustChangePin: true };
          }
          return ps;
        });
        if (modified) {
          await db.update(projects).set({ partners: updated }).where(eq(projects.id, proj.id));
        }
      }
    }
  } catch (err) {
    console.error('Error updating project partners in resetPartnerPinByAccountant:', err);
  }

  return {
    success: true,
    pinCode: '9999',
    message: 'PIN reset to default 9999. User will be prompted to set a new PIN on next login.',
  };
}

export async function togglePartnerStatusByAccountant(
  phone: string,
  partnerId: string | undefined,
  status: 'active' | 'inactive'
) {
  const normPhone = cleanPhone(phone);
  if (normPhone) {
    const existing = await db.select().from(appUsers).where(eq(appUsers.phone, normPhone));
    if (existing.length > 0) {
      await db
        .update(appUsers)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(appUsers.phone, normPhone));
    } else {
      const p = await db.select().from(syndicatePartners).where(eq(syndicatePartners.phone, normPhone));
      let firmId = p[0]?.firmId || null;
      let firmCode: string | null = null;
      let partnerName = p[0]?.name || 'Partner';
      let userRole = p[0]?.userRole || 'field_partner';

      if (!firmId) {
        const projs = await db.select().from(projects);
        for (const pr of projs) {
          if (Array.isArray(pr.partners)) {
            const found = pr.partners.find((item: any) => cleanPhone(item.phone || '') === normPhone);
            if (found) {
              firmId = pr.firmId;
              partnerName = found.name || partnerName;
              break;
            }
          }
        }
      }

      if (firmId) {
        const f = await db.select().from(firms).where(eq(firms.id, firmId));
        firmCode = f[0]?.code || null;
      }

      await db
        .insert(appUsers)
        .values({
          id: `user-pt-${normPhone}`,
          phone: normPhone,
          name: partnerName,
          role: userRole,
          firmId,
          firmCode,
          partnerId: partnerId || p[0]?.id || `partner-${normPhone}`,
          pinCode: p[0]?.pinCode || '9999',
          mustChangePin: false,
          status,
          lastLoginAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .onConflictDoNothing();
    }
  }

  if (partnerId) {
    await db
      .update(syndicatePartners)
      .set({ userStatus: status })
      .where(eq(syndicatePartners.id, partnerId));
  } else if (normPhone) {
    await db
      .update(syndicatePartners)
      .set({ userStatus: status })
      .where(eq(syndicatePartners.phone, normPhone));
  }

  // Also update projects table jsonb partners!
  try {
    const allProjs = await db.select().from(projects);
    for (const proj of allProjs) {
      if (Array.isArray(proj.partners)) {
        let modified = false;
        const updated = proj.partners.map((ps: any) => {
          const matches =
            (partnerId && String(ps.partnerId) === String(partnerId)) ||
            (normPhone && cleanPhone(ps.phone || '') === normPhone);
          if (matches) {
            modified = true;
            return { ...ps, userStatus: status };
          }
          return ps;
        });
        if (modified) {
          await db.update(projects).set({ partners: updated }).where(eq(projects.id, proj.id));
        }
      }
    }
  } catch (err) {
    console.error('Error updating project partners in togglePartnerStatusByAccountant:', err);
  }

  return { success: true, status };
}
