# Human Cast · SchlossER

**Basis:** MakeHuman hm08 / MPFB: Anatomie, Gewichte für das Game-Engine-Rig und Mesh-Targets. [CC0-Freigabe der Daten](https://github.com/makehumancommunity/mpfb2/blob/9de0707fdc88438d7c53a1a2ac7937d9221e2431/LICENSE.md). Blender und MakeHuman-Plug-in-Code sind nicht Teil des Spiels.

**Bauteile:** Kleidung, Schuhe, Hauttexturen, Haar und Brauen aus den [MakeHuman-Systemassets (CC0)](https://static.makehumancommunity.org/assets/assetpacks.html), Stand des Archivs 2024-04-14. Auge: MakeHuman [Low-Poly Eye](https://github.com/makehumancommunity/makehuman/tree/a8bc2d54ff0ac92e78ff71431b1023eda42bf482/makehuman/data/eyes), CC0. Schnitte, Farbauswahl, Pose, Anpassungen, Uniformteile und Rollen sind für SchlossER eingerichtet; Hubert ist fiktiv. Keine Abhängigkeit von einem Avatar-Dienst.

## Eine weitere Figur hinzufügen

1. In [`scripts/bake-humans.py`](../scripts/bake-humans.py) einen neuen Eintrag in `cast` ergänzen: stabile ID, Erwachsenen-Proportion, Haut, ein Outfit, Haar, Schuhe, Größe und ergänzende Morphs. Das Script passt Mesh und Rig gemeinsam an und blendet die unter der Kleidung liegende Haut mit der Proxy-Maske aus.
2. `python scripts/human_sources.py` lädt die Ursprungsteile in den ignorierten Ordner `dist/human-source/`. Für neue Teile dort die Whitelist erweitern. Benötigt Python und curl. Keine dieser Ursprungsdateien lädt der Browser.
3. In Blender im Hintergrund ausführen: `blender -b --factory-startup --python-exit-code 4 -P scripts/bake-humans.py`. Ergebnis: editierbare Szene `dist/Human-Cast.blend`, ausgelieferte, Meshopt-komprimierte `assets/human-cast.glb`. Die Quelltexturen für die Blender-Datei liegen in `dist/human-source`.
4. Im Szenenmodul `createHuman(T,'neueId')` verwenden. Das klont das Skelett und den Gesichtsstatus, behält aber geteilte Geometrie und Texturen. Das Rig bietet `pose(time,phase,motion,attack,hit,fall,seed,...)`, `dance(time,beat,style,...)` und `hitShapes()`. Eine dauerhaft geteilte Spiel-KI ist bewusst nicht Teil der Figurenklasse.
5. `npm run offline` aktualisiert die Web-Fassung und `dist/Schlossgarten.html`. `node scripts/preview-human.mjs` baut den lokalen Kontaktbogen.

## Laufzeit

- Blinzeln, Blick und sieben Gesichtskanäle (Lider, Brauen, Mund) sind vom Körper getrennt. Huberts vorhandene Aufnahme steuert die Mundakzente anhand einer Timeline. Das ist noch keine vollständige Phonem-Lippensynchronisation.
- Gehbewegung folgt dem zurückgelegten Weg. Zweiknochen-IK richtet Ellenbogen und Knie aus, die Fußlage variiert zwischen Stand- und Schwungphase. Es gibt keine Echtzeit-Stoffsims und kein Motion Capture.
- Fünf Clubstile laufen auf der WebAudio-Position der 32-Takte-Schleife. Bei stummem oder noch nicht geladenem Track läuft ein visueller Ersatztakt. Die Figuren bewegen sich nur bei aktivem Clubraum; mit „Bewegung reduzieren“ sind Gesten dezenter. Keine zusätzlichen Echtzeit-Schattenkarten pro Figur.
- Die Gartenrunde setzt den neutralen Baukasten in drei Ghoul-Varianten ein. Spawn, Navigation, fünf Gegner, Trefferabfrage und die Sieg-/Niederlagebedingungen bleiben im Rundensystem. Hubert und Clubgäste gehören nicht zum Gegner-Pool.
- Huberts fiktive Feldbluse nimmt Feldgrau, Brusttaschen und die Knopfreihe aus dem [Sammlungsobjekt M/44 des dänischen Nationalmuseums](https://samlinger.natmus.dk/khs/object/60378) als Formhinweise. Eigene Schnittinterpretation, keine historischen Kennzeichen und keine aus der Fotografie abgeleiteten Texturen.
- `orbPriest`: stehende Figur im Votivraum hinter dem Orb; prozeduraler Arbeitsloop mit Blick- und Stimmreaktion. `niklas`: Butler auf einer festen Runde innerhalb der Eingangshalle. Beide sind atmosphärische NPCs ohne Kampfverhalten. Die Fleischrequisiten sind selbst modellierte Stücke ohne menschlichen Körper.
- Der Griff des Requisitenmessers sitzt in einem Socket des Handknochens. Messerhaltung und Gelenkbeugung werden im selben Animationsschritt gesetzt. Niklas setzt seine Standfüße an festen Punkten der Hallenrunde; die Schwungfüße folgen dem Bogen. Die Sohlenhöhe kommt aus dem gebackenen Modell, nicht aus einem visuellen Pauschalversatz.
- `labAuer`, `labHedwig` und `labSepp` nutzen dasselbe Rig. Sie gehören jeweils zur Krankenstation, zum Herkunftsamt und zur Kantine. Taktung, Blick und Einzeiler sind ausschließlich in ihrem Raum aktiv. Die Gespräche brauchen keinen Audio- oder Avatar-Dienst.
