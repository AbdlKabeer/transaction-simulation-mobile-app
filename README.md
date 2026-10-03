# Nova Bank — Transaction Monitoring Sandbox

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
- Send money to seeded or newly added beneficiaries.
- **Simulation controls** on the Send screen: channel, time of day, originating country.
- Every transfer is scored by `src/engine.ts` and ends ALLOWED / FLAGGED / BLOCKED, with the triggered rules shown.
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

Scores add up (cap 100): ≥ 40 flagged, ≥ 80 blocked (blocked transfers don't debit the balance).
