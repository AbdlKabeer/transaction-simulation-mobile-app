import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { TxRow } from '../components/TxRow';
import { Button, Card, SectionTitle } from '../components/ui';
import { formatMoney } from '../config';
import { useStore } from '../store';

export function Home({ go }: { go: (tab: 'send' | 'activity' | 'monitor') => void }) {
  const { account, transactions } = useStore();
  const flagged = transactions.filter((t) => t.decision !== 'ALLOWED').length;
  if (!account) return null;

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">
      <Text className="text-base text-slate-500">Welcome back,</Text>
      <Text className="mb-4 text-2xl font-bold text-slate-900">{account.name}</Text>

      <View className="rounded-3xl bg-brand-600 p-5">
        <Text className="text-sm text-brand-100">Available balance</Text>
        <Text className="mt-1 text-4xl font-extrabold text-white">{formatMoney(account.balance)}</Text>
        <Text className="mt-3 text-xs text-brand-100">Account {account.accountNumber} · Savings</Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1"><Button title="Send money" onPress={() => go('send')} /></View>
        <View className="flex-1"><Button title="Monitoring" variant="ghost" onPress={() => go('monitor')} /></View>
      </View>

      {flagged > 0 && (
        <Card className="mt-4 border-amber-200 bg-amber-50">
          <Text className="font-semibold text-amber-900">
            {flagged} transaction{flagged > 1 ? 's' : ''} flagged or blocked
          </Text>
          <Text className="mt-1 text-sm text-amber-800">See the Monitoring tab for the rules that triggered.</Text>
        </Card>
      )}

      <SectionTitle>Recent activity</SectionTitle>
      <Card>
        {transactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-500">No transactions yet. Send money to start testing.</Text>
        ) : (
          transactions.slice(0, 5).map((t) => <TxRow key={t.id} tx={t} onPress={() => go('activity')} />)
        )}
      </Card>
    </ScrollView>
  );
}
