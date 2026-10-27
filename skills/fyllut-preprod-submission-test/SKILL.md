---
name: fyllut-preprod-submission-test
description: Send avtalte nologin- og digital-søknader i preprod og kontroller arkivering i Joark. Bruk for ende-til-ende-testing av innsending, Kafka og arkivering med testbrukere.
license: MIT
metadata:
  version: "1.0.0"
---

# Test innsending og arkivering i preprod

Denne testen oppretter søknader og journalposter i preprod. Digitale søknader
kan også opprette brukernotifikasjoner. Kjør aldri mot produksjon.
Ikke send noe før utvikleren har godkjent testplanen nedenfor.

## Kontroller forutsetningene

Stopp hvis noe mangler. Forklar hva utvikleren må ordne, og vent.

- Last `observability-debugging`, deretter `fyllut-observability-debugging`
  og `nav-auth`. Alle tre må være tilgjengelige.
- Maskinen må ha tilkoblet naisdevice, Bash, curl, jq og Python 3.
  Java, Maven og Docker trengs ikke for kall mot preprod.
- `NAV_PILOT_SKILLS_DIR` må være satt. Ellers må utvikleren starte klienten
  gjennom nav-pilot. Kontroller at `observability-debugging/obs-query.sh`
  og denne skillens `assets/` finnes under variabelens sti.
- Kontroller lesetilgang til tokenfilen og testfilene. Test HTTPS-tilgang til
  `https://innsending-api-gcp.intern.dev.nav.no/v3/api-docs` og lesetilgang til
  Loki og Tempo gjennom `obs-query.sh`. Bruk dev-miljøet, aldri prod.
  Nettverksavslag må løses av utvikleren, ikke omgås av agenten.
