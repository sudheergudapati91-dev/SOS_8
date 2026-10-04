import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { changePin, MobileAuthUser } from '../api/config';

interface Props {
  route: { params: { user: MobileAuthUser; onLoginSuccess: (user: MobileAuthUser) => void } };
  navigation: any;
}

export default function ChangePinScreen({ route }: Props) {
  const { user, onLoginSuccess } = route.params;
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSavePin = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit numeric PIN.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Mismatch', 'New PIN and Confirm PIN do not match.');
      return;
    }
    if (newPin === '9999') {
      Alert.alert('Security Alert', 'You cannot reuse the default PIN (9999).');
      return;
    }

    setLoading(true);
    try {
      await changePin(user.phone, newPin);
      Alert.alert('Success', 'PIN changed successfully!', [
        {
          text: 'Enter Dashboard',
          onPress: () => {
            onLoginSuccess({ ...user, mustChangePin: false });
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.badge}>MANDATORY FIRST-TIME SECURITY SETUP</Text>
        <Text style={styles.title}>Set Your Private 4-Digit PIN</Text>
        <Text style={styles.subtitle}>
          Welcome, {user.name}! Please replace the default PIN (9999) with your private PIN to access your syndicate dashboard.
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>ENTER NEW 4-DIGIT PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            value={newPin}
            onChangeText={setNewPin}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CONFIRM 4-DIGIT PIN</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            placeholderTextColor="#64748b"
            keyboardType="number-pad"
            maxLength={4}
            secureTextEntry
            value={confirmPin}
            onChangeText={setConfirmPin}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSavePin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.btnText}>Save PIN & Enter Portal</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  badge: {
    color: '#f59e0b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 20,
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#334155',
    textAlign: 'center',
    letterSpacing: 8,
  },
  btn: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
