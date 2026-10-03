import { HIGH_RISK_COUNTRIES } from './config';
import { Beneficiary, Decision, RuleConfig, RuleHit, Transaction } from './types';
import { formatMoney } from './config';

export interface Candidate {
  amount: number;
  beneficiary: Beneficiary;
  effectiveAt: number;
  country: string;
  /** Real wall-clock time, used for beneficiary age (effectiveAt may be simulated). */
  now: number;
  /** Sandbox test conditions. */
  newDevice: boolean;
  dormant: boolean;
}

const MIN = 60_000;
const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Evaluate a candidate transfer against history and the active rule config. Pure function. */
export function evaluate(
  c: Candidate,
  history: Transaction[],
  cfg: RuleConfig,
  failedPins: number[] = [],
): { decision: Decision; riskScore: number; hits: RuleHit[] } {
  const hits: RuleHit[] = [];
  // Blocked transfers don't move money, so they don't count toward behavioural rules.
  const past = history.filter((t) => t.decision !== 'BLOCKED');

  if (cfg.largeAmount.enabled && c.amount >= cfg.largeAmount.threshold) {
    hits.push({
      ruleId: 'LARGE_AMOUNT',
      title: 'Large transaction',
      detail: `${formatMoney(c.amount)} is at or above the ${formatMoney(cfg.largeAmount.threshold)} limit.`,
      score: 45,
    });
  }

  if (cfg.velocity.enabled) {
    const since = c.effectiveAt - cfg.velocity.windowMinutes * MIN;
    const n = past.filter((t) => t.effectiveAt >= since && t.effectiveAt <= c.effectiveAt).length + 1;
    if (n > cfg.velocity.maxCount) {
      hits.push({
        ruleId: 'VELOCITY',
        title: 'High velocity',
        detail: `${n} transfers within ${cfg.velocity.windowMinutes} minutes (max ${cfg.velocity.maxCount}).`,
        score: 40,
      });
    }
  }

  if (cfg.structuring.enabled && cfg.largeAmount.threshold > 0) {
    const limit = cfg.largeAmount.threshold;
    const floor = limit * (1 - cfg.structuring.band);
    const near = (a: number) => a >= floor && a < limit;
    if (near(c.amount)) {
      const day = startOfDay(c.effectiveAt);
      const prior = past.filter((t) => startOfDay(t.effectiveAt) === day && near(t.amount)).length;
      if (prior + 1 >= cfg.structuring.minCount) {
        hits.push({
          ruleId: 'STRUCTURING',
          title: 'Possible structuring',
          detail: `${prior + 1} transfers just under the ${formatMoney(limit)} limit today.`,
          score: 55,
        });
      }
    }
  }

  if (cfg.newBeneficiary.enabled && c.amount >= cfg.newBeneficiary.threshold) {
    const ageMin = (c.now - c.beneficiary.createdAt) / MIN;
    if (ageMin < cfg.newBeneficiary.ageMinutes) {
      hits.push({
        ruleId: 'NEW_BENEFICIARY',
        title: 'New beneficiary, high value',
        detail: `${c.beneficiary.name} was added under ${cfg.newBeneficiary.ageMinutes} min ago and the amount is ≥ ${formatMoney(cfg.newBeneficiary.threshold)}.`,
        score: 35,
      });
    }
  }

  if (cfg.oddHours.enabled && c.amount >= cfg.oddHours.threshold) {
    const h = new Date(c.effectiveAt).getHours();
    const { fromHour, toHour } = cfg.oddHours;
    const inside = fromHour <= toHour ? h >= fromHour && h < toHour : h >= fromHour || h < toHour;
    if (inside) {
      hits.push({
        ruleId: 'ODD_HOURS',
        title: 'Unusual hour',
        detail: `Transfer at ${String(h).padStart(2, '0')}:00 falls in the ${fromHour}:00–${toHour}:00 window.`,
        score: 30,
      });
    }
  }

  if (cfg.highRiskCountry.enabled && HIGH_RISK_COUNTRIES.includes(c.country)) {
    hits.push({
      ruleId: 'HIGH_RISK_COUNTRY',
      title: 'High-risk jurisdiction',
      detail: `Transaction originated from ${c.country}.`,
      score: 60,
    });
  }

  if (cfg.dailyLimit.enabled) {
    const day = startOfDay(c.effectiveAt);
    const total =
      past.filter((t) => startOfDay(t.effectiveAt) === day).reduce((s, t) => s + t.amount, 0) + c.amount;
    if (total > cfg.dailyLimit.limit) {
      hits.push({
        ruleId: 'DAILY_LIMIT',
        title: 'Daily limit exceeded',
        detail: `Day total ${formatMoney(total)} exceeds ${formatMoney(cfg.dailyLimit.limit)}.`,
        score: 40,
      });
    }
  }

  if (cfg.failedPin.enabled) {
    const since = c.now - cfg.failedPin.windowMinutes * MIN;
    const n = failedPins.filter((t) => t >= since).length;
    if (n >= cfg.failedPin.maxAttempts) {
      hits.push({
        ruleId: 'FAILED_PIN',
        title: 'Repeated failed PIN',
        detail: `${n} incorrect PIN attempts in the last ${cfg.failedPin.windowMinutes} minutes.`,
        score: 35,
      });
    }
  }

  if (cfg.newDevice.enabled && c.newDevice && c.amount >= cfg.newDevice.threshold) {
    hits.push({
      ruleId: 'NEW_DEVICE',
      title: 'New device, high value',
      detail: `Unrecognised device used for a transfer of ${formatMoney(c.amount)}.`,
      score: 30,
    });
  }

  if (cfg.dormant.enabled && c.dormant && c.amount >= cfg.dormant.threshold) {
    hits.push({
      ruleId: 'DORMANT_ACCOUNT',
      title: 'Dormant account reactivated',
      detail: `Account inactive for 180+ days, now sending ${formatMoney(c.amount)}.`,
      score: 35,
    });
  }

  if (cfg.geoVelocity.enabled) {
    const w = cfg.geoVelocity.windowMinutes * MIN;
    const other = past.find((t) => t.country !== c.country && Math.abs(t.effectiveAt - c.effectiveAt) <= w);
    if (other) {
      hits.push({
        ruleId: 'IMPOSSIBLE_TRAVEL',
        title: 'Impossible travel',
        detail: `Previous transfer from ${other.country} within ${cfg.geoVelocity.windowMinutes} minutes; now ${c.country}.`,
        score: 40,
      });
    }
  }

  if (cfg.payeeAnomaly.enabled) {
    const prior = past.filter((t) => t.beneficiaryId === c.beneficiary.id);
    if (prior.length >= 2) {
      const avg = prior.reduce((sum, t) => sum + t.amount, 0) / prior.length;
      if (c.amount >= avg * cfg.payeeAnomaly.multiplier) {
        hits.push({
          ruleId: 'PAYEE_ANOMALY',
          title: 'Unusual amount for payee',
          detail: `${formatMoney(c.amount)} is ${cfg.payeeAnomaly.multiplier}x+ the usual ${formatMoney(avg)} sent to ${c.beneficiary.name}.`,
          score: 30,
        });
      }
    }
  }

  const riskScore = Math.min(100, hits.reduce((s, h) => s + h.score, 0));
  const decision: Decision =
    riskScore >= cfg.blockScore ? 'BLOCKED' : riskScore >= cfg.flagScore ? 'FLAGGED' : 'ALLOWED';
  return { decision, riskScore, hits };
}
