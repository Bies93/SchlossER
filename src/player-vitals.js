export function playerVitals(){
  let hp=100,flash=0;
  return {get hp(){return hp;},get down(){return hp<=0;},get flash(){return flash;},
    hit(points){
      if(hp<=0||!Number.isFinite(points)||points<=0)return false;
      hp=Math.max(0,hp-points);flash=1;return true;
    },
    tick(dt){
      if(flash<=0)return false;
      flash=Math.max(0,flash-dt*2.21);return true;
    },reset(){hp=100;flash=0;}};
}
