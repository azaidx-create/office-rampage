export class Arena {
  constructor(){this.reset()}
  reset(){this.player={x:0,z:3,hp:100,angle:Math.PI,t:0,action:'idle',cool:0,weapon:0};this.enemy={x:0,z:-3,hp:120,angle:0,t:0,action:'idle',cool:1};this.pipe={x:2,z:2,taken:false,uses:10};this.props=[{x:-3,z:0,hp:60},{x:3,z:-2,hp:60}];this.pendingAttack=0;this.status='playing';this.flash=0;this.hits=0;this.message='Find the pipe. Defeat security. Reach the exit.'}
  attack(a){
    if(a.hp<=0||this.status!=='playing')return;
    if(a.cool>0||a.action==='hurt'||a.action==='attack'){
      if(a===this.player)this.pendingAttack=.25;
      return;
    }
    // Touch combat assists facing, so retreating does not leave punches aimed away.
    const target=a===this.player?this.enemy:this.player;
    const dx=target.x-a.x,dz=target.z-a.z;
    if(target.hp>0&&Math.hypot(dx,dz)<(a.weapon?3.25:1.9))a.angle=Math.atan2(dx,dz);
    a.action='attack';a.t=0;a.cool=a===this.enemy?1.15:(a.weapon?.82:.44);a.hit=false;
    a.attackDuration=a.weapon?.82:.44;a.attackWeapon=!!a.weapon;
    if(a===this.player)this.pendingAttack=0;
  }
  pickup(){const p=this.player;if(this.status==='playing'&&!this.pipe.taken&&Math.hypot(p.x-this.pipe.x,p.z-this.pipe.z)<1.6){this.pipe.taken=true;p.weapon=this.pipe.uses;this.message='STEEL PIPE · 10 swings';return true}return false}
  move(a,x,z,dt){let nx=Math.max(-5.3,Math.min(5.3,a.x+x*dt)),nz=Math.max(-4.7,Math.min(4.7,a.z+z*dt));for(const o of this.props)if(o.hp>0&&Math.abs(nx-o.x)<1.25&&Math.abs(nz-o.z)<.85)return;a.x=nx;a.z=nz}
  damage(target,source){if(target.hp<=0)return;target.hp=Math.max(0,target.hp-(source===this.enemy?12:source.weapon?30:17));target.action=target.hp?'hurt':'down';target.t=0;target.cool=.65;this.move(target,Math.sin(source.angle)*3,Math.cos(source.angle)*3,.13);this.flash=.09;this.hits++;if(target===this.enemy)this.message=`HIT · ${source.weapon?30:17} DAMAGE`; if(target===this.player&&target.weapon){this.pipe={x:target.x+.5,z:target.z,taken:false,uses:target.weapon};target.weapon=0;this.message='Pipe dropped · USE to recover'}if(!target.hp)this.message=target===this.player?'SHIFT TERMINATED':'SECURITY DOWN · Head to the green exit'}
  step(dt,input={}){if(this.status!=='playing')return;dt=Math.min(dt,.04);this.flash=Math.max(0,this.flash-dt);const p=this.player,e=this.enemy;for(const a of [p,e]){a.t+=dt;a.cool=Math.max(0,a.cool-dt);if(a.action==='hurt'&&a.t>.32)a.action='idle';if(a.action==='attack'){if(!a.hit&&a.t>(a===e?.34:a.attackWeapon?.26:.16)){a.hit=true;const target=a===p?e:p,reach=a.attackWeapon?2.9:1.5;let dx=target.x-a.x,dz=target.z-a.z,d=Math.hypot(dx,dz);if(d<reach&&(d<.55||(dx*Math.sin(a.angle)+dz*Math.cos(a.angle))/d>(a.attackWeapon?-.1:.25)))this.damage(target,a);if(a===p)for(const o of this.props){dx=o.x-a.x;dz=o.z-a.z;if(o.hp>0&&Math.hypot(dx,dz)<reach+.4&&dx*Math.sin(a.angle)+dz*Math.cos(a.angle)>0){o.hp=Math.max(0,o.hp-(p.weapon?30:17));this.flash=.06}}if(a.weapon&&--a.weapon===0)this.message='PIPE BROKEN'}if(a.t>(a.attackDuration||.44))a.action='idle'}}
    if(this.pendingAttack>0){this.pendingAttack=Math.max(0,this.pendingAttack-dt);if(p.cool<=0&&['idle','walk'].includes(p.action))this.attack(p)}
    if(!p.hp){this.status='lost';return}
    if(['idle','walk'].includes(p.action)){let x=input.x||0,z=input.z||0;const n=Math.max(1,Math.hypot(x,z));x/=n;z/=n;if(x||z){p.angle=Math.atan2(x,z);this.move(p,x*3.4,z*3.4,dt);p.action='walk'}else p.action='idle'}
    if(e.hp){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);if(d<.65){const nx=d>.001?dx/d:-Math.sin(p.angle),nz=d>.001?dz/d:-Math.cos(p.angle);this.move(p,nx*(.65-d),nz*(.65-d),1)}}
    if(e.hp&&['idle','walk'].includes(e.action)){let dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);e.angle=Math.atan2(dx,dz);if(d>1.25){this.move(e,dx/d*1.65,dz/d*1.65,dt);e.action='walk'}else{e.action='idle';this.attack(e)}}
    if(!e.hp&&p.z<-4&&Math.abs(p.x)<1.4){this.status='won';this.message='CLOCKED OUT · You made it'}
  }
}
