import {readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
const file='dist/server/wrangler.json';
let config;try{config=JSON.parse(await readFile(file,'utf8'));}catch{throw new Error('Build Matchmelo before starting or migrating the local Worker.');}
config.d1_databases=config.d1_databases.map(db=>({...db,migrations_dir:path.resolve('drizzle')}));
await writeFile('dist/server/wrangler.local.json',JSON.stringify(config,null,2)+'\n');
try{await copyFile('.dev.vars','dist/server/.dev.vars');}catch{throw new Error('Run npm run setup:local before starting the local Worker.');}
