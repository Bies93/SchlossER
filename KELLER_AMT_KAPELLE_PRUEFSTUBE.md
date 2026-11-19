# Projekt Bayern: Amts- und Ritenflügel

Fiktiver Ausbau für SchlossER. Der Flügel bleibt auf der vorhandenen Kellerebene: Gelände, Treppenphysik und Rückweg zum Schloss ändern sich nicht. Er ist in beiden Spielmodi ohne Schlüssel, Kampf oder Quest zugänglich.

## Lage und Erzählrichtung

- In der **Behandlungsstation** führt ein markierter Personalweg aus der hinteren Wand. Das versetzte Schrankelement und der bestehende Aktentisch lassen die Öffnung frei. Der Gang knickt vor dem Herkunftsamt ab, damit aus der Station nicht alle neuen Räume gleichzeitig sichtbar werden.
- Im **Herkunftsamt** blickt man zuerst auf Wartebereich und Schalter. Seitlich geht es an der Verglasung vorbei. Das dahinterliegende **Namensregister** ist ein eigener Raum: Vorn erscheinen Akten regulär sortiert, hinten werden dieselben Porträts in der alten und der amtlich vergebenen Identität direkt nebeneinander gestellt.
- Vom Amt führt ein zweiter Ausgang in die **Kapelle**. Zwischen Becken, Bankreihen und verrohrtem Altar bleibt eine durchgehende Seitengasse. Der Eid wird beim Näherkommen am Bandlautsprecher ausgelöst und kann nach Verlassen der Hörzone erneut gehört werden.
- Der kupferne **Leitungsgang** führt von der Kapelle in die **Prüfstube**. Diese grenzt direkt an die bestehende Nachprüfung der Brauerei; der Personalweg wird dadurch zum Rundweg, nicht zur Sackgasse.

## Gestaltung und Details

- **Amt:** blasse Mintfarbe, Milchglas in Metallrahmen, Nummernanzeige, Wartemarken, Stempel, Klemmbrett und das vorausgefüllte Formular. Die Uhr steht; auf dem roten Musterabdruck steht „Widerspruch bestätigt fränkische Restprägung“. Alter und Zweck der Objekte bleiben auch ohne lesbare Kleinschrift erkennbar.
- **Register:** engere Regalzeilen, grünlich-kühles Licht, Aktenzüge, Klemmleisten und wiederholte, eigens gezeichnete Karteiporträts. Dieselbe Aktenkennung taucht in der Kapelle wieder auf.
- **Kapelle:** gedämpftes Bernstein und dunkler Rotton, unterleuchtetes Becken, gewölbter Ritenrahmen, Rückenlehnen aus gefasten Brettern, Kupfer mit Befestigungsschellen, Bandgerät und Lautsprecher. Drei Durchläufe desselben Eids; die letzte Zeile widerspricht den ersten beiden. Gemeinsame Beschriftung und ein dezenter, älterer Fleck an der Ablaufseite verbinden die sakrale Bühne mit der Station.
- **Prüfstube:** warmes Licht, nummerierte Juryplätze, echte Gefäßsilhouetten, Probenwagen, Ringabdrücke und Bewertungsbögen. Der Blindbogen nennt zuerst die fränkische Probe als Sieger; das gedruckte Nachfolgeschild benennt dieselbe Charge als „Oberbayerisches Kontrollgetränk“.

## Technische Grenzen

LAB_CELLS und LAB_LINKS definieren Boden, Raumzuordnung, Kollisionskanten und Öffnungen. Jede Öffnung hat genau einen Rahmenbesitzer. Das vorhandene Sichtsystem bestimmt relevante Nachbarräume, und die vier dynamischen Kellerlichter werden wiederverwendet. Kleine Requisiten liegen in Materialbatches; Karteikarten und Aushänge teilen sich einen Atlas. Alle Texte und geometrischen Requisiten funktionieren offline. Der Eid hat eine Textfassung; gesprochene Fassung bei einer lokal installierten deutschen Stimme, zusätzlich ein synthetischer Bandchor.
