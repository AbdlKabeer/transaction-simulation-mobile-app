import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Badge, Button, Card, Chip, Field, SectionTitle } from '../components/ui';
import { COUNTRIES, formatMoney } from '../config';
import { useStore } from '../store';
import { Channel, Transaction } from '../types';

const CHANNELS: Channel[] = ['MOBILE', 'WEB', 'ATM', 'POS'];
const HOURS: { label: string; hour: number | null }[] = [
  { label: 'Now', hour: null },
  { label: '02:00', hour: 2 },
  { label: '09:00', hour: 9 },
  { label: '14:00', hour: 14 },
  { label: '23:00', hour: 23 },
];

export function Send() {
  const { beneficiaries, addBeneficiary, send, account } = useStore();
  const [benId, setBenId] = useState(beneficiaries[0]?.id ?? '');
  const [adding, setAdding] = useState(false);
  const [nb, setNb] = useState({ name: '', bank: '', accountNumber: '' });
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [channel, setChannel] = useState<Channel>('MOBILE');
  const [country, setCountry] = useState('Nigeria');
  const [hour, setHour] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Transaction | null>(null);

  const submit = () => {
    setError('');
    const out = send({
      beneficiaryId: benId,
      amount: Number(amount.replace(/,/g, '')),
      narration,
      channel,
      country,
      simulatedHour: hour,
    });
    if (typeof out === 'string') setError(out);
    else setResult(out);
  };

  if (result) return <Result tx={result} onDone={() => { setResult(null); setAmount(''); setNarration(''); }} />;

  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">
      <Text className="mb-1 text-2xl font-bold text-slate-900">Send money</Text>
      <Text className="mb-4 text-sm text-slate-500">Balance {account ? formatMoney(account.balance) : ''}</Text>

      <Text className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">To</Text>
      <View className="flex-row flex-wrap">
        {beneficiaries.map((b) => (
          <Chip key={b.id} label={b.name} active={b.id === benId} onPress={() => setBenId(b.id)} />
        ))}
        <Chip label="+ New beneficiary" active={adding} onPress={() => setAdding(!adding)} />
      </View>

      {adding && (
        <Card className="mb-4">
          <Field label="Name" value={nb.name} onChangeText={(v) => setNb({ ...nb, name: v })} />
          <Field label="Bank" value={nb.bank} onChangeText={(v) => setNb({ ...nb, bank: v })} />
          <Field
            label="Account number"
            value={nb.accountNumber}
            keyboardType="number-pad"
            onChangeText={(v) => setNb({ ...nb, accountNumber: v })}
          />
          <Button
            title="Save beneficiary"
            disabled={!nb.name.trim() || !nb.accountNumber.trim()}
            onPress={() => {
              const b = addBeneficiary({ name: nb.name.trim(), bank: nb.bank.trim() || 'Other', accountNumber: nb.accountNumber.trim() });
              setBenId(b.id);
              setNb({ name: '', bank: '', accountNumber: '' });
              setAdding(false);
            }}
          />
        </Card>
      )}

      <Field label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />
      <Field label="Narration" value={narration} onChangeText={setNarration} placeholder="What's it for?" />

      <SectionTitle>Simulation controls</SectionTitle>
      <Text className="mb-2 text-xs text-slate-500">Pretend the transfer happens in different conditions to trigger rules.</Text>
      <Text className="mb-1 text-xs font-medium text-slate-600">Channel</Text>
      <View className="flex-row flex-wrap">
        {CHANNELS.map((c) => <Chip key={c} label={c} active={c === channel} onPress={() => setChannel(c)} />)}
      </View>
      <Text className="mb-1 text-xs font-medium text-slate-600">Time of day</Text>
      <View className="flex-row flex-wrap">
        {HOURS.map((h) => <Chip key={h.label} label={h.label} active={h.hour === hour} onPress={() => setHour(h.hour)} />)}
      </View>
      <Text className="mb-1 text-xs font-medium text-slate-600">Originating country</Text>
      <View className="mb-4 flex-row flex-wrap">
        {COUNTRIES.map((c) => <Chip key={c} label={c} active={c === country} onPress={() => setCountry(c)} />)}
      </View>

      {!!error && <Text className="mb-3 text-sm font-medium text-red-600">{error}</Text>}
      <Button title="Send" onPress={submit} />
    </ScrollView>
  );
}

export function Result({ tx, onDone }: { tx: Transaction; onDone: () => void }) {
  const title = { ALLOWED: 'Transfer successful', FLAGGED: 'Sent — flagged for review', BLOCKED: 'Transfer blocked' }[tx.decision];
  return (
    <ScrollView className="flex-1" contentContainerClassName="p-5 pb-10">
      <View className="items-center py-6">
        <Badge decision={tx.decision} />
        <Text className="mt-3 text-2xl font-bold text-slate-900">{title}</Text>
        <Text className="mt-1 text-slate-500">
          {formatMoney(tx.amount)} to {tx.beneficiaryName}
        </Text>
        <Text className="mt-3 text-sm text-slate-500">Risk score</Text>
        <Text className="text-4xl font-extrabold text-slate-900">{tx.riskScore}<Text className="text-lg text-slate-400">/100</Text></Text>
      </View>
      <Card>
        <Text className="mb-2 font-semibold text-slate-900">Rules triggered</Text>
        {tx.hits.length === 0 ? (
          <Text className="text-slate-500">None — this looked like normal behaviour.</Text>
        ) : (
          tx.hits.map((h) => (
            <View key={h.ruleId} className="mb-3">
              <Text className="font-medium text-slate-900">{h.title} <Text className="text-slate-400">+{h.score}</Text></Text>
              <Text className="text-sm text-slate-600">{h.detail}</Text>
            </View>
          ))
        )}
      </Card>
      <View className="mt-4"><Button title="Done" onPress={onDone} /></View>
    </ScrollView>
  );
}
