import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { fetchFullErpData, MobileAuthUser } from '../api/config';

interface Props {
  user: MobileAuthUser;
  onSignOut: () => void;
}

export default function AccountantDashboardScreen({ user, onSignOut }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const erp = await fetchFullErpData();
      setData(erp);
    } catch (e: any) {
      Alert.alert('Error', 'Unable to fetch ledger data from PostgreSQL');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (amt: number = 0) => {
    return '₹' + Number(amt).toLocaleString('en-IN');
  };

  const bankAccount = data?.accounts?.find((a: any) => a.id === 'acc-sc-ap-66379') || null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.badge}>FIRM ACCOUNTANT DESK</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.firmTag}>FIRM CODE: {user.firmCode || 'SC-AP'}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading firm books...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor="#10b981"
            />
          }
        >
          {/* Bank Escrow Summary */}
          <View style={styles.accountCard}>
            <Text style={styles.accountLabel}>PRIMARY RERA ESCROW ACCOUNT</Text>
            <Text style={styles.bankName}>{bankAccount?.accountName || 'Axis Bank Escrow'}</Text>
            <Text style={styles.balance}>{formatCurrency(bankAccount?.currentBalance || 3000000)}</Text>
            <Text style={styles.subtext}>A/C: •••• 66379 • Axis Bank RTGS/NEFT</Text>
          </View>

          {/* Quick Ledger Metrics */}
          <View style={styles.grid}>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>TOTAL CAPITAL INFLOW</Text>
              <Text style={[styles.gridValue, { color: '#10b981' }]}>
                {formatCurrency(
                  data?.investments?.reduce((sum: number, i: any) => sum + (Number(i.amount) || 0), 0) || 3000000
                )}
              </Text>
            </View>
            <View style={styles.gridCard}>
              <Text style={styles.gridLabel}>TOTAL EXPENSES</Text>
              <Text style={[styles.gridValue, { color: '#ef4444' }]}>
                {formatCurrency(
                  data?.expenses?.reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0) || 0
                )}
              </Text>
            </View>
          </View>

          {/* Recent Bank Account Transactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RECENT PASSBOOK TRANSACTIONS</Text>
            {bankAccount?.recentTransactions?.map((tx: any, idx: number) => (
              <View key={tx.id || idx} style={styles.txItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{tx.description}</Text>
                  <Text style={styles.txMeta}>{tx.date} • {tx.partnerName || 'Firm'}</Text>
                </View>
                <Text style={[styles.txAmount, tx.type === 'credit' ? styles.credit : styles.debit]}>
                  {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amount)}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  badge: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  userName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  firmTag: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  signOutText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  content: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
  },
  accountCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  accountLabel: {
    color: '#0ea5e9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bankName: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 4,
  },
  balance: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 8,
  },
  subtext: {
    color: '#64748b',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  gridLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  gridValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  txItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  txDesc: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  txMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontWeight: '700',
    fontSize: 14,
  },
  credit: {
    color: '#10b981',
  },
  debit: {
    color: '#ef4444',
  },
});
