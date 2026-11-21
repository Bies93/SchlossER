import {randomSource} from './surface-detail.js';

const TAU=Math.PI*2;
const unit=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=unit((x-a)/(b-a));return t*t*(3-2*t)};
function texture(T,pixels,w,h,format){
  const map=new T.DataTexture(pixels,w,h,format);
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;
  map.generateMipmaps=true;map.needsUpdate=true;return map;
}

// Linear light, angle along X and sin(latitude) along Y; U wraps at the seam.
// Deliberately stylised star field (not a date-specific astronomy simulation).
export function bakeStars(T){
  const w=1536,h=512,data=new Uint8Array(w*h*4),rng=randomSource(35181);
  for(let x=0;x<w;x++){
    const a=(x+.5)/w*TAU;
    const center=.50+.41*Math.sin(a-1.32),width=.054+.023*Math.cos(a+.84)**2;
    const grain=.6+.23*Math.sin(a*4+.7)+.13*Math.sin(a*11-1.6);
    for(let y=0;y<h;y++){
      const d=((y+.5)/h-center)/width;
      const lane=1-.60*Math.exp(-17*(d+Math.sin(a*7)*.26)**2);
      const light=Math.exp(-d*d*.9)*grain*lane*(4.7+2.1*rng());
      const i=(y*w+x)*4;
      data[i]=light*.76;data[i+1]=light*.89;data[i+2]=light*1.2;data[i+3]=255;
    }
  }
  for(let k=0;k<1830;k++){
    const x=rng()*w,y=rng()*(h-3)+1,mag=rng(),warm=rng();
    const bright=10+184*mag**5,r=.00144+.00186*mag**4,cosine=Math.max(.19,Math.sqrt(1-(y/h)**2));
    const rx=r*w/(TAU*cosine),ry=r*h*cosine;
    for(let j=Math.floor(y-ry-1);j<=Math.ceil(y+ry+1);j++){
      if(j<0||j>=h)continue;
      for(let i=Math.floor(x-rx-1);i<=Math.ceil(x+rx+1);i++){
        const dx=(i-x)/(rx+.34),dy=(j-y)/(ry+.31);
        const k=(j*w+(i+w)%w)*4,v=bright*(1-smooth(.06,1.10,Math.hypot(dx,dy)));
        data[k]=Math.min(255,data[k]+v*(.65+.35*warm));
        data[k+1]=Math.min(255,data[k+1]+v*(.84+.12*warm));
        data[k+2]=Math.min(255,data[k+2]+v*(1.08-.27*warm));
      }
    }
  }
  const map=texture(T,data,w,h,T.RGBAFormat);map.wrapS=T.RepeatWrapping;
  return map;
}

export function bakeMoon(T){
  const size=128,pixels=new Uint8Array(size*size),rng=randomSource(80248);
  const seas=[[-.36,.37,.48,.22,.60],[.26,.23,.40,.34,.54],[-.24,-.14,.24,.43,.55],
    [.36,-.31,.29,.17,.38],[-.66,.08,.19,.36,.45]];
  const craters=[[-.23,-.62,.13,.92],[.41,.44,.105,.84],[-.48,.05,.079,.64],[.36,-.37,.095,.66]];
  for(let i=0;i<36;i++){
    const a=rng()*TAU,d=Math.sqrt(rng())*.97;
    craters.push([Math.cos(a)*d,Math.sin(a)*d,.020+.13*rng()**2,.13+rng()*.62]);
  }
  for(let j=0;j<size;j++)for(let i=0;i<size;i++){
    const x=(i+.5)*2/size-1,y=(j+.5)*2/size-1,r2=x*x+y*y;
    const z=Math.sqrt(Math.max(0,1-r2));
    let sea=0;
    const grit=.5*Math.sin(36*x+17*y)+.29*Math.sin(x*74-y*51+z*12)+.21*Math.cos(y*134-x*45);
    for(const [a,b,w,h,m] of seas){
      const r=Math.hypot((x-a)/w,(y-b)/h);
      sea=Math.max(sea,m*(1-smooth(.63,1.14,r+.13*grit)));
    }
    let shade=.91-.66*sea+.046*grit+(rng()-.5)*.077;
    for(const [a,b,r,depth] of craters){
      const X=(x-a)/r,Y=(y-b)/r,r2=X*X+Y*Y;
      if(r2>2.85)continue;
      const d=Math.sqrt(r2),lit=(-.6*X+.75*Y)/Math.max(.15,d);
      const wall=1-smooth(.08,.34,Math.abs(d-.81));
      const lip=1-smooth(.018,.15,Math.abs(d-1.02));
      shade+=depth*(-.095*(1-smooth(.32,.84,d))-.17*wall*lit+lip*(.069+.17*lit));
    }
    const light=.46+.47*z+.09*(-x+y);
    pixels[j*size+i]=Math.round(unit(shade*light)*255);
  }
  return texture(T,pixels,size,size,T.RedFormat);
}
