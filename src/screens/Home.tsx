import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { TxRow } from '../components/TxRow';
import { Card, IconBubble } from '../components/ui';
import { formatMoney } from '../config';
import { useStore } from '../store';

type Icon = React.ComponentProps<typeof Ionicons>['name'];
export type SendPreset = 'bank' | 'own' | undefined;
export type Tab = 'home' | 'send' | 'activity' | 'monitor';

const ACTIONS: { label: string; icon: Icon; action: 'own' | 'bank' | 'activity' | 'monitor' | 'soon' }[] = [
  { label: 'To Prembly Bank', icon: 'person-outline', action: 'own' },
  { label: 'To Bank', icon: 'business-outline', action: 'bank' },
  { label: 'Activity', icon: 'receipt-outline', action: 'activity' },
  { label: 'Monitoring', icon: 'shield-checkmark-outline', action: 'monitor' },
  { label: 'Airtime', icon: 'call-outline', action: 'soon' },
  { label: 'Data', icon: 'wifi-outline', action: 'soon' },
  { label: 'Electricity', icon: 'bulb-outline', action: 'soon' },
  { label: 'TV', icon: 'tv-outline', action: 'soon' },
];

export function Home({ go }: { go: (tab: Tab, preset?: SendPreset) => void }) {
  const { account, transactions, logout } = useStore();
  const [hidden, setHidden] = useState(false);
  if (!account) return null;
  const flagged = transactions.filter((t) => t.decision !== 'ALLOWED').length;

  const run = (a: (typeof ACTIONS)[number]['action']) => {
    if (a === 'own' || a === 'bank') go('send', a);
    else if (a === 'activity' || a === 'monitor') go(a);
    else Alert.alert('Not in the sandbox', 'Only transfers are simulated in this test app.');
  };

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8">
      <View className="flex-row items-center justify-between px-5 pb-3 pt-4">
        <View className="flex-row items-center">
          <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-600">
            <Text className="text-lg font-bold text-white">{account.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text className="text-xs text-slate-500">Good day 👋</Text>
            <Text className="text-base font-bold text-brand-900">{account.name}</Text>
          </View>
        </View>
        <Pressable onPress={logout} hitSlop={10} className="flex-row items-center">
          <Ionicons name="log-out-outline" size={22} color="#64748b" />
        </Pressable>
      </View>

      <View className="mx-5 overflow-hidden rounded-3xl bg-brand-700 p-5">
        <View className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-600 opacity-30" />
        <View className="absolute -bottom-16 right-10 h-40 w-40 rounded-full bg-brand-900 opacity-30" />
        <View className="flex-row items-center">
          <Text className="text-sm text-brand-100">Available balance</Text>
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={10} className="ml-2">
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={18} color="#CFE0F5" />
          </Pressable>
        </View>
        <Text className="mt-1 text-4xl font-extrabold text-white">{hidden ? '₦ ••••••' : formatMoney(account.balance)}</Text>
        <View className="mt-4 flex-row items-center justify-between">
          <Text className="text-xs text-brand-100">Prembly Bank · {account.accountNumber}</Text>
          <Pressable onPress={() => go('send')} className="flex-row items-center rounded-full bg-brand-600 px-4 py-2">
            <Ionicons name="add" size={16} color="#fff" />
            <Text className="ml-1 text-sm font-semibold text-white">Transfer</Text>
          </Pressable>
        </View>
      </View>

      <Card className="mx-5 mt-4">
        <View className="flex-row flex-wrap">
          {ACTIONS.map((a) => (
            <Pressable key={a.label} onPress={() => run(a.action)} className="w-1/4 items-center py-2.5">
              <View className={a.action === 'soon' ? 'opacity-40' : ''}>
                <IconBubble name={a.icon} />
              </View>
              <Text className={`mt-1.5 text-center text-xs ${a.action === 'soon' ? 'text-slate-400' : 'text-slate-700'}`}>{a.label}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Pressable onPress={() => go('send')} className="mx-5 mt-4 flex-row items-center rounded-2xl bg-brand-900 p-4">
        <View className="flex-1 pr-3">
          <Text className="text-base font-bold text-white">Test the monitoring rules</Text>
          <Text className="mt-0.5 text-xs text-brand-100">Try a ₦600,000 transfer, five quick transfers, or a 2am payment.</Text>
        </View>
        <Ionicons name="arrow-forward-circle" size={32} color="#309D92" />
      </Pressable>

      {flagged > 0 && (
        <Pressable onPress={() => go('monitor')} className="mx-5 mt-4 flex-row items-center rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <Ionicons name="warning-outline" size={22} color="#92400e" />
          <Text className="ml-3 flex-1 font-semibold text-amber-900">
            {flagged} transaction{flagged > 1 ? 's' : ''} flagged or blocked · View alerts
          </Text>
        </Pressable>
      )}

      <View className="mx-5 mt-5 flex-row items-center justify-between">
        <Text className="text-base font-bold text-brand-900">Transactions</Text>
        <Pressable onPress={() => go('activity')}><Text className="text-sm font-semibold text-brand-600">View all</Text></Pressable>
      </View>
      <Card className="mx-5 mt-2">
        {transactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-500">No transactions yet. Send money to start testing.</Text>
        ) : (
          transactions.slice(0, 4).map((t) => <TxRow key={t.id} tx={t} onPress={() => go('activity')} />)
        )}
      </Card>
    </ScrollView>
  );
}
