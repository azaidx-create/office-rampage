import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {clone} from 'three/addons/utils/SkeletonUtils.js';
import {Arena} from './simulation.js';
const $=id=>document.getElementById(id),canvas=$('view');
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'})}catch(err){$('panel').innerHTML='<article><h1>3D unavailable</h1><p>This browser could not start WebGL. Try Safari or Chrome with hardware graphics enabled.</p><a href="../">Play the 2D game</a></article>';throw err}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene();scene.background=new T.Color('#121f2b');scene.fog=new T.Fog('#121f2b',19,35);const camera=new T.PerspectiveCamera(43,1,.1,60);camera.position.set(-8,8,17);camera.lookAt(-8,1,0);
scene.add(new T.HemisphereLight(0xcce8ff,0x535652,2));const sun=new T.DirectionalLight(0xffe1b5,3);sun.position.set(-4,10,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});scene.add(sun);
const mats=new Map();function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.75}));return mats.get(c)}
function box(parent,x,y,z,w,h,d,color){const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
box(scene,7,-.12,0,37,.24,9,'#344852');box(scene,7,1.7,-4.5,37,3.4,.2,'#8a9d9e');box(scene,-11.5,1.1,0,.2,2.2,9,'#71878a');box(scene,25.5,1.1,0,.2,2.2,9,'#71878a');
for(let x=-11;x<=25;x+=1)box(scene,x,.005,0,.015,.01,9,'#405661');for(let z=-4;z<=4;z++)box(scene,7,.006,z,37,.01,.015,'#405661');
box(scene,23,1.35,-4.35,2.3,2.7,.15,'#223c45');const door=box(scene,23,2.95,-4.15,1.8,.18,.1,'#6ba694');
for(const x of [-6,12]){box(scene,x,2.25,-4.32,2.4,1.2,.08,'#254358');for(let j=-1;j<=1;j++)box(scene,x+j*.7,2.25,-4.25,.045,1.2,.05,'#adc3be')}
function label(str,x,y,z){const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle='#182f3b';q.fillRect(0,0,512,128);q.fillStyle='#dce9d4';q.font='bold 48px monospace';q.textAlign='center';q.fillText(str,256,83);const m=new T.Mesh(new T.PlaneGeometry(2,.5),new T.MeshBasicMaterial({map:new T.CanvasTexture(c)}));m.position.set(x,y,z);scene.add(m);return m}label('EXIT',23,3,-4.22);label('OPERATIONS',-6,3,-4.2);
for(const x of [-8,19]){box(scene,x,.35,-4,.5,.7,.5,'#a57958');const foliage=new T.Mesh(new T.IcosahedronGeometry(.65,0),mat('#4f8669'));foliage.position.set(x,1.1 ,-3.5);scene.add(foliage)}

// Layered industrial scenery: wall panels, loading shutters, pipes, lamps and crates.
for(let x=-10;x<=24;x+=3){
 box(scene,x,1.6,-4.38,.10,3.2,.12,'#3b5058');
 box(scene,x,3.15,-4.18,2.35,.12,.18,'#24343b');
 box(scene,x,2.95,-4.05,1.25,.08,.09,'#e2b877');
 box(scene,x,-.03,3.8,2.6,.08,.22,'#657177');
}
for(const x of [-8,1,10,19]){
 box(scene,x,1.55,-4.25,2.4,2.8,.12,'#455963');
 for(let y=.4;y<2.8;y+=.4)box(scene,x,y,-4.12,2.3,.045,.07,'#283a44');
 box(scene,x-1.45,1.45,-4.02,.13,2.9,.17,'#b49a60');
}
for(const x of [-9,6,17]){
 box(scene,x,.5,-3.5,1.1,1,1.1,'#86684c');
 box(scene,x,.98,-3.5,1.16,.08,1.16,'#a78c61');
 box(scene,x,1.6,-4.1,.11,3.2,.11,'#9ba7a7');
}
const stageTint=box(scene,7,3.35,-4.5,37,.1,.15,'#9d9f85');

const game=new Arena(),desks=[];for(const o of game.props){const g=new T.Group();g.position.set(o.x,0,o.z);scene.add(g);box(g,0,.9,0,1.9,.12,1.1,'#c0a87d');for(const x of [-.8,.8])box(g,x,.42,0,.09,.84,.8,'#56656b');box(g,0,1.27,-.25,.65,.55,.3,'#c2c9bc');box(g,0,1.29,-.08,.52,.39,.02,'#173c40');box(g,0,1,.27,.65,.04,.23,'#d0d5c4');desks.push(g)}
let hero,enemies=[],modelReady=false;const PIPE_LENGTH=1.85;
const floorPipe=box(scene,-5,.13,2,PIPE_LENGTH,.09,.09,'#c2d4d6');
function fighter(asset,isEnemy){
 const root=new T.Group(),model=clone(asset.scene);root.add(model);scene.add(root);model.scale.set(1.32,1.18,1.24);
 model.traverse(o=>{if(o.name==='Pistol')o.visible=false;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 const hand=model.getObjectByName('WristR')||model.getObjectByName('Wrist.R');
 if(!hand)throw Error('Character has no right-hand grip');
 const pipe=new T.Mesh(new T.CylinderGeometry(.035,.035,PIPE_LENGTH,10),mat('#bacbd1'));
 pipe.rotation.z=Math.PI/2;pipe.position.set(-.72,.04,0);pipe.castShadow=true;hand.add(pipe);pipe.visible=false;
 const mixer=new T.AnimationMixer(model),actions={};for(const clip of asset.animations)actions[clip.name]=mixer.clipAction(clip);
 return {root,model,mixer,actions,pipe,current:null,lastTime:0};
}
function animate(f,a,dt){if(!f)return;f.root.position.set(a.x,0,a.z);f.root.rotation.y=a.angle;f.pipe.visible=!!a.weapon||(a.action==='attack'&&a.attackWeapon);
 const name=a.action==='attack'?(a.attackWeapon?'Sword_Slash':'Punch_Right'):a.action==='hurt'?'HitRecieve':a.action==='down'?'Death':a.action==='walk'?'Run':a.weapon?'Idle_Sword':'Idle';
 const action=f.actions[name],restart=a.t<f.lastTime&&a.action==='attack';f.lastTime=a.t;
 if(f.current!==name||restart){if(f.current)f.actions[f.current].fadeOut(.07);action.reset();const once=['attack','hurt','down'].includes(a.action);action.setLoop(once?T.LoopOnce:T.LoopRepeat,once?1:Infinity);action.clampWhenFinished=once;action.fadeIn(.07).play();f.current=name}
 action.timeScale=name==='Punch_Right'?action.getClip().duration/.44:name==='Sword_Slash'?action.getClip().duration/.82:name==='HitRecieve'?action.getClip().duration/.32:1;
 f.mixer.update(dt);
}
$('start').disabled=true;$('start').textContent='LOADING FIGHTER…';
(async()=>{try{
 const load=async(name)=>{const response=await fetch(`assets/${name}.glb.gz`);if(!response.ok)throw Error('Model download failed');const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();return new GLTFLoader().parseAsync(bytes,'')};
 const [playerAsset,guardAsset]=await Promise.all([load('punk'),load('swat')]);
 hero=fighter(playerAsset,false);enemies=game.enemies.map(e=>{const boss=e.kind==='boss';const f=fighter(boss?playerAsset:guardAsset,true);
if(boss){
 f.model.scale.set(1.72,1.58,1.65);
 f.model.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.color.set('#71382f')}});
 // Distinct armored gang leader silhouette: broad shoulders, chest plate and spiked pauldrons.
 const armor=new T.Group();f.root.add(armor);
 box(armor,0,1.52,.02,1.05,.65,.55,'#342c2e');
 box(armor,0,1.56,.32,.82,.44,.13,'#9c4933');
 for(const side of [-1,1]){
  box(armor,side*.76,1.82,0,.52,.32,.65,'#37383e');
  const spike=new T.Mesh(new T.ConeGeometry(.16,.55,6),mat('#b5a78e'));
  spike.position.set(side*.78,2.24,0);spike.rotation.z=side*-.32;armor.add(spike);
  box(armor,side*.45,.94,.24,.2,.28,.16,'#b8a47a');
 }
 box(armor,0,2.4,.14,.65,.19,.55,'#24252b');
 box(armor,0,2.25,.45,.6,.16,.09,'#c4a878');
 const mark=label('BOSS',0,3.6,0);mark.position.x=0;
 // label() adds to scene; parent it to the boss so it travels with him.
 f.root.add(mark);mark.position.set(0,3.5,0);
}
return f});modelReady=true;$('start').disabled=false;$('start').textContent='ENTER THE OFFICE →';
 }catch(err){$('panel').querySelector('p').textContent='Character loading failed. Refresh in a current Safari or Chrome browser. '+err.message;$('start').textContent='MODEL UNAVAILABLE';console.error(err)}})();
