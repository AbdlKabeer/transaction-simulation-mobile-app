// Prembly Transaction Monitoring integration.
//
// This app has no backend of its own, so Prembly's main backend plays that part:
//   1. Sign in with the organisation's simulation credentials -> a simulation session and the
//      organisation's sandbox PUBLIC key.
//   2. Give that public key to the Prembly TM SDK, which reads the device and creates device sessions.
//   3. For each transfer, get a device session and send it with the transfer to the backend, which
//      screens it with the organisation's real rules and returns the decision.
// No secret API key is ever in this app.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PremblyTM, type DeviceSession } from 'prembly-tm-native';
import * as Location from 'expo-location';
import { getCurrency } from './config';

const STORAGE_KEY = 'prembly-tm-connection-v1';
const API = '/api/v1/fraud/transaction-monitoring';
const REQUEST_TIMEOUT_MS = 10_000;

export interface PremblyConnection {
  baseUrl: string;
  simulationKey: string;
  username: string;
  password: string;
}

// Optional, git-ignored src/prembly.local.ts pre-fills the connection form for local testing.
// See src/prembly.local.example.ts. Without it the form simply starts empty.
let local: Partial<PremblyConnection> = {};
try {
  local = require('./prembly.local').default ?? {};
} catch {}

export const DEFAULT_CONNECTION: PremblyConnection = {
  // The Prembly dev backend. BEFORE PUBLISHING, change this to the live backend,
  // https://backend.prembly.com. To test against a backend on this machine instead, set baseUrl in
  // src/prembly.local.ts (iOS simulator: http://localhost:8000; Android emulator: run
  // `adb reverse tcp:8000 tcp:8000` first).
  baseUrl: 'https://dev-api.prembly.com',
  simulationKey: '',
  username: '',
  password: '',
  ...local,
};

export interface PremblyScreening {
  /** What the SDK gave us for this transfer (null id when it failed open). */
  deviceSession: DeviceSession;
  request: Record<string, unknown>;
  response: Record<string, unknown> | null;
  decision?: string;
  riskScore?: number;
  riskLevel?: string;
  rules: { name: string; severity?: string }[];
  deviceSessionUsed?: boolean;
  deviceSessionReason?: string;
  error?: string;
}

export interface TransferToScreen {
  transactionId: string;
  amount: number;
  account: { accountNumber: string; name: string };
  beneficiary: { name: string; bank: string; accountNumber: string };
  narration: string;
  channel: string;
  country: string;
}

let connection: PremblyConnection | null = null;
let simulationSession: string | null = null;
let ready = false;

export const isConnected = () => ready;

export async function loadConnection(): Promise<PremblyConnection | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_CONNECTION, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

const trimUrl = (url: string) => url.trim().replace(/\/+$/, '');

async function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {}
    return { ok: res.ok, status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Sign in, then give the SDK the organisation's sandbox public key. */
export async function connect(
  next: PremblyConnection,
): Promise<{ ok: boolean; message: string; organisationName?: string; currency?: string }> {
  const config = { ...next, baseUrl: trimUrl(next.baseUrl) };
  try {
    const res = await post(`${config.baseUrl}${API}/simulation/login/`, {
      // The username identifies the organisation; a key is only sent if one is configured.
      key: config.simulationKey.trim() || undefined,
      username: config.username.trim(),
      password: config.password,
    });
    if (!res.ok || !res.json?.data?.session_id) {
      ready = false;
      return { ok: false, message: res.json?.message ?? `Sign-in failed (HTTP ${res.status}).` };
    }
    const data = res.json.data;
    if (!data.sdk_public_key) {
      ready = false;
      return { ok: false, message: 'Signed in, but the backend did not return an SDK public key. Is the backend up to date?' };
    }

    let locationEnabled = false;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      locationEnabled = status === 'granted';
    } catch (e) {
      // safely ignore if permission request fails
    }

    PremblyTM.init({ publishableKey: data.sdk_public_key, baseUrl: config.baseUrl, location: locationEnabled, debug: __DEV__ });
    PremblyTM.reset();
    connection = config;
    simulationSession = data.session_id;
    ready = true;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(config)).catch(() => {});
    return { ok: true, message: `Connected to ${data.organisation_name}.`, organisationName: data.organisation_name, currency: data.currency };
  } catch (error) {
    ready = false;
    return { ok: false, message: `Could not reach ${config.baseUrl}: ${String(error)}` };
  }
}

/** Sign out of Prembly: stop using the connection and forget the saved credentials. */
export function disconnect() {
  ready = false;
  connection = null;
  simulationSession = null;
  PremblyTM.reset();
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

/** What the SDK would send, without sending it (for the Monitoring tab). */
export const previewSignals = () => PremblyTM.getSignalsPreview();

async function screenOnce(transfer: TransferToScreen, deviceSession: DeviceSession) {
  const body = {
    transaction_id: transfer.transactionId,
    amount: transfer.amount,
    currency: getCurrency(),
    transaction_type: 'transfer',
    customer_id: transfer.account.accountNumber,
    customer_name: transfer.account.name,
    sender_account_number: transfer.account.accountNumber,
    beneficiary_account_number: transfer.beneficiary.accountNumber,
    merchant: transfer.beneficiary.name,
    payment_method: 'transfer',
    // The point of the SDK: the device session from this phone, passed along with the transfer.
    ...(deviceSession.deviceSessionId ? { device_session_id: deviceSession.deviceSessionId } : {}),
    metadata: {
      channel: transfer.channel,
      country: transfer.country,
      beneficiary_bank: transfer.beneficiary.bank,
      narration: transfer.narration,
    },
  };
  const res = await post(`${connection!.baseUrl}${API}/simulation/screen-transaction`, body, {
    'X-Simulation-Session': simulationSession ?? '',
  });
  return { body, res };
}

/** Screen a transfer with Prembly. Never throws: problems come back in `error`. */
export async function screenTransfer(transfer: TransferToScreen): Promise<PremblyScreening> {
  PremblyTM.identify(transfer.account.accountNumber);
  const deviceSession = await PremblyTM.getDeviceSession();
  const empty = { deviceSession, request: {}, response: null, rules: [] as PremblyScreening['rules'] };

  if (!connection) return { ...empty, error: 'Not connected to Prembly.' };

  try {
    let { body, res } = await screenOnce(transfer, deviceSession);
    if (res.status === 401) {
      // The simulation session lasts 30 minutes: sign in again once and retry.
      const again = await connect(connection);
      if (!again.ok) return { ...empty, request: body, error: again.message };
      ({ body, res } = await screenOnce(transfer, deviceSession));
    }
    if (!res.ok || !res.json?.data) {
      return { ...empty, request: body, response: res.json, error: res.json?.message ?? `HTTP ${res.status}` };
    }

    const data = res.json.data;
    const details: any[] = Array.isArray(data.rules_triggered_details) ? data.rules_triggered_details : [];
    return {
      deviceSession,
      request: body,
      response: data,
      decision: data.status,
      riskScore: data.risk_score,
      riskLevel: data.risk_level,
      rules: details.map((r) => ({ name: r.name ?? r.rule_name ?? String(r.id ?? r.rule_id ?? 'rule'), severity: r.severity })),
      deviceSessionUsed: data.device_session?.used,
      deviceSessionReason: data.device_session?.reason,
    };
  } catch (error) {
    return { ...empty, error: `Could not reach Prembly: ${String(error)}` };
  }
}
