import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { verifyFirm, loginWithPin, MobileAuthUser } from '../api/config';

interface Props {
  navigation: any;
  onLoginSuccess: (user: MobileAuthUser) => void;
}

export default function LoginScreen({ navigation, onLoginSuccess }: Props) {
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [firmCode, setFirmCode] = useState('SC-AP');
  const [phone, setPhone] = useState('9848011111');
  const [pin, setPin] = useState('9999');
  const [loading, setLoading] = useState(false);
  const [firmName, setFirmName] = useState('Satya Constructions');

  const handleVerifyFirm = async () => {
    if (!firmCode.trim()) {
      Alert.alert('Required', 'Please enter a Firm Code');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyFirm(firmCode.trim());
      if (res.valid && res.firm) {
        setFirmName(res.firm.name);
        Alert.alert('Verified', `Firm verified: ${res.firm.name} (${res.firm.code})`);
      } else {
        Alert.alert('Invalid Code', 'Firm Code not found in PostgreSQL registry.');
      }
    } catch (e: any) {
      Alert.alert('Connection Error', e.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) {
      Alert.alert('Required', 'Enter 10-digit mobile number and 4-digit PIN');
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithPin(
        phone.trim(),
        pin.trim(),
        isSuperAdminMode ? undefined : firmCode.trim()
      );

      if (user.mustChangePin) {
        navigation.navigate('ChangePin', { user, onLoginSuccess });
      } else {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials or connection timeout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.brandBadge}>SYNDICATE-OS MOBILE</Text>
          <Text style={styles.title}>Partner & Accountant Portal</Text>
          <Text style={styles.subtitle}>
            Direct Mobile & PIN Access for AP / Telangana Syndicates
          </Text>
        </View>

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, !isSuperAdminMode && styles.toggleBtnActive]}
            onPress={() => {
              setIsSuperAdminMode(false);
              setPhone('9848011111');
            }}
          >
            <Text style={[styles.toggleText, !isSuperAdminMode && styles.toggleTextActive]}>
              Firm Member
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, isSuperAdminMode && styles.toggleBtnActive]}
            onPress={() => {
              setIsSuperAdminMode(true);
              setPhone('9550247162');
            }}
          >
            <Text style={[styles.toggleText, isSuperAdminMode && styles.toggleTextActive]}>
              Super Admin
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          {!isSuperAdminMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>FIRM CODE</Text>
              <View style={styles.row}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="e.g. SC-AP"
                  placeholderTextColor="#64748b"
                  value={firmCode}
                  onChangeText={setFirmCode}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={styles.verifyBtn}
                  onPress={handleVerifyFirm}
                  disabled={loading}
                >
                  <Text style={styles.verifyBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
              {firmName ? (
                <Text style={styles.firmBadge}>✓ {firmName}</Text>
              ) : null}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>REGISTERED MOBILE NUMBER</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>4-DIGIT SECURITY PIN</Text>
            <TextInput
              style={styles.input}
              placeholder="••••"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              value={pin}
              onChangeText={setPin}
            />
            <Text style={styles.hint}>Default PIN is 9999 for first-time login</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Authorize & Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔒 Connected to Cloud SQL PostgreSQL Backend
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadge: {
    color: '#06b6d4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleBtnActive: {
    backgroundColor: '#0284c7',
  },
  toggleText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 14,
  },
  toggleTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  verifyBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 10,
  },
  verifyBtnText: {
    color: '#38bdf8',
    fontWeight: '700',
  },
  firmBadge: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
  },
  footerText: {
    color: '#475569',
    fontSize: 12,
  },
});
