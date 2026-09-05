// Operator-only pilot account creation/reset. Password comes from an environment variable.
import pg from 'pg';
import { randomBytes, scrypt as derive } from 'node:crypto';
const [action,email,name='New Kaki'] = process.argv.slice(2);
if (!['create','reset'].includes(action) || !email || !process.env.KAKI_ACCOUNT_PASSWORD || process.env.KAKI_ACCOUNT_PASSWORD.length < 8) {
  throw new Error('Usage: KAKI_ACCOUNT_PASSWORD=<secret> node --env-file=.env.azure.local scripts/azure/account.mjs create|reset email [name]');
}
const salt=randomBytes(16).toString('hex');
const key=await new Promise((resolve,reject)=>derive(process.env.KAKI_ACCOUNT_PASSWORD,salt,64,{N:32768,r:8,p:3,maxmem:64*1024*1024},(e,k)=>e?reject(e):resolve(k)));
const hash=`scrypt$${salt}$${key.toString('hex')}`;
const client=new pg.Client({connectionString:process.env.DATABASE_ADMIN_URL,ssl:{rejectUnauthorized:true}});
await client.connect();
try {
 await client.query('BEGIN');
 let id;
 if(action==='create') id=(await client.query('select auth.register($1,$2,$3,false) as id',[email.toLowerCase(),hash,name])).rows[0].id;
 else {
  const result=await client.query('update auth.users set password_hash=$2 where email=$1 returning id',[email.toLowerCase(),hash]);
  if(!result.rows[0])throw new Error('Account not found');
  id=result.rows[0].id;
 }
 await client.query('delete from auth.sessions where user_id=$1',[id]);
 await client.query('COMMIT');
 console.log(`Account ${action} completed; existing sessions revoked.`);
} catch(error){await client.query('ROLLBACK');throw error;}finally{await client.end();}
