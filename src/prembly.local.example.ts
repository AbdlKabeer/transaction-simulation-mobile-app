// Copy to src/prembly.local.ts (git-ignored) to pre-fill the Prembly connection form.
import type { PremblyConnection } from './prembly';

const local: Partial<PremblyConnection> = {
  baseUrl: 'http://localhost:8010',
  simulationKey: '<organisation simulation key>',
  username: '<simulation username>',
  password: '<simulation password>',
};

export default local;
