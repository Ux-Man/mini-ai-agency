import * as T from 'three';
import {clone} from 'three/addons/utils/SkeletonUtils.js';

export const cloneActor=source=>clone(source);
const rigs=new WeakMap();
function bonesFor(model){if(!rigs.has(model)){const b={};model.traverse(o=>{if(o.isBone)b[o.name]=o;});rigs.set(model,b);}return rigs.get(model);}

export function animateActor(model,time,seed,kind='desk'){
 const b=bonesFor(model),t=time+seed*1.73;
 if(kind==='walk'){
  const cycle=t*2.9;
  if(b.walkRoot)b.walkRoot.position.y=.003-.87*(1-Math.cos(.27*Math.abs(Math.sin(cycle))));
  for(const [side,phase] of [['left',cycle],['right',cycle+Math.PI]]){
   const s=Math.sin(phase);
   if(b[side+'Hip'])b[side+'Hip'].rotation.x=s*.27;
   if(b[side+'Knee'])b[side+'Knee'].rotation.x=Math.max(0,s)*.42;
   if(b[side+'Ankle'])b[side+'Ankle'].rotation.x=-Math.max(0,-s)*.11;
   if(b[side+'Shoulder']){b[side+'Shoulder'].rotation.z=(side==='left'?1:-1)*(model.userData.armAngle||.5);b[side+'Shoulder'].rotation.x=-s*.17;}
   if(b[side+'Elbow'])b[side+'Elbow'].rotation.x=.08+Math.max(0,-s)*.06;
  }
  return;
 }
 if(b.seatedRoot)b.seatedRoot.position.y=Math.sin(t*1.1)*.0018;
 // The seated model turns 180 degrees: its negative-X arm reaches the desk-right mouse.
 const mouseWeight=kind==='desk'?T.MathUtils.smoothstep(Math.sin(t*.2),.2,.55):0;
 for(const [side,offset] of [['left',0],['right',1.8]]){
  const wrist=b[side+'Wrist'],elbow=b[side+'Elbow'];
  if(wrist){wrist.rotation.x=kind==='meeting'?Math.sin(t*.7+offset)*.018:side==='left'?T.MathUtils.lerp(Math.sin(t*7.5+offset)*.035,Math.sin(t*1.5+offset)*.015,mouseWeight):Math.sin(t*7.5+offset)*.035;wrist.rotation.z=Math.sin(t*(kind==='meeting'?.55:5.7)+offset)*.02;}
  if(elbow){elbow.rotation.y=side==='left'?T.MathUtils.lerp(Math.sin(t*.8+offset)*.004,-.22+Math.sin(t*.9)*.025,mouseWeight):Math.sin(t*.8+offset)*.004;elbow.rotation.x=Math.sin(t*(kind==='meeting'?.6:4.4)+offset)*.008;}
 }
}

