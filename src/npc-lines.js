// Stable model/voice IDs. "existing" means the scene already owns the
// interaction and must not get a second E prompt or duplicate playback.
const niklasReply={clip:'niklasAntwort',line:'Schade, wenn du sie findest, bringe sie mir!'};
const bonsReply={clip:'bonsSchluchzen',line:'Bons schluchzt.',reaction:'sob',stageDirection:true};
export const NPCS={
  grey:{name:'Grey',template:'clubNiko',line:'Soll ich dir was zeigen?',choices:[
    {label:'Ja, zeig!',reply:{action:'grey-show'}},{label:'Verpiss dich!'}
  ]},
  festZwanni:{name:'Zwanni',template:'guestJona',line:'Ich bin dein Gottkönig! Aahhh!',choices:[
    {label:'Leck mich!'},
    {label:'Was willst du, Gottkönig?',reply:{clip:'festZwanniEier',line:'Ich brauche Eier zum lutschen!'}}
  ]},
  festAnni:{name:'Anni · Theke',template:'guestSabine',line:"In Uehlfeld ist besser. Da fragt wenigstens keiner, ob wir das Bier auch warm haben."},
  festKalle:{name:'Kalle · Playlist',template:'clubNiko',line:"Die Playlist läuft auf meinem alten Laptop. Seit da Bier drin ist, spielt er nur noch Stimmungsmusik."},
  festRudi:{name:'Rudi · Schreiber',template:'guestBruno',line:"Der Zwanni wird seit fünfzehn Jahren nicht besser. Aber beim Ausredenwerfen ist er Bezirksmeister."},
  bergWirt:{name:'Kerwas Michi',template:'labSepp',line:'Halb besoffen ist rausgeschmissenes Geld!'},
  bergLeni:{name:"Leni Beck · Schankkellnerin",template:'guestSabine',line:"Früher hat mei Mutter die Maß ohne Strich ausg’schenkt. Der Strich war am Deckel. Schau, der da is noch von vor der Flut."},
  bergDora:{name:"Dora Pfister · Stammgast",template:'guestMarlene',line:"Alla, früher ham mer für die letzte Runde a Bleim g’sunga. Heut sing mer’s nimmer. Sonst könnt’s ja wirklich die letzte sei."},
  bergFritz:{name:'Bons',template:'clubNiko',line:'Dai Mudda is dai Fadda, F.C.N.!',choices:[
    {label:'Geh heim Bons!',reply:bonsReply},{label:'Deine Mudda ist eine Jutta!',reply:bonsReply}
  ]},
  bergUdo:{name:"Udo Heller · Musikant",template:'guestJona',line:"Früher ham mer am Berch bis zum Regen g’spielt. Jetzt spiel mer bis zum Trocknen. Des zieht si, wenn mer in einer Pfützn wohnt."},
  guestBruno:{name:'Bruno Reiter',line:'Heiliger Bies, erleuchte uns. Aber bitte nicht schon wieder mit dem Chor.'},
  guestMarlene:{name:'Marlene Vogel',line:'Ich suche die Chronik. Im Katalog steht: ausgeliehen, seit 1743.'},
  guestSabine:{name:'Sabine Roth',line:'Die Seife ist alle. Das Schild „Hygiene“ haben sie aber frisch geputzt.'},
  guestJona:{name:'Jona „Moos“ Ebert',line:'Das ist kein Rauch. Das ist ungeklärter Nebel im Gemeinschaftseigentum.'},
  guestRike:{name:'Rike Stein',line:'Die Tomaten kennen keine Obrigkeit. Nur wenn’s ums Gießen geht, brauchen sie plötzlich einen Staat.'},
  guestEdda:{name:'Edda Seifert',line:'Psst. Wir sind auf Sendung. Hörer haben wir noch keine, aber Beschwerden schon.'},
  guestLotte:{name:'Lotte Weber'},
  gardenHannes:{name:'Jake',template:'guestJona',line:'Ich mag Bäume.',choices:[
    {label:'Bist du dumm?',reply:{clip:'jakeDumm',line:'Ja, ein bisschen dumm bin ich.'}},
    {label:'Ja, ich mag auch Bäume!',reply:{clip:'jakeNaeher',line:'Sehr gut, dann tritt näher an ihn!'}}
  ]},
  cloneB07:{name:'Klon B–07 · Anwärter',template:'clubSami',line:'Ich habe meinen neuen Namen schon gelernt. Darf ich den alten behalten, wenn ihn keiner hört?'},
  cloneAlma:{name:'Alma Zinn · Ausbilderin',template:'labHedwig',line:'Abschnitt drei: freiwillige Begeisterung. Wer keine mitgebracht hat, bekommt welche zugeteilt.'},
  cloneLorenz:{name:'Lorenz Sattler · Botwart',template:'labAuer',line:'Der Druide sollte Befehle auslegen. Jetzt legt er Beschwerde ein. Saubere Arbeit, würde ich sagen.'},
  cloneB12:{name:'Klon B–12 · Abnahme',template:'clubSami',line:'Die große Drohne hat heute nicht bestanden. Sie ist einfach sitzen geblieben. Das darf bei uns sonst nur die Leitung.'},
  plazaRaban:{name:'Raban Eck · Protokollant',template:'labSepp',line:'Auf dem Band heißt es Nein. In der Abschrift heißt es noch nicht. Das ist keine Fälschung, das ist Zukunftsdenken.'},
  plazaVroni:{name:'Veronika Karg · Registratur',template:'guestMarlene',line:'Abteilung C, Fach drei. Alles hat hier seinen Platz. Nur wer wiederkommt, macht uns die Ablage kaputt.'},
  plazaEberwin:{name:'Eberwin Moser · Siegelwart',template:'orbPriest',line:'Du darfst deinen neuen Namen behalten. Vorausgesetzt, du verwechselst ihn nie wieder mit dir selbst.'},
  plazaIsolde:{name:'Isolde Brandt · Wartemarke 00',template:'guestLotte',line:'Sie haben mich gestern schon aufgerufen. Unter einem anderen Namen. Ich warte lieber, bis ich wieder dran bin.'},
  plazaAnton:{name:'Anton Rott · Depotwache',template:'niklas',line:'Ich soll nur die Kisten zählen. Wenn eine zurückklopft, zählen wir sie doppelt.'},
  crownFlesh:{name:'Ludwig 18 · Brutringschaden',template:'clubSami',line:'Sie sagen, ich bin das Ebenbild vom König. Der König muss ein ziemlich miserables Leben haben.'},
  crownSleeper17:{name:'Ludwig 17 · inaktiv',template:'clubSami'},
  crownSleeper19:{name:'Ludwig 19 · inaktiv',template:'clubSami'},
  crownDrone:{name:'Hedi Rupp · Schwarmwartin',template:'labHedwig',line:'Die Dinger erkennen Gesichter. Drum hab ich dem Marschall geraten, seins nicht zu oft zu benutzen.'},
  crownMarshal:{name:'Xaver Brunn · Kronenmarschall',template:'niklas',line:'Ich will kein Massengrab. Ich will, dass wenn wir eins graben, jemand Rosen in Auftrag gibt.'},
  crownVoice:{name:'Veith Zoll · Sendemeister',template:'orbPriest',line:'Klatschen vor der Rede verkauft Hoffnung. Klatschen nach der Rede verkauft Angst. Dasselbe Band.'},
  crownWitness:{name:'Alois Wirth · Zeuge',template:'guestBruno',line:'Ich hab beim ersten Schrei an Gott gedacht. Beim achten nur noch: Hoffentlich ist das ein Scheißband mit kurzer Laufzeit.'},
  crownMedic:{name:'Agnes Stahl · Beichtwerk',template:'labHedwig',line:'Für Schmerz ist er zu weich gewesen, hat der König gesagt. Der König war beim Zuhören nicht zugegen.'},
  crownQuartermaster:{name:'Berti Mang · Quartiermeister',template:'labSepp',line:'Die Uniform hat keine Taschen vorn. Sonst sieht beim Appell jeder, wie wenig die da drin verstecken.'},
  crownEcho:{name:'Stimme 01 · nicht zur Auslieferung',template:'labAuer',line:'Das ist nicht meine Stimme. Ich bin nur das Loch, aus dem sie kommt.'},
  chapterOskar:{name:'Oskar Ried · Vorsitzender',template:'niklas',line:'Setz dich ruhig. Nur nicht hier. Für diesen Stuhl haben wir vier Satzungsänderungen gebraucht.'},
  chapterMatthias:{name:'Matthias Kern · Archivar',template:'guestBruno',line:'Von jeder Sitzung gibt es zwei Protokolle. Das ehrliche liegt unter dem Tisch.'},
  chapterKonrad:{name:'Konrad Falk · Fechtmeister',template:'labSepp',line:'Die Klingen sind geputzt. Die Ehre muss noch bis morgen einweichen.'},
  niklas:{name:'Niklas',line:'Hi, hast du meine Hoden gesehen?',choices:[
    {label:'Nein, Eierloser Spast!',reply:niklasReply},{label:'Was? Nein?!',reply:niklasReply}
  ]},
  labAuer:{name:'Dr. Ernst Auer',line:'In der Akte steht „Behandlung“. So heißt es hier.',existing:true},
  labPrisoner:{name:'Kilian Beck · Zelle C',template:'guestBruno',line:'Ich hab heimlich alkoholfreies Bier getrunken. Jetzt sitz ich dafür lebenslänglich.'},
  labPatient:{name:'Tobias Lang · Patient',template:'guestJona',line:'Aaah! Aufhören!'},
  labOrderly:{name:'Greta Lang · Nachtdienst',template:'guestRike',line:'Ich sortiere nur die Akten. Nach Ursachen sortieren wir hier nicht.'},
  labHedwig:{name:'Hedwig Kern',line:'Herkunft? Für die neue Akte zählt nur der neue Name.',existing:true},
  labSepp:{name:'Sepp Moser',line:'Fränkische Suppe. Auf dem Speiseplan steht jetzt bayerisch.',existing:true},
  orbPriest:{name:'Orb-Priester',existing:true},
  hubert:{name:'Hubert',line:'Deutschland … Deutschland … aaah …'},
  clubAda:{name:'Ada',line:'Das hier ist die einzige Schicht, bei der mir keiner die Schritte vorschreibt.'},
  clubMira:{name:'Mira',line:'Wenn die Kugel stehen bleibt, tanz weiter. Sonst merken sie, dass wir keine Techniker haben.'},
  clubNiko:{name:'Niko',line:'Das Bier heißt Kontrollgetränk. Die Kontrolle hab ich schon verloren.'},
  clubSami:{name:'Sami',line:'Vier Viertel. Das ist die einzige Vorschrift hier unten, an die ich mich halte.'},
  clubVeit:{name:'Veit',line:'Ich wollte längst gehen. Die sagen aber seit drei Stunden: letzter Tanz.'}
};
