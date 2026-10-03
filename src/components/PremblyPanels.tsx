import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Typography';
import { JsonView } from './JsonView';
import { Button, Card } from './ui';
import { previewSignals } from '../prembly';
import { PremblyResult } from '../types';

const PILL: Record<string, string[]> = {
  approved: ['bg-emerald-100', 'text-emerald-700'],
  pending_review: ['bg-amber-100', 'text-amber-800'],
  flagged: ['bg-amber-100', 'text-amber-800'],
  blocked: ['bg-red-100', 'text-red-700'],
};

/** Monitoring tab: what the device SDK collects on this phone (for testing). */
export function PremblyDeviceSignals() {
  const [signals, setSignals] = useState<unknown>(null);
  return (
    <Card>
      <Text className="mb-3 text-xs text-slate-500">
        Transfers are also screened by Prembly with this phone&apos;s device session from the Prembly TM SDK. This shows exactly what the SDK reads.
      </Text>
      <Button
        title="Preview device signals"
        variant="ghost"
        onPress={async () => setSignals((await previewSignals()) ?? { error: 'The SDK could not read the device.' })}
      />
      {signals !== null && (
        <View className="mt-3">
          <JsonView label="What the SDK collects" data={signals} />
        </View>
      )}
    </Card>
  );
}

/** Receipt: what Prembly's backend decided, and whether the SDK's device session was used. */
export function PremblyResultCard({ result }: { result: PremblyResult }) {
  const [raw, setRaw] = useState(false);
  const pill = PILL[result.decision ?? ''] ?? ['bg-slate-100', 'text-slate-600'];

  return (
    <Card className="mt-4">
      <View className="mb-1 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="cloud-done-outline" size={20} color="#101944" />
          <Text className="ml-2 font-bold text-brand-900">Prembly TM (server)</Text>
        </View>
        {result.status === 'done' && (
          <View className={`rounded-full px-2.5 py-1 ${pill[0]}`}>
            <Text className={`text-xs font-bold ${pill[1]}`}>{(result.decision ?? '').replace('_', ' ').toUpperCase()}</Text>
          </View>
        )}
      </View>

      {result.status === 'pending' && <Text className="text-sm text-slate-600">Screening with Prembly…</Text>}
      {result.status === 'error' && <Text className="text-sm text-red-700">{result.error}</Text>}

      {result.status === 'done' && (
        <>
          <Text className="mb-2 text-xs text-slate-500">
            Risk score {result.riskScore}/100 · {result.riskLevel}
          </Text>
          {result.rules.length === 0 ? (
            <Text className="text-sm text-slate-600">No rules triggered.</Text>
          ) : (
            result.rules.map((r) => (
              <Text key={r.name} className="mb-1 text-sm text-slate-800">
                • {r.name}
                {r.severity ? <Text className="text-slate-400"> ({r.severity})</Text> : null}
              </Text>
            ))
          )}
        </>
      )}

      <View className={`mt-3 rounded-xl p-3 ${result.deviceSessionUsed ? 'bg-brand-50' : 'bg-slate-50'}`}>
        <Text className="text-xs font-bold uppercase tracking-wide text-slate-500">Device session (SDK)</Text>
        <Text className="mt-1 text-sm text-slate-800">
          {result.deviceSessionUsed
            ? 'Used: Prembly joined this phone’s signals to the transfer.'
            : result.status === 'error' && result.deviceSessionId
              ? 'A device session existed, but Prembly could not be reached to use it.'
              : result.deviceSessionId
              ? `Created but not used (${result.deviceSessionReason || 'unknown'}).`
              : `None (${result.sdkError ?? 'not created'}). The SDK fails open, so the transfer was screened without it.`}
        </Text>
        {!!result.deviceSessionId && (
          <Text selectable className="mt-1 text-[11px] text-slate-500">
            {result.deviceSessionId}
          </Text>
        )}
      </View>

      {!!result.response && (
        <>
          <Pressable onPress={() => setRaw(!raw)} className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-semibold text-brand-900">Raw request / response</Text>
            <Ionicons name={raw ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
          </Pressable>
          {raw && (
            <View className="mt-2">
              <JsonView label="Request" data={result.request} />
              <JsonView label="Response" data={result.response} />
            </View>
          )}
        </>
      )}
    </Card>
  );
}
