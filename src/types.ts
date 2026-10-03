export type Channel = 'MOBILE' | 'ATM' | 'POS' | 'WEB';
export type Decision = 'ALLOWED' | 'FLAGGED' | 'BLOCKED';

export interface Beneficiary {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  createdAt: number;
}

export interface RuleHit {
  ruleId: string;
  title: string;
  detail: string;
  score: number;
}

export interface Transaction {
  id: string;
  createdAt: number; // real time the user pressed send
  effectiveAt: number; // simulated time used by the rules engine
  amount: number;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryBank: string;
  beneficiaryAccount: string;
  narration: string;
  channel: Channel;
  country: string;
  decision: Decision;
  riskScore: number;
  hits: RuleHit[];
}

export interface RuleConfig {
  largeAmount: { enabled: boolean; threshold: number };
  velocity: { enabled: boolean; maxCount: number; windowMinutes: number };
  structuring: { enabled: boolean; band: number; minCount: number };
  newBeneficiary: { enabled: boolean; threshold: number; ageMinutes: number };
  oddHours: { enabled: boolean; fromHour: number; toHour: number; threshold: number };
  highRiskCountry: { enabled: boolean };
  dailyLimit: { enabled: boolean; limit: number };
  flagScore: number;
  blockScore: number;
}

export interface Account {
  name: string;
  email: string;
  accountNumber: string;
  balance: number;
}
