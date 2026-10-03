import './global.css';
import { Ionicons } from '@expo/vector-icons';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './src/components/Typography';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Activity } from './src/screens/Activity';
import { Home, SendPreset, Tab } from './src/screens/Home';
import { Login } from './src/screens/Login';
import { Monitor } from './src/screens/Monitor';
import { Send } from './src/screens/Send';
import { StoreProvider, useStore } from './src/store';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
const TABS: { key: Tab; label: string; icon: Icon; active: Icon }[] = [
  { key: 'home', label: 'Home', icon: 'home-outline', active: 'home' },
  { key: 'send', label: 'Transfer', icon: 'swap-horizontal-outline', active: 'swap-horizontal' },
  { key: 'activity', label: 'Activity', icon: 'receipt-outline', active: 'receipt' },
  { key: 'monitor', label: 'Monitoring', icon: 'shield-checkmark-outline', active: 'shield-checkmark' },
];

function Shell() {
  const { account, ready } = useStore();
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });
  const [tab, setTab] = useState<Tab>('home');
  const [preset, setPreset] = useState<SendPreset>(undefined);
  const [sendKey, setSendKey] = useState(0);

  if (!ready || !(fontsLoaded || fontError)) return <View className="flex-1 bg-brand-900" />;
  if (!account) return <Login />;

  const go = (t: Tab, p?: SendPreset) => {
    if (t === 'send') {
      setPreset(p);
      setSendKey((k) => k + 1); // fresh transfer flow each time it is opened from a shortcut
    }
    setTab(t);
  };

  return (
    <SafeAreaView className="flex-1 bg-app">
      <View className="items-center bg-amber-100 py-1">
        <Text className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">Sandbox · no real money</Text>
      </View>
      <View className="flex-1">
        {tab === 'home' && <Home go={go} />}
        {tab === 'send' && <Send key={sendKey} preset={preset} />}
        {tab === 'activity' && <Activity />}
        {tab === 'monitor' && <Monitor />}
      </View>
      <View className="flex-row border-t border-slate-200 bg-white pb-1">
        {TABS.map((t) => {
          const on = tab === t.key;
          return (
            <Pressable key={t.key} onPress={() => (t.key === 'send' && tab !== 'send' ? go('send') : setTab(t.key))} className="flex-1 items-center py-2.5">
              <Ionicons name={on ? t.active : t.icon} size={22} color={on ? '#309D92' : '#94a3b8'} />
              <Text className={`mt-0.5 text-[11px] ${on ? 'font-bold text-brand-600' : 'text-slate-500'}`}>{t.label}</Text>
            </Pressable>
          );
        })}
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
