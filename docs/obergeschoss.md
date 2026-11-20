# Erstes Obergeschoss

Fiktiver Innenausbau für SchlossER. Der Zugang verwendet die vorhandene erste Einzelfensterachse links neben den gekoppelten Fenstern der Gartenfassade. Die übrigen Außenfenster, die Traufe und die Dachform bleiben unverändert.

- `src/palace-openings.js`: `UPPER_ENTRY` ist der gemeinsame Bezug für Baum, Öffnung und Fensterlaibung. Die Fensteröffnung wird in die betroffenen Meshes des Schloss-GLB geschnitten; es wird kein zweites Außenwandmodell darübergelegt.
- `src/palace-upper.js`: `UPPER_FLOOR` ist die Oberkante des Bodens. `UPPER_BAYS` teilt die Länge in acht Abschnitte; jede Achse hat je einen Raum zur Garten- und zur Platzseite. Die Längsachse des Hauptgangs liegt bei `z = 0`, die Gangwände bei `z = ±1.73`. Negative Z-Werte zeigen zum Garten, positive X-Werte nach Süden.
- Neue Ausstattung für diese Etage in die Gruppe `room` oder eine ihrer Untergruppen aufnehmen, bevor ihre Layer gesetzt werden. Sie gehört auf `UPPER_LAYER`; Möbel- und Wandkollisionen gehören in `upperWorld`, nicht in die Kollisionen des Erdgeschosses.
- Die Gartenlaibung samt Anlegeleiter freihalten. Sie ist der Hin- und Rückweg. Geöffnet wird nur einmal pro Rundgang, damit das Fenster bei einem Abstieg nicht versehentlich geschlossen werden kann.

## Referat Morgenform

In der Reihenfolge der X-Achse auf der Gartenseite: Schwerlast-Hangar, Kleindrohnen-Montage, Druiden- und Botwerkstatt, Wellenlabor, Aufnahme und Einkleidung, Lehrsaal, Agentenprüfung, Munitionslinie. Der Fensterzugang mündet in die Aufnahme.

`src/upper-factory.js` baut die Ausstattung mit gemeinsam genutzten und pro Raum zusammengefassten Materialien. `src/upper-factory-art.js` enthält die originalen Schilder und Propagandaplakate. Die vier NPCs verwenden vorhandene Rig-Vorlagen, aber eigene IDs, Kleidung, Posen und Untertitel aus `src/npc-lines.js`. Die Requisiten sind fiktive Außengehäuse und Bühnenobjekte; sie haben keine Funktion als reale Waffen oder Fluggeräte.

Zur Schlossplatzseite: Fundbüro der Identitäten, Protokollkammer, Register der Aussonderung, Kapelle der Letzten Unterschrift, Wartesaal der Freiwilligen, Stimm- und Haltungsschule, Spiegelprüfung und Depot ohne Rückgabe. `src/upper-plaza.js` hält Einrichtung, Kollisionen und die fünf zusätzlichen Figuren einschließlich der Depotpatrouille zusammen. `src/upper-plaza-art.js` liefert die Drucke. Die Lichtfarbe wechselt raumbezogen über die vorhandenen drei Lichtquellen; die Geschosshälfte ist auch aus der Nähe kein zweites Rendermodell der Schlossfassade.
