# Verifica dei dati CREA

Controllo di veridicità degli alimenti di base (`src/data/alimenti-crea.json`), eseguito il 2026-09-24 sui dati estratti con `npm run dati:crea`.

## 1. Coerenza interna (tutti i 616 alimenti)

Per ogni alimento le kcal dichiarate dal CREA sono state ricalcolate dai nutrienti con i fattori del metodo di Southgate usato dal CREA (carboidrati disponibili 3,75 kcal/g, proteine 4, grassi 9, fibre 2).

**Risultato: tutti i 616 alimenti sono coerenti, scarto massimo 0,55 kcal.** Il controllo conferma che i valori sono stati letti correttamente dalle schede (nessun campo scambiato o troncato). È ripetuto a ogni `npm test` da `src/data/alimentiBase.test.ts`, con tolleranza di 1 kcal.

## 2. Confronto con USDA FoodData Central (campione di 47 alimenti comuni)

Confronto con la banca dati USDA SR Legacy (aprile 2018, pubblico dominio). Gli alimenti sono stati abbinati a mano al corrispondente USDA più vicino. Segnalati (⚠️) gli scarti di kcal oltre il 25% e gli scarti di proteine o grassi oltre il 30% (e oltre 2 g).

Le differenze non indicano errori: le due banche dati misurano campioni diversi (varietà, provenienza, stagione) e con metodi diversi. Il CREA usa i carboidrati disponibili misurati e i fattori di Southgate; l'USDA calcola i carboidrati "per differenza" (includendo fibre, acidi organici e altre sostanze) e applica fattori energetici specifici per alimento. Gli scarti percentuali più grandi riguardano frutta e verdura, che hanno poche kcal: in valore assoluto restano entro 14 kcal per 100 g, in entrambe le direzioni.

Come previsto da `CLAUDE.md`, i valori CREA **non sono stati corretti**: le discrepanze sono solo segnalate.

