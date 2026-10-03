import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { formatMoney } from '../config';
import { Transaction } from '../types';
import { Badge } from './ui';

export const TxRow = ({ tx, onPress }: { tx: Transaction; onPress?: () => void }) => (
  <Pressable onPress={onPress} className="flex-row items-center justify-between border-b border-slate-100 py-3">
    <View className="flex-1 pr-3">
      <Text className="text-base font-medium text-slate-900" numberOfLines={1}>
        {tx.beneficiaryName}
      </Text>
      <Text className="text-xs text-slate-500">
        {new Date(tx.createdAt).toLocaleString()} · {tx.channel}
      </Text>
      {tx.hits.length > 0 && (
        <Text className="mt-0.5 text-xs text-amber-700" numberOfLines={1}>
          {tx.hits.map((h) => h.title).join(' · ')}
        </Text>
      )}
    </View>
    <View className="items-end gap-1">
      <Text className={`text-base font-semibold ${tx.decision === 'BLOCKED' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
        -{formatMoney(tx.amount)}
      </Text>
      <Badge decision={tx.decision} />
    </View>
  </Pressable>
);
