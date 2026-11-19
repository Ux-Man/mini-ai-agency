import * as T from 'three';

export function createOfficeLabels(canvas,onSelect){
 const root=document.createElement('div');root.className='office-labels';root.setAttribute('aria-label','Workstation titles and studio groups');canvas.parentElement.append(root);
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('label-stems');root.append(svg);
 const items=[],groups=new Map();let enabled=true,frame=0;
 function stem(color){const line=document.createElementNS('http://www.w3.org/2000/svg','path');line.setAttribute('stroke',color);svg.append(line);return line;}
 function memberButton(info){const b=document.createElement('button');b.className='team-member';b.dataset.roleIndex=info.index;b.dataset.activity=info.status;b.style.setProperty('--team-color',info.team.color);b.setAttribute('aria-label',`${info.title}, ${info.name}, ${info.team.name}, ${info.status}`);b.onclick=()=>onSelect(info.index);const strong=document.createElement('strong');strong.textContent=info.title;const meta=document.createElement('span');meta.textContent=info.name+(info.status==='At desk'?'':' · '+info.status);b.append(strong,meta);return b;}
 function add(info){
  const {index,title,name,team,status,anchor,kind='desk'}=info;
  if(kind==='desk'||status==='Meeting group'){
   const key=kind==='desk'?team.name:'meeting';let entry=groups.get(key);
   if(!entry){const element=document.createElement('div');element.className='team-tag';element.dataset.kind=kind==='desk'?'desk-group':'meeting-group';element.style.setProperty('--team-color',team.color);element.setAttribute('role','group');element.setAttribute('aria-label',key==='meeting'?'Meeting room group':team.name+' work group');const heading=document.createElement('h3');heading.textContent=key==='meeting'?'MEETING ROOM':team.name;element.append(heading);root.append(element);entry={element,line:stem(team.color),members:[],anchor:()=>{const p=new T.Vector3();for(const m of entry.members)p.add(m.anchor());p.divideScalar(entry.members.length||1);p.y+=kind==='desk'?.30:.20;return p;}};groups.set(key,entry);items.push(entry);}
   entry.members.push(info);entry.element.append(memberButton(info));return;
  }
  const element=document.createElement('button');element.className='role-tag';element.style.setProperty('--team-color',team.color);element.dataset.roleIndex=index;element.dataset.kind='person';element.dataset.activity=status;element.setAttribute('aria-label',`${title}, ${name}, ${status}`);element.onclick=()=>onSelect(index);const strong=document.createElement('strong');strong.textContent=title;const meta=document.createElement('span');meta.textContent=`${name} · ${status}`;element.append(strong,meta);root.append(element);items.push({element,line:stem(team.color),anchor});
 }
 function update(camera){
  if(!enabled||++frame%2)return;
  const w=canvas.clientWidth,h=canvas.clientHeight;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);const mobile=w<650,left=mobile?72:12,right=w-12,top=mobile?105:145,bottom=h-(mobile?135:108),occupied=[];
  const projected=items.map(item=>{const world=item.anchor(),point=world.clone().project(camera);return {...item,point,priority:item.members?0:1,distance:camera.position.distanceToSquared(world)};}).sort((a,b)=>a.priority-b.priority||a.distance-b.distance);
  for(const item of projected){
   const {point,element,line}=item;if(point.z>1||point.z<0||Math.abs(point.x)>1.1||Math.abs(point.y)>1.1){element.hidden=true;line.style.display='none';continue;}
   element.hidden=false;const width=mobile?148:194;element.style.width=width+'px';const height=element.offsetHeight||40,ax=(point.x*.5+.5)*w,ay=(.5-point.y*.5)*h,desiredX=ax-width/2,desiredY=ay-height-14;let best=null,bestScore=Infinity;
   for(const dx of [0,-width-8,width+8,-2*(width+8),2*(width+8)])for(const dy of [0,-height-8,height+8,-2*(height+8),2*(height+8),-3*(height+8),3*(height+8)]){
    const x=T.MathUtils.clamp(desiredX+dx,left,Math.max(left,right-width)),y=T.MathUtils.clamp(desiredY+dy,top,Math.max(top,bottom-height));if(occupied.some(r=>x<r.x+r.w+5&&x+width+5>r.x&&y<r.y+r.h+5&&y+height+5>r.y))continue;const score=Math.hypot(x-desiredX,y-desiredY);if(score<bestScore){bestScore=score;best={x,y,w:width,h:height};}
   }
   if(!best)for(let y=top;y+height<=bottom;y+=16)for(let x=left;x+width<=right;x+=16){if(occupied.some(r=>x<r.x+r.w+5&&x+width+5>r.x&&y<r.y+r.h+5&&y+height+5>r.y))continue;const score=Math.hypot(x-desiredX,y-desiredY);if(score<bestScore){bestScore=score;best={x,y,w:width,h:height};}}
   if(!best)best={x:T.MathUtils.clamp(desiredX,left,Math.max(left,right-width)),y:T.MathUtils.clamp(desiredY,top,Math.max(top,bottom-height)),w:width,h:height};occupied.push(best);element.style.transform=`translate3d(${best.x.toFixed(1)}px,${best.y.toFixed(1)}px,0)`;element.style.zIndex=100-Math.min(99,Math.round(item.distance));
   const lx=T.MathUtils.clamp(ax,best.x+8,best.x+width-8),ly=ay>best.y+height?best.y+height:best.y;line.setAttribute('d',`M ${lx.toFixed(1)} ${ly.toFixed(1)} L ${ax.toFixed(1)} ${ay.toFixed(1)}`);line.style.display='';
  }
 }
 return {add,update,setVisible(value){enabled=value;root.hidden=!value;},get visible(){return enabled;}};
}
