// Clip azimuth and elevation through the actual chain of openings. Each
// portal uses a conservative enclosing angle; the depth buffer clips trim.
export function portalSight(ports,start,x,z,leafAt,heights,eye=0,margin=.065){
  const visible=new Set([start]),path=new Set([start]),tau=2*Math.PI;
  function visit(id,window,bottom,top){
    for(const link of ports[id]??[]){
      const [a,b,axis,edge,l,r]=link,next=a===id?b:a;
      if(path.has(next))continue;
      const vertical=axis==='x'||axis==='u',fixed=edge-(vertical?x:z),t=vertical?z:x;
      let wedge=window;
      if(Math.abs(fixed)>.24||t<l-.20||t>r+.20){
        const bearing=n=>vertical?Math.atan2(n-t,fixed):Math.atan2(fixed,n-t);
        const mid=bearing((l+r)/2),rel=n=>Math.atan2(Math.sin(bearing(n)-mid),Math.cos(bearing(n)-mid));
        let lo=mid+Math.min(rel(l),rel(r))-margin,hi=mid+Math.max(rel(l),rel(r))+margin;
        if(window){
          const shift=tau*Math.round((window[0]+window[1]-lo-hi)/(2*tau));
          lo=Math.max(window[0],lo+shift);hi=Math.min(window[1],hi+shift);
          if(hi<lo)continue;
        }
        wedge=[lo,hi];
      }
      let low=bottom,high=top;
      if(heights){
        const [floor,lintel]=heights(link),dy0=floor-eye-.12,dy1=lintel-eye+.12;
        const near=Math.hypot(fixed,Math.max(l-t,t-r,0)),far=Math.hypot(fixed,Math.max(Math.abs(l-t),Math.abs(r-t)));
        low=Math.max(low,Math.atan2(dy0,dy0<0?near:far)-.025);
        high=Math.min(high,Math.atan2(dy1,dy1>0?near:far)+.025);
        if(high<low)continue;
      }
      const leaf=leafAt?.(link);
      if(leaf&&leaf.progress<=.01){
        if(id===b)visible.add(a); // leaf and frame belong to side A
        if(leaf.peek)visible.add(next);
        continue;
      }
      visible.add(next);path.add(next);visit(next,wedge,low,high);path.delete(next);
    }
  }
  visit(start,null,-Math.PI/2,Math.PI/2);return visible;
}
