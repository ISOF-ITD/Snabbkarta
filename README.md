# ISOF Snabbkarta

## Kör med gulp

Extensions Live server:
Go Live

git submodule update --init --recursive
cd

Set if build is production in gulpfile.js
var production = true;

gulp

Add config you want:
http://127.0.0.1:5500/www/?config=sifferkartan.json

If needed:
npm install gulp --g
Does not work in ubuntu/WSL as it seems:
sudo apt install gulp

For development switch urls in config file to relative path or localhost. Example:
			"__url": "http://127.0.0.1:5500/www/data/ortnamn-teckensprak/ortnamn-teckensprak.geojson",
			"url": "data/ortnamn-teckensprak/ortnamn-teckensprak.geojson",


Run with parameter config pointing to a json-config file:
http://127.0.0.1:5500/www/?config=sifferkartan.json
http://127.0.0.1:5500/www/?config=ortnamn-tecken.json
http://127.0.0.1:5500/www/?config=oland.json

## Konvertera CSV till JSON

Se mappen `csv2json`.

Det här skriptet omvandlar en CSV-fil till en JSON-fil. CSV-filen ska innehålla följande fält: `Name`, `Description`, `Latitude` och `Longitude`. Dessa fält motsvarar egenskaperna för varje `Feature` i JSON-filen.

Det finns en mall som heter `template.csv`.

För att köra skriptet behöver du Python. Följande instruktioner visar hur du använder skriptet:

1. **Förbered din CSV-fil**: CSV-filen ska ha följande format:

    ```
    Name,Description,Latitude,Longitude
    ```

    Varje rad i CSV-filen motsvarar en `Feature` i den slutliga JSON-filen.

2. **Kör skriptet**: När du har förberett din CSV-fil, navigera till katalogen där både skriptet och CSV-filen finns. Du kan sedan köra skriptet med följande kommando i terminalen:

    ```bash
    python script.py dinfil.csv
    ```

    Om du inte anger någon utdatafil kommer skriptet att skapa en JSON-fil med samma namn som CSV-filen (t.ex. `dinfil.json`).

    Om du vill specificera en annan utdatafil kan du göra det genom att ange det som ett andra argument:

    ```bash
    python script.py dinfil.csv annanfil.json
    ```

    I det här fallet kommer skriptet att skapa en fil som heter `annanfil.json`.

3. **Kontrollera utdatafilen**: Efter att skriptet har kört, kontrollera den genererade JSON-filen för att se till att all data har konverterats korrekt.

Observera att skriptet inte hanterar eventuella fel eller problem med CSV-filen. Se till att din CSV-fil är korrekt formaterad och innehåller giltiga data innan du kör skriptet.