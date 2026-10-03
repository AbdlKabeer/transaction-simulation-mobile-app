// Usage: serve ./dist on :8099 (npx expo export --platform web), then
//   node scripts/screenshots.mjs docs/screenshots/<version>
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/');
const pw = require('playwright');
const out = process.argv[2];
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const shot = (n) => p.screenshot({ path: `${out}/${n}.png` });
const click = (t, o = {}) => p.getByText(t, { exact: true, ...o }).first().click();
const tab = (t) => p.getByText(t, { exact: true }).last().click();
const pin = async (d) => { for (const k of d) await click(k); };

async function transfer({ recent, bank, acct, amount, country, hour, shots }) {
  await tab('Transfer');
  if (shots) await shot(`${shots}-1-recipient`);
  if (recent) await click(recent);
  else { await click('Select bank'); if (shots) await shot(`${shots}-1b-bank-list`); await click(bank, { }); await p.getByPlaceholder('10-digit account number').fill(acct); }
  if (shots) await shot(`${shots}-2-recipient-verified`);
  await click('Next');
  await p.getByPlaceholder('0.00').fill(amount);
  if (country) await click(country);
  if (hour) await click(hour);
  if (shots) await shot(`${shots}-3-amount`);
  await click('Next');
  if (shots) await shot(`${shots}-4-confirm`);
  await click('Pay');
  await pin('12');
  if (shots) await shot(`${shots}-5-pin`);
  await pin('34');
  await p.waitForTimeout(400);
  if (shots) await shot(`${shots}-6-processing`);
  await p.waitForTimeout(1300);
  if (shots) await shot(`${shots}-7-receipt`);
  await click('Done');
}

await p.goto('http://localhost:8099');
await p.waitForTimeout(800);
await shot('01-login');
await p.getByPlaceholder('Jane Doe').fill('Jane Doe');
await p.getByText('Enter sandbox').click();
await p.waitForTimeout(400);
await shot('02-home-empty');

await transfer({ bank: 'GTBank', acct: '0234567891', amount: '50000', shots: '03-flow-allowed' });
await transfer({ recent: 'Adaeze Okafor', amount: '600000', shots: '04-flow-flagged' });
await transfer({ bank: 'Kuda', acct: '5566778899', amount: '300000', country: 'Iran', hour: '02:00', shots: '05-flow-blocked' });

await tab('Home'); await shot('06-home-with-activity');
await tab('Activity'); await shot('07-activity');
await tab('Monitoring'); await shot('08-monitoring-alerts');
await p.mouse.wheel(0, 900); await p.waitForTimeout(300); await shot('09-monitoring-rules');
await b.close();
