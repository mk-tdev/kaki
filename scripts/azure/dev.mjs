import { spawn } from 'node:child_process';
// Keep the existing development server and its build cache separate.
const port=process.env.KAKI_PORT || '5027';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--webpack','-p',port],{
 stdio:'inherit',env:{...process.env,APP_ORIGIN:`http://localhost:${port}`,KAKI_DIST_DIR:'.next-azure'}
});
child.on('exit',code=>process.exit(code ?? 1));
