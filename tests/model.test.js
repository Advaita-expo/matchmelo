import {test} from 'node:test';
import assert from 'node:assert/strict';
import {freshState,availableProfiles,actOnProfile,rollover,blockProfile,sendMessage,likeIncoming} from '../dist/model.js';

test('daily discovery prevents repeated actions and survives a saved state',()=>{
  const s=freshState();
  assert.equal(availableProfiles(s).length,10);
  assert.equal(actOnProfile(s,1,'like').matched,true);
  assert.equal(actOnProfile(s,1,'like').ok,false);
  const restored=JSON.parse(JSON.stringify(s));
  assert.equal(availableProfiles(restored).some(p=>p.id===1),false);
  for(let id=2;id<=10;id++)assert.equal(actOnProfile(restored,id,'pass').ok,true);
  assert.equal(restored.acted.length,10);
  assert.equal(availableProfiles(restored).length,0);
});
test('a new local day resets the preview quota while preserving matches and blocks',()=>{
  const s=freshState();actOnProfile(s,1,'like');blockProfile(s,2);
  rollover(s,'2099-01-01');
  assert.deepEqual(s.acted,[]);assert.ok(s.matches.includes(1));
  assert.equal(availableProfiles(s).some(p=>p.id===1||p.id===2),false);
});
test('incoming mutual likes are deduplicated and can be accepted outside discovery filters',()=>{
  const s=freshState();s.preferences.area='Thane';
  assert.equal(likeIncoming(s,1),true);
  assert.equal(likeIncoming(s,1),false);
  assert.equal(s.matches.filter(x=>x===1).length,1);
});
test('blocking removes contact and prevents new messages',()=>{
  const s=freshState();assert.equal(sendMessage(s,11,'Hello'),true);
  blockProfile(s,11);assert.equal(sendMessage(s,11,'Hello again'),false);
  assert.equal(s.messages[11],undefined);assert.ok(!s.matches.includes(11));
  assert.equal(sendMessage(s,4,'Unmatched'),false);
});
test('filters and paused visibility affect discovery, and message input is bounded',()=>{
  const s=freshState();s.preferences.area='Bandra';
  assert.ok(availableProfiles(s).every(p=>p.area==='Bandra'));
  s.visibility=false;assert.deepEqual(availableProfiles(s),[]);
  assert.equal(sendMessage(s,11,'   '),false);
  sendMessage(s,11,'x'.repeat(3000));assert.equal(s.messages[11].at(-1).text.length,2000);
});
