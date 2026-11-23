---
name: fyllut-trello-card
description: Use when the user wants to draft or create a Trello card for the team.
license: MIT
metadata:
  version: "0.1.0"
---

# Trello card

Write a concise Trello card for non-technical team members. Load `klarsprak`
and `fyllut-unslop` before writing the card text.

## Audience and content

- Write in Norwegian Bokmål unless the user asks for English.
- Explain what happens today, what we want to achieve, and the benefit for users
  or the team.
- Use plain language. Omit class names, code lines, file paths, and internal
  implementation jargon.
- End the description with a short, non-technical `Definition of done` (one or
  two sentences).
- Add a `GitHub-issue` link only when a relevant issue exists. Omit the line if
  there is no issue.
- Never include secrets, personal data, or private identifiers.

## Copy-friendly format

Trello mangles rich text copied from rendered chat messages. Always output the
title and description in two separate fenced code blocks so each can be copied
in one click:

1. One fenced `text` block containing only the title, without Markdown or
   backticks.
2. One fenced `markdown` block containing only the description. Use plain
   paragraphs, simple `- ` bullet lists, and bare URLs. Avoid inline code
   backticks, tables, and nested lists.

Example description structure:

```markdown
Kort beskrivelse av problemet eller behovet og hvem det påvirker.

Mål:
- Hva vi ønsker å oppnå.

Gevinst:
Kort forklaring på nytten for brukere eller teamet.

GitHub-issue:
https://github.com/navikt/<repo>/issues/<nummer>

Definition of done:
Én kort, ikke-teknisk setning som beskriver når oppgaven er ferdig.
```

Drop sections that do not fit the task rather than leaving placeholders.

## Publishing

If a Trello MCP tool is available and the user asks to create the card in
Trello, show the draft first and ask for confirmation before publishing. If no
Trello tool is available, output the two copy-ready blocks in the chat.
