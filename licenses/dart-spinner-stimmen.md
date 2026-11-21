# Dart-Spinner Uehlfeld: Dialogaufnahmen

Vier deutsche Katalogstimmen von HeyGen Voice; keine Stimmklone. Modell vom
Dienst gewählt (keine Modell-ID in der Antwort). Die Takes entsprechen den
Texten in `src/npc-lines.js` und werden erst beim Ansprechen bzw. bei der
passenden Antwort abgespielt. Format: MP3, 24 kHz, Mono, 64 kbit/s.

| Datei in `assets/npc-voices/` | Katalogstimme und ID | Take-ID | Tempo | Dateidauer |
| --- | --- | --- | ---: | ---: |
| `festZwanni.mp3` | Albrecht – Calm & Trustworthy (`20cd33ab51e546009b390d207842580f`) | `695e41d80e714877b386ee32fdb893aa` | 0,96 | 3,17 s |
| `festZwanniEier.mp3` | Albrecht – Calm & Trustworthy (`20cd33ab51e546009b390d207842580f`) | `c6cd8021dfef4369bb28d8a8c012c76b` | 0,96 | 1,65 s |
| `festAnni.mp3` | Nele – Friendly & Natural (`194c5c7896e849139df58b34b05b6a7c`) | `dc7ba7d9e5cc4d2d9967b8d9377b5e69` | 0,98 | 5,02 s |
| `festKalle.mp3` | Florian – Dynamic & Punchy (`be8d7bf8ce774bda8b6dd04541fb8623`) | `1c976a4378f840a89a8144dc045732b4` | 1,00 | 5,90 s |
| `festRudi.mp3` | August – Professional (`849dbf55415e4beea43c4522f8e3a377`) | `4ade119a650840c5aa8cdd8f705f689a` | 0,96 | 6,38 s |

Dateiformat, Laufzeiten und vollständige Dekodierung geprüft; keine Hörabnahme.

Zwannis neuer Einstieg „Ich bin dein Gottkönig! Aahhh!“ ist ein unveränderter
deutscher Take mit deaktivierter Textnormalisierung. „Aahhh“ ist laut
Dienst-Zeitmarken ab 2,533 s enthalten. „Ich brauche Eier zum lutschen!“
bleibt unverändert der Ausschnitt 2,625–4,278 s aus dem früheren Take.
Die Ablehnung hat absichtlich keine Sprachausgabe.

Die Musik `assets/zwannis-polka.mp3` ist eine eigene prozedurale Komposition
aus `scripts/bake-festival-polka.py`. Keine verwendeten Fremdsamples.
