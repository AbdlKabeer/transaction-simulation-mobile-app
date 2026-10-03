import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from '../components/Typography';
import { TxRow } from '../components/TxRow';
import { Card, ScreenHeader } from "../components/ui";
import { useStore } from '../store';
import { Receipt } from './Send';
import { Transaction } from '../types';

export function Activity() {
  const { transactions } = useStore();
  const [open, setOpen] = useState<Transaction | null>(null);
  if (open) return <Receipt tx={open} onDone={() => setOpen(null)} />;
  return (
    <View className="flex-1">
    <ScreenHeader title="Transactions" />
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">
      <Card>
        {transactions.length === 0 ? (
          <Text className="py-4 text-center text-slate-500">Nothing here yet.</Text>
        ) : (
          transactions.map((t) => <TxRow key={t.id} tx={t} onPress={() => setOpen(t)} />)
        )}
      </Card>
    </ScrollView>
    </View>
  );
}
