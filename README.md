# Funtodo

Een todo-lijst die aanvoelt als een expeditie. Eén hoofdquest, drie zijpaden en een kamp dat groeit met wat je afmaakt. Meerdere gebruikers, een beheerdersrol, pushmeldingen en een widget voor de Omarchy-balk.

- **Vandaag** — je hoofdquest en zijpaden voor vandaag, met een reeks en weekoverzicht.
- **Quests** — alles wat je hebt opgeschreven, met een inbox voor dingen zonder datum.
- **Kamp** — munten, upgrades, een avatar en de statistieken van je expeditie.
- **Profiel** — wachtwoord wijzigen, pushmeldingen aanzetten en tokens voor de balkwidget maken.
- **Beheer** — als beheerder maak je accounts en stel je wachtwoorden opnieuw in.

## Vereisten

- Node 22 of nieuwer en npm.
- Optioneel: Omarchy met de Quickshell-shell voor de balkwidget.

## Downloaden en installeren

```bash
git clone https://github.com/michielturmel-max/funtodo.git
cd funtodo
npm install
cp .env.example .env.local
```

Liever geen git? Op de [releases-pagina](https://github.com/michielturmel-max/funtodo/releases)
staat een zip van elke versie, en via de groene **Code**-knop download je de
nieuwste broncode.

Open `.env.local` en kies je eigen beheerdersaccount:

```ini
ADMIN_USERNAME=beheerder
ADMIN_NAME=Beheerder
ADMIN_PASSWORD=kies-een-lang-wachtwoord
```

Start de app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) en log in met het account uit `.env.local`. Bij de eerste start maakt de app de SQLite-database en dat account aan. Daarna kun je op `/admin/inloggen` andere gebruikers toevoegen.

Voor productie:

```bash
npm run build
npm start
```

De app draait dan op poort 3000. Zet `APP_URL` op het adres waarop hij bereikbaar is; dat gebruikt de app voor redirects en pushmeldingen.

### De balkwidget

De widget is een aparte plugin: [funtodo-omarchy](https://github.com/michielturmel-max/funtodo-omarchy).
Start Funtodo, installeer daarna de plugin:

```bash
omarchy plugin add https://github.com/michielturmel-max/funtodo-omarchy --enable
```

Maak een token op `/profiel`, of log in met je wachtwoord:

```bash
~/.config/omarchy/plugins/funtodo/bin/funtodo login
```

Draait de app niet op `http://127.0.0.1:3000`, geef dan het adres mee
(`funtodo login --url https://funtodo.example`) of vul het in bij de
widgetinstellingen. De widget leest en schrijft via `~/.config/funtodo/plugin.json`.

## Wat waar staat

| pad | inhoud |
| --- | --- |
| `data/funtodo.db` | gebruikers, quests, munten en geschiedenis |
| `data/vapid.json` | automatisch gemaakt sleutelpaar voor pushmeldingen |
| `~/.config/funtodo/plugin.json` | URL en token van de balkwidget |
| `drizzle/` | databasemigraties; de app voert ze bij de eerste start uit |

`data/` staat in `.gitignore`: je eigen voortgang hoort niet in de repository. Wil je een andere locatie, zet dan `DATABASE_FILE` in `.env.local`.

## Pushmeldingen

De app maakt bij de eerste start een VAPID-sleutelpaar in `data/vapid.json`. Wil je dat liever via omgevingsvariabelen doen, zet dan `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` en `VAPID_SUBJECT` in `.env.local`. Push werkt alleen in een secure context: `localhost` of HTTPS.

## Ontwikkelen

```bash
npm run lint       # eslint
npm run dev        # development met hot reload
npm run build      # productiebuild
```

De database wordt aangemaakt met `drizzle-kit`; de migraties staan in `drizzle/`. Nieuwe migratie maken:

```bash
npx drizzle-kit generate
```

## Licentie

MIT, zie [LICENSE](LICENSE).
