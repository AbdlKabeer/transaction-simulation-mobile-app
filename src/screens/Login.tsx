import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Button, Field } from '../components/ui';
import { useStore } from '../store';

export function Login() {
  const { login } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <View className="flex-1 justify-center bg-brand-900 px-6">
      <Text className="text-4xl font-extrabold text-white">Nova Bank</Text>
      <Text className="mb-8 mt-1 text-base text-brand-100">Transaction monitoring sandbox</Text>
      <View className="rounded-2xl bg-white p-5">
        <Text className="mb-4 text-sm text-slate-600">
          This is a test environment. No real money moves. Enter any details to get a demo account with ₦2,000,000.
        </Text>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="jane@company.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Button title="Enter sandbox" disabled={!name.trim()} onPress={() => login(name.trim(), email.trim())} />
      </View>
    </View>
  );
}
