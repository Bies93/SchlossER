// Fictional woodcuts of the Moosfunk liturgy. Cut marks, lettering and
// gilded grounds are baked into the room's existing print atlas.
export function liturgy(c,id){
  const pi=Math.PI,gold='#dfbb7d',ivory='#e3cfac',dark='#22242b',vermilion='#a35a49';
  const line=(x,y,X,Y,ink,w=2)=>{c.strokeStyle=ink;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
  const shape=(pts,ink)=>{c.fillStyle=ink;c.beginPath();pts.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  const oval=(x,y,a,b,ink,angle=0)=>{c.fillStyle=ink;c.beginPath();c.ellipse(x,y,a,b,angle,0,2*pi);c.fill();};
  const type=(text,y,size,col)=>{c.font='bold '+size+'px Georgia';c.textAlign='center';c.fillStyle=col;c.fillText(text,256,y,420);};
  const info={eclipse:['I · AUREOLA','DIE KRONE DES NACHHALLS','#303c42'],canticle:['II · CANTICUM','DIE SIEBEN STIMMEN','#36505a'],
    oracle:['III · SPECULUM','DAS AUGE UNTER STEIN','#4d4254'],ashes:['IV · CINIS','WAS DER STAUB BEHÄLT','#493938'],
    renewal:['V · REDITUS','AUS ASCHE WIRD STIMME','#493542'],obit:['LIBER UMBRARUM','DAS BUCH DER WIEDERKEHR','#403630']};
  const [head,foot,bg]=info[id];
  c.fillStyle=bg;c.fillRect(0,0,512,512);
  for(let j=0;j<76;j++){const a=j*pi/38;line(256+70*Math.cos(a),222+70*Math.sin(a),256+177*Math.cos(a),222+164*Math.sin(a),j%4?'#847054':gold,j%4?1:3);}
  for(const x of [31,469]){c.fillStyle=gold;c.fillRect(x,38,8,404);for(let j=0;j<19;j++)oval(x+4,71+j*19,6,10,bg,j%2?.32:-.32);}
  for(let j=0;j<4;j++){c.strokeStyle=j%2?gold:dark;c.lineWidth=2+j%2;c.strokeRect(12+j*5,12+j*5,488-j*10,488-j*10);}
  type(head,68,22,ivory);
  const eye=(x,y,r)=>{c.fillStyle=gold;c.beginPath();c.moveTo(x-r,y);c.quadraticCurveTo(x,y-r*.88,x+r,y);
    c.quadraticCurveTo(x,y+r*.83,x-r,y);c.fill();oval(x,y,r*.32,r*.34,dark);oval(x-r*.08,y-r*.11,r*.055,r*.055,ivory);};
  if(id==='ashes'||id==='obit'){
    oval(256,228,69,77,ivory);
    shape([[199,240],[313,240],[294,274],[282,313],[230,310],[216,273]],ivory);
    for(const s of [-1,1]){
      oval(256+s*31,235,22,17,dark,s*.22);
      for(let i=0;i<9;i++)line(256+s*(46+i),198-i,256+s*(51+i),216-i,'#917f6e',1.7);
    }
    shape([[256,244],[267,266],[247,263]],dark);
    for(let j=0;j<8;j++)line(231+j*7,281,231+j*7,305,dark);
    line(233,289,280,293,dark);
    if(id==='obit')for(let j=0;j<9;j++){let x=104+j*36;for(let i=0;i<4;i++)line(x+i*5,349,x+i*5,362,ivory,1.5);line(x-2,361,x+18,349,vermilion,2);}
  }else if(id==='renewal'||id==='canticle'){
    for(const s of [-1,1])for(let j=0;j<10;j++){
      let x=256+s*(33+j*11),y=220-j*10;
      shape([[256+s*12,288],[x,y+19],[x+s*14,y-27],[x+s*24,y+23],[256+s*42,303]],j%2?gold:vermilion);
      line(x+s*13,y-8,256+s*35,284,dark,2);
    }
    oval(256,260,27,54,ivory,.15);oval(267,209,22,20,ivory);
    shape([[280,203],[306,213],[278,216]],gold);oval(276,205,4,4,dark);
    for(let j=0;j<7;j++)shape([[224+j*10,342],[237+j*9,285-j%3*11],[246+j*8,345]],j%2?gold:vermilion);
  }else{
    shape([[256,99],[387,319],[125,319]],gold);shape([[256,110],[377,312],[135,312]],dark);
    for(let j=0;j<8;j++)line(155+j*12,295-j*20,357-j*12,295-j*20,'#68614f',1.6);
    if(id==='oracle')eye(256,240,72);
    else{oval(256,233,57,57,gold);oval(268,222,51,51,'#37323e');for(let j=0;j<8;j++)oval(242+j*4,266+Math.sin(j*.5)*4,1.4,1.4,ivory);}
  }
  for(const s of [-1,1])for(let j=0;j<10;j++){
    const a=j*.14,x=256+s*(133*Math.cos(a)),y=232+139*Math.sin(a);
    oval(x,y,5,15,gold,-s*(.38+a));
  }
  c.fillStyle=dark;c.fillRect(41,402,430,57);type(foot,435,24,ivory);
  type('ARCHIV DES TIEFFUNKS   ·   HANDABZUG',479,13,gold);
}
