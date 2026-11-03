import {readFile,writeFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
let previous='';try{previous=await readFile('.dev.vars','utf8');}catch{}
const entries=new Map(previous.split(/\r?\n/).filter(line=>line.includes('=')&&!line.startsWith('#')).map(line=>[line.slice(0,line.indexOf('=')),line.slice(line.indexOf('=')+1)]));
entries.set('APP_ENV','development');entries.set('APP_URL','http://127.0.0.1:4183');
if(!entries.get('BETTER_AUTH_SECRET'))entries.set('BETTER_AUTH_SECRET',randomBytes(48).toString('base64url'));
if(!entries.get('REVIEWER_EMAIL')||entries.get('REVIEWER_EMAIL')==='seedy@sites.test')entries.set('REVIEWER_EMAIL','admin@matchmelo.test');
await writeFile('.dev.vars',[...entries].map(([key,value])=>key+'='+value).join('\n')+'\n',{mode:0o600});
console.log('Local configuration is ready. Secrets remain in ignored .dev.vars. Local email links are captured instead of delivered.');
