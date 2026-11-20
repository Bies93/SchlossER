# SchlossER · First-Person-Waffen

## Modelle und Spielwerte

| Platz | Modell | Ablauf und Balance |
| --- | --- | --- |
| 1 | **Windbruch** – quer ausladende Armbrust, dunkler Holzschaft, beschichtete Auflagen, sichtbare Sehne und ein dreidimensionaler Spielbolzen. | Ein sichtbarer Bolzen mit leichter Absenkung; 64 Schaden erst beim Treffer statt 36 sofort. Sehnenbewegung, Ladebewegung, sichtbares Einlegen des nächsten Bolzens; nach 1,30 s wieder bereit. Kein Mündungsblitz. |
| 2 | **Vesper 17** – fiktives Sturmgewehr mit separatem Polymer-Schaft, asymmetrischen Gehäuseblenden, geripptem Magazin und geschlitztem Handschutz. | Einzelklick, kleiner Streukegel, 54 Schaden wie zuvor, Abstand 0,243 s. Kurzer Blitz und eigener Rücklauf der Seitenblende. |
| 3 | **Amber 08** – Pumpflinte mit gebläuter Oberfläche, geöltem Holz, geriffeltem Vorderschaft und offener Zielreferenz. | Fünf Streustrahlen; bis zu 25 Schaden je Treffer und schwächer auf Distanz, zusammengefasst pro Ghoul. Sperre 0,752 s bis nach dem Pumpzyklus; die Stützhand folgt dem Vorderschaft. |

Reichweiten, Bewegung und Streuung sind Spielwerte. Es gibt keine nachbildbare Innenmechanik. Die Formgebung ist eigenständig; kein Referenzmodell, Fremdmesh oder Audiosample ist enthalten.

## Darstellung und Einbindung

- `src/ego-assets.js`, `src/ego-gear.js`, `src/ego-weapon-models.js`: Profile und gekrümmte Abschnitte mit separaten Fasenkanten, Ausnehmungen, Drehprofilen und sichtbaren Montagefugen. Statische Teile werden im Werkzeugraum nach Material zusammengefasst. Bewegliche Blenden, Bow-Elemente, Vorderschaft und Bolzen bleiben getrennt.
- Materialbibliothek: Base Color in sRGB; Normal und Roughness linear. Kleine wiederverwendete Maps, längs gerichtete Holz-UVs, geringfügige Kratzer an ausgewählten sichtbaren Stellen. Metallanteil je Material, kein eingebrannter Schatten und kein separater AO-Pass. Keine GLBs oder neuen Binärassets.
- `src/ego-hands.js`, `src/viewmodel.js`: getrennte Kontaktgruppen für beide Hände, bestehender Viewmodel-Pass, passende Hip-/ADS-Anker, Atem-, Lauf- und Sprintführung. Wechselanimation und Erholungszeit sind getrennt; ein schneller Wechsel macht keine Waffe vorzeitig wieder bereit. Pause hält die Spielzeit an.
- `src/ego-projectiles.js`: Kontakte nutzen das vorhandene Kollisionsraster. Der Bolt-Pool prüft jeweils den tatsächlich abgeflogenen Abschnitt; der erste Kontakt beendet die Schadensprüfung. Streutreffer werden pro Klick addiert und genau einmal je Ghoul übergeben. Standmarke, kurzer Staub und Trefferton verwenden dieselbe Kontaktposition. Beim Verlassen der Kampfzone werden die Effekte zurückgesetzt.
- `src/audio.js`: drei getrennte prozedurale Klangprofile, eigene Lade- und Repetiergeräusche sowie Trefferprofile. Lautstärke und Stummschaltung behalten die vorhandene Steuerung.
- `src/app.js`, `src/template.html`: Bedienhinweise, Modustransitionen und Runden-Reset der Projektile. `index.html`, `viewer.js` und `dist/Schlossgarten.html` kommen aus dem normalen Build. Keine Änderung an Ghoul-Spawns oder Bestandsszenen.

## Vorschau und Grenzen

- `node scripts/preview-gear.mjs` erzeugt `dist/waffen-atelier.html`. Die Seite rendert dieselben Modelle unter Studiolicht von der Seite und schräg von vorne, danach in den In-Game-Haltungen mit und ohne ADS.
- Ausgeführt: `npm run build`, `npm run offline`, `git diff --check`, Render der Atelieransicht in Edge. Kein kompletter Spieldurchlauf und keine Endabnahme.
- Feste Budgets der neuen Welteffekte: drei wiederverwendete Bolzen, ein Instanzmesh für bis zu 24 kurze Staubpartikel, keine Schusslichter. Keine Vorher-/Nachher-FPS gemessen.
- Die Kollision folgt den Spiel-Collidern und ist an Bänken, Toren und anderen vereinfachten Objekten konservativer als ein Test gegen einzelne Renderdreiecke. Es gibt kein zusätzliches manuelles Nachladen, keinen Hülsenauswurf und keine Waffen-Munitionsanzeige.

## Material- und Formpolitur nach den Ego-Screenshots

- `src/weapon-finishes.js` erzeugt gekachelte Albedo-, Normal- und Rauheitsmaps. Holz nutzt 512 px mit längs gewarpten Jahresringen und Poren; Stahl, Polymer, Verbundstoff, Gummi und Textilien nutzen geteilte 128-/256-px-Maps. Nur Fertigungsspuren und gezielt maskierte Kanten verändern den Glanz; Kontaktabdunklung aus der Geometrie greift vor allem an Fugen. Die Texturen entstehen lokal, es gibt keine neuen Downloads.
- Windbruch und Amber haben jetzt modellierte, aus Querschnitten aufgebaute Holzschäfte mit durchlaufenden UVs. Bei Vesper schärfen räumliche Nähte, Einlagen und die konturierte Wangenauflage den oberen Gehäuseumriss. Ärmel und Handschuhe haben eigene Stoff-/Lederoberflächen.
- Amber: Die ursprüngliche, koplanare Holz-Griffauflage ist entfernt. Griffstruktur sitzt nun im einen Schaftmaterial. Der Vorderschaft hat Freiraum zum Gehäuse auch am Ende der Animation; Dauer, Schadenswerte und Zielanker bleiben gleich. Das Atelier enthält dafür zwei zusätzliche Unterseitenansichten.
