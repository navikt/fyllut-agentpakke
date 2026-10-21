---
applyTo: "**"
---

# Git i sandbox

Når sandboxen nekter skriving til `.git/config`, fortsett uten å endre
Git-konfigurasjonen. Ikke forsøk å omgå tilgangsbegrensningen.

- Unngå `--track`, `git push -u` og `git branch --set-upstream-to`.
- Finnes branchen lokalt, bruk `git switch <branch>`.
- Ellers: hent fra origin og bruk
  `git switch --no-track -c <branch> origin/<branch>`.
- Bruk eksplisitte referanser ved merge og push, for eksempel
  `git merge origin/main` og `git push origin HEAD:<branch>`.
- Kontroller faktisk tilstand etter en feil. Branch-bytte kan ha lykkes
  selv om registrering av upstream feilet.
- Hvis oppgaven fortsatt krever en blokkert operasjon, forklar hva som
  gjenstår og be brukeren utføre den utenfor sandboxen.
