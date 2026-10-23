---
name: fyllut-preprod-e2e
description: Test digital innsending, ettersending og løspost med Playwright MCP mot lokale Fyllut-SendInn-apper og ekte preprod-tjenester. Kontroller kvittering og dokumenter, og bruk observability-debugging til å verifisere arkivering og tilbakemelding i etterkant. Bruk for agentstyrte nettlesertester, ikke for å skrive en testsuite.
---

# Test lokal Fyllut mot preprod

Bruk Playwright MCP til nettleserhandlingene og observability-debugging til etterkontrollen. Ikke erstatt MCP med Cypress, en egen nettleserdriver eller direkte innsending via API. Skillen bruker den støttede lokale utviklingsflyten, ikke en lokal proxy av preprod-nettsidene.

## Avtal testøkten

Les relevante `AGENTS.md` og repo-skills. Avklar disse punktene med klientens spørreverktøy. Mangler verktøyet, still ett samlet spørsmål og vent på svar.

- Lokal URL, skjema, språk, backend-tjenester og revisjoner.
- Godkjent syntetisk testperson, og om den har aktive utkast eller ettersendinger.
- Flyter, vedleggsfiler og tillatte midlertidige kataloger.
- Om agenten kan opprette utkast, laste opp og slette egne testfiler og sende inn. Avtal maksimalt antall innsendinger og ventetid for arkivering.
- Hvor agenten skal stoppe for brukerens kontroll, og om dokumentkontroll på Min side inngår.

En godkjent plan kan dekke flere steg, så du trenger ikke spørre før hver avtalt handling. Stopp hvis omfanget endres. At brukeren ber om en skill, gir ikke tillatelse til å sende inn søknader.

## Utvikleren klargjør utenfor sandkassen

Utvikleren gjør dette før agenten starter:

1. Åpne `skjemabygging-formio`, bruk verktøyversjonene i `mise.toml` og installer avhengighetene.
2. Kjør `pnpm get-tokens fyllut` i en vanlig terminal og fullfør tokenhentingen i godkjent nettleser. Ikke lim tokens inn i agentsamtalen.
3. Kontroller backendens lokale konfigurasjon. `MOCKS_ENABLED=false`, `SEND_INN_HOST` peker på avtalt innsending-api i preprod, og `FAMILIE_PDF_GENERATOR_URL` peker på riktig testtjeneste.
4. Kontroller at lokal testidentitet og identiteten bak OBO-tokenet er den samme. Start med `pnpm start:fyllut` og oppgi faktisk URL og port til agenten. Standardadressen er `http://localhost:3001/fyllut`.
5. Sørg for Naisdevice og nettverkstilgang for backend-prosessen. Start agentklienten gjennom nav-pilot, slik at `NAV_PILOT_SKILLS_DIR` er satt og observability-skriptene finnes.

Tokenkommandoen henter et TokenX OBO-token til innsending-api og M2M-tokens til innsending-api og Familie-PDF. Den skriver dem til en ignorert lokal `.env`-fil. Tokenene utløper, og ved fornyelse må utvikleren følge skriptets beskjed om omstart. Agenten skal ikke lese eller vise innholdet i `.env`.

Lokal development-modus simulerer ID-porten-innloggingen. Et ekte OBO-token til backend betyr ikke at nettleserens ID-porten-flyt er testet. `dev-gcp` er clusteret testtjenestene bruker, så kontroller faktisk vert og token-audience i stedet for å tolke clusternavnet som et annet miljø.

`pnpm start:fyllut:mocks` gir ingen bevis på arkivering, fordi PDF- og innsendingstjenestene da peker mot mocks. Løspost og ettersending i SendInn krever at utvikleren starter en egnet lokal app etter den appens oppsett. Fylluts tokenoppsett autentiserer ikke andre apper.

## Kontroller nettlesertilgangen

Finn de tilgjengelige MCP-verktøyene før bruk, og åpne den lokale URL-en med Playwright MCP. Nettleseren kaller lokal Fyllut. Vite videresender `/fyllut/api` til lokal fyllut-backend, som kaller testtjenestene.

