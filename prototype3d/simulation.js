export class Arena {
 constructor(){this.reset()}
 reset(){
  this.stage=1;this.startStage(1,true);
 }
 startStage(stage,fresh=false){
  const hp=fresh?100:Math.min(100,(this.player?.hp||70)+35);
  this.stage=stage;this.player={x:-8,z:2,hp,angle:Math.PI/2,t:0,action:'idle',cool:0,weapon:0};
  this.pipe={x:-5,z:2,taken:false,uses:14};
  this.props=[{x:-2,z:-3,hp:60},{x:8,z:-3,hp:60},{x:16,z:-3,hp:60}];
  this.enemies=[
   {x:-.5,z:0,hp:65,maxHp:65,angle:0,t:0,action:'idle',cool:1.2,kind:'guard',wave:0},
   {x:2,z:2,hp:65,maxHp:65,angle:0,t:0,action:'idle',cool:1.9,kind:'guard',wave:0},
   {x:10,z:-1,hp:85,maxHp:85,angle:0,t:0,action:'idle',cool:1,kind:'guard',wave:1},
   {x:13,z:2,hp:85,maxHp:85,angle:0,t:0,action:'idle',cool:1.8,kind:'guard',wave:1},
   {x:20,z:0,hp:260,maxHp:260,angle:0,t:0,action:'idle',cool:1.2,kind:'boss',wave:2}
  ];
  this.enemy=this.enemies[0];this.wave=0;this.pendingAttack=0;this.status='playing';this.message='STAGE '+stage+' · Fight through security';this.hits=0;this.flash=0;
 }
 get activeEnemies(){return this.enemies.filter(e=>e.hp>0&&e.wave===this.wave)}
 get boss(){return this.enemies.find(e=>e.kind==='boss')}
 attack(a){
  if(a.hp<=0||this.status!=='playing')return;
  if(a.cool>0||a.action==='hurt'||a.action==='attack'){if(a===this.player)this.pendingAttack=.25;return}
  const targets=a===this.player?this.activeEnemies:[this.player];
  const target=targets.filter(e=>e.hp>0).sort((u,v)=>Math.hypot(u.x-a.x,u.z-a.z)-Math.hypot(v.x-a.x,v.z-a.z))[0];
  if(target&&Math.hypot(target.x-a.x,target.z-a.z)<(a.weapon?3.25:2))a.angle=Math.atan2(target.x-a.x,target.z-a.z);
  a.action='attack';a.t=0;a.cool=a===this.player?(a.weapon?.82:.44):(a.kind==='boss'?1.25:1.5);a.hit=false;a.attackDuration=a.weapon?.82:.44;a.attackWeapon=!!a.weapon;
  if(a===this.player)this.pendingAttack=0;
 }
 pickup(){const p=this.player;if(this.status==='playing'&&!this.pipe.taken&&Math.hypot(p.x-this.pipe.x,p.z-this.pipe.z)<1.6){this.pipe.taken=true;p.weapon=this.pipe.uses;this.message='STEEL PIPE · '+p.weapon+' swings';return true}return false}
 move(a,x,z,dt){
  let nx=Math.max(-10.5,Math.min(24.5,a.x+x*dt)),nz=Math.max(-3.8,Math.min(3.8,a.z+z*dt));
  if(a===this.player){const barrier=[4.5,16.5,24.5][this.wave];nx=Math.min(nx,barrier)}
  for(const o of this.props)if(o.hp>0&&Math.abs(nx-o.x)<1.25&&Math.abs(nz-o.z)<.85)return;
  a.x=nx;a.z=nz;
 }
 damage(target,source){
  if(target.hp<=0)return;
  const amount=source===this.player?(source.weapon?30:17):(source.kind==='boss'?22:10);
  target.hp=Math.max(0,target.hp-amount);target.action=target.hp?'hurt':'down';target.t=0;target.cool=.65;
  this.move(target,Math.sin(source.angle)*2.2,Math.cos(source.angle)*2.2,.12);this.flash=.09;this.hits++;
  if(target===this.player&&target.weapon){this.pipe={x:target.x+.5,z:target.z,taken:false,uses:target.weapon};target.weapon=0;this.message='Pipe dropped · USE to recover'}
  if(target===this.player&&!target.hp)this.message='SHIFT TERMINATED';
  else if(target.kind==='boss'&&!target.hp)this.message='BOSS DEFEATED · Advance to the exit!';
  else if(target!==this.player)this.message='HIT · '+amount+' DAMAGE';
 }
 step(dt,input={}){
  if(this.status!=='playing')return;
  dt=Math.min(dt,.04);this.flash=Math.max(0,this.flash-dt);
  const p=this.player,active=this.activeEnemies;
  for(const a of [p,...this.enemies]){
   a.t+=dt;a.cool=Math.max(0,a.cool-dt);
   if(a.action==='hurt'&&a.t>.32)a.action='idle';
   if(a.action==='attack'){
    if(!a.hit&&a.t>(a===p?(a.attackWeapon?.34:.16):.2)){
     a.hit=true;const targets=a===p?this.activeEnemies:[p],reach=a.attackWeapon?2.9:a.kind==='boss'?2.1:1.5;
     for(const target of targets){if(target.hp<=0)continue;const dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz);
      if(d<reach&&(d<.55||(dx*Math.sin(a.angle)+dz*Math.cos(a.angle))/d>(a.attackWeapon?-.1:.25)))this.damage(target,a)}
     if(a===p)for(const o of this.props){const dx=o.x-a.x,dz=o.z-a.z;if(o.hp>0&&Math.hypot(dx,dz)<reach+.4&&dx*Math.sin(a.angle)+dz*Math.cos(a.angle)>0)o.hp=Math.max(0,o.hp-(p.weapon?30:17))}
     if(a.weapon&&--a.weapon===0)this.message='PIPE BROKEN';
    }
    if(a.t>(a.attackDuration||.44))a.action='idle';
   }
  }
  if(this.pendingAttack>0){this.pendingAttack=Math.max(0,this.pendingAttack-dt);if(p.cool<=0&&['idle','walk'].includes(p.action))this.attack(p)}
  if(!p.hp){this.status='lost';return}
  if(['idle','walk'].includes(p.action)){let x=input.x||0,z=input.z||0,n=Math.max(1,Math.hypot(x,z));x/=n;z/=n;if(x||z){p.angle=Math.atan2(x,z);this.move(p,x*3.4,z*3.4,dt);p.action='walk'}else p.action='idle'}
  for(const e of active){
   if(!e.hp||!['idle','walk'].includes(e.action))continue;
   const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);e.angle=Math.atan2(dx,dz);
   if(d>(e.kind==='boss'?1.8:1.3)){this.move(e,dx/Math.max(.01,d)*(e.kind==='boss'?1.25:1.65),dz/Math.max(.01,d)*1.65,dt);e.action='walk'}
   else{e.action='idle';this.attack(e)}
  }
  if(this.activeEnemies.length===0&&this.wave<2){this.wave++;this.message=this.wave===2?'BOSS APPROACHING · Final encounter!':'AREA CLEAR · More guards ahead!'}
  if(this.wave===2&&this.activeEnemies.length===0&&p.x>21){if(this.stage<2){this.startStage(2,false);this.message='STAGE 2 · NIGHT SHIFT · New enemies!'}else{this.status='won';this.message='ALL STAGES CLEARED · YOU WIN'}}
 }
}
