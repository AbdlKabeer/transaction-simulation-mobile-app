import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_RULES, SEED_BENEFICIARIES, STARTING_BALANCE } from './config';
import { evaluate } from './engine';
import { Account, Beneficiary, Channel, LogEvent, RuleConfig, Transaction } from './types';

interface Persisted {
  account: Account | null;
  beneficiaries: Beneficiary[];
  transactions: Transaction[];
  failedPins: number[];
  events: LogEvent[];
  rules: RuleConfig;
}

export interface SendInput {
  recipient: { name: string; bank: string; accountNumber: string };
  amount: number;
  narration: string;
  channel: Channel;
  country: string;
  /** Hour of day (0-23) to pretend the transfer happens at; null = now. */
  simulatedHour: number | null;
  newDevice?: boolean;
  dormant?: boolean;
}

interface Store extends Persisted {
  ready: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
  send: (input: SendInput) => Transaction | string;
  recordFailedPin: () => void;
  logScenario: (summary: string) => void;
  setRules: (r: RuleConfig) => void;
  resetRules: () => void;
  resetSession: () => void;
}

const KEY = 'prembly-sandbox-v1';
const MAX_EVENTS = 200;
const Ctx = createContext<Store | null>(null);

const seed = (): Beneficiary[] =>
  // Seeded beneficiaries are "old" so only newly added ones trigger the new-beneficiary rule.
  SEED_BENEFICIARIES.map((b) => ({ ...b, createdAt: Date.now() - 30 * 86_400_000 }));

const fresh = (account: Account | null): Persisted => ({
  account,
  beneficiaries: seed(),
  transactions: [],
  failedPins: [],
  events: [],
  rules: DEFAULT_RULES,
});

