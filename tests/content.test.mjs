import test from 'node:test';
import assert from 'node:assert/strict';
import {topics} from '../topics.mjs';
import {createPersona} from '../persona.mjs';
test('80 unique topics preserve original order and required local themes',()=>{
  assert.equal(topics.length,80);assert.equal(new Set(topics.map(t=>t.en)).size,80);
  topics.forEach((t,i)=>{assert.equal(t.id,i+1);assert.ok(t.ja&&t.category&&t.en);});
  assert.match(topics[0].en,/Fuji/);assert.match(topics[2].en,/Ota/);assert.match(topics[26].en,/break/);assert.match(topics[79].en,/part-time/);
});
test('persona is reproducible and covers all requested independently chosen attributes',()=>{
  const genders=new Set(),ages=new Set(),ethnicities=new Set(),personalities=new Set();
  for(let seed=0;seed<10000;seed++){
    const p=createPersona(seed);assert.deepEqual(p,createPersona(seed));
    genders.add(p.gender);ages.add(p.ageGroup);ethnicities.add(p.ethnicity);personalities.add(p.personality);
    assert.ok(p.name&&p.hobby&&p.family&&p.experience&&p.dream);
    if(p.ageGroup==='ご老人')assert.ok(p.age>=65);
    if(p.ageGroup==='若者')assert.ok(p.age<=22);
  }
  assert.equal(genders.size,2);assert.equal(ages.size,3);assert.equal(ethnicities.size,3);assert.equal(personalities.size,5);
});
