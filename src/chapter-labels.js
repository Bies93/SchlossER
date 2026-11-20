// One small atlas for handwritten batch labels, painted drawer numbers and
// personal effects. The fine print is texture detail, not separate geometry.
export const labels=[
 ['SALBEI','getrocknet · K/12','I'],['DILLSAMEN','Ernte  IX · 43','II'],['KIRSCHEN','eingekocht · 44','III'],
 ['BOHNEN','Vorrat  ·  600 g','IV'],['GERSTE','Mühle am Tor','V'],['PFEFFER','nur auf Bezug','VI'],
 ['HUBERT','KAMMER 07  ·  seit 1945','07'],['NACHTWACHE','Schichtbuch · Band IV','IV'],
 ['EIGENTUM','Wäsche · Fach 03','03'],['SEIFE','Kernseife · 100 g','K'],
 ['BRIEFPOST','Nicht abgeholt','✉'],['ABENDDIENST','Ausgabe  •  acht Portionen','VIII']
];
export function labelMaterial(T){
 const c=document.createElement('canvas');c.width=1024;c.height=512;
 const g=c.getContext('2d');
 labels.forEach(([title,note,no],i)=>{
   const x=(i%4)*256,y=Math.floor(i/4)*160;g.save();g.translate(x,y);
   g.fillStyle=i===6?'#354345':['#d6bf97','#a9b8a6','#dcc8a1'][i%3];g.fillRect(0,0,256,160);
   g.strokeStyle=g.fillStyle=i===6?'#e9d7a8':'#4b4233';g.lineWidth=3;g.strokeRect(6,6,244,148);
   g.strokeRect(10,10,236,140);g.font='italic 26px Georgia';g.textAlign='center';g.fillText(no,128,42);
   g.font='bold 35px Georgia';g.fillText(title,128,91,222);
   g.fillRect(40,103,176,1);g.font='19px Georgia';g.fillText(note,128,132,226);g.restore();
 });
 const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
 return new T.MeshStandardMaterial({map,roughness:.86});
}
export function labelGeometry(T,i){
 const g=new T.PlaneGeometry(1,1,10,1),uv=g.attributes.uv;
 for(let j=0;j<uv.count;j++)uv.setXY(j,((i%4)*256+2+uv.getX(j)*252)/1024,
   1-(Math.floor(i/4)*160+2+(1-uv.getY(j))*156)/512);
 return g;
}
