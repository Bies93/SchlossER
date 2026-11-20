# SchlossER · Sprechliste für die Aufnahmen

Alle 15 Einzeiler sind vertont und beim Ansprechen mit `E` eingebunden. Die mit HeyGen erzeugten, vom Nutzer bereitgestellten Aufnahmen liegen in `assets/npc-voices/`. Die Modell-IDs unten sind die internen Schlüssel; die tatsächlichen MP3-Dateinamen stehen in `src/npc-voice-assets.js`. Für künftige Aufnahmen: möglichst trocken, ohne eingebrannten Raumhall.

- `node scripts/import-npc-voices.mjs PFAD_ZUM_MANIFEST` prüft Figur und Dialogtext und übernimmt vorhandene MP3s aus dem benachbarten `mp3/`-Ordner oder lädt sie vom Audioanbieter. Das Skript verändert das Quellpaket nicht; Download-URLs werden weder im Spiel noch im Repo gespeichert.
- Der Web-Build nutzt versionierte lokale MP3s; der Offline-Build bettet sie ein. Die Clips laden erst beim Ansprechen. Im Club wird die Musik während des Satzes abgesenkt. Bei stummgeschaltetem Ton bleibt der Untertitel.

| Figur / vorgeschlagener Dateiname | Spielort und Vortrag | Text |
| --- | --- | --- |
| Bruno Reiter · `guestBruno` | Südgalerie, murmelnd, dann trocken | Heiliger Bies, erleuchte uns. Aber bitte nicht schon wieder mit dem Chor. |
| Marlene Vogel · `guestMarlene` | Lesesaal, sachlich ratlos | Ich suche die Chronik. Im Katalog steht: ausgeliehen, seit 1743. |
| Sabine Roth · `guestSabine` | Damen-WC, beiläufig genervt | Die Seife ist alle. Das Schild „Hygiene“ haben sie aber frisch geputzt. |
| Jona „Moos“ Ebert · `guestJona` | Moosfunk-Couch, verschmitzt und entspannt | Das ist kein Rauch. Das ist ungeklärter Nebel im Gemeinschaftseigentum. |
| Rike Stein · `guestRike` | Gewächshaus, trocken und bestimmt | Die Tomaten kennen keine Obrigkeit. Nur wenn’s ums Gießen geht, brauchen sie plötzlich einen Staat. |
| Edda Seifert · `guestEdda` | Funkstudio, leises „Psst“, dann mit Sprecherstimme | Psst. Wir sind auf Sendung. Hörer haben wir noch keine, aber Beschwerden schon. |
| Niklas · `niklas` | Eingangshalle, höflich, letzter Teilsatz geschäftsmäßig | Guten Abend. Die Galerie ist offen. Was dahinter liegt, gehört nicht zur Führung. |
| Dr. Ernst Auer · `labAuer` | Krankenstation, kontrolliert, ohne Regung | In der Akte steht „Behandlung“. So heißt es hier. |
| Hedwig Kern · `labHedwig` | Herkunftsamt, als wäre das eine Routinefrage | Herkunft? Für die neue Akte zählt nur der neue Name. |
| Sepp Moser · `labSepp` | Laborkantine, stolz auf die Suppe, nüchtern beim Rest | Fränkische Suppe. Auf dem Speiseplan steht jetzt bayerisch. |
| Ada · `clubAda` | Club, etwas außer Atem, freundlich | Das hier ist die einzige Schicht, bei der mir keiner die Schritte vorschreibt. |
| Mira · `clubMira` | Club, schnell und verschwörerisch | Wenn die Kugel stehen bleibt, tanz weiter. Sonst merken sie, dass wir keine Techniker haben. |
| Niko · `clubNiko` | Club, ein bisschen angeheitert | Das Bier heißt Kontrollgetränk. Die Kontrolle hab ich schon verloren. |
| Sami · `clubSami` | Club, entspannt und rhythmisch | Vier Viertel. Das ist die einzige Vorschrift hier unten, an die ich mich halte. |
| Veit · `clubVeit` | Club, müde und gut gelaunt | Ich wollte längst gehen. Die sagen aber seit drei Stunden: letzter Tanz. |

Lotte Weber bleibt im aktuellen Stand stumm. Optionaler späterer Satz am Bettrand: „Wenn du Edda siehst: Sag ihr, dass nach Mitternacht niemand Nachrichten braucht.“

## Optionale Nachaufnahmen vorhandener Geräusche oder synthetischer Stimmen

- **Orb-Priester:** „… hm …“ — ein kurzes tiefes, gedecktes Brummen, als würde ihn gar nichts überraschen. Der aktuelle Effekt ist prozedural.
- **Hubert:** „Deutschland … Deutschland … aaah …“ — sehr langsam, zwei getrennte Versuche und ein auslaufendes Stöhnen. Eine bearbeitete Aufnahme existiert bereits.
- **Stimme des Orbs:** „Fürchte nicht die Stille. Noch ehe der erste Stein fiel, kannte ich deinen Namen. Tritt ins Licht.“ — Aufnahme existiert bereits.
- **Kapellenband:** Takes 1 und 2 identisch und mechanisch: „Ich bin freiwillig hier. Von daheim ist nichts in mir geblieben.“ Take 3 mit hörbarer Pause und abweichendem Ende: „Ich bin freiwillig hier. Von daheim ist … alles in mir geblieben.“
- **Moosfunk-Stationsjingle:** „Hier ist Moosfunk. Drei Jingles, zwei Hörer. Den zweiten vermuten wir.“
- **Moosfunk-Prüfvermerk:** „Beim Blindtest gewann Franken. Das Ergebnis wurde aus Gründen der Objektivität aussortiert.“
- **Moosfunk-Küchendienst:** „Die Tomatenfrage ist vertagt. Die Tomaten selbst sind weg.“
- **Moosfunk-Archivband:** „Hier Rückkanal. Im Labor heißt es: Fremdakte F, nicht ablegen. Wir haben den Namen trotzdem aufgeschrieben.“
- **Moosfunk-Schalter, erste Ansage:** „Moosfunk an alle: Rückkanal steht. Wer hätte gedacht, dass Beschlagnahmen einen Rückgabeschalter haben?“
- **Moosfunk-Schalter, erneute Ansage:** „Rückkanal offen. Wenn ihr mich hört: Die Sprechprobe ist vorbei. Bitte keine weitere Sprechprobe.“
