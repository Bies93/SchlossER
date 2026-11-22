export const BIES_DISPLAY_TEXT=Object.freeze({
  headline:'Maximaler Leistung vs. Durchschnitt',
  series:['TOBIAS BIES','DURCHSCHNITT'],
  note:'Die Skala wurde wegen mangelnden Ehrgeizes entlassen.'
});

// One high-resolution static label. No animation, lighting pass or external texture.
export function biesPerformanceBoard(T,kit,x,y,z){
  const {root,k,dress}=kit;
  const w=1.94,h=1.18,ry=Math.PI/2,f=dress.plane(x,y,z,ry);
  k.box('gunmetal',f,-w*.5-.047,w*.5+.047,-h*.5-.036,h*.5+.036,-.035,-.003);
  for(const X of [-w*.5-.013,w*.5+.013])k.box('brass',f,X-.007,X+.007,-h*.5-.015,h*.5+.015,-.005,.009);
  for(const Y of [-h*.5,h*.5])k.box('brass',f,-w*.5-.018,w*.5+.018,Y-.009,Y+.009,-.005,.009);
  for(const s of [-1,1])for(const t of [-1,1])dress.fastener(f,s*(w*.5-.041),t*(h*.5-.039),.010,.015,true);
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=720;
  const c=canvas.getContext('2d'),cream='#e9d8aa',gold='#dcb36e',muted='#aab2a0';
  const bg=c.createLinearGradient(0,0,1200,720);bg.addColorStop(0,'#223637');bg.addColorStop(1,'#122426');
  c.fillStyle=bg;c.fillRect(0,0,1200,720);
  for(let i=0;i<3900;i++){
    c.fillStyle=i%2?'#fff4c111':'#0e171b5c';
    c.fillRect((i*173+43)%1200,(i*113+i%19*7)%720,1+i%4,1);
  }
  c.strokeStyle=gold;c.lineWidth=2;c.strokeRect(26,26,1148,668);
  c.fillStyle=gold;c.font='bold 24px monospace';c.fillText('NACHTSTATION   /   VERSUCHSREIHE 001',62,75);
  c.fillStyle=cream;c.font='bold 59px Georgia';c.fillText('Maximaler Leistung',61,152);
  c.font='italic 42px Georgia';c.fillText('vs. Durchschnitt',64,208);
  c.fillStyle=gold;c.fillRect(62,244,1076,2);
  for(let i=0;i<9;i++){
    const x=71+i*111;c.fillStyle='#c4bd9029';c.fillRect(x,295,2,255);
  }
  const row=({y,right,width,color,label,value})=>{
    c.textAlign='left';c.fillStyle=cream;c.font='bold 27px monospace';c.fillText(label,70,y);
    c.fillStyle='#0d181b';c.fillRect(70,y+18,1060,30);
    c.fillStyle=color;c.fillRect(70,y+18,width,30);
    c.textAlign='right';c.fillStyle=color;c.fillText(value,right,y);
  };
  row({y:326,right:1128,width:1058,color:gold,label:BIES_DISPLAY_TEXT.series[0],value:'137 %'});
  row({y:463,right:1128,width:49,color:muted,label:BIES_DISPLAY_TEXT.series[1],value:'4 %'});
  c.textAlign='left';c.fillStyle=gold;c.font='24px monospace';c.fillText('MESSWERT JENSEITS DER SKALA',70,577);
  c.fillStyle=cream;c.font='italic 31px Georgia';c.fillText(BIES_DISPLAY_TEXT.note,70,639);
  const map=new T.CanvasTexture(canvas);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  const label=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({
    map,roughness:.85,emissive:0x584c37,emissiveMap:map,emissiveIntensity:.32
  }));
  label.name=BIES_DISPLAY_TEXT.headline;label.rotation.y=ry;label.position.set(x,y,z);label.receiveShadow=true;root.add(label);
}
