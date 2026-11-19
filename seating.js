import * as THREE from 'three';

// Normalize the generated A-pose assets, then bind a small seated arm rig.
export function seatedCharacter(source) {
  source.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(source),height=bounds.max.y-bounds.min.y;
  if(!Number.isFinite(height)||height<.001)throw new Error('The character has no measurable height.');
  const scale=1.76/height;
  const center=bounds.getCenter(new THREE.Vector3());
  const result=new THREE.Group();
  source.traverse(node=>{
    if(!node.isMesh)return;
    const geo=node.geometry.clone();geo.applyMatrix4(node.matrixWorld);
    const pos=geo.attributes.position;
    let reach=.3;for(let j=0;j<pos.count;j++){const y=(pos.getY(j)-bounds.min.y)*scale;if(y>.65&&y<1.5)reach=Math.max(reach,Math.abs((pos.getX(j)-center.x)*scale));}
    let tipY=0,tipCount=0;for(let j=0;j<pos.count;j++){const x=Math.abs((pos.getX(j)-center.x)*scale),y=(pos.getY(j)-bounds.min.y)*scale;if(x>reach*.96&&y>.65&&y<1.5){tipY+=y;tipCount++;}}
    tipY=tipCount?tipY/tipCount:.91;
    const shoulder=new THREE.Vector3(.19,1.43,0),wrist=new THREE.Vector3(.19+(reach-.19)*.82,1.43+(tipY-1.43)*.82,0),elbow=shoulder.clone().lerp(wrist,.54);
    const seatedShoulder=new THREE.Vector3(.19,1.0,0),seatedElbow=new THREE.Vector3(.30,.80,.035),seatedWrist=new THREE.Vector3(.18,.85,.40);
    const upperQ=new THREE.Quaternion().setFromUnitVectors(elbow.clone().sub(shoulder).normalize(),seatedElbow.clone().sub(seatedShoulder).normalize());
    const lowerQ=new THREE.Quaternion().setFromUnitVectors(wrist.clone().sub(elbow).normalize(),seatedWrist.clone().sub(seatedElbow).normalize());
    const armAxis=wrist.clone().sub(shoulder),armLengthSq=armAxis.lengthSq(),twistAxis=seatedWrist.clone().sub(seatedElbow).normalize();
    const skinIndices=new Uint16Array(pos.count*4),skinWeights=new Float32Array(pos.count*4);
    for(let i=0;i<pos.count;i++){
      const x=(pos.getX(i)-center.x)*scale,y=(pos.getY(i)-bounds.min.y)*scale,z=(pos.getZ(i)-center.z)*scale;
      let ny=y-.43,nz=z;
      // Hip and knee bends: upper leg forward, lower leg vertical.
      if(y<.94&&y>=.49){ny=.51+z;nz=.94-y;}
      else if(y<.49){ny=y+.02;nz=z+.45;}
      // Bring each A-pose arm into a supported typing/resting posture.
      const ax=Math.abs(x),side=Math.sign(x);
      const progress=THREE.MathUtils.clamp(((ax-.19)*armAxis.x+(y-1.43)*armAxis.y)/armLengthSq,0,1.3);
      const distance=Math.hypot(ax-(shoulder.x+armAxis.x*progress),y-(shoulder.y+armAxis.y*progress));
      let arm=(1-THREE.MathUtils.smoothstep(distance,.10,.18))*THREE.MathUtils.smoothstep(ax,.16,.25);
      if(y<tipY-.18||y>1.55)arm=0;
      const fore=THREE.MathUtils.smoothstep(progress,.40,.65),hand=THREE.MathUtils.smoothstep(progress,.85,1.12);
      const base=side<0?1:4,k=i*4;
      skinIndices[k]=0;skinIndices[k+1]=base;skinIndices[k+2]=base+1;skinIndices[k+3]=base+2;
      skinWeights[k]=1-arm;skinWeights[k+1]=arm*(1-fore);skinWeights[k+2]=arm*fore*(1-hand);skinWeights[k+3]=arm*fore*hand;
      let nx=x;
      if(arm>0){
        const p=new THREE.Vector3(ax,y,z);
        const upper=p.clone().sub(shoulder).applyQuaternion(upperQ).add(seatedShoulder);
        const lower=p.clone().sub(elbow).applyQuaternion(lowerQ).applyAxisAngle(twistAxis,Math.PI*.5).add(seatedElbow);
        const blend=THREE.MathUtils.smoothstep(progress,.40,.65);
        const target=upper.lerp(lower,blend);
        nx=THREE.MathUtils.lerp(x,side*target.x,arm);ny=THREE.MathUtils.lerp(ny,target.y,arm);nz=THREE.MathUtils.lerp(nz,target.z,arm);
      }
      pos.setXYZ(i,nx,ny,nz);
    }
    pos.needsUpdate=true;geo.computeVertexNormals();geo.computeBoundingBox();geo.computeBoundingSphere();
    geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));geo.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));
    const root=new THREE.Bone();root.name='seatedRoot';const bones=[root];
    for(const side of [-1,1]){
      const shoulderBone=new THREE.Bone();shoulderBone.name=side<0?'leftShoulder':'rightShoulder';shoulderBone.position.set(side*.19,1,0);root.add(shoulderBone);
      const elbowBone=new THREE.Bone();elbowBone.name=side<0?'leftElbow':'rightElbow';elbowBone.position.set(side*.11,-.20,.035);shoulderBone.add(elbowBone);
      const wristBone=new THREE.Bone();wristBone.name=side<0?'leftWrist':'rightWrist';wristBone.position.set(-side*.12,.05,.365);elbowBone.add(wristBone);bones.push(shoulderBone,elbowBone,wristBone);
    }
    const mesh=new THREE.SkinnedMesh(geo,node.material);mesh.add(root);mesh.bind(new THREE.Skeleton(bones));mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;result.add(mesh);
  });
  return result;
}