export function walkingCharacter(source){
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1.76/size.y;
 if(!Number.isFinite(scale))throw Error('Invalid walking model');
 const group=new T.Group();
 source.traverse(node=>{
  if(!node.isMesh)return;
  const geo=node.geometry.clone();geo.applyMatrix4(node.matrixWorld);const p=geo.attributes.position;
  let reach=.3,tipY=0,count=0;
  for(let i=0;i<p.count;i++){const x=(p.getX(i)-center.x)*scale,y=(p.getY(i)-bounds.min.y)*scale,z=(p.getZ(i)-center.z)*scale;p.setXYZ(i,x,y,z);if(y>.65&&y<1.5)reach=Math.max(reach,Math.abs(x));}
  for(let i=0;i<p.count;i++)if(Math.abs(p.getX(i))>reach*.96&&p.getY(i)>.65&&p.getY(i)<1.5){tipY+=p.getY(i);count++;}
  tipY=count?tipY/count:.95;const shoulder=new T.Vector3(.19,1.43,0),wrist=new T.Vector3(.19+(reach-.19)*.82,1.43+(tipY-1.43)*.82,0),elbow=shoulder.clone().lerp(wrist,.54),axis=wrist.clone().sub(shoulder),len=axis.lengthSq();group.userData.armAngle=Math.atan2(axis.x,-axis.y)*.88;
  const root=new T.Bone();root.name='walkRoot';const bones=[root];
  for(const side of [-1,1]){
   const prefix=side<0?'left':'right';const upper=new T.Bone();upper.name=prefix+'Shoulder';upper.position.set(side*.19,1.43,0);root.add(upper);
   const lower=new T.Bone();lower.name=prefix+'Elbow';lower.position.set(side*(elbow.x-shoulder.x),elbow.y-shoulder.y,0);upper.add(lower);
   const hand=new T.Bone();hand.name=prefix+'Wrist';hand.position.set(side*(wrist.x-elbow.x),wrist.y-elbow.y,0);lower.add(hand);bones.push(upper,lower,hand);
  }
  for(const side of [-1,1]){
   const prefix=side<0?'left':'right';const hip=new T.Bone();hip.name=prefix+'Hip';hip.position.set(side*.105,.93,.01);root.add(hip);
   const knee=new T.Bone();knee.name=prefix+'Knee';knee.position.set(0,-.44,.02);hip.add(knee);
   const ankle=new T.Bone();ankle.name=prefix+'Ankle';ankle.position.set(0,-.43,.03);knee.add(ankle);bones.push(hip,knee,ankle);
  }
  const indices=new Uint16Array(p.count*4),weights=new Float32Array(p.count*4);
  for(let i=0;i<p.count;i++){
   const x=p.getX(i),ax=Math.abs(x),y=p.getY(i),side=x<0?-1:1,k=i*4;
   const progress=T.MathUtils.clamp(((ax-.19)*axis.x+(y-1.43)*axis.y)/len,0,1.3),distance=Math.hypot(ax-(shoulder.x+axis.x*progress),y-(shoulder.y+axis.y*progress));
   let arm=(1-T.MathUtils.smoothstep(distance,.10,.18))*T.MathUtils.smoothstep(ax,.16,.25);if(y<tipY-.18||y>1.55)arm=0;
   if(arm>.01){const fore=T.MathUtils.smoothstep(progress,.4,.65),base=side<0?1:4;indices[k]=0;indices[k+1]=base;indices[k+2]=base+1;weights[k]=1-arm;weights[k+1]=arm*(1-fore);weights[k+2]=arm*fore;}
   else if(y<.96){const body=T.MathUtils.smoothstep(y,.82,.96),knee=1-T.MathUtils.smoothstep(y,.43,.56),foot=1-T.MathUtils.smoothstep(y,.08,.17),base=side<0?7:10;indices[k]=0;indices[k+1]=base;indices[k+2]=base+1;indices[k+3]=base+2;weights[k]=body;weights[k+1]=(1-body)*(1-knee);weights[k+2]=(1-body)*knee*(1-foot);weights[k+3]=(1-body)*knee*foot;}
   else{indices[k]=0;weights[k]=1;}
  }
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));geo.computeBoundingBox();geo.computeBoundingSphere();
  const mesh=new T.SkinnedMesh(geo,node.material);mesh.add(root);mesh.bind(new T.Skeleton(bones));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;group.add(mesh);
 });
 return group;
}

// Closed routes stay in the two clear studio aisles and the front cross aisle.
const routes=[[[.35,4.15],[.35,-3.65],[.35,4.15],[-3.05,4.15],[-3.05,-3.65],[-3.05,4.15]],[[.88,4.80],[-2.60,4.80],[-2.60,-3.25],[-2.60,4.80],[.88,4.80],[.88,-3.25]]];
export function walkingLocation(time,which){
 const route=routes[which%2],speed=.36;const segments=route.map((p,i)=>{const q=route[(i+1)%route.length];return {p,q,length:Math.hypot(q[0]-p[0],q[1]-p[1])};});const total=segments.reduce((s,v)=>s+v.length,0);let distance=(time*speed+which*total*.37)%total;
 for(const segment of segments){if(distance>segment.length){distance-=segment.length;continue;}const u=segment.length?distance/segment.length:0;return {x:T.MathUtils.lerp(segment.p[0],segment.q[0],u),z:T.MathUtils.lerp(segment.p[1],segment.q[1],u),heading:Math.atan2(segment.q[0]-segment.p[0],segment.q[1]-segment.p[1])};}
 return {x:route[0][0],z:route[0][1],heading:0};
}
