# Prembly Bank — Transaction Monitoring Sandbox

A mock mobile banking app (Expo + React Native + NativeWind/Tailwind) that customers can use to make
test transfers and see how transaction-monitoring rules react. No real money or backend: all state lives
on the device (AsyncStorage).

## Run

```bash
npm install
npm start          # press i / a, scan the QR in Expo Go, or press w for web
npm run web        # browser (use a phone-width window)
npx expo export --platform web   # static build in dist/ — host anywhere to share a link
npx tsc --noEmit   # typecheck
```

## What it does

- Login with any name/email → demo account with ₦2,000,000.
- OPay-style home (balance card with hide toggle, shortcut grid) and a full transfer flow: bank + account number (name lookup) → amount → confirm → PIN (sandbox PIN `1234`) → processing → receipt with the monitoring result.
- Sending to a new account number creates a new beneficiary, which can trigger the new-beneficiary rule.
- **Test conditions** on the amount step: channel, time of day, originating country.
- Every transfer is scored by `src/engine.ts` and ends ALLOWED / FLAGGED / BLOCKED, with the triggered rules shown.
- **Run a test scenario**: one tap per rule on the Monitoring tab sends the transfers needed to trigger it.
- **Event log**: every transaction and failed PIN with the raw request/response JSON (also on each receipt).
- **Monitoring** tab: alert list, per-rule toggles and thresholds, score cut-offs, reset buttons.

## Rules (defaults in `src/config.ts`)

| Rule | Default trigger | Score |
|---|---|---|
| Large amount | ≥ ₦500,000 | 45 |
| Velocity | > 3 transfers / 10 min | 40 |
| Structuring | 3+ transfers within 10% below the large-amount limit, same day | 55 |
| New beneficiary | ≥ ₦200,000 to a payee added < 60 min ago | 35 |
| Unusual hours | ≥ ₦100,000 between 00:00–05:00 | 30 |
| High-risk country | Iran, North Korea, Syria, Myanmar, Russia | 60 |
| Daily limit | > ₦1,000,000 per day | 40 |
| Failed PIN | 3+ wrong PINs in 10 min before a transfer | 35 |
| New device | ≥ ₦100,000 from an unrecognised device (test condition) | 30 |
| Dormant account | ≥ ₦100,000 from an account inactive 180+ days (test condition) | 35 |
| Impossible travel | Transfers from two countries within 60 min | 40 |
| Unusual amount for payee | ≥ 5x the average sent to that payee (after 2+ prior) | 30 |

Scores add up (cap 100): ≥ 30 flagged, ≥ 80 blocked (blocked transfers don't debit the balance).
