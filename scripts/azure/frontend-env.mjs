import { writeFile } from 'node:fs/promises';
process.loadEnvFile('.env.azure.local');
if(!process.env.API_BASE_URL || !process.env.API_BRIDGE_KEY)throw new Error('Provision the API first.');
await writeFile('.env.frontend.local',[
 `API_BASE_URL=${process.env.API_BASE_URL}`,
 `API_BRIDGE_KEY=${process.env.API_BRIDGE_KEY}`,
 'APP_ORIGIN=http://localhost:5027',''
].join('\n'),{mode:0o600});
console.log('Wrote private .env.frontend.local with only API connection settings.');
