import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import {seatedCharacter} from './seating.js';
import {MeshoptSimplifier} from './meshopt.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

export function createOffice({canvas,roles,people,onSelect,onStatus}){
RectAreaLightUniformsLib.init();
const assets='https://raw.githubusercontent.com/Ux-Man/mini-ai-agency/0685215b09fcff96deeb4b94de431f25597cd714/assets/';
const scene=new T.Scene();scene.background=new T.Color('#b9c6cc');scene.fog=new T.Fog('#c5ced0',24,65);
const camera=new T.PerspectiveCamera(49,1,.08,100);
const renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;renderer.outputColorSpace=T.SRGBColorSpace;
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.minDistance=1.4;controls.maxDistance=38;controls.maxPolarAngle=Math.PI*.49;controls.target.set(-.5,1.1,-.8);
camera.position.set(3.6,1.95,7.5);controls.update();
const hemi=new T.HemisphereLight('#dde8e9','#8f694b',.65);scene.add(hemi);
const sun=new T.DirectionalLight('#fff0db',2.0);sun.position.set(-9,11,5);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.5,far:40});sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;scene.add(sun);
new RGBELoader().load(assets+'studio.hdr',hdr=>{hdr.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(renderer);scene.environment=pmrem.fromEquirectangular(hdr).texture;hdr.dispose();pmrem.dispose();},undefined,()=>onStatus('Office ready · environment map unavailable'));
const loader=new T.TextureLoader();
function tex(url,rx=1,ry=1){const t=loader.load(url);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
const woodMap=tex(assets+'wood.jpg');woodMap.colorSpace=T.SRGBColorSpace;const woodNormal=tex(assets+'wood-normal.jpg');
const floorMap=tex(assets+'stone.jpg',8,8);floorMap.colorSpace=T.SRGBColorSpace;
const material=(color,roughness=.6,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
const wood=new T.MeshStandardMaterial({map:woodMap,normalMap:woodNormal,normalScale:new T.Vector2(.12,.12),roughness:.48,color:'#ffffff'}),walnut=new T.MeshStandardMaterial({map:woodMap,color:'#b5885f',roughness:.52});
const black=material('#171c20',.35,.55),dark=material('#293134',.57),aluminium=material('#90989d',.23,.85),cream=material('#cfc5b3',.74),leather=material('#9f542d',.5),stone=new T.MeshStandardMaterial({map:floorMap,color:'#c8c5bd',roughness:.24,metalness:.07});
stone.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>','#include <map_fragment>\nfloat stoneGrey=dot(diffuseColor.rgb,vec3(.299,.587,.114)); diffuseColor.rgb=mix(diffuseColor.rgb,vec3(stoneGrey),.95);');};
const green=material('#28533a',.69),lightGreen=material('#517447',.75),gold=material('#bf985a',.35,.72),glass=new T.MeshPhysicalMaterial({color:'#c5e6e7',roughness:.06,transparent:true,opacity:.045,metalness:0,depthWrite:false,side:T.DoubleSide});
const lightMat=new T.MeshBasicMaterial({color:'#ffce87',toneMapped:false}),pick=[],stations=[],staff=new Map(),plantSlots=[];
function mesh(geo,mat,x=0,y=0,z=0,parent=scene){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,mat,x,y,z,parent=scene,r=.015){return mesh(r?new RoundedBoxGeometry(w,h,d,2,Math.min(r,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d),mat,x,y,z,parent);}
function cyl(r1,r2,h,mat,x,y,z,parent=scene){return mesh(new T.CylinderGeometry(r1,r2,h,20),mat,x,y,z,parent);}
function rod(a,b,r,mat,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const m=mesh(new T.CylinderGeometry(r,r,v.length(),10),mat,0,0,0,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m;}
function label(text,w,h,bg='#101c20',fg='#f1e8d8',size=64){const c=document.createElement('canvas');c.width=1024;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle=fg;ctx.font=`600 ${size}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,512,128);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:bg==='transparent',alphaTest:.02}));}
// A real woven mesh surface: the seat and back share a continuous frame.
const mc=document.createElement('canvas');mc.width=mc.height=128;const mt=mc.getContext('2d');mt.fillStyle='#4c5354';mt.fillRect(0,0,128,128);mt.strokeStyle='#202829';mt.lineWidth=2;for(let i=0;i<128;i+=6){mt.beginPath();mt.moveTo(i,0);mt.lineTo(i,128);mt.moveTo(0,i);mt.lineTo(128,i);mt.stroke();}
const meshTexture=new T.CanvasTexture(mc);meshTexture.wrapS=meshTexture.wrapT=T.RepeatWrapping;meshTexture.repeat.set(2,2);meshTexture.colorSpace=T.SRGBColorSpace;const fabric=new T.MeshStandardMaterial({map:meshTexture,roughness:.91,color:'#a5aaaa'});
function chair(parent,x=0,z=.91,rotation=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);
 cyl(.035,.045,.34,aluminium,0,.25,0,g);cyl(.072,.07,.11,black,0,.12,0,g);
 for(let k=0;k<5;k++){const a=k*Math.PI*2/5,dx=Math.sin(a)*.29,dz=Math.cos(a)*.29;rod([0,.12,0],[dx,.075,dz],.021,aluminium,g);const wheel=cyl(.045,.045,.055,black,dx,.052,dz,g);wheel.rotation.z=Math.PI/2;}
 box(.49,.09,.46,dark,0,.47,0,g,.045);box(.46,.035,.43,fabric,0,.524,-.012,g,.016);
 const back=new T.Group();back.position.set(0,.72,.22);back.rotation.x=-.13;g.add(back);
 for(const side of [-1,1])rod([side*.23,-.19,0],[side*.23,.27,.025],.018,black,back);
 rod([-.23,.27,.025],[.23,.27,.025],.018,black,back);rod([-.23,-.19,0],[.23,-.19,0],.018,black,back);
 box(.428,.455,.014,fabric,0,.045,0,back,.035);box(.33,.075,.065,dark,0,-.095,-.05,back,.03);
 rod([0,.45,.18],[0,.87,.27],.022,aluminium,g);
 for(const side of [-1,1]){rod([side*.225,.48,.13],[side*.27,.69,.12],.017,black,g);box(.065,.035,.26,dark,side*.27,.705,-.015,g,.017);}
 box(.28,.13,.065,fabric,0,1.075,.29,g,.035);return g;
}
function plant(x,z,h=1.4,parent=scene){const g=new T.Group();g.position.set(x,0,z);parent.add(g);plantSlots.push({group:g,height:h});cyl(.20,.16,.34,cream,0,.18,0,g);cyl(.175,.175,.018,material('#393329'),0,.354,0,g);
 for(let k=0;k<19;k++){const a=k*2.399,ht=h*(.40+(k%7)*.075),rad=.13+(k%4)*.055;const end=[Math.sin(a)*rad,ht,Math.cos(a)*rad];rod([0,.31,0],end,.004,green,g);
 const positions=[],uvs=[],indices=[];for(let j=0;j<=10;j++){const t=j/10,w=Math.sin(Math.PI*t)*(.06+(k%3)*.012);for(const side of [-1,1]){positions.push(side*w,t*.38,Math.sin(Math.PI*t)*.065);uvs.push((side+1)/2,t);}}for(let j=0;j<10;j++){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);geo.computeVertexNormals();const leafMat=(k%3?green:lightGreen).clone();leafMat.side=T.DoubleSide;const leaf=mesh(geo,leafMat,...end,g);leaf.rotation.set(.6+Math.sin(a)*.35,a,.25);}
 return g;
}
// Shared studio shell. There are no isolated classroom bays or grid lines.
box(25,.16,19,stone,3,-.1,1,scene,0);box(16,3.6,.16,cream,0,1.8,-7,scene,0);box(.16,3.6,16,cream,-8,1.8,1,scene,0);
box(6,3.3,.05,wood,-4.75,1.65,-6.89,scene,0);
for(let x=-7.6;x<-1.8;x+=.17)box(.033,3.3,.055,walnut,x,1.65,-6.84,scene,0);
const brand=label('Mini AI Agency',4.2,.8,'transparent','#18251f',94);brand.position.set(-4.65,2.1,-6.77);scene.add(brand);
const brandSub=label('DESIGN   /   3D   /   VIDEO   /   AI',3.7,.32,'transparent','#23392f',39);brandSub.position.set(-4.65,1.48,-6.77);scene.add(brandSub);
// Window mullions and daylight glass down the west side.
for(const z of [-4.9,-1.5,1.9,5.3]){box(.035,2.5,3.15,new T.MeshBasicMaterial({color:'#c3e0e8'}),-7.89,1.85,z,scene,0);for(const dz of [-1.58,0,1.58])box(.07,2.65,.045,black,-7.82,1.85,z+dz,scene,0);box(.11,.06,3.22,black,-7.8,3.17,z,scene,0);}
// Exposed dark ceiling beams and warm suspended luminaires.
for(const x of [-7,-3,1,5,9])box(.13,.18,15,black,x,3.75,0,scene,0);
for(const z of [-5,-1,3,7])box(17,.14,.12,black,.5,3.62,z,scene,0);
const ceiling=mesh(new T.PlaneGeometry(25,19),material('#282a29',.92),3,3.9,1);ceiling.rotation.x=Math.PI/2;ceiling.castShadow=false;
function linearLight(x,z,w=2.4){box(w,.075,.075,black,x,3.28,z);box(w-.06,.018,.067,lightMat,x,3.235,z);for(const dx of [-w*.4,w*.4])rod([x+dx,3.32,z],[x+dx,3.68,z],.006,black);const light=new T.RectAreaLight('#ffd397',4,w,.25);light.position.set(x,3.22,z);light.rotation.x=-Math.PI/2;scene.add(light);}
for(const x of [-4.4,-1.1,2.2])for(const z of [-4.5,-1.2,2.1])linearLight(x,z);
function ringLight(x,z,r=1){const ring=mesh(new T.TorusGeometry(r,.025,8,64),lightMat,x,3.12,z);ring.rotation.x=Math.PI/2;for(const a of [0,2.1,4.2])rod([x+Math.sin(a)*r,3.13,z+Math.cos(a)*r],[x+Math.sin(a)*r,3.65,z+Math.cos(a)*r],.005,black);}
ringLight(-3.4,6.3,1.05);ringLight(6.3,-4.4,.9);
// Desktop display textures contain distinct design, code and video workspaces.
function screenTexture(type){const c=document.createElement('canvas');c.width=1024;c.height=600;const p=c.getContext('2d');p.fillStyle='#151c27';p.fillRect(0,0,1024,600);p.fillStyle='#242d3b';p.fillRect(0,0,1024,32);p.fillStyle='#d1d8e0';p.font='14px monospace';p.fillText(['STUDIO / interface.fig','STUDIO / office.js','STUDIO / sequence-01'][type],22,22);
 p.fillStyle='#202a36';p.fillRect(0,32,155,568);p.fillRect(830,32,194,568);p.fillStyle='#94a6ba';p.font='13px monospace';for(let i=0;i<17;i++)p.fillText((i%4?'  ':'> ')+['Layers','Workspace','Components','Properties'][i%4],15,61+i*27);
 if(type===0){p.fillStyle='#b7c4c4';p.fillRect(175,70,635,480);p.fillStyle='#f6f2e9';p.fillRect(260,100,430,420);p.fillStyle='#163e33';p.fillRect(260,100,430,155);p.fillStyle='#e9e9d8';p.font='bold 35px Arial';p.fillText('Better by design.',283,177);p.fillStyle='#73918a';p.fillRect(283,220,120,13);for(let i=0;i<3;i++){p.fillStyle=['#e2d9c6','#cad7d0','#c2cbd5'][i];p.fillRect(282+i*132,282,115,110);p.fillStyle='#46544e';p.fillRect(282+i*132,410,100,7);p.fillRect(282+i*132,430,75,5);}}
 else if(type===1){p.font='16px monospace';const lines=['import { Scene, Camera } from "three";','','export function createOffice() {','  const studio = new Scene();','  const team = await loadCharacters();','','  team.forEach((person, index) => {','    const desk = workstations[index];','    person.position.copy(desk.seat);','    studio.add(person);','  });','','  return { studio, controls };','}'];lines.forEach((l,i)=>{p.fillStyle=i%3?'#a5c8bb':'#e5b57e';p.fillText(l,182,78+i*29)});p.fillStyle='#0d1420';p.fillRect(168,485,640,98);p.fillStyle='#72c4a3';p.fillText('> Studio ready',185,515);p.fillStyle='#92a4b5';p.fillText('18 workstations / local prototype',185,546);}
 else {p.fillStyle='#090f16';p.fillRect(176,50,636,330);const grd=p.createLinearGradient(0,60,0,380);grd.addColorStop(0,'#a2c3d0');grd.addColorStop(1,'#e1c8a5');p.fillStyle=grd;p.fillRect(230,70,530,286);p.fillStyle='#c4b598';p.fillRect(305,136,339,196);for(let j=0;j<6;j++)for(let k=0;k<4;k++){p.fillStyle='#41515b';p.fillRect(319+j*53,150+k*44,32,30);}p.fillStyle='#273342';p.fillRect(165,402,661,170);for(let r=0;r<4;r++)for(let k=0;k<7;k++){p.fillStyle=['#538b9a','#a27c9d','#7d9b67','#b7925c'][r];p.fillRect(185+k*86,423+r*31,79,23);}p.fillStyle='#f2c88b';p.fillRect(530,395,2,180);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.anisotropy=8;return t;}
const screens=[0,1,2].map(i=>new T.MeshBasicMaterial({map:screenTexture(i)}));
function monitor(g,type){box(.71,.425,.033,black,0,1.035,-.18,g,.018);const display=mesh(new T.PlaneGeometry(.668,.376),screens[type],0,1.04,-.159,g);display.rotation.x=-.02;rod([0,.78,-.22],[0,.90,-.20],.025,aluminium,g);box(.28,.012,.18,aluminium,0,.783,-.20,g,.01);cyl(.005,.005,.002,lightMat,.31,.845,-.158,g);}
function keyboard(g){box(.405,.016,.142,aluminium,-.02,.784,.21,g,.009);for(let r=0;r<5;r++)for(let k=0;k<14;k++)box(k===6&&r===4?.09:.021,.004,.019,dark,-.201+k*.027,.795,.155+r*.025,g,.002);const mouse=mesh(new T.SphereGeometry(1,16,10),dark,.30,.794,.21,g);mouse.scale.set(.028,.018,.045);}
function workstation(i,x,z,rotation){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);
 const top=box(1.60,.045,.76,wood,0,.75,0,g,.02);top.userData.agent=i;pick.push(top);
 for(const side of [-1,1]){box(.045,.69,.52,black,side*.68,.36,0,g,.012);box(.36,.68,.59,cream,side*.51,.35,-.01,g,.02);if(side===1)for(const y of [.19,.39,.59]){box(.305,.008,.018,material('#aaa89e'),side*.51,y,.294,g,.003);box(.08,.012,.018,aluminium,side*.51,y+.07,.30,g,.004);}}
 box(1.50,.065,.045,black,0,.23,-.24,g);monitor(g,i%3);keyboard(g);chair(g,0,.73);
 // Soft upholstered acoustic divider with a planted centre line.
 box(1.58,.26,.045,fabric,0,.88,-.39,g,.016);
 cyl(.047,.042,.09,cream,.59,.818,.16,g);const handle=mesh(new T.TorusGeometry(.028,.007,6,14),cream,.64,.827,.16,g);handle.rotation.y=Math.PI/2;
 box(.18,.013,.24,material('#e2d6ba'),-.55,.786,.17,g,.006);box(.014,.008,.14,black,-.55,.798,.19,g,.003);
 const seat=new T.Group();seat.position.set(0,0,.66);seat.rotation.y=Math.PI;g.add(seat);stations.push({group:g,seat,top,index:i});return g;
}
for(let pod=0;pod<9;pod++){const x=-4.9+(pod%3)*3.45,z=-4.7+Math.floor(pod/3)*3.45;workstation(pod*2,x,z+.44,0);workstation(pod*2+1,x,z-.44,Math.PI);plant(x+1.1,z,1.05);}
for(const [x,z,h] of [[-7,-5.7,2],[-7,-.8,1.8],[-7,4.4,2],[3.9,-5.5,1.8],[3.8,4,1.6],[-.7,7.2,1.65],[8.4,7,1.8]])plant(x,z,h);
// Glass meeting room: slim framing, a real conference table and inward-facing chairs.
function glazing(x,z,w,angle=0){const g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);box(w,2.9,.018,glass,0,1.45,0,g,0);for(const a of [-w/2,w/2])box(.035,2.96,.045,black,a,1.48,0,g,.003);box(w,.045,.055,black,0,2.94,0,g);box(w,.035,.05,black,0,.025,0,g);return g;}
box(5.1,3.2,.13,cream,6.3,1.6,-7);glazing(6.3,-1.95,5.1);glazing(3.75,-4.45,5.05,Math.PI/2);glazing(8.85,-4.45,5.05,Math.PI/2);
box(3.35,.065,1.22,wood,6.3,.75,-4.55,scene,.045);for(const x of [5.1,7.5])box(.09,.70,.75,black,x,.36,-4.55);for(const x of [5.2,6.3,7.4]){chair(scene,x,-3.45,0);chair(scene,x,-5.65,Math.PI);}const meetingLabel=label('MEETING ROOM',1.3,.2,'#182326','#e2e6df',60);meetingLabel.position.set(6.3,1.8,-1.91);scene.add(meetingLabel);plant(8,-6.3,1.5);
const meetingScreen=mesh(new T.PlaneGeometry(2.1,1.18),screens[0],6.3,1.85,-6.91);
// Lounge: leather cushions, piping, walnut base, low tables and woven rug.
const rugCanvas=document.createElement('canvas');rugCanvas.width=rugCanvas.height=256;const rc=rugCanvas.getContext('2d');rc.fillStyle='#9e9a8c';rc.fillRect(0,0,256,256);for(let j=0;j<256;j+=3){rc.strokeStyle=j%2?'#b9b2a0':'#8f8b7f';rc.beginPath();rc.moveTo(j,0);rc.lineTo(j,256);rc.stroke();}const rugMap=new T.CanvasTexture(rugCanvas);rugMap.wrapS=rugMap.wrapT=T.RepeatWrapping;rugMap.repeat.set(9,5);box(5.5,.017,3.1,new T.MeshStandardMaterial({map:rugMap,roughness:1}),-4.1,.005,6.4,scene,0);
function sofa(x,z){const g=new T.Group();g.position.set(x,0,z);scene.add(g);box(2.75,.16,.86,walnut,0,.20,0,g,.045);box(2.7,.64,.17,leather,0,.64,.36,g,.075);for(const xx of [-.88,0,.88]){box(.85,.18,.69,leather,xx,.40,-.02,g,.075);box(.83,.47,.13,leather,xx,.70,.29,g,.055);}for(const xx of [-1.4,1.4])box(.20,.54,.91,leather,xx,.49,0,g,.07);for(const xx of [-1.15,1.15])for(const zz of [-.25,.25])rod([xx,.05,zz],[xx,.20,zz],.026,black,g);return g;}
const sofaSlot=sofa(-4.2,7.15);cyl(.73,.73,.045,walnut,-4.2,.39,5.8);for(const a of [0,2.1,4.2])rod([-4.2+Math.sin(a)*.45,.03,5.8+Math.cos(a)*.45],[-4.2+Math.sin(a)*.35,.37,5.8+Math.cos(a)*.35],.022,black);plant(-6.6,6.3,1.4);box(.22,.025,.30,cream,-4.3,.43,5.8);
// Coffee corner and dining bar.
box(3.3,.87,.62,walnut,6.3,.44,4.2);box(3.45,.055,.72,cream,6.3,.90,4.2);box(.51,.45,.36,aluminium,5.6,1.15,4.2,.0||scene);box(.42,.10,.11,black,5.6,1.14,4.43);for(const x of [6.4,6.7,7])cyl(.06,.05,.10,cream,x,.98,4.25);
for(const x of [5.5,6.3,7.1]){cyl(.18,.18,.06,leather,x,.60,5.25);cyl(.023,.023,.56,black,x,.3,5.25);cyl(.22,.22,.03,black,x,.04,5.25);}plant(8.2,4,1.6);
// Background auxiliary rooms keep the existing room-navigation destinations.
const zones={work:{pos:[-2,1.15,-1],cam:[3.6,1.95,7.5]},meeting:{pos:[6.3,1.1,-4.5],cam:[8,1.65,-2.8]},recreation:{pos:[-4.2,.65,6.4],cam:[-.1,1.55,4.3]},coffee:{pos:[6.3,1,4.2],cam:[2.5,1.8,7.5]},dining:{pos:[6.3,.8,5.2],cam:[3,2,8]},reception:{pos:[-4,1.6,-6.8],cam:[-1,1.9,-2]},prayer:{pos:[12,1,-4.5],cam:[10,2,0]},restrooms:{pos:[12,1,2],cam:[10,2,5]}};
for(const [name,z] of [['QUIET / PRAYER',-4.5],['RESTROOMS',2]]){box(4.8,.07,4,cream,12,.01,z);box(4.8,2.8,.12,cream,12,1.4,z-2);glazing(9.6,z,4,Math.PI/2);const s=label(name,2.1,.32);s.position.set(12,2.1,z-1.91);scene.add(s);if(z<0){for(const x of [10.7,12,13.3])box(.8,.02,1.5,material('#64776a'),x,.065,z);}else for(const x of [11,13]){box(.9,.70,.5,cream,x,.35,z);cyl(.14,.16,.10,aluminium,x,.74,z);}}
// Fixed employee-to-asset mapping; asynchronous download order never changes identity.
const assetIds=[1,2,3,5,8,11,15,17],models=new Map(),assetByRole=[1,2,3,2,5,1,2,8,2,3,11,1,8,11,15,3,17,11];
const gltf=new GLTFLoader();let loaded=0,failed=0;
async function loadFurniture(){
 try{const p=await gltf.loadAsync(assets+'potted_plant_02.glb');p.scene.traverse(o=>{if(o.isMesh&&o.material?.name?.includes('_pot')){const m=o.material.clone();m.map=null;m.color.set('#d2cbbd');m.roughness=.72;o.material=m;}});const b=new T.Box3().setFromObject(p.scene),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3());
 for(const slot of plantSlots){slot.group.clear();const model=p.scene.clone(true),s=slot.height/size.y;model.scale.setScalar(s);model.position.set(-c.x*s,-b.min.y*s,-c.z*s);model.rotation.y=(slot.group.position.x+slot.group.position.z)*.8;model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});slot.group.add(model);}}
 catch(e){console.warn('Plant asset unavailable',e);}
 try{const p=await gltf.loadAsync(assets+'sofa_03.glb');const b=new T.Box3().setFromObject(p.scene),size=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),s=2.9/size.x;const model=p.scene;model.scale.setScalar(s);model.position.set(-c.x*s,-b.min.y*s,-c.z*s);model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});sofaSlot.clear();const holder=new T.Group();holder.rotation.y=Math.PI;holder.add(model);sofaSlot.add(holder);}
 catch(e){console.warn('Sofa asset unavailable',e);}
}
async function load(id){try{const source=await gltf.loadAsync(`https://ma21foh9cxu9ar68.public.blob.vercel-storage.com/characters/employee-${String(id).padStart(2,'0')}.glb`);const model=seatedCharacter(source.scene);if(MeshoptSimplifier.supported){await MeshoptSimplifier.ready;model.traverse(o=>{if(!o.isMesh||!o.geometry.index)return;const geo=o.geometry;const indices=new Uint32Array(geo.index.array);const target=Math.floor(indices.length*.22/3)*3;const [simple]=MeshoptSimplifier.simplify(indices,geo.attributes.position.array,3,target,.002,['LockBorder']);geo.setIndex(new T.BufferAttribute(simple,1));});}models.set(id,model);for(let i=0;i<18;i++)if(assetByRole[i]===id){const person=model.clone(true);person.traverse(o=>{if(o.isMesh){o.userData.agent=i;pick.push(o);}});stations[i].seat.add(person);staff.set(i,person);}loaded++;}catch(e){failed++;console.warn('Character asset unavailable',id,e);}onStatus(`Staff ${loaded}/8${failed?' · '+failed+' unavailable':''}`);}
let next=0;async function worker(){while(next<assetIds.length)await load(assetIds[next++]);}
Promise.all([worker(),worker(),worker(),loadFurniture()]).then(()=>onStatus(failed?`Office ready · ${loaded}/8 staff assets`:'Office ready · 18 workstations'));
let walking=false,spin=false,dragStart=null;const held=new Set(),clock=new T.Clock();
function navigate(key){walking=false;controls.enabled=true;const v=zones[key]||zones.work;controls.target.fromArray(v.pos);camera.position.fromArray(v.cam);controls.update();}
canvas.addEventListener('pointerdown',e=>dragStart=[e.clientX,e.clientY]);canvas.addEventListener('pointerup',e=>{if(!dragStart||Math.hypot(e.clientX-dragStart[0],e.clientY-dragStart[1])>5)return;const rect=canvas.getBoundingClientRect();const pointer=new T.Vector2((e.clientX-rect.left)/rect.width*2-1,1-(e.clientY-rect.top)/rect.height*2);const ray=new T.Raycaster();ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects(pick,false)[0];if(hit)onSelect(hit.object.userData.agent);});
window.addEventListener('keydown',e=>{if(/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))return;if(['w','a','s','d','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){held.add(e.key);if(walking)e.preventDefault();}});window.addEventListener('keyup',e=>held.delete(e.key));window.addEventListener('blur',()=>held.clear());
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const ao=new SSAOPass(scene,camera,640,360);ao.kernelRadius=.22;ao.minDistance=.001;ao.maxDistance=.08;composer.addPass(ao);composer.addPass(new OutputPass());
const resize=()=>{const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);composer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();};new ResizeObserver(resize).observe(canvas);resize();
function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.04);if(walking){const dir=new T.Vector3();camera.getWorldDirection(dir);dir.y=0;dir.normalize();if(held.has('ArrowLeft'))dir.applyAxisAngle(new T.Vector3(0,1,0),dt*.9);if(held.has('ArrowRight'))dir.applyAxisAngle(new T.Vector3(0,1,0),-dt*.9);const side=new T.Vector3().crossVectors(dir,new T.Vector3(0,1,0)),move=new T.Vector3();if(held.has('w')||held.has('ArrowUp'))move.add(dir);if(held.has('s')||held.has('ArrowDown'))move.sub(dir);if(held.has('a'))move.sub(side);if(held.has('d'))move.add(side);if(move.lengthSq())camera.position.addScaledVector(move.normalize(),dt*1.7);camera.position.x=T.MathUtils.clamp(camera.position.x,-7.5,14);camera.position.z=T.MathUtils.clamp(camera.position.z,-6.5,9);camera.position.y=1.65;controls.target.copy(camera.position).add(dir);camera.lookAt(controls.target);}else{controls.autoRotate=spin;controls.autoRotateSpeed=.3;controls.update();}renderScene();}
const renderScene=()=>composer.render();
animate();
return {navigate,focusDesk(i){const station=stations[i];const p=station.group.localToWorld(new T.Vector3(1.4,1.45,1.45));const target=station.group.localToWorld(new T.Vector3(0,.9,.2));walking=false;controls.enabled=true;camera.position.copy(p);controls.target.copy(target);controls.update();},overview(){walking=false;controls.enabled=true;camera.position.set(15,15,19);controls.target.set(2,0,0);controls.update();},setOrbit(value){spin=value;},setWalk(value){walking=value;controls.enabled=!value;if(value){camera.position.set(1.5,1.65,7.5);controls.target.set(0,1.65,0);camera.lookAt(controls.target);}},async importCharacter(i,url){const source=await gltf.loadAsync(url);if(staff.has(i))stations[i].seat.remove(staff.get(i));const p=seatedCharacter(source.scene);stations[i].seat.add(p);staff.set(i,p);},restoreCharacter(i){if(staff.has(i))stations[i].seat.remove(staff.get(i));const source=models.get(assetByRole[i]);if(source){const p=source.clone(true);stations[i].seat.add(p);staff.set(i,p);}}};
}
