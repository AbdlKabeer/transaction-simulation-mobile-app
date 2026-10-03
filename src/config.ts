import { RuleConfig } from './types';

// The organisation's currency (a 3-letter code such as NGN, USD or GBP). It is set at sign-in from
// the organisation's settings in Prembly, and every amount in the app is shown in it.
let currencyCode = 'NGN';
export const setCurrency = (code?: string | null) => {
  const next = (code ?? '').trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(next)) currencyCode = next;
};
export const getCurrency = () => currencyCode;

// Symbols for common currencies. Looked up here, not with Intl, because React Native's JavaScript
// engine does not reliably support currency symbols.
const SYMBOLS: Record<string, string> = {
  NGN: '₦', USD: '$', GBP: '£', EUR: '€', GHS: 'GH₵', KES: 'KSh ', ZAR: 'R', UGX: 'USh ', TZS: 'TSh ',
  XOF: 'CFA ', XAF: 'FCFA ', CAD: 'CA$', AUD: 'A$', INR: '₹', CNY: '¥', JPY: '¥', AED: 'AED ', EGP: 'E£',
  RWF: 'RF ', ZMW: 'ZK', MAD: 'MAD ',
};

/** The symbol for the current currency, for example ₦, $ or £. Other currencies show their code. */
export const currencySymbol = (): string => SYMBOLS[currencyCode] ?? `${currencyCode} `;
export const STARTING_BALANCE = 2_000_000;

export const HIGH_RISK_COUNTRIES = ['Iran', 'North Korea', 'Syria', 'Myanmar', 'Russia'];
export const COUNTRIES = ['Nigeria', 'Ghana', 'United Kingdom', 'United States', ...HIGH_RISK_COUNTRIES];

export const DEFAULT_RULES: RuleConfig = {
  largeAmount: { enabled: true, threshold: 500_000 },
  velocity: { enabled: true, maxCount: 3, windowMinutes: 10 },
  structuring: { enabled: true, band: 0.1, minCount: 3 },
  newBeneficiary: { enabled: true, threshold: 200_000, ageMinutes: 60 },
  oddHours: { enabled: true, fromHour: 0, toHour: 5, threshold: 100_000 },
  highRiskCountry: { enabled: true },
  dailyLimit: { enabled: true, limit: 1_000_000 },
  failedPin: { enabled: true, maxAttempts: 3, windowMinutes: 10 },
  newDevice: { enabled: true, threshold: 100_000 },
  dormant: { enabled: true, threshold: 100_000 },
  geoVelocity: { enabled: true, windowMinutes: 60 },
  payeeAnomaly: { enabled: true, multiplier: 5 },
  flagScore: 30,
  blockScore: 80,
};

export const SEED_BENEFICIARIES = [
  { id: 'b1', name: 'Adaeze Okafor', bank: 'Prembly Bank', accountNumber: '0123456789' },
  { id: 'b2', name: 'Tunde Bakare', bank: 'GTBank', accountNumber: '0234567891' },
  { id: 'b3', name: 'Sunrise Supplies Ltd', bank: 'Access Bank', accountNumber: '1029384756' },
];

/** An amount in the organisation's currency, for example ₦2,000,000.00 or $2,000,000.00. */
export const formatMoney = (n: number) =>
  `${currencySymbol()}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/** A whole amount without decimals, for chips and hints: ₦5,000. */
export const formatMoneyShort = (n: number) => `${currencySymbol()}${n.toLocaleString('en-US')}`;

export const DEMO_PIN = '1234';

export const BANKS = [
  'Prembly Bank', 'Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'UBA', 'Opay', 'Kuda', 'Moniepoint', 'Sterling Bank',
];

const MOCK_NAMES = [
  'Chinedu Eze', 'Fatima Bello', 'Ngozi Adeyemi', 'Ibrahim Musa', 'Blessing Udo',
  'Emeka Nwosu', 'Funke Alabi', 'Yusuf Danjuma', 'Kemi Ogunleye', 'Samuel Etim',
];

/** Fake "name enquiry": known payees resolve to their name, anything else gets a stable mock name. */
export function resolveAccountName(
  bank: string,
  accountNumber: string,
  known: { name: string; bank: string; accountNumber: string }[],
): string {
  const hit = known.find((k) => k.accountNumber === accountNumber && k.bank === bank);
  if (hit) return hit.name;
  const sum = accountNumber.split('').reduce((a, d) => a + Number(d), 0);
  return MOCK_NAMES[sum % MOCK_NAMES.length].toUpperCase();
}
