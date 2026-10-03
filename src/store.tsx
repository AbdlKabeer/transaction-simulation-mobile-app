import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_RULES, SEED_BENEFICIARIES, STARTING_BALANCE } from './config';
import { evaluate } from './engine';
import { Account, Beneficiary, Channel, RuleConfig, Transaction } from './types';

interface Persisted {
  account: Account | null;
  beneficiaries: Beneficiary[];
  transactions: Transaction[];
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
}

interface Store extends Persisted {
  ready: boolean;
  login: (name: string, email: string) => void;
  logout: () => void;
  send: (input: SendInput) => Transaction | string;
  setRules: (r: RuleConfig) => void;
  resetRules: () => void;
  resetSession: () => void;
}

const KEY = 'nova-sandbox-v1';
const Ctx = createContext<Store | null>(null);

const seed = (): Beneficiary[] =>
  // Seeded beneficiaries are "old" so only newly added ones trigger the new-beneficiary rule.
  SEED_BENEFICIARIES.map((b) => ({ ...b, createdAt: Date.now() - 30 * 86_400_000 }));

const fresh = (account: Account | null): Persisted => ({
  account,
  beneficiaries: seed(),
  transactions: [],
  rules: DEFAULT_RULES,
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Persisted>(fresh(null));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => raw && setState(JSON.parse(raw)))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  const login = useCallback((name: string, email: string) => {
    setState((s) =>
      s.account
        ? s
        : fresh({
            name,
            email,
            accountNumber: String(Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)),
            balance: STARTING_BALANCE,
          }),
    );
  }, []);

  const logout = useCallback(() => setState((s) => ({ ...s, account: null })), []);

  const send = useCallback(
    (input: SendInput): Transaction | string => {
      const { account, beneficiaries, transactions, rules } = state;
      if (!account) return 'Not logged in.';
      const now = Date.now();
      const existing = beneficiaries.find(
        (b) => b.accountNumber === input.recipient.accountNumber && b.bank === input.recipient.bank,
      );
      const ben: Beneficiary = existing ?? { ...input.recipient, id: `b${now}`, createdAt: now };
      if (!(input.amount > 0)) return 'Enter an amount greater than zero.';
      if (input.amount > account.balance) return 'Insufficient funds.';

      let effectiveAt = now;
      if (input.simulatedHour !== null) {
        const d = new Date(now);
        d.setHours(input.simulatedHour, 0, 0, 0);
        effectiveAt = d.getTime();
      }
      const result = evaluate(
        { amount: input.amount, beneficiary: ben, effectiveAt, country: input.country, now },
        transactions,
        rules,
      );
      const tx: Transaction = {
        id: `T${now.toString(36).toUpperCase()}`,
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
        ...result,
      };
      setState((s) => ({
        ...s,
        beneficiaries: existing ? s.beneficiaries : [ben, ...s.beneficiaries],
        account: s.account && {
          ...s.account,
          balance: tx.decision === 'BLOCKED' ? s.account.balance : s.account.balance - tx.amount,
        },
        transactions: [tx, ...s.transactions],
      }));
      return tx;
    },
    [state],
  );

  const setRules = useCallback((rules: RuleConfig) => setState((s) => ({ ...s, rules })), []);
  const resetRules = useCallback(() => setState((s) => ({ ...s, rules: DEFAULT_RULES })), []);
  const resetSession = useCallback(
    () =>
      setState((s) => ({
        ...fresh(s.account && { ...s.account, balance: STARTING_BALANCE }),
        rules: s.rules,
      })),
    [],
  );

  const value = useMemo(
    () => ({ ...state, ready, login, logout, send, setRules, resetRules, resetSession }),
    [state, ready, login, logout, send, setRules, resetRules, resetSession],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
};
