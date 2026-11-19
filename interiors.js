import * as T from 'three';

export function decorateStudio({scene,box,cyl,rod,mesh,label,material,wood,cream,black,aluminium,gold,lightMat,plant}){
 const navy=material('#213b54'),teal=material('#246b69'),coral=material('#d68b74'),ochre=material('#deb85b'),white=material('#f1eee5'),blue=material('#657ca3');
 // A continuous perimeter: all four sides reach the ceiling.
 box(23.2,3.9,.16,teal,3.6,1.95,9.4,scene,0);box(.16,3.9,16.5,navy,15.2,1.95,1.15,scene,0);
 // The cafe wall is light birch and tile; the lounge wall carries a bold mural.
 box(5.2,3.1,.03,white,6.45,1.6,9.29,scene,0);box(7.8,3.3,.03,coral,-3.8,1.7,9.29,scene,0);
 function artwork(kind,width,height){
  const c=document.createElement('canvas');c.width=1200;c.height=800;const p=c.getContext('2d');
  const palettes=[['#123e50','#65c5be','#f3bb55','#ec856d'],['#26466b','#8cb1dc','#f1d277','#e8eef0'],['#e8e4d8','#2e6064','#d97b64','#d7af42']];const col=palettes[kind%3];p.fillStyle=col[0];p.fillRect(0,0,1200,800);
  if(kind%3===0){for(let i=0;i<6;i++){p.fillStyle=col[1+i%3];p.fillRect(660+(i%3)*150,95+Math.floor(i/3)*220,127,185);p.fillStyle=col[0];p.beginPath();p.arc(723+(i%3)*150,125+Math.floor(i/3)*220,22,0,Math.PI*2);p.fill();}p.fillStyle='#f6f0df';p.font='bold 107px Arial';p.fillText('THINK.',65,240);p.fillText('MAKE.',65,370);p.fillText('TOGETHER.',65,500);}
  else if(kind%3===1){p.strokeStyle=col[1];p.lineWidth=13;p.beginPath();p.moveTo(75,430);p.lineTo(305,430);p.lineTo(520,235);p.lineTo(760,235);p.lineTo(1090,430);p.stroke();for(const [x,y] of [[80,430],[305,430],[520,235],[760,235],[1090,430]]){p.fillStyle=col[2];p.beginPath();p.arc(x,y,32,0,Math.PI*2);p.fill();}p.fillStyle=col[3];p.font='bold 76px Arial';p.fillText('FOLLOW THE FRICTION',65,120);p.font='32px Arial';p.fillText('Discover    /    Design    /    Build    /    Learn',65,650);}
  else{for(let j=0;j<4;j++)for(let i=0;i<6;i++){p.fillStyle=col[1+(i+j)%3];const x=75+i*180,y=70+j*135;if((i+j)%3===0){p.beginPath();p.arc(x+60,y+60,55,0,Math.PI*2);p.fill();}else p.fillRect(x,y,115,115);}p.fillStyle=col[1];p.font='bold 73px Arial';p.fillText('BUILD. TEST. LEARN.',65,725);}
  const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;const art=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture,toneMapped:false}));return art;
 }
 // Original corporate-style artwork, not third-party brand or partner marks.
 for(const [z,kind] of [[-4.6,1],[-.3,2],[4.0,0]]){const art=artwork(kind,3.5,2.25);art.position.set(-7.86,2.05,z);art.rotation.y=Math.PI/2;scene.add(art);}
 const loungeArt=artwork(0,5.8,2.3);loungeArt.rotation.y=Math.PI;loungeArt.position.set(-3.8,2.03,9.24);scene.add(loungeArt);
 for(const [x,kind] of [[.7,2],[11.8,1]]){const art=artwork(kind,3.3,2.2);art.position.set(x,2.05,-6.86);scene.add(art);}
 for(const z of [-3,3,7]){const art=artwork(2,3.2,2.1);art.position.set(15.08,2,z);art.rotation.y=-Math.PI/2;scene.add(art);}
 // Bright acoustic wall tiles and a deliberate rhythm of accent blocks.
 for(let i=0;i<6;i++){box(.45,1.0,.06,[teal,blue,ochre,coral][i%4],-1.7+i*.58,1.25,-6.84,scene,.05);}
 // A modern modular lounge: tailored fabric, low arms, thin feet, no rolled leather.
 const weave=document.createElement('canvas');weave.width=weave.height=128;const wc=weave.getContext('2d');wc.fillStyle='#a4bab7';wc.fillRect(0,0,128,128);wc.strokeStyle='#849d99';wc.lineWidth=1;for(let i=0;i<128;i+=4){wc.beginPath();wc.moveTo(i,0);wc.lineTo(i,128);wc.moveTo(0,i);wc.lineTo(128,i);wc.stroke();}
 const wt=new T.CanvasTexture(weave);wt.wrapS=wt.wrapT=T.RepeatWrapping;wt.repeat.set(3,3);wt.colorSpace=T.SRGBColorSpace;
 const upholstery=new T.MeshStandardMaterial({map:wt,color:'#6ea4a1',roughness:.94}),pillow1=material('#dbad5a',.95),pillow2=material('#cd7f72',.96);
 box(5.7,.018,3.3,material('#d0c9b8',1),-4.2,.008,6.9,scene,.02);
 function module(x,z,w=1.03){box(w,.16,.92,upholstery,x,.29,z,scene,.07);box(w-.02,.16,.78,upholstery,x,.45,z-.04,scene,.065);box(w,.50,.17,upholstery,x,.70,z+.35,scene,.07);for(const dx of [-w*.36,w*.36])for(const dz of [-.29,.29])rod([x+dx,.035,z+dz],[x+dx,.23,z+dz],.015,black);}
 for(const x of [-5.25,-4.2,-3.15])module(x,7.75);module(-5.25,6.8);box(.15,.40,1.04,upholstery,-5.82,.53,7.7,scene,.045);box(.15,.40,1.04,upholstery,-2.58,.53,7.7,scene,.045);
 for(const [x,color] of [[-5.10,pillow1],[-3.35,pillow2]]){const p=box(.38,.38,.11,color,x,.72,7.96,scene,.06);p.rotation.z=x<-4?.15:-.13;}
 cyl(.68,.68,.055,white,-4.05,.39,6.25);cyl(.32,.40,.34,black,-4.05,.19,6.25);cyl(.36,.36,.04,coral,-2.75,.45,6.85);rod([-2.75,.04,6.85],[-2.75,.43,6.85],.026,black);box(.27,.023,.34,blue,-4.2,.43,6.25,scene,.006);box(.23,.018,.30,ochre,-4.12,.45,6.26,scene,.006);
 const loungeLabel=label('LOUNGE / IDEAS WELCOME',2.1,.24,'#164e50','#faf4e6',52);loungeLabel.rotation.y=Math.PI;loungeLabel.position.set(-3.8,3.30,9.2);scene.add(loungeLabel);
 // Scandinavian cafe: white modular fronts, birch tops, pegboard and open shelves.
 for(let i=0;i<5;i++){const x=4.45+i*.87;box(.84,.84,.63,white,x,.43,8.72,scene,.025);box(.72,.009,.025,aluminium,x,.60,8.385);box(.72,.009,.025,aluminium,x,.26,8.385);box(.27,.018,.03,black,x,.71,8.365);}
 box(4.5,.055,.76,wood,6.2,.89,8.68,scene,.025);box(.73,.89,2.3,white,8.45,.45,7.75);box(.81,.055,2.4,wood,8.45,.92,7.75);
 for(const y of [1.65,2.15]){box(3.6,.045,.35,wood,6.2,y,9.0);for(let i=0;i<9;i++){const x=4.8+i*.34;const mug=cyl(.043,.039,.09,[blue,coral,ochre,teal][i%4],x,y+.065,8.98);const handle=mesh(new T.TorusGeometry(.026,.006,5,12),mug.material,x+.047,y+.075,8.98);handle.rotation.y=Math.PI/2;}}
 const cafeSign=label('COFFEE / GOOD IDEAS BREW HERE',3.5,.36,'#f1eee5','#264f53',46);cafeSign.rotation.y=Math.PI;cafeSign.position.set(6.2,2.76,9.2);scene.add(cafeSign);
 const roast=label('ESPRESSO   FILTER   POUR OVER   CAPSULE   ARABIC',3.8,.24,'#f1eee5','#466366',33);roast.rotation.y=Math.PI;roast.position.set(6.2,2.42,9.18);scene.add(roast);
 const front=new T.Group();front.position.set(6.2,.93,8.65);front.rotation.y=Math.PI;scene.add(front);
 // Two-group espresso machine, drip tray, steam wands and portafilter handles.
 box(.84,.42,.38,aluminium,1.53,.22,0,front,.045);box(.78,.09,.31,black,1.53,.39,.045,front,.02);box(.79,.045,.22,black,1.53,.025,.20,front,.015);
 for(const x of [1.32,1.70]){cyl(.04,.04,.06,black,x,.19,.22,front);rod([x,.16,.22],[x,.16,.36],.018,black,front);box(.11,.055,.008,teal,x,.28,.197,front,.008);cyl(.045,.04,.07,white,x,.08,.24,front);}
 rod([1.92,.30,.14],[1.97,.13,.28],.008,aluminium,front);rod([1.16,.30,.14],[1.11,.13,.28],.008,aluminium,front);
 // Grinder with transparent hopper, filter brewer and glass carafe.
 box(.25,.25,.27,black,.78,.14,0,front,.035);const hopperMat=new T.MeshPhysicalMaterial({color:'#d6d9d2',transparent:true,opacity:.35,roughness:.1,depthWrite:false});cyl(.10,.065,.18,hopperMat,.78,.36,0,front);cyl(.084,.055,.105,material('#513b2e'),.78,.33,0,front);cyl(.11,.11,.025,black,.78,.46,0,front);
 box(.36,.04,.30,black,.23,.03,0,front,.025);box(.11,.39,.10,black,.36,.22,-.07,front,.025);box(.34,.08,.25,black,.23,.42,.0,front,.025);cyl(.10,.13,.19,hopperMat,.20,.15,.035,front);cyl(.10,.10,.075,material('#342a24'),.20,.11,.035,front);const carafeHandle=mesh(new T.TorusGeometry(.075,.012,6,20),black,.32,.18,.035,front);carafeHandle.rotation.y=Math.PI/2;
 // Capsule machine, pour-over cone, gooseneck kettle and brass dallah.
 box(.27,.30,.32,blue,-.35,.17,0,front,.07);box(.17,.04,.15,black,-.35,.045,.19,front);cyl(.025,.025,.01,gold,-.35,.29,.17,front);cyl(.038,.035,.065,white,-.35,.085,.18,front);
 cyl(.10,.055,.16,white,-.91,.27,.01,front);cyl(.10,.13,.19,hopperMat,-.91,.10,.01,front);cyl(.09,.09,.07,material('#493327'),-.91,.07,.01,front);
 cyl(.12,.10,.20,aluminium,-1.43,.13,0,front);cyl(.08,.08,.035,black,-1.43,.245,0,front);const spout=new T.CatmullRomCurve3([new T.Vector3(-1.5,.14,0),new T.Vector3(-1.65,.21,0),new T.Vector3(-1.66,.34,0),new T.Vector3(-1.79,.35,0)]);mesh(new T.TubeGeometry(spout,16,.012,7,false),aluminium,0,0,0,front);
 cyl(.09,.12,.24,gold,-1.98,.15,0,front);cyl(.035,.085,.10,gold,-1.98,.32,0,front);const ds=new T.CatmullRomCurve3([new T.Vector3(-2.03,.14,0),new T.Vector3(-2.18,.21,0),new T.Vector3(-2.22,.36,0)]);mesh(new T.TubeGeometry(ds,12,.016,7,false),gold,0,0,0,front);
 const machineTitles=[['ESPRESSO',1.53],['GRIND',.78],['FILTER',.23],['CAPSULE',-.35],['POUR OVER',-.91],['KETTLE',-1.43],['ARABIC',-1.98]];for(const [title,x] of machineTitles){const t=label(title,.36,.07,'#e5e7dc','#294b4d',55);t.position.set(x,-.035,.405);front.add(t);}
 // A slim social island, bent-frame stools and color-coordinated trays.
 box(3.6,.88,.72,teal,6.1,.44,5.35,scene,.025);box(3.75,.055,.84,wood,6.1,.91,5.35,scene,.025);
 for(const x of [5.2,6.1,7]){cyl(.19,.19,.065,blue,x,.62,6.36);for(const dx of [-.12,.12]){rod([x+dx,.04,6.23],[x+dx,.6,6.23],.012,black);rod([x+dx,.04,6.49],[x+dx,.6,6.49],.012,black);}rod([x-.12,.24,6.49],[x+.12,.24,6.49],.01,black);}
 box(.55,.025,.32,ochre,5.65,.957,5.35,scene,.025);for(const x of [5.5,5.75])cyl(.043,.037,.08,white,x,1.01,5.35);plant(8.8,5,1.4);
 // Meeting work materials make the seated group's purpose visible.
 for(const [x,z,turn] of [[5.2,-4.05,Math.PI],[6.3,-5.05,0],[7.4,-5.05,0]]){const g=new T.Group();g.position.set(x,.79,z);g.rotation.y=turn;scene.add(g);box(.33,.014,.23,aluminium,0,0,0,g,.007);const lid=box(.33,.21,.014,black,0,.11,-.09,g,.01);lid.rotation.x=-.15;box(.20,.008,.27,white,.40,0,0,g,.003);rod([.37,.012,-.08],[.45,.012,.08],.004,blue,g);}
 return {coffee:[6.2,1.2,8.45]};
}
