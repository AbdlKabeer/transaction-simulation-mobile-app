import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { Text } from '../components/Typography';
import { JsonView } from '../components/JsonView';
import { Badge, Button, Card, ScreenHeader, SectionTitle } from '../components/ui';
import { confirm } from '../notify';
import { SCENARIOS, summarise } from '../scenarios';
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
        <Switch value={enabled} onValueChange={onToggle} trackColor={{ true: "#309D92", false: "#cbd5e1" }} thumbColor="#ffffff" />
      </View>
      {enabled && !!children && <View className="mt-2 flex-row items-center justify-end">{children}</View>}
    </View>
  );
}

export function Monitor() {
  const { transactions, rules, events, send, recordFailedPin, logScenario, setRules, resetRules, resetSession } = useStore();
  const [lastRun, setLastRun] = useState('');
  const [openEvent, setOpenEvent] = useState<string | null>(null);
  const alerts = transactions.filter((t) => t.decision !== 'ALLOWED');
  const set = <K extends keyof RuleConfig>(k: K, patch: Partial<RuleConfig[K]>) =>
    setRules({ ...rules, [k]: { ...(rules[k] as object), ...patch } });
  const money = (n: number) => formatMoney(n).replace(/\.00$/, '');

  return (
    <View className="flex-1">
    <ScreenHeader title="Monitoring" />
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">

      <SectionTitle>Run a test scenario</SectionTitle>
      <Card>
        <Text className="mb-2 text-xs text-slate-500">One tap sends the transfers needed to trigger a rule. Results appear in Alerts below.</Text>
        {!!lastRun && (
          <View className="mb-2 rounded-xl bg-brand-50 p-3">
            <Text className="text-sm font-medium text-brand-900">{lastRun}</Text>
          </View>
        )}
        {SCENARIOS.map((sc) => (
          <View key={sc.id} className="flex-row items-center border-b border-slate-100 py-3">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-slate-900">{sc.title}</Text>
              <Text className="text-xs text-slate-500">{sc.desc}</Text>
              <Text className="text-[11px] text-brand-600">Expect: {sc.expect}</Text>
            </View>
            <Pressable
              onPress={() => {
                const res = sc.run({ send, failPin: recordFailedPin, rules });
                const msg = `${sc.title}: ${summarise(res)}`;
                logScenario(`Scenario · ${sc.title}`);
                setLastRun(msg);
              }}
              className="rounded-full bg-brand-600 px-4 py-2 active:opacity-80"
            >
              <Text className="text-sm font-semibold text-white">Run</Text>
            </Pressable>
          </View>
        ))}
      </Card>

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
        <RuleRow title="Failed PIN attempts" desc="Repeated wrong PINs before a transfer" enabled={rules.failedPin.enabled}
          onToggle={(v) => set('failedPin', { enabled: v })}>
          <Stepper value={rules.failedPin.maxAttempts} step={1} min={1} fmt={(n) => `${n}+ in ${rules.failedPin.windowMinutes}m`} onChange={(n) => set('failedPin', { maxAttempts: n })} />
        </RuleRow>
        <RuleRow title="New device" desc="High value from an unrecognised device" enabled={rules.newDevice.enabled}
          onToggle={(v) => set('newDevice', { enabled: v })}>
          <Stepper value={rules.newDevice.threshold} step={50_000} min={0} fmt={(n) => `≥ ${money(n)}`} onChange={(n) => set('newDevice', { threshold: n })} />
        </RuleRow>
        <RuleRow title="Dormant account" desc="Inactive account suddenly sends money" enabled={rules.dormant.enabled}
          onToggle={(v) => set('dormant', { enabled: v })}>
          <Stepper value={rules.dormant.threshold} step={50_000} min={0} fmt={(n) => `≥ ${money(n)}`} onChange={(n) => set('dormant', { threshold: n })} />
        </RuleRow>
        <RuleRow title="Impossible travel" desc="Different countries in a short window" enabled={rules.geoVelocity.enabled}
          onToggle={(v) => set('geoVelocity', { enabled: v })}>
          <Stepper value={rules.geoVelocity.windowMinutes} step={15} min={15} fmt={(n) => `${n} min`} onChange={(n) => set('geoVelocity', { windowMinutes: n })} />
        </RuleRow>
        <RuleRow title="Unusual amount for payee" desc="Much bigger than usual for this payee" enabled={rules.payeeAnomaly.enabled}
          onToggle={(v) => set('payeeAnomaly', { enabled: v })}>
          <Stepper value={rules.payeeAnomaly.multiplier} step={1} min={2} fmt={(n) => `${n}x usual`} onChange={(n) => set('payeeAnomaly', { multiplier: n })} />
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

      <SectionTitle>Event log ({events.length})</SectionTitle>
      <Card>
        {events.length === 0 ? (
          <Text className="py-3 text-center text-slate-500">No events yet.</Text>
        ) : (
          events.slice(0, 30).map((e) => {
            const open = openEvent === e.id;
            return (
              <View key={e.id} className="border-b border-slate-100 py-2.5">
                <Pressable onPress={() => setOpenEvent(open ? null : e.id)} className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[11px] font-bold uppercase text-slate-400">{e.type.replace('_', ' ')} · {new Date(e.at).toLocaleTimeString()}</Text>
                    <Text className="text-sm text-slate-800">{e.summary}</Text>
                  </View>
                  {(e.request || e.response) && <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" />}
                </Pressable>
                {open && (
                  <View className="mt-2">
                    {e.request && <JsonView label="Request" data={e.request} />}
                    {e.response && <JsonView label="Response" data={e.response} />}
                  </View>
                )}
              </View>
            );
          })
        )}
      </Card>

      <View className="mt-4 gap-3">
        <Button title="Reset rules to defaults" variant="ghost" onPress={resetRules} />
        <Button
          title="Reset balance & history"
          variant="danger"
          onPress={() => confirm('Reset sandbox?', 'This clears all transactions and events and restores the starting balance.', 'Reset', resetSession)}
        />
      </View>
    </ScrollView>
    </View>
  );
}
