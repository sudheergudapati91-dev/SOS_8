import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import ChangePinScreen from './src/screens/ChangePinScreen';
import PartnerDashboardScreen from './src/screens/PartnerDashboardScreen';
import AccountantDashboardScreen from './src/screens/AccountantDashboardScreen';
import { MobileAuthUser } from './src/api/config';

export default function App() {
  const [currentUser, setCurrentUser] = useState<MobileAuthUser | null>(null);
  const [changePinPendingUser, setChangePinPendingUser] = useState<MobileAuthUser | null>(null);

  const handleLoginSuccess = (user: MobileAuthUser) => {
    setChangePinPendingUser(null);
    setCurrentUser(user);
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setChangePinPendingUser(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {changePinPendingUser ? (
        <ChangePinScreen
          route={{ params: { user: changePinPendingUser, onLoginSuccess: handleLoginSuccess } }}
          navigation={{
            navigate: () => {},
          }}
        />
      ) : !currentUser ? (
        <LoginScreen
          navigation={{
            navigate: (screen: string, params: any) => {
              if (screen === 'ChangePin') {
                setChangePinPendingUser(params.user);
              }
            },
          }}
          onLoginSuccess={handleLoginSuccess}
        />
      ) : currentUser.role === 'accountant' ? (
        <AccountantDashboardScreen user={currentUser} onSignOut={handleSignOut} />
      ) : (
        <PartnerDashboardScreen user={currentUser} onSignOut={handleSignOut} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
});
