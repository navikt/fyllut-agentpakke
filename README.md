# Fyllut-agentpakke

Teamets skills og en liten Fyllut-agent, distribuert med nav-pilot som en
**Tier 1-pakke**. Installer med **bruker-scope** én gang på hver utviklermaskin:
innholdet kan brukes på tvers av repoer, uten installasjon i hvert repo.

Pakken gjenbruker `navikt/copilot` fra en pinnet revisjon. Navs agenter, skills
og instruksjoner følger dermed med uten at vi vedlikeholder kopier av dem.
Standardpersonaen er `fyllut`; modellen velges fra brukerens klientoppsett.

## Slik tar du i bruk agentpakken

### 1. Installer verktøyene

På macOS:

```bash
brew install navikt/tap/nav-pilot navikt/tap/cplt
```

Har du dem allerede, oppdater med `brew upgrade`. Pakken krever nav-pilot
`2026.10.07-064704` eller nyere. For Linux og andre installasjonsmåter, følg
[Navs veiledning](https://ki-utvikling.nav.no/nav-pilot).

Velg og klargjør Copilot CLI eller OpenCode etter den samme veiledningen.
Git og autentisert GitHub CLI er nødvendig for GitHub-arbeidsflytene:

```bash
gh auth status
# Bare hvis du ikke allerede er innlogget:
gh auth login
```

Du trenger tilgang til repoene du skal arbeide med. Installer Node.js dersom
du skal bruke `form-text-history`, og bruk prosjektets pinnede versjon når
prosjektet har en. Stack-skillene trenger også GitHub CLI-utvidelsen:

```bash
gh extension install github/gh-stack
```

### 2. Installer pakken for brukeren din

Kjør dette i en vanlig terminal **utenfor cplt-/agentsandkassen**:

```bash
nav-pilot install fyllut-agentpakke \
  --source navikt/fyllut-agentpakke \
  --user --save-source
```

Godkjenn installasjonen når du blir spurt. `--user` velger bruker-scope;
`--save-source` gjør denne pakken til standardkilde for senere oppstarter.
Ingen `.github/`-filer eller pakkelåsfil opprettes i arbeidsrepoene dine.
For Copilot ligger skillene i `~/.copilot/skills/`. Nav-pilot klargjør
klientens eget innhold ved oppstart.

Har du allerede installert Nav-grunnpakken i bruker-scope, er dette et
bevisst bytte av kilde for scopet, ikke en ekstra uavhengig installasjon.
Grunnpakken følger med gjennom gjenbrukserklæringen i denne pakken.
Les eventuelle konfliktmeldinger før du velger overskriving; ikke bruk
`--force` ukritisk. Hooks og prompts fra basen er ikke del av bruker-scope;
ikke baser sikkerheten på at en repo-hook er installert.

### 3. Start fra repoet du skal arbeide i

```bash
cd /sti/til/ditt/repo
nav-pilot --client copilot --persona fyllut
# Eller:
nav-pilot --client opencode --persona fyllut
```

Et repo som har sin egen `.nav-pilot/agentpakke.lock.json` kan velge en annen
pakkekilde enn brukerens standard. Vil du uttrykkelig bruke teamets pakke i
en slik økt, legg til `--source navikt/fyllut-agentpakke` ved oppstart.

Start gjennom nav-pilot når du bruker skills med skript. Det setter
`NAV_PILOT_SKILLS_DIR` til riktig katalog for klienten. En direkte oppstart
av klienten har ikke nødvendigvis denne variabelen.

### 4. Bruk en skill

Be agenten bruke skillen ved navn, for eksempel:

```text
Bruk dependency-upgrade til å oppdatere avhengighetene i dette repoet.
Bruk pr-review-follow-up for https://github.com/navikt/<repo>/pull/<nummer>.
Bruk form-text-history for nav190105 i perioden 2024-01-01 til 2024-12-31.
```

Start spesifikasjonsflyten uttrykkelig:

```text
/fyllut-sendinn-specification
```

Hvis klienten ikke tilbyr slash-kommandoen, be eksplisitt om å bruke
`fyllut-sendinn-specification`. I Copilot kan godkjent spesifikasjon overføres
til `/plan`; i OpenCode brukes klientens planmodus. Agenten skal fortsatt
vente på svar og godkjenning der skillen krever det.

| Skill | Bruk |
| --- | --- |
| `approve-github-stack` | Gjennomgå og godkjenne en GitHub PR-stack |
| `dependency-upgrade` | Undersøke og gjennomføre avhengighetsoppgraderinger |
| `dependency-upgrade-stack` | Organisere oppgraderinger som en PR-stack |
| `bug-triage-and-fix` | Undersøke en feil, rette den og levere en PR |
| `conventional-commit` | Skrive conventional commits |
| `pr-review-follow-up` | Avklare og håndtere reviewkommentarer |
| `release-fyllut` | Publisere valgt FyllUt-commit etter bekreftelse |
| `unslop` | Fjerne unødvendige KI-genererte kode- og tekstmønstre |
| `fyllut-sendinn-specification` | Lage funksjonell eller teknisk spesifikasjon |
| `form-text-history` | Undersøke publisert skjematekst og lage HTML-rapport |

`form-text-history` trenger lokale form- og rendererrepoer med relevant
Git-historikk. Release- og stack-skillene trenger de respektive
GitHub-rettighetene; installasjon av pakken gir ikke nye tilganger.
Ved arbeid på tvers av lokale repoer må også sandkassen tillate de aktuelle
katalogene. Følg cplt-veiledningen; ikke slå av beskyttelsene generelt.

### 5. Hold brukerinstallasjonen oppdatert

```bash
# Vis tilgjengelige oppdateringer:
nav-pilot sync --user

# Installer oppdateringene i en vanlig terminal:
nav-pilot sync --user --apply
```

`sync` uten `--apply` endrer ingenting, og exitkode `1` betyr at oppdateringer
finnes. Utviklerne kan ha ulike revisjoner hvis de oppdaterer på ulike
tidspunkt; bruker-scope har ingen felles låsfil i prosjektet.

Ved problemer, kjør `nav-pilot doctor`. Hvis du vil bruke MCP-verktøy, aktiver
aktuelle servere med `nav-pilot mcp enable` etter Navs veiledning.
Pakkeinstallasjonen setter ikke opp MCP eller innlogging automatisk.

## Vedlikehold

Skillene er kopiert fra
[`navikt/fyllut-sendinn-local-dev-env`](https://github.com/navikt/fyllut-sendinn-local-dev-env/tree/961b0d6ba56d2ce5f72c20f919c99f7fad4342d5/plugins),
revisjon `961b0d6ba56d2ce5f72c20f919c99f7fad4342d5`.
Dette repoet er distribusjonskilden for nav-pilot; det synkes ikke automatisk
fra de opprinnelige pluginene. Ved import må hele skillmapper kopieres og de
lokale sti- og klienttilpasningene bevares.

Fra pakkerepoet:

```bash
nav-pilot validate --source "$PWD"
node --test tests/package.test.mjs
node --check skills/form-text-history/scripts/generate-form-text-history.mjs
bash -n skills/release-fyllut/scripts/list-releasable-fyllut-commits.sh

# Oppdater den pinnede Nav-grunnpakken bevisst:
nav-pilot pakke bump-base
```

Se over endringen i `.nav-pilot/agentpakke.lock.json`, valider, og commit den.
Den filen beskriver **pakken vi gjenbruker**, ikke brukerens installasjon.
Endringer med samme skillnavn som i basen skygger basens innhold; sjekk dette
ved oppdateringer.

[Pakkekontrakten](https://github.com/navikt/copilot/blob/main/docs/README.agentpakke.md)
beskriver formatet. Innholdet distribueres under [MIT-lisensen](LICENSE).