let running=false,keys=new Set(),stick={x:0,z:0},pointer=null;function clear(){keys.clear();stick={x:0,z:0};pointer=null;$('nub').style.transform=''}
function pause(){if(!running)return;running=false;clear();$('panel').style.display='grid';$('start').textContent='RESUME →'}
$('start').onclick=()=>{if(!modelReady)return;if(game.status!=='playing'){game.reset();desks.forEach(g=>{g.rotation.set(0,0,0);g.position.y=0})}running=true;$('panel').style.display='none'};
$('attack').onpointerdown=e=>{e.preventDefault();if(running)game.attack(game.player)};$('use').onpointerdown=e=>{e.preventDefault();if(running)game.pickup()};
addEventListener('keydown',e=>{if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();keys.add(e.code);if(e.repeat)return;if(e.code==='KeyP')pause();if(running&&e.code==='Space')game.attack(game.player);if(running&&e.code==='KeyE')game.pickup()});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
function drag(e){const r=$('stick').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,z=e.clientY-r.top-r.height/2,n=Math.max(38,Math.hypot(x,z));stick={x:x/n,z:z/n};$('nub').style.transform=`translate(${stick.x*32}px,${stick.z*32}px)`}
$('stick').onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;e.currentTarget.setPointerCapture(pointer);drag(e)};$('stick').onpointermove=e=>{if(e.pointerId===pointer)drag(e)};for(const type of ['pointerup','pointercancel','lostpointercapture'])$('stick').addEventListener(type,e=>{if(e.pointerId===pointer){pointer=null;stick={x:0,z:0};$('nub').style.transform=''}});
function resize(){renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.position.set(game.player.x,camera.aspect<.8?13:8,camera.aspect<.8?23:17);camera.lookAt(game.player.x,1,0);camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();let last=performance.now(),time=0;
renderer.setAnimationLoop(now=>{const dt=Math.min((now-last)/1000,.04);last=now;if(running){time+=dt;game.step(dt,{x:stick.x+(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),z:stick.z+(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-(keys.has('KeyW')||keys.has('ArrowUp')?1:0)});if(game.status!=='playing'){running=false;$('panel').style.display='grid';$('panel').querySelector('h1').textContent=game.message;$('start').textContent='PLAY AGAIN →'}}animate(hero,game.player,running?dt:0);game.enemies.forEach((e,i)=>{const f=enemies[i];f.root.visible=e.wave<=game.wave;animate(f,e,running?dt:0)});floorPipe.visible=!game.pipe.taken;floorPipe.position.set(game.pipe.x,.12,game.pipe.z);desks.forEach((g,i)=>{if(!game.props[i].hp){g.rotation.z=.22;g.position.y=-.65}else{g.rotation.z=0;g.position.y=0}});door.material=mat(game.boss.hp?'#a66c51':'#67e4ac');$('health').value=game.player.hp;$('enemy').textContent=`STAGE ${game.stage} · WAVE ${game.wave+1}/3 · ${game.activeEnemies.length} ENEMIES · BOSS ${game.boss.hp}/260`;$('message').textContent=game.player.weapon?`STEEL PIPE · ${game.player.weapon} swings · ${game.message}`:game.message;{stageTint.material=mat(game.stage===2?'#537b9f':'#9d9f85');scene.background.set(game.stage===2?'#101b31':'#121f2b');const cx=Math.max(-8,Math.min(22,game.player.x));camera.position.x+=(cx-camera.position.x)*Math.min(1,dt*5);camera.lookAt(camera.position.x,1,0);renderer.render(scene,camera)}});
