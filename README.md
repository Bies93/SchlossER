# Erlanger Schloss und Schlossgarten

Begehbarer Three.js-Rundgang für Browser mit WebGL 2. Mit **Rundgang starten** geht es auf dem Schlossplatz los. Mit **WASD** gehen und mit der **Maus** umsehen; ohne Mausfang funktioniert auch Ziehen im Bild, alternativ drehen die **Pfeiltasten** den Blick. Auf Touchscreens links zum Gehen und rechts zum Umsehen ziehen. **Esc** oder **Pause** öffnet das Menü mit Lichtwechsel und Vollbild.

Der begehbare Außenrundgang ist durch Gartenmauer, Gitter und geschlossene Tore sowie durch die Bebauung am Schlossplatz eingefasst. Die gepflasterten Straßenstücke enden an sichtbaren Hofdurchgängen. Die Straßenabschlüsse sind Ergänzungen für den Rundgang, keine Rekonstruktion realer Sperren.

## GitHub Pages

Den Inhalt **dieses Ordners** einschließlich `index.html`, `viewer.js` und `assets/` in die oberste Ebene des gewünschten Repositories übernehmen. In den Pages-Einstellungen „Deploy from a branch“ und den Ordner `/ (root)` auswählen. Der fertige Stand verwendet relative URLs und funktioniert auch unter einem Projektnamen als Unterpfad.

## Lokal öffnen und bearbeiten

Nach `npm run offline` lässt sich `dist/Schlossgarten.html` per Doppelklick öffnen. Für die aufgeteilte Webfassung im Projektordner beispielsweise `python -m http.server 8000` starten und `http://localhost:8000` öffnen.

Die JavaScript-Quellen liegen in `src/`. `app.js` verbindet Szene, Licht und Oberfläche, `player.js` steuert die Figur. `world-layout.js` definiert Start, Weltkontur und feste Grundrisse; `perimeter.js` baut daraus Mauer, Tore, Fassaden und Pflaster samt Kollidern. `collision.js` löst Kontakte. `garden.js` registriert Wege und Collider beim Erzeugen von Orangerie, Bänken und Baumstämmen. `palace.js` ordnet Oberflächen und Texturen zu.

Maßstab und Route sind am vorhandenen Modell ausgerichtet: Y zeigt nach oben, Z positiv zum Platz. Das ca. 65 m breite Schloss liegt um den Ursprung, der Denkmalsockel um z = +31 m und der Brunnen um z = −47 m. Geh vom Platz um die Seite des Schlosses (z. B. bei x ≈ +37 m), dann nach innen zum Brunnen oder weiter zur Orangerie im positiven X. Portal und Gebäude bleiben geschlossen. Grundrisse, Tore und Platzgrenzen sind Spielmaße, kein Aufmaß.

Die [Übergabe für Etappe 2](docs/etappe-2.md) enthält die Lage der Weltgrenzen, Quellen und eine kurze Route für den eigenen Abnahmerundgang.

Texturen unter `assets/` lassen sich direkt ersetzen. Nach Änderungen an JavaScript oder der HTML-Vorlage mit Node.js und `npm ci`, dann `npm run build` den Pages-Stand neu erzeugen. Für eine neue Einzeldatei `npm run offline` ausführen. Das Ergebnis steht unter `dist/Schlossgarten.html`.

## Modell und Quellen

Schloss, Hugenottenbrunnen und Friedrich-Denkmal beruhen auf den lokalen Erlanger Blender-Modellen. Figuren und Ornamentik sind nach Fotografien angenähert. Orangerie, Parkwege und sommerliche Bepflanzung sind gestalterische Rekonstruktionen. Das Modell zeigt den Außenbereich.

- Architekturkontrolle anhand der LoD2-Daten der Bayerischen Vermessungsverwaltung (www.geodaten.bayern.de, CC BY 4.0). Die Referenzkachel diente dem Maßabgleich.
- Luftbildreferenzen von Reinhold Möller (Ermell), [Gartenseite](https://commons.wikimedia.org/wiki/File:Erlangen_Schlossgarten_Luftbild-20230422-RM-165329.jpg) und [Schlossplatz](https://commons.wikimedia.org/wiki/File:Erlangen_Schloss_Luftbild-20230422-RM-165002.jpg), CC BY-SA 4.0.
- Anatomiebasis der Figuren von MakeHuman Community (CC0). Oberflächentexturen und Vorschaurender stammen aus dem lokalen Schlossprojekt.
- Umgebungslicht [Kloppenheim 06](https://polyhaven.com/a/kloppenheim_06) von Greg Zaal, Poly Haven (CC0).
- Three.js und Meshoptimizer werden unter der MIT-Lizenz verwendet. Lizenztexte liegen in `licenses/`.
