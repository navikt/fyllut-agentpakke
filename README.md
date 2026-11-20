# Fyllut-agentpakke

Fyllut-Sendinns agent, skills og felles instruksjoner for Copilot CLI, OpenCode og Pi.
Pakken gjenbruker en pinnet versjon av Nav-grunnpakken og installeres én gang
per utvikler, på tvers av repoer.

## Installer og oppdater

Kjør i en vanlig terminal utenfor agentsandkassen:

```bash
# Installer og velg pakken som standardkilde:
nav-pilot install fyllut-agentpakke \
  --source navikt/fyllut-agentpakke --user --save-source

# Oppdater brukerinstallasjonen:
nav-pilot sync --user --apply
```

Dette erstatter eventuell Nav-grunnpakke i samme bruker-scope. Grunnpakkens
innhold følger fortsatt med. Les konfliktmeldinger før du godtar overskriving.
Pakken krever nav-pilot `2026.10.07-064704` eller nyere.
Oppsett av verktøyene er beskrevet hos [nav-pilot](https://github.com/navikt/copilot/tree/main/cli/nav-pilot)
og [cplt](https://github.com/navikt/cplt).

## Agent og skills i dette repoet

Start [`fyllut`](agents/fyllut.agent.md) i repoet du jobber i. Beskriv oppgaven,
så bruker agenten de skillsene den trenger. Noen må du be om ved navn.

### Skills å kjenne til i det daglige

| Oppgave | Skill | Hva agenten gjør |
| --- | --- | --- |
| Undersøke en hendelse i prod eller preprod | [`fyllut-investigate-incident`](skills/fyllut-investigate-incident/SKILL.md) | Skiller funn fra hypoteser uten å endre noe i miljøet. |
| Spesifisere en endring | [`fyllut-sendinn-specification`](skills/fyllut-sendinn-specification/SKILL.md) | Skriver en funksjonell eller teknisk spesifikasjon sammen med deg. |
| Rette en bug | [`fyllut-bug-triage-and-fix`](skills/fyllut-bug-triage-and-fix/SKILL.md) | Finner årsaken, tester rettelsen og oppretter en PR. |
| Samle avhengighetsoppgraderinger | [`fyllut-dependency-upgrade-stack`](skills/fyllut-dependency-upgrade-stack/SKILL.md) | Tester oppgraderingene i en PR-stack og erstatter bot-PR-ene som stacken dekker. |

<details>
<summary>Hjelpeskills</summary>

| Skill | Hva den hjelper med |
| --- | --- |
| [`fyllut-create-pr`](skills/fyllut-create-pr/SKILL.md) | Skriver PR-beskrivelser og oppretter PR-er når du ber om det. |
| [`fyllut-dependency-upgrade`](skills/fyllut-dependency-upgrade/SKILL.md) | Oppgraderer én avhengighet eller en liten gruppe i én PR. |
| [`fyllut-follow-up-issue`](skills/fyllut-follow-up-issue/SKILL.md) | Oppretter en oppfølgingssak i GitHub når du ber om denne skillen. |
| [`fyllut-form-text-history`](skills/fyllut-form-text-history/SKILL.md) | Viser hva som sto i publiserte skjemaer, og når teksten endret seg. |
| [`fyllut-observability-debugging`](skills/fyllut-observability-debugging/SKILL.md) | Viser hvilke Fyllut-Sendinn-apper du bør sjekke, og hvor du finner logger, metrikker og spor. |
| [`fyllut-playwright-best-practices`](skills/fyllut-playwright-best-practices/SKILL.md) | Gir råd om å skrive og feilsøke Playwright-tester. |
| [`fyllut-unslop`](skills/fyllut-unslop/SKILL.md) | Fjerner KI-markører og unødvendige formuleringer fra tekst. |

</details>

<details>
<summary>Skills for kodegjennomgang</summary>

Du trenger ikke be om review av koden agenten skriver for deg. Agenten sjekker
endringene før levering og retter det den finner innenfor oppgaven. Starter du
`fyllut-create-pr` selv, velger du om agenten skal kjøre review og rette funn.

| Skill | Hva den hjelper med |
| --- | --- |
| [`fyllut-review-before-pr`](skills/fyllut-review-before-pr/SKILL.md) | Verifiserer og gjennomgår lokale endringer før levering eller push. |
| [`fyllut-review-core`](skills/fyllut-review-core/SKILL.md) | Felles kriterier for de andre review-skillene. |
| [`fyllut-pr-review`](skills/fyllut-pr-review/SKILL.md) | Gjennomgår en PR eller en hel stack når du ber om det. |
| [`fyllut-pr-review-follow-up`](skills/fyllut-pr-review-follow-up/SKILL.md) | Avklarer reviewkommentarene med deg og gjør avtalte endringer. |

</details>

Nav-grunnpakkens agenter og skills kommer i tillegg, blant annet
`conventional-commit` og `playwright-testing`. Sistnevnte gir innførende
Nav-eksempler; teamskillen gir detaljerte Playwright-råd.

## Bruk

Start fra repoet du skal arbeide i:

```bash
nav-pilot --client copilot --persona fyllut
# Eller:
nav-pilot --client opencode --persona fyllut
# Eller:
nav-pilot --client pi --persona fyllut
```

Be eksplisitt om `/fyllut-sendinn-specification` for å lage en spesifikasjon,
eller `/fyllut-dependency-upgrade-stack` for å samle avhengighetsoppgraderinger.
Et repos egen pakkekilde kan overstyre brukerens standard. Legg til
`--source navikt/fyllut-agentpakke` ved oppstart for å velge teamets pakke.

Start gjennom nav-pilot for å få `NAV_PILOT_SKILLS_DIR` satt for medfølgende
skript. GitHub-arbeidsflytene krever innlogget `gh` og tilgang til målrepoet.
Øvrige krav står i hver skill. MCP aktiveres separat med `nav-pilot mcp enable`.

## Opphav og lisenser

De opprinnelige teamskillene ble importert fra
[`navikt/fyllut-sendinn-local-dev-env`](https://github.com/navikt/fyllut-sendinn-local-dev-env/tree/961b0d6ba56d2ce5f72c20f919c99f7fad4342d5/plugins)
ved revisjon `961b0d6ba56d2ce5f72c20f919c99f7fad4342d5`. Dette repoet er nå
distribusjonskilden. Eget innhold har [MIT-lisens](LICENSE).

| Importert skill | Kilde og pinnet revisjon | Lisens |
| --- | --- | --- |
| `fyllut-playwright-best-practices` | [currents-dev/playwright-best-practices-skill, `0b75b5835a87de1fdd202ba965f3bc5a27738fdf`](https://github.com/currents-dev/playwright-best-practices-skill/tree/0b75b5835a87de1fdd202ba965f3bc5a27738fdf/playwright-best-practices) | [MIT, Currents Software Inc.](skills/fyllut-playwright-best-practices/LICENSE.md) |
| `fyllut-unslop` | [cursor/plugins, `2f87c854fe3e2fcda44ca86b46ede35aad3c46b7`](https://github.com/cursor/plugins/tree/2f87c854fe3e2fcda44ca86b46ede35aad3c46b7/pstack/skills/unslop) | [MIT fra `pstack/LICENSE`, Lauren Tan](skills/fyllut-unslop/LICENSE) |

Playwright-skillen har lokalt navn, Nav-integrasjonsregler og repoets testkommando.
Avsluttende mellomrom i to referansefiler er fjernet. Unslop har lokalt navn og
beskrivelse. I motsetning til originalen kan agenten laste skillen automatisk
ved skriving og redigering av prosa. `disable-model-invocation` er fjernet lokalt.
Hent hele skillmapper ved oppdatering, bevar lisensene og lokale tilpasninger,
og gjennomgå endringene i en PR.

## Vedlikehold

Kjør fra pakkerepoet med verktøyversjonene i `mise.toml`:

```bash
mise run test
nav-pilot validate --source "$PWD"
mise exec -- node --check skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs
```

Oppdater Nav-grunnpakken fra en vanlig terminal utenfor agentsandkassen:

```bash
bash scripts/bump-base.sh
```

Skriptet krever et rent repo på `main`, innlogget `gh` og verktøyene `git`,
`jq`, `nav-pilot` og `mise`. Det oppdaterer lokal `main` fra `origin/main`
med fast-forward og kjører `nav-pilot pakke bump-base`. Lokal `main` med
egne commits avvises. `origin` må peke til `navikt/fyllut-agentpakke`, ikke en fork.

Ved ny base oppretter skriptet `chore/nav-pilot-base-<sha>`, kjører kontrollene
over, committer låsefilen og pusher branchen til `origin`. Deretter oppretter
det en PR mot `main` med endringsoversikten fra nav-pilot. Commitmeldingen
inneholder kort base-SHA i tittelen og full SHA i brødteksten. Ingen ny base
betyr ingen branch, commit eller PR.

Ved feil beholdes filer og eventuell branch for manuell oppfølging. Skriptet
overskriver ikke en eksisterende branch og bruker ikke force-push. Hvis push
lykkes, men PR-oppretting feiler, opprett PR-en manuelt med `gh pr create`.
Gjennomgå PR-en før merge. Se [pakkekontrakten](https://github.com/navikt/copilot/blob/main/docs/README.agentpakke.md).