- Ved `ERR_CONNECTION_REFUSED`: sjekk at serveren kjører på riktig port og at MCP-nettleseren ser samme localhost som utvikleren.
- Ved `ERR_BLOCKED_BY_CLIENT`: stopp og oppgi hvilken vert og handling som ble blokkert. Ikke bytt verktøy eller proxy for å omgå sperren.
- Direkte lenker til preprod-SendInn, Min side eller ansatt-domenet kan være blokkert eller kreve annen innlogging. Ikke skriv om lenkene og ikke kopier cookies mellom domener. Be om avklaring, og merk kontrollen som blokkert hvis den ikke kan gjennomføres.

Ikke endre cplt-policy, TLS-kontroll, autentisering eller tjenestekonfigurasjon for å få testen gjennom. Bruk aldri produksjon i stedet for preprod.

## Fyll ut og test vedlegg

Bruk ferske snapshots og observerte elementreferanser. Vent på konkrete tilstander, for eksempel ferdig opplasting, ikke et fast antall sekunder. Bruk `fyllut-playwright-best-practices` ved behov.

Behold avtalte, preutfylte testopplysninger og bruk tydelig syntetisk innhold i andre felt. Skriv aldri reelle personopplysninger i testskjemaet. Noter UTC-vindu, flyt og faktisk innsendings-ID privat, slik at oppslagene i etterkant gjelder riktig test.

| Flyt | Kontroller |
|---|---|
| Digital søknad | Utfylling, avtalte prefill-felt, vedlegg og oppsummering. Ekte digital innsending bruker Familie-PDF, men trenger ikke førsteside fra FSS. |
| Vedlegg | Bruk gyldige PDF-, TXT-, JPG- eller DOCX-fixtures med ulike syntetiske markører. Test flere filer på samme vedlegg. Ved avtalt sletting skal markøren fra den slettede filen mangle i det endelige dokumentet. |
| Automatisk ettersending | Velg «last opp senere» på et relevant vedlegg. Etter innsending kontrollerer du at oppgaven og koblingen er riktige. Fortsett bare i en avtalt og tilgjengelig SendInn-flate. |
| Ny ettersending | Kontroller at en ny oppgave faktisk opprettes. Fyllut-ettersending kan åpne en eksisterende aktiv oppgave i stedet, og da testes ikke et nytt SAF-oppslag. Ikke slett gamle oppgaver og ikke gå utenom frontend for å tvinge frem en ny. |
| Løspost | Bruk avtalt lokal inngang. Kontroller hoveddokument, flere filer og eventuell sletting før innsending. |

Avklar hvilke vedlegg som lastes opp og hvilke som sendes senere. Ikke velg «senere» for å slippe et avtalt opplastingstestpunkt. Velg førsteside, statiske PDF-er, store filer og negative tester etter testmålet, og ikke kjør alle variantene automatisk.

Bruk bare godkjente fixturefiler. En filsti i agentens miljø er ikke nødvendigvis lesbar for MCP-serveren. Mangler filopplasting i verktøyene, ber du brukeren utføre steget og registrerer det som manuelt. Ikke endre DOM og ikke mock en vellykket opplasting.

### Stopp før innsending

Send bare inn hvis brukeren har godkjent innsending i testplanen. Kontroller miljø, dokumentliste og oppsummering. Har brukeren bedt om kontroll før innsending, stopp her og vent på uttrykkelig godkjenning. Ikke trykk «Send til Nav» før den kommer.

Etter godkjenning sender du søknaden én gang. Ved timeout eller tapt forbindelse undersøker du status for samme ID før du vurderer nytt forsøk. Ikke klikk på nytt fordi kvitteringen mangler. En kvittering eller HTTP 2xx beviser ikke arkivering.

## Verifiser med observability-debugging

Bruk observability-debugging etter hver innsending. Kjør `obs-query.sh` med `bash` fra `$NAV_PILOT_SKILLS_DIR/observability-debugging/obs-query.sh`. Mangler variabelen, stopp og be brukeren starte klienten gjennom nav-pilot.

