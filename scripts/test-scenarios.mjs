// Runs every scenario on a fresh sandbox in a browser and checks its expected rule fires.
// Usage: serve ./dist on :8099, then `node scripts/test-scenarios.mjs`
import { createRequire } from 'module';
const require = createRequire(process.cwd() + '/');
const pw = require('playwright');
const b = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const SC = [
  ['Large transfer', 'Large transaction'], ['Rapid-fire transfers', 'High velocity'], ['Structuring', 'Possible structuring'],
  ['Midnight transfer', 'Unusual hour'], ['New payee, big amount', 'New beneficiary, high value'],
  ['High-risk country', 'High-risk jurisdiction'], ['Failed PIN attempts', 'Repeated failed PIN'], ['New device', 'New device, high value'],
  ['Impossible travel', 'Impossible travel'], ['Dormant account wakes up', 'Dormant account reactivated'],
  ['Unusual amount for payee', 'Unusual amount for payee'],
];
let fail = 0;
for (const [i, [name, rule]] of SC.entries()) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://localhost:8099');
  await p.getByPlaceholder('Jane Doe').fill('T');
  await p.getByText('Enter sandbox').click();
  await p.getByText('Monitoring', { exact: true }).last().click();
  await p.getByText('Run', { exact: true }).nth(i).click();
  await p.waitForTimeout(300);
  const msg = await p.getByText(`${name}:`).first().innerText();
  const ok = msg.includes(rule) && errs.length === 0;
  if (!ok) fail++;
  console.log(ok ? 'PASS' : 'FAIL', name, '→', msg, errs);
  await ctx.close();
}
await b.close();
process.exit(fail ? 1 : 0);
