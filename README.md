# Erlanger Schloss und Schlossgarten

Interaktive Three.js-Außenansicht für Browser mit WebGL 2. Die fünf Kamerastandorte sind über die Fußleiste und die Tasten 1 bis 5 erreichbar. Ziehen dreht den Blick, das Mausrad zoomt und die rechte Maustaste verschiebt den Blickpunkt.

## GitHub Pages

Den Inhalt **dieses Ordners** einschließlich `index.html`, `viewer.js` und `assets/` in die oberste Ebene des gewünschten Repositories übernehmen. In den Pages-Einstellungen „Deploy from a branch“ und den Ordner `/ (root)` auswählen. Der fertige Stand verwendet relative URLs und funktioniert auch unter einem Projektnamen als Unterpfad.

## Lokal öffnen und bearbeiten

Die einzelne Datei `Schlossgarten.html` neben diesem Projekt lässt sich per Doppelklick öffnen. Für die aufgeteilte Webfassung im Projektordner beispielsweise `python -m http.server 8000` starten und `http://localhost:8000` öffnen.

Die JavaScript-Quellen liegen in `src/`. In `app.js` stehen Kameras, Licht und Szenenaufbau. In `garden.js` stehen Gelände, Wege, Bepflanzung und Orangerie. `palace.js` ordnet Oberflächen und Texturen zu. Neue Objekte wie eine Stadtmauer lassen sich als eigenes Modul beim Szenenaufbau in `app.js` hinzufügen. Die beiden GLBs enthalten Geometrie in Metern, mit Y als Hochachse. Der Brunnen liegt bei z = −47 m.

Texturen unter `assets/` lassen sich direkt ersetzen. Nach Änderungen an JavaScript oder der HTML-Vorlage mit Node.js und `npm ci`, dann `npm run build` den Pages-Stand neu erzeugen. Für eine neue Einzeldatei `npm run offline` ausführen. Das Ergebnis steht unter `dist/Schlossgarten.html`.

## Modell und Quellen

Schloss, Hugenottenbrunnen und Friedrich-Denkmal beruhen auf den lokalen Erlanger Blender-Modellen. Figuren und Ornamentik sind nach Fotografien angenähert. Orangerie, Parkwege und sommerliche Bepflanzung sind gestalterische Rekonstruktionen. Das Modell zeigt den Außenbereich.

- Architekturkontrolle anhand der LoD2-Daten der Bayerischen Vermessungsverwaltung (www.geodaten.bayern.de, CC BY 4.0). Die Referenzkachel diente dem Maßabgleich.
- Luftbildreferenzen von Reinhold Möller (Ermell), [Gartenseite](https://commons.wikimedia.org/wiki/File:Erlangen_Schlossgarten_Luftbild-20230422-RM-165329.jpg) und [Schlossplatz](https://commons.wikimedia.org/wiki/File:Erlangen_Schloss_Luftbild-20230422-RM-165002.jpg), CC BY-SA 4.0.
- Anatomiebasis der Figuren von MakeHuman Community (CC0). Oberflächentexturen und Vorschaurender stammen aus dem lokalen Schlossprojekt.
- Umgebungslicht [Kloppenheim 06](https://polyhaven.com/a/kloppenheim_06) von Greg Zaal, Poly Haven (CC0).
- Three.js und Meshoptimizer werden unter der MIT-Lizenz verwendet. Lizenztexte liegen in `licenses/`.
