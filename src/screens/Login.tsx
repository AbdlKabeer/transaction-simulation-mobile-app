import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { Button, Field } from '../components/ui';
import { connect, DEFAULT_CONNECTION, loadConnection } from '../prembly';
import { useStore } from '../store';

/**
 * Sign in with the organisation's simulation credentials (copied from the Prembly dashboard). This
 * connects the app to Prembly's backend and starts the device SDK; the demo customer account is
 * created from the organisation's name.
 */
export function Login() {
  const { login } = useStore();
  const [username, setUsername] = useState(DEFAULT_CONNECTION.username);
  const [password, setPassword] = useState(DEFAULT_CONNECTION.password);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Fill in the last credentials used on this device, if any.
  useEffect(() => {
    loadConnection().then((saved) => {
      if (!saved) return;
      setUsername(saved.username);
      setPassword(saved.password);
    });
  }, []);

  const ready = username.trim() && password;

  const signIn = async () => {
    setBusy(true);
    setError('');
    const result = await connect({ ...DEFAULT_CONNECTION, simulationKey: '', username, password });
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    login(result.organisationName || 'Prembly Sandbox', username.trim(), result.currency);
  };

  return (
    <ScrollView className="flex-1 bg-brand-600" contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
      <Text className="text-4xl font-extrabold text-white">Prembly Bank</Text>
      <Text className="mb-8 mt-1 text-base text-brand-50">Transaction monitoring sandbox</Text>
      <View className="rounded-2xl bg-white p-5">
        <Text className="mb-4 text-sm text-slate-600">
          Sign in with your Transaction Monitoring simulation username and password from the Prembly dashboard. No real money moves; you get a demo account with a starting balance in your organisation's currency.
        </Text>
        <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
        <Field label="Password" value={password} onChangeText={setPassword} autoCapitalize="none" autoCorrect={false} secureTextEntry />
        {!!error && (
          <View className="mb-4 rounded-xl bg-red-50 p-3">
            <Text className="text-sm text-red-700">{error}</Text>
          </View>
        )}
        <Button title={busy ? 'Signing in…' : 'Sign in'} disabled={!ready || busy} onPress={signIn} />
      </View>
    </ScrollView>
  );
}