const mergeSaved = (saved: Partial<Persisted>): Persisted => ({
  ...fresh(null),
  ...saved,
  // Older saves lack newer rules; fill them in from defaults.
  rules: { ...DEFAULT_RULES, ...(saved.rules ?? {}) },
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(fresh(null));
  const [ready, setReady] = useState(false);
  // Always-current copy so several calls in the same tick (scenarios) see each other's writes.
  const ref = useRef(state);
  const commit = useCallback((fn: (s: Persisted) => Persisted) => {
    ref.current = fn(ref.current);
    setState(ref.current);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && commit(() => mergeSaved(JSON.parse(raw))))
      .catch(() => {})
      .finally(() => setReady(true));
  }, [commit]);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const login = useCallback(
    (name: string, email: string) =>
      commit((s) =>
        s.account
          ? s
          : fresh({
              name,
              email,
              accountNumber: String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)),
              balance: STARTING_BALANCE,
            }),
      ),
    [commit],
  );

  const logout = useCallback(() => commit((s) => ({ ...s, account: null })), [commit]);

  const pushEvent = (s: Persisted, e: Omit<LogEvent, 'id' | 'at'>): Persisted => ({
    ...s,
    events: [{ ...e, id: `E${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`, at: Date.now() }, ...s.events].slice(0, MAX_EVENTS),
  });

  const send = useCallback(
    (input: SendInput): Transaction | string => {
      const { account, beneficiaries, transactions, rules, failedPins } = ref.current;
      if (!account) return 'Not logged in.';
      if (!(input.amount > 0)) return 'Enter an amount greater than zero.';
      if (input.amount > account.balance) return 'Insufficient funds.';

      const now = Date.now();
      const existing = beneficiaries.find(
        (b) => b.accountNumber === input.recipient.accountNumber && b.bank === input.recipient.bank,
      );
      const ben: Beneficiary = existing ?? { ...input.recipient, id: `b${now}${Math.random().toString(36).slice(2, 5)}`, createdAt: now };

      let effectiveAt = now;
      if (input.simulatedHour !== null) {
        const d = new Date(now);
        d.setHours(input.simulatedHour, 0, 0, 0);
        effectiveAt = d.getTime();
      }
      const newDevice = !!input.newDevice;
      const dormant = !!input.dormant;
      const result = evaluate(
        { amount: input.amount, beneficiary: ben, effectiveAt, country: input.country, now, newDevice, dormant },
        transactions,
        rules,
        failedPins,
      );
      const id = `T${now.toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
      const request = {
        event: 'transaction.initiated',
        transactionId: id,
        timestamp: new Date(now).toISOString(),
        effectiveTimestamp: new Date(effectiveAt).toISOString(),
        amount: input.amount,
        currency: 'NGN',
        channel: input.channel,
        country: input.country,
        device: { status: newDevice ? 'NEW' : 'KNOWN' },
        account: { number: account.accountNumber, balance: account.balance, status: dormant ? 'DORMANT' : 'ACTIVE' },
        beneficiary: {
          name: ben.name,
          bank: ben.bank,
          accountNumber: ben.accountNumber,
          ageMinutes: Math.round((now - ben.createdAt) / 60000),
        },
        context: {
          failedPinAttempts: failedPins.filter((t) => t >= now - 10 * 60000).length,
          transfersLast10Min: transactions.filter((t) => t.effectiveAt >= effectiveAt - 10 * 60000).length,
        },
      };
      const response = {
        transactionId: id,
        decision: result.decision,
        riskScore: result.riskScore,
        rules: result.hits.map((h) => ({ id: h.ruleId, title: h.title, score: h.score, detail: h.detail })),
      };
      const tx: Transaction = {
        id,
        createdAt: now,
        effectiveAt,
        amount: input.amount,
        beneficiaryId: ben.id,
        beneficiaryName: ben.name,
        beneficiaryBank: ben.bank,
        beneficiaryAccount: ben.accountNumber,
        narration: input.narration,
        channel: input.channel,
        country: input.country,
        newDevice,
        dormant,
        request,
        response,
        ...result,
      };
      commit((s) =>
        pushEvent(
          {
            ...s,
            beneficiaries: existing ? s.beneficiaries : [ben, ...s.beneficiaries],
            account: s.account && {
              ...s.account,
              balance: tx.decision === 'BLOCKED' ? s.account.balance : s.account.balance - tx.amount,
            },
            transactions: [tx, ...s.transactions],
          },
          { type: 'TRANSACTION', summary: `${tx.decision} · ₦${tx.amount.toLocaleString()} → ${tx.beneficiaryName}`, request, response },
        ),
      );
      return tx;
    },
    [commit],
  );

  const recordFailedPin = useCallback(
    () =>
      commit((s) => {
        const at = Date.now();
        const count = s.failedPins.filter((t) => t >= at - 10 * 60000).length + 1;
        return pushEvent(
          { ...s, failedPins: [at, ...s.failedPins].slice(0, 50) },
          {
            type: 'FAILED_PIN',
            summary: `Incorrect PIN (${count} in the last 10 min)`,
            request: { event: 'auth.pin_failed', timestamp: new Date(at).toISOString(), attemptsLast10Min: count },
          },
        );
      }),
    [commit],
  );

  const logScenario = useCallback((summary: string) => commit((s) => pushEvent(s, { type: 'SCENARIO', summary })), [commit]);
  const setRules = useCallback((rules: RuleConfig) => commit((s) => ({ ...s, rules })), [commit]);
  const resetRules = useCallback(() => commit((s) => ({ ...s, rules: DEFAULT_RULES })), [commit]);
  const resetSession = useCallback(
    () => commit((s) => ({ ...fresh(s.account && { ...s.account, balance: STARTING_BALANCE }), rules: s.rules })),
    [commit],
  );

  const value = useMemo(
    () => ({ ...state, ready, login, logout, send, recordFailedPin, logScenario, setRules, resetRules, resetSession }),
    [state, ready, login, logout, send, recordFailedPin, logScenario, setRules, resetRules, resetSession],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
};
