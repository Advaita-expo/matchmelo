// Prepare a standalone Cloudflare configuration; this never deploys or copies secrets.
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
const args=new Map();
for(let i=2;i<process.argv.length;i+=2){if(!process.argv[i].startsWith('--')||!process.argv[i+1])throw new Error('Use named --option value pairs.');args.set(process.argv[i].slice(2),process.argv[i+1]);}
for(const key of ['app-url','database-id','database-name','bucket-name','reviewer-email'])if(!args.has(key))throw new Error('Missing --'+key);
const url=new URL(args.get('app-url'));
if(url.protocol!=='https:'||url.pathname!=='/'||url.search||url.hash||url.username||url.password)throw new Error('app-url must be a canonical HTTPS origin.');
if(!/^[a-f0-9-]{36}$/i.test(args.get('database-id'))||args.get('database-id')==='00000000-0000-4000-8000-000000000000')throw new Error('Use the real D1 database UUID.');
if(!/^[a-z0-9][a-z0-9-]{1,62}$/.test(args.get('bucket-name'))||!/^\S+@\S+\.\S+$/.test(args.get('reviewer-email')))throw new Error('Check the bucket name and reviewer email.');
const source=JSON.parse(await readFile('dist/server/wrangler.json','utf8'));
source.name='matchmelo';
source.vars={APP_ENV:'production',APP_URL:url.origin,REVIEWER_EMAIL:args.get('reviewer-email')};
source.d1_databases=[{binding:'DB',database_id:args.get('database-id'),database_name:args.get('database-name'),migrations_dir:path.resolve('drizzle')}];
source.r2_buckets=[{binding:'BUCKET',bucket_name:args.get('bucket-name')}];
source.triggers={crons:['*/15 * * * *']};
await writeFile('dist/server/wrangler.production.json',JSON.stringify(source,null,2)+'\n');
console.log('Prepared dist/server/wrangler.production.json. Nothing was deployed. Set production secrets separately before deploying.');
