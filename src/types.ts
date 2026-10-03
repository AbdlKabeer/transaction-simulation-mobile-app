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
  newDevice: boolean;
  dormant: boolean;
  /** Payload the app sent to monitoring and what came back (shown in the event log). */
  request: Record<string, unknown>;
  response: Record<string, unknown>;
}

export interface RuleConfig {
  largeAmount: { enabled: boolean; threshold: number };
  velocity: { enabled: boolean; maxCount: number; windowMinutes: number };
  structuring: { enabled: boolean; band: number; minCount: number };
  newBeneficiary: { enabled: boolean; threshold: number; ageMinutes: number };
  oddHours: { enabled: boolean; fromHour: number; toHour: number; threshold: number };
  highRiskCountry: { enabled: boolean };
  dailyLimit: { enabled: boolean; limit: number };
  failedPin: { enabled: boolean; maxAttempts: number; windowMinutes: number };
  newDevice: { enabled: boolean; threshold: number };
  dormant: { enabled: boolean; threshold: number };
  geoVelocity: { enabled: boolean; windowMinutes: number };
  payeeAnomaly: { enabled: boolean; multiplier: number };
  flagScore: number;
  blockScore: number;
}

export interface Account {
  name: string;
  email: string;
  accountNumber: string;
  balance: number;
}

export interface LogEvent {
  id: string;
  at: number;
  type: 'TRANSACTION' | 'FAILED_PIN' | 'SCENARIO';
  summary: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
}
