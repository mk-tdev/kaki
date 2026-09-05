import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
// Load operator settings without ever printing values. Existing environment wins.
process.loadEnvFile('.env.azure.local');
try { process.loadEnvFile('.env.local'); } catch(error) { if(error.code !== 'ENOENT')throw error; }
const rg=process.env.AZURE_RESOURCE_GROUP,app=process.env.AZURE_API_APP,subscription=process.env.AZURE_SUBSCRIPTION_ID;
if(!rg || !app || !process.env.API_BRIDGE_KEY)throw new Error('Provision API infrastructure first.');
const temporary=await mkdtemp(join(tmpdir(),'kaki-api-deploy-'));
function run(command,args,options={}) {
 const r=spawnSync(command,args,{encoding:'utf8',...options});
 if(r.status!==0){
  let detail=r.stderr || r.error?.message || 'Command failed';
  for(const key of ['DATABASE_URL','DATABASE_ADMIN_URL','API_BRIDGE_KEY','OPENAI_API_KEY','AUTH_INVITE_CODE'])if(process.env[key])detail=detail.replaceAll(process.env[key],'[redacted]');
  throw new Error(detail);
 }
 return r.stdout;
}
try {
 run('npm',['--prefix','services/api','run','build']);
 const bundle=join(temporary,'bundle');
 await cp('services/api/dist',join(bundle,'dist'),{recursive:true});
 await cp('services/api/package-lock.json',join(bundle,'package-lock.json'));
 const manifest=JSON.parse(await readFile('services/api/package.json','utf8'));
 manifest.scripts={start:'node dist/main.js'};
 await writeFile(join(bundle,'package.json'),JSON.stringify(manifest));
 run('npm',['ci','--omit=dev','--ignore-scripts'],{cwd:bundle});
 const zip=join(temporary,'api.zip');
 run('python3',['-c',`import pathlib,zipfile,sys
root=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2],'w',zipfile.ZIP_DEFLATED) as z:
 for p in root.rglob('*'):
  if p.is_file():z.write(p,p.relative_to(root))`,bundle,zip]);
 const settings={NODE_ENV:'production',DATABASE_POOL_MAX:'3',SCM_DO_BUILD_DURING_DEPLOYMENT:'false',WEBSITE_RUN_FROM_PACKAGE:'1'};
 for(const key of ['DATABASE_URL','DATABASE_POOL_MAX','API_BRIDGE_KEY','AUTH_INVITE_CODE','OPENAI_API_KEY','OPENAI_MODEL','OPENAI_SUGGESTIONS_MODEL','OPENAI_TRANSCRIPTION_MODEL','OPENAI_TRANSLATION_MODEL'])if(process.env[key])settings[key]=process.env[key];
 const settingsFile=join(temporary,'settings.json');
 await writeFile(settingsFile,JSON.stringify(settings),{mode:0o600});
 run('az',['webapp','config','appsettings','set','--subscription',subscription,'-g',rg,'-n',app,'--settings','@'+settingsFile,'--only-show-errors','-o','none']);
 console.log('API settings applied. Uploading the compiled NestJS package…');
 const output=run('az',['webapp','deploy','--subscription',subscription,'-g',rg,'-n',app,'--src-path',zip,'--type','zip','--async','false','--track-status','false','--only-show-errors','-o','json']);
 const result=JSON.parse(output);
 console.log(JSON.stringify({deploymentId:result.id || result.deploymentId,status:result.status || result.properties?.status,api:process.env.API_BASE_URL}));
 // Kudu package deployment is complete; independently verify application and DB readiness.
 for(let attempt=0;attempt<30;attempt++) {
  try {
   const response=await fetch(process.env.API_BASE_URL+'/api/health',{
    headers:{'x-kaki-bridge-key':process.env.API_BRIDGE_KEY},signal:AbortSignal.timeout(10000),
   });
   const health=await response.json();
   if(response.ok && health.database==='connected') {
    console.log('NestJS is healthy and connected to PostgreSQL.');break;
   }
  } catch { /* The worker may still be mounting the deployment package. */ }
  if(attempt===29)throw new Error('Package deployed but API readiness timed out. Inspect Azure runtime logs.');
  if(attempt%3===0)console.log('Waiting for the API worker to become ready…');
  await new Promise(resolve=>setTimeout(resolve,10000));
 }
} finally { await rm(temporary,{recursive:true,force:true}); }
