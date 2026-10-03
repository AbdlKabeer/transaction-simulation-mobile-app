import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Badge, Button, Card, Chip, IconBubble, PinPad, ScreenHeader } from '../components/ui';
import { BANKS, COUNTRIES, DEMO_PIN, formatMoney, resolveAccountName } from '../config';
import { useStore } from '../store';
import { Channel, Transaction } from '../types';
import { SendPreset } from './Home';

type Step = 'recipient' | 'amount' | 'confirm' | 'pin' | 'processing' | 'receipt';
const CHANNELS: Channel[] = ['MOBILE', 'WEB', 'ATM', 'POS'];
const HOURS: { label: string; hour: number | null }[] = [
  { label: 'Now', hour: null },
  { label: '02:00', hour: 2 },
  { label: '09:00', hour: 9 },
  { label: '14:00', hour: 14 },
  { label: '23:00', hour: 23 },
];

const Label = ({ children }: { children: React.ReactNode }) => (
  <Text className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</Text>
);

export function Send({ preset }: { preset?: SendPreset }) {
  const { beneficiaries, send, account } = useStore();
  const [step, setStep] = useState<Step>('recipient');
  const [bank, setBank] = useState(preset === 'own' ? 'Pueblo Bank' : '');
  const [acct, setAcct] = useState('');
  const [bankOpen, setBankOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [channel, setChannel] = useState<Channel>('MOBILE');
  const [country, setCountry] = useState('Nigeria');
  const [hour, setHour] = useState<number | null>(null);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [error, setError] = useState('');
  const [tx, setTx] = useState<Transaction | null>(null);

  const name = acct.length === 10 && bank ? resolveAccountName(bank, acct, beneficiaries) : '';
  const amt = Number(amount.replace(/,/g, ''));

  const reset = () => {
    setStep('recipient'); setAcct(''); setBank(''); setAmount(''); setNarration(''); setPin(''); setPinError(''); setError(''); setTx(null);
  };

  // Verify the PIN once four digits are entered.
  useEffect(() => {
    if (step !== 'pin' || pin.length !== 4) return;
    if (pin === DEMO_PIN) { setStep('processing'); return; }
    setPinError('Incorrect PIN. Try again.');
    const t = setTimeout(() => setPin(''), 400);
    return () => clearTimeout(t);
  }, [pin, step]);

  // Simulated processing delay, then hand the transfer to the monitoring engine.
  useEffect(() => {
    if (step !== 'processing') return;
    const t = setTimeout(() => {
      const out = send({
        recipient: { name, bank, accountNumber: acct },
        amount: amt, narration, channel, country, simulatedHour: hour,
      });
      if (typeof out === 'string') { setError(out); setPin(''); setStep('amount'); }
      else { setTx(out); setStep('receipt'); }
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === 'receipt' && tx) return <Receipt tx={tx} onDone={reset} />;

  if (step === 'processing')
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#309D92" />
        <Text className="mt-4 text-base font-semibold text-brand-900">Processing your transfer…</Text>
      </View>
    );

  if (step === 'pin')
    return (
      <View className="flex-1 bg-app">
        <ScreenHeader title="Enter payment PIN" onBack={() => { setPin(''); setPinError(''); setStep('confirm'); }} />
        <View className="flex-1 justify-center px-8">
          <Text className="mb-1 text-center text-sm text-slate-500">Paying {name}</Text>
          <Text className="mb-8 text-center text-3xl font-extrabold text-brand-900">{formatMoney(amt)}</Text>
          <PinPad value={pin} onChange={(v) => { setPinError(''); setPin(v); }} />
          <Text className="mt-6 h-5 text-center text-sm font-medium text-red-600">{pinError}</Text>
          <Text className="text-center text-xs text-slate-400">Sandbox PIN: {DEMO_PIN}</Text>
        </View>
      </View>
    );

  if (step === 'confirm')
    return (
      <View className="flex-1 bg-app">
        <ScreenHeader title="Confirm transfer" onBack={() => setStep('amount')} />
        <ScrollView contentContainerClassName="p-5">
          <View className="items-center py-5">
            <Text className="text-sm text-slate-500">Amount</Text>
            <Text className="mt-1 text-4xl font-extrabold text-brand-900">{formatMoney(amt)}</Text>
          </View>
          <Card>
            {[
              ['To', name],
              ['Bank', bank],
              ['Account number', acct],
              ['Narration', narration || '—'],
              ['Fee', formatMoney(0)],
            ].map(([k, v]) => (
              <View key={k} className="flex-row justify-between border-b border-slate-100 py-3">
                <Text className="text-slate-500">{k}</Text>
                <Text className="ml-4 flex-1 text-right font-semibold text-slate-900">{v}</Text>
              </View>
            ))}
            <View className="flex-row justify-between py-3">
              <Text className="text-slate-500">Pay from</Text>
              <Text className="font-semibold text-slate-900">Balance {account ? formatMoney(account.balance) : ''}</Text>
            </View>
          </Card>
          <View className="mt-5"><Button title="Pay" onPress={() => setStep('pin')} /></View>
        </ScrollView>
      </View>
    );

  if (step === 'amount')
    return (
      <View className="flex-1 bg-app">
        <ScreenHeader title="Transfer" onBack={() => setStep('recipient')} />
        <ScrollView contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">
          <Card className="flex-row items-center">
            <IconBubble name="person-outline" />
            <View className="ml-3 flex-1">
              <Text className="font-bold text-brand-900">{name}</Text>
              <Text className="text-xs text-slate-500">{bank} · {acct}</Text>
            </View>
          </Card>

          <Card className="mt-4">
            <Label>Amount</Label>
            <View className="flex-row items-center border-b border-slate-200 pb-2">
              <Text className="mr-2 text-3xl font-bold text-brand-900">₦</Text>
              <TextInput
                value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" placeholderTextColor="#cbd5e1"
                className="flex-1 text-3xl font-bold text-brand-900"
              />
            </View>
            <Text className="mt-2 text-xs text-slate-500">Balance {account ? formatMoney(account.balance) : ''}</Text>
            <View className="mt-3 flex-row flex-wrap">
              {[5000, 20000, 100000, 500000].map((n) => (
                <Chip key={n} label={`₦${n.toLocaleString()}`} active={amt === n} onPress={() => setAmount(String(n))} />
              ))}
            </View>
            <View className="mt-1 border-t border-slate-100 pt-3">
              <Label>Narration (optional)</Label>
              <TextInput
                value={narration} onChangeText={setNarration} placeholder="What's it for?" placeholderTextColor="#94a3b8"
                className="text-base text-slate-900"
              />
            </View>
          </Card>

          <Card className="mt-4 border-amber-200 bg-amber-50">
            <View className="mb-2 flex-row items-center">
              <Ionicons name="flask-outline" size={18} color="#92400e" />
              <Text className="ml-2 font-bold text-amber-900">Test conditions (sandbox only)</Text>
            </View>
            <Text className="mb-3 text-xs text-amber-800">Pretend this transfer happens under different conditions to trigger monitoring rules.</Text>
            <Text className="mb-1 text-xs font-semibold text-slate-700">Channel</Text>
            <View className="flex-row flex-wrap">
              {CHANNELS.map((c) => <Chip key={c} label={c} active={c === channel} onPress={() => setChannel(c)} />)}
            </View>
            <Text className="mb-1 text-xs font-semibold text-slate-700">Time of day</Text>
            <View className="flex-row flex-wrap">
              {HOURS.map((h) => <Chip key={h.label} label={h.label} active={h.hour === hour} onPress={() => setHour(h.hour)} />)}
            </View>
            <Text className="mb-1 text-xs font-semibold text-slate-700">Originating country</Text>
            <View className="flex-row flex-wrap">
              {COUNTRIES.map((c) => <Chip key={c} label={c} active={c === country} onPress={() => setCountry(c)} />)}
            </View>
          </Card>

          {!!error && <Text className="mt-3 text-sm font-medium text-red-600">{error}</Text>}
          <View className="mt-5">
            <Button
              title="Next"
              disabled={!(amt > 0)}
              onPress={() => {
                if (account && amt > account.balance) return setError('Insufficient balance.');
                setError('');
                setStep('confirm');
              }}
            />
          </View>
        </ScrollView>
      </View>
    );

  // recipient
  const recents = beneficiaries.slice(0, 5);
  return (
    <View className="flex-1 bg-app">
      <ScreenHeader title={preset === 'own' ? 'Transfer to Pueblo Bank' : 'Transfer to bank account'} />
      <ScrollView contentContainerClassName="p-5 pb-10" keyboardShouldPersistTaps="handled">
        <Card>
          <Label>Bank</Label>
          <Pressable onPress={() => setBankOpen(!bankOpen)} className="mb-3 flex-row items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <Text className={bank ? 'text-base text-slate-900' : 'text-base text-slate-400'}>{bank || 'Select bank'}</Text>
            <Ionicons name={bankOpen ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
          </Pressable>
          {bankOpen && (
            <View className="mb-3 flex-row flex-wrap">
              {BANKS.map((b) => <Chip key={b} label={b} active={b === bank} onPress={() => { setBank(b); setBankOpen(false); }} />)}
            </View>
          )}
          <Label>Account number</Label>
          <TextInput
            value={acct} onChangeText={(v) => setAcct(v.replace(/\D/g, '').slice(0, 10))} keyboardType="number-pad" maxLength={10}
            placeholder="10-digit account number" placeholderTextColor="#94a3b8"
            className="rounded-xl border border-slate-200 px-4 py-3 text-base text-slate-900"
          />
          {name ? (
            <View className="mt-3 flex-row items-center rounded-xl bg-brand-50 px-3 py-3">
              <Ionicons name="checkmark-circle" size={20} color="#309D92" />
              <Text className="ml-2 font-bold text-brand-900">{name}</Text>
            </View>
          ) : (
            <Text className="mt-2 text-xs text-slate-500">{bank ? 'Enter 10 digits to verify the account name.' : 'Pick a bank, then enter the account number.'}</Text>
          )}
        </Card>

        <View className="mt-4"><Button title="Next" disabled={!name} onPress={() => setStep('amount')} /></View>

        <Text className="mb-2 mt-6 text-sm font-bold text-brand-900">Recent recipients</Text>
        <Card>
          {recents.map((b, i) => (
            <Pressable
              key={b.id}
              onPress={() => { setBank(b.bank); setAcct(b.accountNumber); }}
              className={`flex-row items-center py-3 ${i < recents.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Text className="font-bold text-brand-600">{b.name.charAt(0)}</Text>
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-900">{b.name}</Text>
                <Text className="text-xs text-slate-500">{b.bank} · {b.accountNumber}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </Pressable>
          ))}
        </Card>
      </ScrollView>
    </View>
  );
}

export function Receipt({ tx, onDone }: { tx: Transaction; onDone: () => void }) {
  const meta = {
    ALLOWED: { icon: 'checkmark-circle', color: '#16a34a', title: 'Transfer successful' },
    FLAGGED: { icon: 'checkmark-circle', color: '#d97706', title: 'Transfer sent — under review' },
    BLOCKED: { icon: 'close-circle', color: '#dc2626', title: 'Transfer declined' },
  }[tx.decision] as { icon: 'checkmark-circle' | 'close-circle'; color: string; title: string };

  return (
    <View className="flex-1 bg-app">
      <ScreenHeader title="Transaction details" />
      <ScrollView contentContainerClassName="p-5 pb-10">
        <View className="items-center py-4">
          <Ionicons name={meta.icon} size={64} color={meta.color} />
          <Text className="mt-2 text-xl font-bold text-brand-900">{meta.title}</Text>
          <Text className="mt-1 text-3xl font-extrabold text-brand-900">{formatMoney(tx.amount)}</Text>
          <Text className="mt-1 text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</Text>
        </View>

        <Card>
          {[
            ['Recipient', tx.beneficiaryName],
            ['Bank', tx.beneficiaryBank],
            ['Account number', tx.beneficiaryAccount],
            ['Narration', tx.narration || '—'],
            ['Channel', tx.channel],
            ['Reference', tx.id],
          ].map(([k, v], i, a) => (
            <View key={k} className={`flex-row justify-between py-3 ${i < a.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <Text className="text-slate-500">{k}</Text>
              <Text className="ml-4 flex-1 text-right font-semibold text-slate-900">{v}</Text>
            </View>
          ))}
        </Card>

        <Card className="mt-4">
          <View className="mb-1 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#101944" />
              <Text className="ml-2 font-bold text-brand-900">Monitoring result</Text>
            </View>
            <Badge decision={tx.decision} />
          </View>
          <Text className="mb-3 text-xs text-slate-500">Risk score {tx.riskScore}/100</Text>
          {tx.hits.length === 0 ? (
            <Text className="text-sm text-slate-600">No rules triggered. This looked like normal behaviour.</Text>
          ) : (
            tx.hits.map((h) => (
              <View key={h.ruleId} className="mb-2">
                <Text className="font-semibold text-slate-900">{h.title} <Text className="text-slate-400">+{h.score}</Text></Text>
                <Text className="text-sm text-slate-600">{h.detail}</Text>
              </View>
            ))
          )}
        </Card>
        <View className="mt-5"><Button title="Done" onPress={onDone} /></View>
      </ScrollView>
    </View>
  );
}
