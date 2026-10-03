import React from 'react';
import { View } from 'react-native';
import { Text } from './Typography';

export const JsonView = ({ label, data }: { label: string; data: unknown }) => (
  <View className="mb-3 overflow-hidden rounded-xl bg-brand-900">
    <Text className="px-3 pt-2 text-[11px] font-bold uppercase tracking-wider text-brand-500">{label}</Text>
    <Text selectable className="px-3 pb-3 pt-1 text-[11px] leading-4 text-brand-100" style={{ fontFamily: 'Menlo, Consolas, monospace' }}>
      {JSON.stringify(data, null, 2)}
    </Text>
  </View>
);