| | Alimento CREA | kcal CREA | kcal USDA | Δ kcal | Proteine g (CREA / USDA) | Grassi g (CREA / USDA) | Alimento USDA | Nota |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | Mele, fresche, con buccia (`007120`) | 44 | 52 | -15% | 0,2 / 0,3 | 0 / 0,2 | Apples, raw, with skin |  |
|  | Banane, fresche (`007510`) | 76 | 89 | -15% | 1,2 / 1,1 | 0,3 / 0,3 | Bananas, raw |  |
|  | Arance, fresche (`008000`) | 37 | 47 | -21% | 0,7 / 0,9 | 0,2 / 0,1 | Oranges, raw, all commercial varieties |  |
|  | Pere, fresche, senza buccia (`007260`) | 43 | 57 | -25% | 0,3 / 0,4 | 0,1 / 0,1 | Pears, raw |  |
| ⚠️ | Pesche, fresche, con buccia (`007290`) | 28 | 39 | -28% | 0,7 / 0,9 | 0 / 0,2 | Peaches, yellow, raw |  |
|  | Fragole, fresche (`007730`) | 30 | 32 | -6% | 0,9 / 0,7 | 0,4 / 0,3 | Strawberries, raw |  |
|  | Kiwi, freschi (`007570`) | 48 | 61 | -21% | 1,2 / 1,1 | 0,6 / 0,5 | Kiwifruit, green, raw |  |
|  | Uva, fresca (`007380`) | 64 | 69 | -7% | 0,5 / 0,7 | 0,1 / 0,2 | Grapes, red or green (European type, such as Thompson seedless), raw |  |
|  | Albicocche, fresche (`007000`) | 42 | 48 | -12% | 0,4 / 1,4 | 0,1 / 0,4 | Apricots, raw |  |
| ⚠️ | Cocomero, fresco (`007040`) | 16 | 30 | -47% | 0,4 / 0,6 | 0 / 0,1 | Watermelon, raw | CREA misura i carboidrati disponibili (3,7 g); USDA li calcola per differenza (7,1 g) |
| ⚠️ | Pomodori, maturi, freschi (`006610`) | 23 | 18 | +28% | 1 / 0,9 | 0,2 / 0,2 | Tomatoes, red, ripe, raw, year round average |  |
|  | Zucchine, crude (`005730`) | 16 | 17 | -6% | 1,5 / 1,2 | 0,1 / 0,3 | Squash, summer, zucchini, includes skin, raw |  |
|  | Carote, crude (`005150`) | 41 | 41 | +0% | 1,1 / 0,9 | 0,2 / 0,2 | Carrots, raw |  |
|  | Patate, crude (`006500`) | 72 | 77 | -6% | 2 / 2,0 | 0,1 / 0,1 | Potatoes, flesh and skin, raw |  |
| ⚠️ | Spinaci, crudi (`005700`) | 35 | 23 | +52% | 3,4 / 2,9 | 0,7 / 0,4 | Spinach, raw |  |
| ⚠️ | Lattuga, fresca (`005410`) | 22 | 15 | +47% | 1,8 / 1,4 | 0,4 / 0,1 | Lettuce, green leaf, raw |  |
|  | Cavolo broccolo verde ramoso, crudo (`005180`) | 30 | 34 | -12% | 3,4 / 2,8 | 0,3 / 0,4 | Broccoli, raw |  |
|  | Melanzane, crude (`005500`) | 23 | 25 | -8% | 1 / 1,0 | 0,4 / 0,2 | Eggplant, raw |  |
| ⚠️ | Cipolle, crude (`005300`) | 28 | 40 | -30% | 1 / 1,1 | 0,1 / 0,1 | Onions, raw |  |
| ⚠️ | Peperoni, rossi, crudi (`005630`) | 34 | 26 | +31% | 0,9 / 1,0 | 0,3 / 0,3 | Peppers, sweet, red, raw |  |
|  | Ceci, secchi (`004000`) | 343 | 378 | -9% | 20,9 / 20,5 | 6,3 / 6,0 | Chickpeas (garbanzo beans, bengal gram), mature seeds, raw |  |
|  | Lenticchie, secche (`004500`) | 319 | 352 | -9% | 22,7 / 24,6 | 1 / 1,1 | Lentils, raw |  |
|  | Fagioli, Borlotti, secchi (`004120`) | 312 | 347 | -10% | 20,2 / 21,4 | 2 / 1,2 | Beans, pinto, mature seeds, raw |  |
|  | Piselli, freschi (`004700`) | 64 | 81 | -21% | 5,5 / 5,4 | 0,6 / 0,4 | Peas, green, raw |  |
|  | Mandorle dolci, secche (`008540`) | 628 | 579 | +8% | 22 / 21,1 | 55,3 / 49,9 | Nuts, almonds |  |
|  | Noci, secche (`008570`) | 702 | 654 | +7% | 14,3 / 15,2 | 68,1 / 65,2 | Nuts, walnuts, english |  |
|  | Nocciole, secche (`008550`) | 671 | 628 | +7% | 13,8 / 14,9 | 64,1 / 60,8 | Nuts, hazelnuts or filberts |  |
|  | Pasta di semola (`000800`) | 341 | 371 | -8% | 13,5 / 13,0 | 1,2 / 1,5 | Pasta, dry, enriched |  |
|  | Riso, brillato (`000100`) | 334 | 365 | -8% | 6,7 / 7,1 | 0,4 / 0,7 | Rice, white, long-grain, regular, raw, unenriched |  |
|  | Riso, integrale (`000110`) | 341 | 367 | -7% | 7,5 / 7,5 | 1,9 / 3,2 | Rice, brown, long-grain, raw |  |
| ⚠️ | Fiocchi d'avena (`003030`) | 367 | 379 | -3% | 8 / 13,2 | 7,5 / 6,5 | Cereals, oats, regular and quick, not fortified, dry | Prodotto diverso: la scheda CREA è "Oat bran flakes" (fiocchi di crusca d'avena), l'USDA fiocchi d'avena |
| ⚠️ | Pane bianco (`000530`) | 268 | 266 | +1% | 8,1 / 8,8 | 0,5 / 3,3 | Bread, white, commercially prepared (includes soft bread crumbs) | Il pane italiano è senza grassi aggiunti, quello industriale USA li contiene |
|  | Pollo, intero, senza pelle, crudo (`106210`) | 110 | 119 | -8% | 19,4 / 21,4 | 3,6 / 3,1 | Chicken, broilers or fryers, meat only, raw |  |
|  | Tacchino intero, senza pelle, crudo (`106710`) | 109 | 115 | -5% | 21,9 / 22,6 | 2,4 / 1,9 | Turkey, whole, meat only, raw |  |
|  | Bovino adulto o vitellone, filetto, crudo (`101170`) | 127 | 153 | -17% | 20,5 / 22,1 | 5 / 6,5 | Beef, tenderloin, steak, separable lean only, trimmed to 1/8" fat, all grades, raw |  |
|  | Maiale, lombo, crudo (`105210`) | 146 | 143 | +2% | 20,7 / 21,4 | 7 / 5,7 | Pork, fresh, loin, whole, separable lean only, raw |  |
|  | Salmone (`122400`) | 185 | 208 | -11% | 18,4 / 20,4 | 12 / 13,4 | Fish, salmon, Atlantic, farmed, raw |  |
| ⚠️ | Tonno (`123500`) | 159 | 144 | +10% | 21,5 / 23,3 | 8,1 / 4,9 | Fish, tuna, fresh, bluefin, raw | Il contenuto di grassi del tonno varia molto con specie e stagione |
|  | Merluzzo o nasello (`121410`) | 71 | 82 | -13% | 17 / 17,8 | 0,3 / 0,7 | Fish, cod, Atlantic, raw |  |
|  | Uova di gallina, intero (`181100`) | 128 | 143 | -10% | 12,4 / 12,6 | 8,7 / 9,5 | Egg, whole, raw, fresh |  |
|  | Latte di vacca, pastorizzato, intero (`135010`) | 64 | 61 | +5% | 3,3 / 3,1 | 3,6 / 3,2 | Milk, whole, 3.25% milkfat, with added vitamin D |  |
|  | Latte di vacca, pastorizzato, parzialmente scremato (`135020`) | 46 | 42 | +10% | 3,5 / 3,4 | 1,5 / 1,0 | Milk, lowfat, fluid, 1% milkfat, with added vitamin A and vitamin D |  |
|  | Yogurt, da latte intero (`150010`) | 66 | 61 | +8% | 3,8 / 3,5 | 3,9 / 3,2 | Yogurt, plain, whole milk |  |
|  | Yogurt greco, 0% lipidi (`150030`) | 51 | 59 | -14% | 9 / 10,2 | 0 / 0,4 | Yogurt, Greek, plain, nonfat |  |
|  | Olio di oliva extra vergine (`009210`) | 899 | 884 | +2% | 0 / 0,0 | 99,9 / 100,0 | Oil, olive, salad or cooking |  |
|  | Burro (`190010`) | 758 | 717 | +6% | 0,8 / 0,8 | 83,4 / 81,1 | Butter, without salt |  |
|  | Burro d'arachidi (`009010`) | 625 | 598 | +5% | 24,9 / 22,2 | 53,7 / 51,4 | Peanut butter, smooth style, without salt |  |
