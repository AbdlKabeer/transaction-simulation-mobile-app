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

/** Result of screening a transfer with Prembly's backend (and the SDK's device session). */
export interface PremblyResult {
  status: 'pending' | 'done' | 'error';
  decision?: string;
  riskScore?: number;
  riskLevel?: string;
  rules: { name: string; severity?: string }[];
  deviceSessionId: string | null;
  deviceSessionUsed?: boolean;
  deviceSessionReason?: string;
  sdkError?: string;
  error?: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown> | null;
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
  /** Present once the transfer was also sent to Prembly's backend. */
  prembly?: PremblyResult;
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
  /** The organisation's currency code, set at sign-in. */
  currency?: string;
}

export interface LogEvent {
  id: string;
  at: number;
  type: 'TRANSACTION' | 'FAILED_PIN' | 'SCENARIO' | 'PREMBLY';
  summary: string;
  request?: Record<string, unknown>;
  response?: Record<string, unknown>;
}
