import { formatMoney } from './config';
import { SendInput } from './store';
import { RuleConfig, Transaction } from './types';

export interface ScenarioApi {
  send: (input: SendInput) => Transaction | string;
  failPin: () => void;
  rules: RuleConfig;
}

export interface Scenario {
  id: string;
  title: string;
  desc: string;
  expect: string;
  run: (api: ScenarioApi) => (Transaction | string)[];
}

const KNOWN = { name: 'Adaeze Okafor', bank: 'Prembly Bank', accountNumber: '0123456789' };
const base = { narration: 'Scenario', channel: 'MOBILE' as const, country: 'Nigeria', simulatedHour: null };
const newPayee = () => ({
  name: 'TEST PAYEE',
  bank: 'Kuda',
  accountNumber: String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)),
});

export const SCENARIOS: Scenario[] = [
  {
    id: 'large',
    title: 'Large transfer',
    desc: 'One transfer above the large-amount limit.',
    expect: 'Large transaction',
    run: ({ send, rules }) => [send({ ...base, recipient: KNOWN, amount: rules.largeAmount.threshold + 100_000 })],
  },
  {
    id: 'rapid',
    title: 'Rapid-fire transfers',
    desc: 'Five small transfers within seconds.',
    expect: 'High velocity',
    run: ({ send, rules }) =>
      Array.from({ length: rules.velocity.maxCount + 2 }, () => send({ ...base, recipient: KNOWN, amount: 10_000 })),
  },
  {
    id: 'structuring',
    title: 'Structuring',
    desc: 'Several transfers just under the large-amount limit.',
    expect: 'Possible structuring',
    run: ({ send, rules }) =>
      Array.from({ length: rules.structuring.minCount }, () =>
        send({ ...base, recipient: KNOWN, amount: Math.round(rules.largeAmount.threshold * 0.95) }),
      ),
  },
  {
    id: 'midnight',
    title: 'Midnight transfer',
    desc: 'A ₦150,000 transfer at 02:00.',
    expect: 'Unusual hour',
    run: ({ send }) => [send({ ...base, recipient: KNOWN, amount: 150_000, simulatedHour: 2 })],
  },
  {
    id: 'new-payee',
    title: 'New payee, big amount',
    desc: 'First-ever transfer to a brand new account.',
    expect: 'New beneficiary, high value',
    run: ({ send, rules }) => [send({ ...base, recipient: newPayee(), amount: rules.newBeneficiary.threshold + 50_000 })],
  },
  {
    id: 'high-risk',
    title: 'High-risk country',
    desc: 'A small transfer originating from Iran.',
    expect: 'High-risk jurisdiction',
    run: ({ send }) => [send({ ...base, recipient: KNOWN, amount: 20_000, country: 'Iran' })],
  },
  {
    id: 'pin',
    title: 'Failed PIN attempts',
    desc: 'Three wrong PINs, then a transfer.',
    expect: 'Repeated failed PIN',
    run: ({ send, failPin, rules }) => {
      for (let i = 0; i < rules.failedPin.maxAttempts; i++) failPin();
      return [send({ ...base, recipient: KNOWN, amount: 25_000 })];
    },
  },
  {
    id: 'device',
    title: 'New device',
    desc: 'High-value transfer from an unrecognised device.',
    expect: 'New device, high value',
    run: ({ send, rules }) => [send({ ...base, recipient: KNOWN, amount: rules.newDevice.threshold + 50_000, newDevice: true })],
  },
  {
    id: 'travel',
    title: 'Impossible travel',
    desc: 'Transfer from Nigeria, then the UK minutes later.',
    expect: 'Impossible travel',
    run: ({ send }) => [
      send({ ...base, recipient: KNOWN, amount: 15_000 }),
      send({ ...base, recipient: KNOWN, amount: 15_000, country: 'United Kingdom' }),
    ],
  },
  {
    id: 'dormant',
    title: 'Dormant account wakes up',
    desc: 'Account inactive for 180+ days sends money.',
    expect: 'Dormant account reactivated',
    run: ({ send, rules }) => [send({ ...base, recipient: KNOWN, amount: rules.dormant.threshold + 50_000, dormant: true })],
  },
  {
    id: 'payee-anomaly',
    title: 'Unusual amount for payee',
    desc: 'Two small payments, then one much bigger.',
    expect: 'Unusual amount for payee',
    run: ({ send, rules }) => [
      send({ ...base, recipient: KNOWN, amount: 5_000 }),
      send({ ...base, recipient: KNOWN, amount: 5_000 }),
      send({ ...base, recipient: KNOWN, amount: 5_000 * rules.payeeAnomaly.multiplier }),
    ],
  },
];

export const summarise = (results: (Transaction | string)[]) => {
  const txs = results.filter((r): r is Transaction => typeof r !== 'string');
  const errs = results.filter((r): r is string => typeof r === 'string');
  if (txs.length === 0) return errs[0] ?? 'Nothing ran.';
  const last = txs[txs.length - 1];
  const rules = Array.from(new Set(txs.flatMap((t) => t.hits.map((h) => h.title))));
  return `${txs.length} transfer${txs.length > 1 ? 's' : ''} sent · last ${formatMoney(last.amount)} ${last.decision}${
    rules.length ? ` · ${rules.join(', ')}` : ' · no rules triggered'
  }${errs.length ? ` · ${errs[0]}` : ''}`;
};
