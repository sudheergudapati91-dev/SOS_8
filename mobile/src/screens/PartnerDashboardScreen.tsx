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

export default function PartnerDashboardScreen({ user, onSignOut }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const erp = await fetchFullErpData();
      setData(erp);
    } catch (e: any) {
      Alert.alert('Sync Error', 'Failed to fetch latest syndicate data from PostgreSQL');
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

  // Find partner details
  const partner = data?.partners?.find((p: any) => p.phone && p.phone.includes(user.phone.slice(-10))) || null;
  const project = data?.projects?.[0] || null;
  const bankAccount = data?.accounts?.find((a: any) => a.id === 'acc-sc-ap-66379') || null;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.firmTag}>FIRM: {user.firmCode || 'SC-AP'}</Text>
        </View>
        <TouchableOpacity style={styles.signOutBtn} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0284c7" />
          <Text style={styles.loadingText}>Syncing live Cloud SQL data...</Text>
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
              tintColor="#38bdf8"
            />
          }
        >
          {/* Capital & Equity Hero Card */}
          <View style={styles.metricCard}>
            <Text style={styles.cardHeader}>SYNDICATE CAPITAL ACCOUNT</Text>
            <Text style={styles.heroAmount}>
              {formatCurrency(partner?.actualInvested || 3000000)}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>EQUITY SHARE</Text>
                <Text style={styles.metaValue}>{partner?.fixedEquityPercent || 65}%</Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaLabel}>COMMITTED CAPITAL</Text>
                <Text style={styles.metaValue}>{formatCurrency(partner?.initialCapital || 39000000)}</Text>
              </View>
            </View>
          </View>

          {/* Bank Escrow Balance */}
          <View style={styles.escrowCard}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.escrowTitle}>Axis Bank Escrow Balance</Text>
                <Text style={styles.escrowSub}>RERA Project Escrow Account</Text>
              </View>
              <Text style={styles.escrowAmount}>
                {formatCurrency(bankAccount?.currentBalance || 3000000)}
              </Text>
            </View>
          </View>

          {/* Active Venture Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACTIVE VENTURE</Text>
            <View style={styles.projectCard}>
              <Text style={styles.projectName}>{project?.name || 'Katavaram Phase 1'}</Text>
              <Text style={styles.projectLocation}>
                {project?.location || 'Katavaram / Vijayawada, Andhra Pradesh'}
              </Text>

              <View style={styles.projectStatsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>{data?.plots?.length || 24}</Text>
                  <Text style={styles.statCaption}>Total Plots</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: '#10b981' }]}>
                    {data?.plots?.filter((p: any) => p.status === 'available').length || 18}
                  </Text>
                  <Text style={styles.statCaption}>Available</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: '#f59e0b' }]}>
                    {data?.plots?.filter((p: any) => p.status === 'booked' || p.status === 'blocked').length || 6}
                  </Text>
                  <Text style={styles.statCaption}>Booked</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Capital Inflows History */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CAPITAL INFUSION HISTORY</Text>
            {data?.investments?.map((inv: any, idx: number) => (
              <View key={inv.id || idx} style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txDesc}>{inv.purpose || 'Partner Capital Infusion'}</Text>
                  <Text style={styles.txDate}>{inv.date} • {inv.paymentMode}</Text>
                </View>
                <Text style={styles.txAmount}>+{formatCurrency(inv.amount)}</Text>
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
  greeting: {
    color: '#94a3b8',
    fontSize: 12,
  },
  userName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  firmTag: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700',
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
  metricCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 16,
  },
  cardHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '800',
    marginVertical: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingTop: 12,
    marginTop: 6,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  metaValue: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  escrowCard: {
    backgroundColor: '#142a42',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#0369a1',
    marginBottom: 20,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escrowTitle: {
    color: '#bae6fd',
    fontWeight: '700',
    fontSize: 13,
  },
  escrowSub: {
    color: '#7dd3fc',
    fontSize: 11,
  },
  escrowAmount: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 12,
  },
  projectCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  projectName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  projectLocation: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
    marginBottom: 14,
  },
  projectStatsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  statNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  statCaption: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  txRow: {
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
    fontWeight: '600',
    fontSize: 13,
  },
  txDate: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: 14,
  },
});
