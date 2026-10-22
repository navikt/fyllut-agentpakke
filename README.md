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

| Type | Navn | Beskrivelse |
| --- | --- | --- |
| Agent | [`fyllut`](agents/fyllut.agent.md) | Hjelper teamet med utvikling og brukerstøtte i repoet du arbeider i. |
| Skill | [`fyllut-approve-github-stack`](skills/fyllut-approve-github-stack/SKILL.md) | Gjennomgår og godkjenner kvalifiserte PR-er i en GitHub-stack. |
| Skill | [`fyllut-bug-triage-and-fix`](skills/fyllut-bug-triage-and-fix/SKILL.md) | Undersøker en feil, retter den og leverer en testet PR. |
| Skill | [`fyllut-dependency-upgrade`](skills/fyllut-dependency-upgrade/SKILL.md) | Oppgraderer én avhengighet eller en liten gruppe i én PR. |
| Skill | [`fyllut-dependency-upgrade-stack`](skills/fyllut-dependency-upgrade-stack/SKILL.md) | Samler avhengighetsoppgraderinger i en testet PR-stack og erstatter dekkede bot-PR-er. |
| Skill | [`fyllut-follow-up-issue`](skills/fyllut-follow-up-issue/SKILL.md) | Oppretter oppfølgingssaker med opphav og kriterier for `follow-up` og `quick-win`. Krever eksplisitt invokasjon fra et menneske. |
| Skill | [`fyllut-form-text-history`](skills/fyllut-form-text-history/SKILL.md) | Dokumenterer publiserte skjematekster og endringsdatoer i en HTML-rapport. |
| Skill | [`fyllut-playwright-best-practices`](skills/fyllut-playwright-best-practices/SKILL.md) | Gir råd og temainndelte referanser for Playwright-tester. |
| Skill | [`fyllut-pr-review-follow-up`](skills/fyllut-pr-review-follow-up/SKILL.md) | Avklarer reviewkommentarer med deg og gjennomfører avtalte endringer. |
| Skill | [`fyllut-release`](skills/fyllut-release/SKILL.md) | Publiserer en valgt FyllUt-commit etter bekreftelse. |
| Skill | [`fyllut-sendinn-specification`](skills/fyllut-sendinn-specification/SKILL.md) | Lager en funksjonell eller teknisk spesifikasjon ved eksplisitt invokasjon. |
| Skill | [`fyllut-unslop`](skills/fyllut-unslop/SKILL.md) | Fjerner KI-markører og unødvendige formuleringer fra tekst. |

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

Be om en skill ved navn. Spesifikasjonsflyten må startes eksplisitt med
`/fyllut-sendinn-specification` eller en tilsvarende forespørsel.
Et repos egen pakkekilde kan overstyre brukerens standard. Legg til
`--source navikt/fyllut-agentpakke` ved oppstart for å velge teamets pakke.

Start gjennom nav-pilot for å få `NAV_PILOT_SKILLS_DIR` satt for medfølgende
skript. GitHub-arbeidsflytene krever innlogget `gh` og tilgang til målrepoet.
`fyllut-approve-github-stack` krever også extensionen `github/gh-stack`.
Øvrige krav står i hver skill. MCP aktiveres separat med `nav-pilot mcp enable`.

## Opphav og lisenser

De opprinnelige teamskillene ble importert fra
[`navikt/fyllut-sendinn-local-dev-env`](https://github.com/navikt/fyllut-sendinn-local-dev-env/tree/961b0d6ba56d2ce5f72c20f919c99f7fad4342d5/plugins)
ved revisjon `961b0d6ba56d2ce5f72c20f919c99f7fad4342d5`. Dette repoet er nå
distribusjonskilden. Eget innhold har [MIT-lisens](LICENSE).

| Importert skill | Kilde og pinnet revisjon | Lisens |
| --- | --- | --- |
| `fyllut-playwright-best-practices` | [currents-dev/playwright-best-practices-skill, `283d5cbc5d11aac1abda058b16ad22c317d54dc0`](https://github.com/currents-dev/playwright-best-practices-skill/tree/283d5cbc5d11aac1abda058b16ad22c317d54dc0/playwright-best-practices) | [MIT, Currents Software Inc.](skills/fyllut-playwright-best-practices/LICENSE.md) |
| `fyllut-unslop` | [cursor/plugins, `f713f14203cd6420cec13cd7c55c32d598dbab68`](https://github.com/cursor/plugins/tree/f713f14203cd6420cec13cd7c55c32d598dbab68/pstack/skills/unslop) | [MIT fra `pstack/LICENSE`, Lauren Tan](skills/fyllut-unslop/LICENSE) |

Playwright-skillen har lokalt navn, Nav-integrasjonsregler og repoets testkommando.
Avsluttende mellomrom i to referansefiler er fjernet. Unslop beholder lokalt navn.
Hent hele skillmapper ved oppdatering, bevar lisensene og lokale tilpasninger,
og gjennomgå endringene i en PR.

## Vedlikehold

Kjør fra pakkerepoet med verktøyversjonene i `mise.toml`:

```bash
mise run test
nav-pilot validate --source "$PWD"
mise exec -- node --check skills/fyllut-form-text-history/scripts/generate-form-text-history.mjs
bash -n skills/fyllut-release/scripts/list-releasable-fyllut-commits.sh
```

Oppdater Nav-grunnpakken med `nav-pilot pakke bump-base`, og gjennomgå
låsefilendringen i en PR. Se [pakkekontrakten](https://github.com/navikt/copilot/blob/main/docs/README.agentpakke.md).
