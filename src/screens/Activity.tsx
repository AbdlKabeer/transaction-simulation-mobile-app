import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { TxRow } from '../components/TxRow';
import { Card } from "../components/ui";
import { useStore } from '../store';
import { Result } from './Send';
import { Transaction } from '../types';

export function Activity() {
  const { transactions } = useStore();
  const [open, setOpen] = useState<Transaction | null>(null);
  if (open) return (
    <View className="flex-1">
      <Result tx={open} onDone={() => setOpen(null)} />
    </View>
  );
  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">
      <Text className="mb-4 text-2xl font-bold text-slate-900">Activity</Text>
      <Card>
        {transactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-500">Nothing here yet.</Text>
        ) : (
          transactions.map((t) => <TxRow key={t.id} tx={t} onPress={() => setOpen(t)} />)
        )}
      </Card>
    </ScrollView>
  );
}
