import test from 'node:test';import assert from 'node:assert/strict';import {Arena} from '../prototype3d/simulation.js';
const tick=(g,n,input={})=>{for(let i=0;i<n;i++)g.step(1/60,input)};
test('pipe requires proximity, preserves durability on disarm and reset',()=>{const g=new Arena();assert.equal(g.pickup(),false);g.player.x=2;g.player.z=2;assert.equal(g.pickup(),true);g.player.weapon=4;g.damage(g.player,g.enemy);assert.equal(g.player.weapon,0);assert.equal(g.pickup(),true);assert.equal(g.player.weapon,4);g.reset();assert.equal(g.player.hp,100);assert.equal(g.pipe.taken,false)});
test('pipe has active timing, single hit and consumes one use',()=>{const g=new Arena();g.player.weapon=10;g.player.x=0;g.player.z=0;g.enemy.z=-1.8;g.enemy.cool=99;g.attack(g.player);tick(g,8);assert.equal(g.enemy.hp,120);tick(g,7);assert.equal(g.enemy.hp,90);tick(g,22);assert.equal(g.enemy.hp,90);assert.equal(g.player.weapon,9)});
test('room bounds, solid desks and destructible furniture',()=>{const g=new Arena();g.move(g.player,100,100,1);assert.equal(g.player.x,5.3);assert.equal(g.player.z,4.7);g.player.x=-3;g.player.z=1.5;g.move(g.player,0,-1,1);assert.equal(g.player.z,1.5);g.player.weapon=10;g.player.angle=Math.PI;g.enemy.cool=99;g.enemy.x=5;g.attack(g.player);tick(g,40);g.attack(g.player);tick(g,40);assert.equal(g.props[0].hp,0);g.move(g.player,0,-1,1);assert.equal(g.player.z,.5)});
test('playable fight can be won then exited; loss freezes simulation',()=>{const g=new Arena();g.player.weapon=10;for(let i=0;i<4;i++){g.player.x=0;g.player.z=0;g.player.angle=Math.PI;g.enemy.x=0;g.enemy.z=-1.8;g.enemy.cool=99;g.attack(g.player);tick(g,40)}assert.equal(g.enemy.hp,0);g.player.z=-4.5;tick(g,1);assert.equal(g.status,'won');g.reset();g.player.hp=1;g.damage(g.player,g.enemy);tick(g,1);assert.equal(g.status,'lost');const x=g.player.x;tick(g,60,{x:1});assert.equal(g.player.x,x)});

test('unarmed attacks connect after retreating and at overlapping range',()=>{
 for(const distance of [0,.2,1.2]){const g=new Arena();g.player.x=0;g.player.z=0;g.player.angle=0;g.enemy.x=0;g.enemy.z=-distance;g.enemy.cool=99;g.attack(g.player);tick(g,12);assert.equal(g.enemy.hp,103,`distance ${distance}`)}
});
test('tap during recovery is buffered and enemy can be defeated without stat overrides',()=>{
 const g=new Arena();let attacks=0;
 for(let i=0;i<1800&&g.enemy.hp>0&&g.player.hp>0;i++){
   const p=g.player,e=g.enemy,dx=e.x-p.x,dz=e.z-p.z,d=Math.hypot(dx,dz);
   if(i%12===0){g.attack(p);attacks++}
   g.step(1/60,d>1.1?{x:dx/d,z:dz/d}:{});
 }
 assert.ok(attacks>1);assert.equal(g.enemy.hp,0);assert.ok(g.player.hp>0);
});
