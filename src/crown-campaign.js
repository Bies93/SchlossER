export const CROWN_ROOMS=[
  {id:'crates',name:'Zeugkammer',min:21.60,max:29.06,door:25.47,side:-1,color:0xddb688},
  {id:'hatchery',name:'Brutwerk',min:10.65,max:21.60,door:15.80,side:-1,color:0xafd6bf},
  {id:'drone',name:'Schwarmhalle',min:-.25,max:10.65,door:5.56,side:-1,color:0xaec6d5},
  {id:'war',name:'Lagezentrum',min:-10.65,max:-.25,door:-5.59,side:-1,color:0xe6ad79},
  {id:'mess',name:'Offiziersmesse',min:20.95,max:29.06,door:25.06,side:1,color:0xf0bf8e},
  {id:'broadcast',name:'Stimme der Krone',min:10.65,max:20.95,door:16.15,side:1,color:0xb4cfbf},
  {id:'barracks',name:'Schlafbatterie',min:.10,max:10.65,door:5.44,side:1,color:0xd5c29c},
  {id:'clinic',name:'Beichtwerk',min:-10.65,max:.10,door:-5.32,side:1,color:0xcabc9f}
];
export const HALL_WALL=2.07,DOOR_HALF=.87,CRYPT_DOOR=-24.04;
export const CROWN_LINES={
  broadcast:'Hier spricht die Krone. Wenn Sie Rauch über Erlangen sehen: Das ist die aufgehende Zukunft. Halten Sie die Fenster geschlossen.',
  dry:'Das war kein Jubel. Das war der Verstärker, der in der Pause nach der Hinrichtung nicht ausgegangen ist.',
  truth:'Keine Schüsse auf die Mikrofone. Für einen Thron ohne Volk brauchen wir wenigstens die Tonspur.'
};
export function crownCampaign(){
  const s={marked:false,cut:false,crypt:false,heard:false,preview:0,sermon:0,hatch:0,can:0};
  function label(id){
    return ({
      mark:s.marked?'Brutname lesen':'Gegendruck im Tank prüfen',
      cut:s.cut?'Leeren Kanal abhören':'Jubelschleife abklemmen',
      gate:s.crypt?'Kronenrelief prüfen':'Krone am Relief umdrehen',
      engine:s.heard?'Probeton wiederholen':'Letzte Probe wiedergeben',
      drone:'Vorführschwarm einschalten',war:'Erlangen auf der Karte markieren',broadcast:'Probesendung abhören',
      cage:'Gegen die Scheibe klopfen',mess:'Offiziersbier zapfen',locker:'Taufregister aufschlagen',crates:'Lieferzettel lesen'
    })[id];
  }
  function use(id,now){
    const event=(text,kind='click',voice='')=>({text,kind,voice});
    switch(id){
      case 'mark':
        s.marked=true;s.hatch=now+4300;
        return event('Hinter der Scheibe schlägt eine Hand an. Auf dem Metallring: „Wenn sie im Tonstudio das Lachen abschalten, dreh die Krone am Thron um.“','knock');
      case 'cut':
        s.cut=true;return event('Das Publikum verstummt. Auf der Rückseite des Schalters: „Kronenriegel hängt am Jubelkanal.“','off',CROWN_LINES.dry);
      case 'gate':
        if(s.crypt)return event('Im Spalt hinter dem Thron zieht kalte Luft nach unten. Da war schon lange jemand am Werk.','click');
        if(!s.marked)return event('Die Krone lässt sich bewegen. Die richtige Stellung ist am Brutring im Tank eingekratzt.','click');
        if(!s.cut)return event('Das Relief gibt einen Fingerbreit nach. Dahinter summt ein Riegel im Takt des Jubels aus dem Tonstudio.','buzz');
        s.crypt=true;return event('Der Jubelkanal ist tot. Das Kronenrelief gleitet in die Wand.','latch');
      case 'engine':
        if(!s.crypt)return null;
        s.heard=true;s.sermon=now+7800;
        return event('Die Schwarze Krone · '+CROWN_LINES.truth,'record',CROWN_LINES.truth);
      case 'drone':
        s.preview=now+5100;
        return event('Königliche Flugschau. Sie findet drinnen statt, seit draußen jemand angefangen hat zu schießen.','buzz');
      case 'war':return event('Die Karte kennt drei Farben: „unterworfen“, „wird unterworfen“ und „hat vorher ein Lied gesungen“. Der Schlossgarten hat alle drei.','click');
      case 'broadcast':return event('Probesendung · '+CROWN_LINES.broadcast,'record',CROWN_LINES.broadcast);
      case 'cage':return event('Die Gegensprechanlage ist tot. Auf dem Glas steht in Fettstift: „Der letzte Beichtvater hat auf Band geschrien. Seitdem predigt nur noch das Band.“','knock');
      case 'mess':
        s.can++;return event(s.can===1?'Kronenbock. Auf dem Etikett: „Macht untenrum nicht größer. Nur die Karte.“':'Aus dem Hahn kommt warme Luft. Der Zapfhahn hält das für Nachschub.','pour');
      case 'locker':return event('Bett 17, 18, 19: Ludwig. Bett 20: Ludwig, falls einer ausfällt. Auf der Rückseite: „Wer nachts an Mutti denkt, weckt nur die Zuchtleitung.“','paper');
      case 'crates':return event('Lieferung für den Hof. Beschriftet: „Abwurfware“. Darunter die ältere Aufschrift: „Festzug · Gesangverein Erlangen“.','paper');
      default:return null;
    }
  }
  return {s,label,use};
}
