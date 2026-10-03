import { RuleConfig } from './types';

export const CURRENCY = '₦';
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
  flagScore: 40,
  blockScore: 80,
};

export const SEED_BENEFICIARIES = [
  { id: 'b1', name: 'Adaeze Okafor', bank: 'Pueblo Bank', accountNumber: '0123456789' },
  { id: 'b2', name: 'Tunde Bakare', bank: 'GTBank', accountNumber: '0234567891' },
  { id: 'b3', name: 'Sunrise Supplies Ltd', bank: 'Access Bank', accountNumber: '1029384756' },
];

export const formatMoney = (n: number) =>
  `${CURRENCY}${n.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DEMO_PIN = '1234';

export const BANKS = [
  'Pueblo Bank', 'Access Bank', 'GTBank', 'Zenith Bank', 'First Bank', 'UBA', 'Opay', 'Kuda', 'Moniepoint', 'Sterling Bank',
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
