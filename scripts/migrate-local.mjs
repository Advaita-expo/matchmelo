import './prepare-local.mjs';
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.execPath,['--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','dist/server/wrangler.local.json','--persist-to','.wrangler/matchmelo-state'],{stdio:'inherit',env:{...process.env,CI:'1'}});
process.exit(result.status??1);
