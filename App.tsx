import './global.css';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from './src/screens/Activity';
import { Home } from './src/screens/Home';
import { Login } from './src/screens/Login';
import { Monitor } from './src/screens/Monitor';
import { Send } from './src/screens/Send';
import { StoreProvider, useStore } from './src/store';

type Tab = 'home' | 'send' | 'activity' | 'monitor';
const TABS: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'send', label: 'Send' },
  { key: 'activity', label: 'Activity' },
  { key: 'monitor', label: 'Monitoring' },
];

function Shell() {
  const { account, ready, logout } = useStore();
  const [tab, setTab] = useState<Tab>('home');

  if (!ready) return <View className="flex-1 bg-brand-900" />;
  if (!account) return <Login />;

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-row items-center justify-between bg-white px-5 py-3 border-b border-slate-100">
        <Text className="text-lg font-extrabold text-brand-700">Nova Bank <Text className="text-xs font-semibold text-amber-600">SANDBOX</Text></Text>
        <Pressable onPress={logout}><Text className="text-sm text-slate-500">Log out</Text></Pressable>
      </View>
      <View className="flex-1">
        {tab === 'home' && <Home go={setTab} />}
        {tab === 'send' && <Send />}
        {tab === 'activity' && <Activity />}
        {tab === 'monitor' && <Monitor />}
      </View>
      <View className="flex-row border-t border-slate-200 bg-white">
        {TABS.map((t) => (
          <Pressable key={t.key} onPress={() => setTab(t.key)} className="flex-1 items-center py-3.5">
            <Text className={`text-sm ${tab === t.key ? 'font-bold text-brand-600' : 'text-slate-500'}`}>{t.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}