Avgrens spørringene til avtalt testmiljø, faktisk innsendings-ID og tidsvinduet rundt testen. I det vanlige oppsettet er Loki- og Mimir-labelen `k8s_cluster_name="dev"`, namespace `team-soknad` og Tempo-miljøet `dev-gcp`. Bekreft verdiene, og søk aldri i produksjon.

Følg innsendingen gjennom hele kjeden:

1. `soknadsmottaker` mottar innsendingen og publiserer metadata.
2. `soknadsarkiverer` henter dokumentfiler, oppretter journalpost og når `ARCHIVED` og `FINISHED`, eller tilsvarende signaler i gjeldende kode.
3. `innsending-api` mottar arkiveringstilbakemeldingen og logger `er arkivert` og `Ferdig behandlet mottatt melding`. Sjekk i gjeldende kode at den siste meldingen kommer etter statusoppdateringen.

Innsending og varselbestillinger går fra innsending-api til soknadsmottaker over REST. Et vellykket varsel beviser ikke at innsending-api har konsumert arkiveringstilbakemeldingen.

Sammenhold minst to observability-kilder, for eksempel logger og et Tempo-trace som viser statusoppdateringen. Bruk metrikker når du trenger feilrate, responstid, Kafka-lag, retries eller ressursbruk. Nye counter-serier kan gi `increase()=0` etter første hendelse, så bruk dem ikke som eksakte testantall. Et observert klient-lag på 0 beviser ikke brokerens committed offset.

Vent innenfor avtalt tidsbudsjett og bruk avgrensede oppslag. Mangler bevis, rapporter siste tilstand og begrensningen. Ikke send flere søknader for å få en grønn test. En opprettet, men ikke innsendt ettersending skal ikke ha arkiveringstilbakemelding.

### SAF og dokumentinnhold

SAF-oppslag før opprettelse kan mangle den nye innsendings-ID-en i loggene. Finn trace-ID fra opprettelseskallet og korreler bakover. HTTP 200 kan inneholde GraphQL-feil, og `onComplete` betyr bare at bodyen er lest. Null data etter en fanget feil beviser ikke tom historikk. Kontroller at testpersonen finnes i riktig SAF- og PDL-miljø.

Skal arkivert dokumentinnhold testes, åpner du dokumentet fra en avtalt arkivflate etter bekreftet arkivering. Kontroller filmarkører, sider, rekkefølge og utfylte PDF-felt. Lokal kvitterings-PDF eller forhåndsvisning fra mellomlager beviser ikke at arkivets dokument er riktig. Mangler tilgang eller PDF-lesing, merk kontrollen som blokkert eller manuelt kontrollert.

## Rapporter og avslutt

Skill mellom tre resultater: nettleseren, arkivering med tilbakemelding, og arkivert dokumentinnhold. Bruk `BESTÅTT`, `FEILET`, `BLOKKERT`, `IKKE KJØRT` eller `MANUELT KONTROLLERT` per kontrollpunkt.

Oppgi miljø, UTC-vindu, revisjonsbevis, filtyper, tidsbruk og gjenstående kontroller. Skill opplastingstid fra konverteringstid og asynkron arkiveringstid. Kall ikke en WARN-melding en funksjonell feil uten støtte i forløpet.

Bruk testaliaser i delte rapporter. Ikke publiser innsendings-ID-er, identiteter, tokens, cookies, dokumentinnhold eller rå logger. Skjermbilder, HAR og lagret nettlesertilstand er sensitive og skal ikke inn i Git eller CI-artefakter. Unngå fullstendige nettverksheaders og bodyer i verktøyutskrifter. Publisering på GitHub og nye issues krever egen bestilling.

Stopp bare prosesser du selv startet. La brukerstartet Fyllut og nettleserøkten stå hvis brukeren skal kontrollere resultatet. Rydd bare egne midlertidige artefakter, etter avtalen. Ikke endre kode, deploy, release eller godkjenn PR-er i testøkten.
