import React from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Badge, Button, Card, SectionTitle } from '../components/ui';
import { formatMoney } from '../config';
import { useStore } from '../store';
import { RuleConfig } from '../types';

function Stepper({ value, step, min = 0, onChange, fmt = (n: number) => String(n) }: {
  value: number; step: number; min?: number; onChange: (n: number) => void; fmt?: (n: number) => string;
}) {
  return (
    <View className="flex-row items-center">
      <Pressable className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100" onPress={() => onChange(Math.max(min, value - step))}>
        <Text className="text-lg font-bold text-slate-700">−</Text>
      </Pressable>
      <Text className="min-w-[96px] text-center text-sm font-semibold text-slate-900">{fmt(value)}</Text>
      <Pressable className="h-8 w-8 items-center justify-center rounded-lg bg-slate-100" onPress={() => onChange(value + step)}>
        <Text className="text-lg font-bold text-slate-700">+</Text>
      </Pressable>
    </View>
  );
}

function RuleRow({ title, desc, enabled, onToggle, children }: {
  title: string; desc: string; enabled: boolean; onToggle: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <View className="border-b border-slate-100 py-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="font-semibold text-slate-900">{title}</Text>
          <Text className="text-xs text-slate-500">{desc}</Text>
        </View>
        <Switch value={enabled} onValueChange={onToggle} />
      </View>
      {enabled && !!children && <View className="mt-2 flex-row items-center justify-end">{children}</View>}
    </View>
  );
}

export function Monitor() {
  const { transactions, rules, setRules, resetRules, resetSession } = useStore();
  const alerts = transactions.filter((t) => t.decision !== 'ALLOWED');
  const set = <K extends keyof RuleConfig>(k: K, patch: Partial<RuleConfig[K]>) =>
    setRules({ ...rules, [k]: { ...(rules[k] as object), ...patch } });
  const money = (n: number) => formatMoney(n).replace(/\.00$/, '');

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">
      <Text className="text-2xl font-bold text-slate-900">Monitoring</Text>

      <SectionTitle>Alerts ({alerts.length})</SectionTitle>
      <Card>
        {alerts.length === 0 ? (
          <Text className="py-3 text-center text-slate-500">No alerts. Try a large or rapid transfer.</Text>
        ) : (
          alerts.map((t) => (
            <View key={t.id} className="border-b border-slate-100 py-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-slate-900">{formatMoney(t.amount)} → {t.beneficiaryName}</Text>
                <Badge decision={t.decision} />
              </View>
              <Text className="mt-0.5 text-xs text-slate-500">Score {t.riskScore} · {new Date(t.createdAt).toLocaleTimeString()}</Text>
              {t.hits.map((h) => (
                <Text key={h.ruleId} className="mt-1 text-sm text-slate-700">• {h.title}: {h.detail}</Text>
              ))}
            </View>
          ))
        )}
      </Card>

      <SectionTitle>Rules</SectionTitle>
      <Card>
        <RuleRow title="Large amount" desc="Single transfer at/above threshold" enabled={rules.largeAmount.enabled}
          onToggle={(v) => set('largeAmount', { enabled: v })}>
          <Stepper value={rules.largeAmount.threshold} step={100_000} min={100_000} fmt={money} onChange={(n) => set('largeAmount', { threshold: n })} />
        </RuleRow>
        <RuleRow title="Velocity" desc="Too many transfers in a short window" enabled={rules.velocity.enabled}
          onToggle={(v) => set('velocity', { enabled: v })}>
          <Stepper value={rules.velocity.maxCount} step={1} min={1} fmt={(n) => `max ${n}`} onChange={(n) => set('velocity', { maxCount: n })} />
        </RuleRow>
        <RuleRow title="Structuring" desc="Repeated amounts just under the large-amount limit" enabled={rules.structuring.enabled}
          onToggle={(v) => set('structuring', { enabled: v })}>
          <Stepper value={rules.structuring.minCount} step={1} min={2} fmt={(n) => `${n}+ per day`} onChange={(n) => set('structuring', { minCount: n })} />
        </RuleRow>
        <RuleRow title="New beneficiary" desc="High value to a recently added payee" enabled={rules.newBeneficiary.enabled}
          onToggle={(v) => set('newBeneficiary', { enabled: v })}>
          <Stepper value={rules.newBeneficiary.threshold} step={50_000} min={50_000} fmt={money} onChange={(n) => set('newBeneficiary', { threshold: n })} />
        </RuleRow>
        <RuleRow title="Unusual hours" desc="Transfers between 00:00 and 05:00" enabled={rules.oddHours.enabled}
          onToggle={(v) => set('oddHours', { enabled: v })}>
          <Stepper value={rules.oddHours.threshold} step={50_000} min={0} fmt={(n) => `≥ ${money(n)}`} onChange={(n) => set('oddHours', { threshold: n })} />
        </RuleRow>
        <RuleRow title="High-risk country" desc="Origin on the watchlist" enabled={rules.highRiskCountry.enabled}
          onToggle={(v) => set('highRiskCountry', { enabled: v })} />
        <RuleRow title="Daily limit" desc="Total sent in a day" enabled={rules.dailyLimit.enabled}
          onToggle={(v) => set('dailyLimit', { enabled: v })}>
          <Stepper value={rules.dailyLimit.limit} step={250_000} min={250_000} fmt={money} onChange={(n) => set('dailyLimit', { limit: n })} />
        </RuleRow>
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-sm text-slate-700">Flag at score</Text>
          <Stepper value={rules.flagScore} step={5} min={5} onChange={(n) => setRules({ ...rules, flagScore: Math.min(n, rules.blockScore) })} />
        </View>
        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-sm text-slate-700">Block at score</Text>
          <Stepper value={rules.blockScore} step={5} min={5} onChange={(n) => setRules({ ...rules, blockScore: Math.max(n, rules.flagScore) })} />
        </View>
      </Card>

      <View className="mt-4 gap-3">
        <Button title="Reset rules to defaults" variant="ghost" onPress={resetRules} />
        <Button
          title="Reset balance & history"
          variant="danger"
          onPress={() =>
            Alert.alert('Reset sandbox?', 'This clears all transactions and restores the starting balance.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Reset', style: 'destructive', onPress: resetSession },
            ])
          }
        />
      </View>
    </ScrollView>
  );
}