- Finn skjemadefinisjoner i arbeidsområdet, uavhengig av gjeldende repo.
  Les lokale repo-instruksjoner. Hvis `skjemautfylling-formio` mangler, bruk
  `forms/` i [navikt/skjemautfylling-formio](https://github.com/navikt/skjemautfylling-formio)
  gjennom tilgjengelig GitHub-verktøy eller autentisert `gh`.
  Utvikleren kan også oppgi metadata. Stopp hvis metadata ikke kan avklares.

## Avtal testplanen

Bruk klientens spørreverktøy, eller still spørsmål i samtalen og vent.
Be bare om det som ikke allerede er oppgitt. Bekreft samlet plan før første kall.

| Opplysning | Avklaring |
| --- | --- |
| Formål | Hva skal testen bekrefte, og eventuell issue-lenke? |
| Omfang | Antall nologin og digital, totalt antall og fordeling på testbrukere. Første søknad teller med. |
| Skjema | Oppgitte skjemanummer eller lov til å velge. Er gjentatt innsending på samme skjemanummer tillatt, eller kreves ulike? |
| Metadata | Skjemanummer, tittel, tema og vedleggskoder fra definisjonene eller utvikleren. Oppgi kilde og revisjon når tilgjengelig. Ikke gjett koder. |
| Filer | Hoveddokument, antall vedlegg, filer og størrelser. Standardforslag er medfølgende PDF som hoveddokument og to små vedlegg. |
| Variant | Kontroller live-kontrakten. Hvis `mainDocumentAlt` kreves, be om lov til å sende `{}`. Noen skjema krever reelle variantdata, velg da annet skjema eller avklar data. |
| Stoppgrense | Foreslå fem minutters ventetid på første arkivering. Avtal eventuell annen grense. |

Medfølgende `assets/test-document.pdf` og `assets/test-attachment.txt` inneholder
kun syntetisk tekst. Finn dem under
`$NAV_PILOT_SKILLS_DIR/fyllut-preprod-submission-test/assets`, ikke relativt til
gjeldende repo. PDF-en kan gjenbrukes som vedlegg hvis avtalt. Andre eller større
filer krever oppgitt filsti, lesetilgang og avklart innhold uten persondata.

## Motta tokens og testbrukere

Gi utvikleren en absolutt filsti i klientens godkjente tmp-mappe, utenfor repoet.
Be om JSON-formatet nedenfor og filrettigheter `0600`. Ikke be om tokens eller
fødselsnummer i chatten. Utelat søknadstyper som ikke inngår i testen.

```json
{
  "innlogget": [
    { "testFnr": "<test-fnr>", "tokenxToken": "<token>" }
  ],
  "nologin": {
    "m2mToken": "<token>",
    "testFnr": ["<test-fnr-1>", "<test-fnr-2>"]
  }
}
```

- Skaff [TokenX-token](https://tokenx-token-generator.intern.dev.nav.no/api/obo?aud=dev-gcp:team-soknad:innsending-api)
  for hver innlogget testbruker.
- Skaff [M2M-token](https://azure-token-generator.intern.dev.nav.no/api/m2m?aud=dev-gcp:team-soknad:innsending-api)
  for nologin. Samme token kan brukes for flere test-fnr.
- Kontroller lokalt at tokens rekker testen, har forventet audience, og at
  TokenX-identiteten samsvarer med test-fnr. M2M krever `nologin-access` og
  en tillatt klient. Azure-audience er en klient-ID, ikke TokenX-audience.
  Bekreft at identitetene er syntetiske testbrukere, for eksempel fra Dolly.
  Dekoding alene verifiserer ikke tokenets signatur.
  La API-et håndheve autentisering. Stopp ved auth-feil.
- Les verdiene direkte fra fil i prosessen. Ikke legg dem i kommandolinjeargumenter,
  shell-historikk, logger, rapporter eller commits. Ikke vis rå API-svar.
  Ved curl, les auth-header fra stdin eller en `0600`-fil. Ikke bruk `-v` eller `--trace`.

## Send og kontroller

1. Les live OpenAPI og nødvendige implementasjonsdetaljer fra lokalt
   `innsending-api` eller `navikt/innsending-api` på GitHub. Stopp ved uklar kontrakt.
   Før hvert skrivende kall, krev HTTPS og nøyaktig host
   `innsending-api-gcp.intern.dev.nav.no`. Ikke følg redirects med auth-header.
   Ikke endre kode eller konfigurasjon.
2. Opprett en lokal kjørelogg med `0600` uten tokens eller fnr. Registrer type,
   skjema, innsendings-ID, tidspunkt og steg før og etter hvert skrivende kall.
   Bruk klientgenerert UUID for nologin. For digital, opprett først via
   `/fyllUt/v1/soknad` og bruk ID-en API-et returnerer, ikke ID-en du foreslo.
   Bruk bare `force=true` hvis gjentakelser er godkjent.
3. Last opp avtalte vedlegg via `/v1/application-{type}/{id}/attachments/{kode}`,
   der type er `nologin` eller `digital`. Ta vare på returnerte fil-ID-er.
   Send søknaden til `/v1/application-{type}/{id}` med riktige metadata,
   opplastede fil-ID-er og avtalte hoveddokumenter. Godta kontraktens
   suksessrespons, ikke anta at den alltid er `201`.
4. Send først **én** søknad. Ikke send flere før Loki viser `FINISHED` fra
   `soknadsarkiverer` for samme innsendings-ID, og innsending-api har mottatt
   positiv arkiveringstilbakemelding, normalt `: er arkivert`.
   Korreler også med Tempo eller metrikker etter observability-skillene.
   `Innsendt` eller HTTP-suksess alene bekrefter ikke arkivering i Joark.
5. Stopp ved feil, manglende observability-tilgang eller utløpt ventetid.
   Ved timeout eller tvetydig POST-resultat, kontroller lokal kjørelogg og
   serverdata før noe gjentas. Ikke send samme søknad på nytt automatisk.
   Behold samme ID for samme forsøk. Ny ID er ikke en løsning på timeout.
   Hvis utfallet ikke kan avklares, avslutt forsøket som uavklart.
6. Når første arkivering er bekreftet, send resten sekvensielt innenfor avtalt
   antall. Stopp ved nye feil. Kontroller `FINISHED` og positiv tilbakemelding
   for hver ID. Stopp også resten av kjøringen hvis en senere søknad mangler
   bekreftelse innen stoppgrensen. Ny kjøring krever ny avklaring.

Bruk avgrensede tidsvinduer og dev-labels fra observability-skillene.
Hold rå logger, payloads og korrelasjons-ID-er utenfor delt output.
Søk på innsendings-ID, aldri fnr. Behandle rå loggsvar i minnet.
Lagre og vis kun nødvendige statuser og tidspunkt, ikke ordrette loggtreff.
Ikke slett søknader eller journalposter som opprydding.

## Rapporter resultatet

Oppgi tidsvindu med tidssone, miljø, avtalt og faktisk antall per type,
skjemakilde og filer med størrelser. Ta med første kontroll før videre innsending.
List **hver** søknad, også delvis opprettede og uavklarte forsøk.

| Innsendings-ID | Type og skjema | Innsending i API/mottaker | `FINISHED` | Tilbakemelding til API |
| --- | --- | --- | --- | --- |
| `<id>` | `nologin`, `<nummer>`, `<kort tittel>` | `<HTTP og kort loggfunn med tidspunkt>` | `<tidspunkt eller ikke funnet>` | `<arkivert, feilet eller uavklart>` |

Skill mellom observerte loggfunn og konklusjoner. Ta med avvik og stoppårsak,
og oppgi hvor den lokale kjøreloggen ligger. Ikke inkluder tokens eller fnr.
Påstå ikke at en Kafka-versjon er testet uten bekreftet broker-versjon.
Minn om å slette tokenfilen, men ikke slett den uten avtale.
