import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const usage = `Generate a standalone HTML report of user-visible FyllUt form text history.

Usage:
  node generate-form-text-history.mjs \\
    --form <form-path> \\
    --from <YYYY-MM-DD> \\
    --to <YYYY-MM-DD> \\
    [--repository <path>] \\
    [--output <file>] \\
    [--focus <source text>] \\
    [--ref <git ref>] \\
    [--timezone <IANA timezone>]

Example:
  node generate-form-text-history.mjs \\
    --form nav190105 \\
    --from 2024-01-01 \\
    --to 2024-12-31 \\
    --repository ../skjemautfylling-formio \\
    --output ../../nav190105-teksthistorikk-2024.html \\
    --focus "Vil du søke AFP fra privat sektor?"
`;

const parseArguments = (args) => {
  const options = {};
  const supportedOptions = new Set([
    'focus',
    'form',
    'from',
    'output',
    'ref',
    'repository',
    'timezone',
    'to',
  ]);
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }
    if (!argument.startsWith('--')) {
      throw new Error(`Unknown argument: ${argument}`);
    }
    const name = argument.slice(2);
    if (!supportedOptions.has(name)) {
      throw new Error(`Unknown option: --${name}`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${name}`);
    }
    options[name] = value;
    index += 1;
  }
  return options;
};

const options = parseArguments(process.argv.slice(2));
if (options.help) {
  console.log(usage);
  process.exit(0);
}

for (const required of ['form', 'from', 'to']) {
  if (!options[required]) {
    throw new Error(`Missing required option --${required}\n\n${usage}`);
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
if (!datePattern.test(options.from) || !datePattern.test(options.to)) {
  throw new Error('--from and --to must use YYYY-MM-DD.');
}
const isValidDate = (value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};
if (!isValidDate(options.from) || !isValidDate(options.to)) {
  throw new Error('--from and --to must be valid calendar dates.');
}
if (options.from > options.to) {
  throw new Error('--from must be before or equal to --to.');
}
if (!/^[A-Za-z0-9_/-]+$/.test(options.form) || options.form.includes('..')) {
  throw new Error('--form must be a relative form path without "..".');
}

const formPath = options.form;
const fromDate = options.from;
const toDate = options.to;
const repository = resolve(options.repository ?? 'skjemautfylling-formio');
const output = resolve(
  options.output ?? `${formPath.replaceAll('/', '-')}-teksthistorikk-${fromDate}-til-${toDate}.html`,
);
const focusText = options.focus;
const gitRef = options.ref ?? 'HEAD';
const timeZone = options.timezone ?? 'Europe/Oslo';
const startInstant = `${fromDate}T00:00:00Z`;
const endInstant = `${toDate}T23:59:59Z`;

const trackedPaths = [
  `forms/${formPath}.json`,
  `translations/${formPath}.json`,
  'resources/global-translations-nn-NO.json',
  'resources/global-translations-en.json',
];

const git = (args) =>
  execFileSync('git', ['-C', repository, ...args], {
    encoding: 'utf8',
    maxBuffer: 100 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();

const normalizeRepositoryUrl = (remote) =>
  remote
    .replace(/^git@github\.com:/, 'https://github.com/')
    .replace(/^ssh:\/\/git@github\.com\//, 'https://github.com/')
    .replace(/\.git$/, '');

git(['rev-parse', '--is-inside-work-tree']);

const repositoryUrl = normalizeRepositoryUrl(git(['remote', 'get-url', 'origin']));

const showJson = (revision, path) => {
  try {
    return JSON.parse(git(['show', `${revision}:${path}`]));
  } catch {
    return {};
  }
};

const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const plainText = (value = '') =>
  String(value)
    .replace(
      /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
      '$2 [$1]',
    )
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#039;/gi, "'")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const commitLink = (hash) => `${repositoryUrl}/commit/${hash}`;
const shortHash = (hash) => hash.slice(0, 8);
const formatTimestamp = (timestamp) =>
  new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone,
  }).format(new Date(timestamp));
const formatDate = (date) =>
  new Intl.DateTimeFormat('nb-NO', {
    dateStyle: 'long',
    timeZone,
  }).format(new Date(`${date}T12:00:00Z`));
const calendarYear =
  fromDate.endsWith('-01-01') &&
  toDate.endsWith('-12-31') &&
  fromDate.slice(0, 4) === toDate.slice(0, 4)
    ? fromDate.slice(0, 4)
    : null;
const periodLabel = calendarYear ?? `${formatDate(fromDate)} til ${formatDate(toDate)}`;
const periodSentence = calendarYear
  ? `kalenderåret ${calendarYear}`
  : `perioden ${formatDate(fromDate)} til ${formatDate(toDate)}`;

const flattenGlobalTranslations = (resource, language) => {
  const translations = {};
  for (const group of resource[language] ?? []) {
    for (const [key, entry] of Object.entries(group.translations ?? {})) {
      translations[key] = typeof entry === 'string' ? entry : entry.value;
    }
  }
  return translations;
};

const internalLabelTypes = new Set([
  'alertstripe',
  'column',
  'columns',
  'container',
  'content',
  'htmlelement',
  'navSkjemagruppe',
  'panel',
]);

const fieldNames = {
  title: 'Tittel',
  legend: 'Gruppetittel',
  label: 'Felttekst',
  description: 'Hjelpetekst',
  additionalDescriptionLabel: 'Tittel for utvidet hjelpetekst',
  additionalDescriptionText: 'Utvidet hjelpetekst',
  content: 'Informasjonstekst',
  errorLabel: 'Feiltekst',
  placeholder: 'Plassholder',
  customMessage: 'Valideringsmelding',
  'sender:nationalIdentityNumber': 'Felttekst i sender-komponent',
  'sender:firstName': 'Felttekst i sender-komponent',
  'sender:surname': 'Felttekst i sender-komponent',
  'sender:organizationNumber': 'Felttekst i sender-komponent',
  'sender:organizationName': 'Felttekst i sender-komponent',
  'description:nationalIdentityNumber': 'Hjelpetekst i sender-komponent',
  'description:organizationNumber': 'Hjelpetekst i sender-komponent',
  'identity:question': 'Felttekst i identitetskomponent',
  'navAddress:livesInNorway': 'Felttekst i adressekomponent',
};

const describeField = (field) => {
  if (field.startsWith('option-description:')) return 'Forklaring til svaralternativ';
  if (field.startsWith('option:')) return 'Svaralternativ';
  return fieldNames[field] ?? field;
};

const languageDefinitions = {
  nb: { name: 'Bokmål', publishedLanguageCodes: ['nb', 'nb-NO'] },
  nn: { name: 'Nynorsk', publishedLanguageCodes: ['nn', 'nn-NO'] },
  en: { name: 'Engelsk', publishedLanguageCodes: ['en', 'en-US'] },
};

const getPublishedLanguages = (form) =>
  Object.entries(languageDefinitions)
    .filter(
      ([, definition]) =>
        definition.publishedLanguageCodes.some((language) =>
          form.publishedLanguages?.includes(language),
        ),
    )
    .map(([language]) => language);

const submissionMethodByType = {
  PAPER: 'paper',
  DIGITAL: 'digital',
  DIGITAL_NO_LOGIN: 'digitalnologin',
  STATIC_PDF: 'staticpdf',
  PAPER_NO_COVER_PAGE: 'papernocoverpage',
};

const extractVisibleText = (form) => {
  const items = new Map();
  const identityCounts = new Map();
  const submissionTypes = form.properties?.submissionTypes;
  const submissionMethods = submissionTypes
    ? [
        ...new Set(
          submissionTypes.map((type) => {
            const normalizedType = String(type).toUpperCase();
            const method = submissionMethodByType[normalizedType];
            if (!method) throw new Error(`Unsupported submission type: ${type}`);
            return method;
          }),
        ),
      ]
    : ['paper'];
  const formSubmissionMethods = submissionMethods.filter((method) => method !== 'staticpdf');
  const put = (identity, field, source, metadata) => {
    if (typeof source !== 'string' || !source.trim()) return;
    items.set(`${identity}|${field}`, {
      identity,
      field,
      source,
      ...metadata,
    });
  };
  const getIdentity = (component) => {
    if (component.navId) return `navId:${component.navId}`;

    const componentType = component.type || 'component';
    const stableKey = component.key || component.type || component.id || 'component';
    const baseIdentity = `fallback:${componentType}:${stableKey}`;
    const occurrence = identityCounts.get(baseIdentity) ?? 0;
    identityCounts.set(baseIdentity, occurrence + 1);
    return occurrence ? `${baseIdentity}#${occurrence + 1}` : baseIdentity;
  };
  const withCondition = (metadata, when, equals) => ({
    ...metadata,
    conditional: true,
    conditions: [...metadata.conditions, { when, equals }],
  });
  const forSubmissionMethods = (metadata, methods) =>
    methods.length < submissionMethods.length
      ? withCondition(metadata, 'submissionMethod', methods.join(' eller '))
      : metadata;
  const extractConfiguredComponentText = (component, identity, metadata) => {
    if (formSubmissionMethods.length === 0) return;

    if (component.type === 'sender') {
      const role = component.senderRole ?? 'person';
      const labels = component.customLabels ?? {};
      const descriptions = component.descriptions ?? {};
      const senderMetadata = forSubmissionMethods(metadata, formSubmissionMethods);
      if (role === 'organization') {
        put(identity, 'sender:organizationNumber', labels.organizationNumber, senderMetadata);
        put(identity, 'sender:organizationName', labels.organizationName, senderMetadata);
        put(
          identity,
          'description:organizationNumber',
          descriptions.organizationNumber,
          senderMetadata,
        );
      } else {
        put(
          identity,
          'sender:nationalIdentityNumber',
          labels.nationalIdentityNumber,
          senderMetadata,
        );
        put(identity, 'sender:firstName', labels.firstName, senderMetadata);
        put(identity, 'sender:surname', labels.surname, senderMetadata);
        put(
          identity,
          'description:nationalIdentityNumber',
          descriptions.nationalIdentityNumber,
          senderMetadata,
        );
      }
    }

    if (component.type === 'identity') {
      const interactiveMethods = component.prefillKey
        ? formSubmissionMethods.filter((method) => method !== 'digital')
        : formSubmissionMethods;
      if (interactiveMethods.length === 0) return;

      put(
        identity,
        'identity:question',
        component.customLabels?.doYouHaveIdentityNumber,
        forSubmissionMethods(metadata, interactiveMethods),
      );
    }

    if (component.type === 'navAddress') {
      const showsAddressTypeChoice = component.prefillKey
        ? formSubmissionMethods.filter(
            (method) => method === 'paper' || method === 'digitalnologin',
          )
        : component.addressTypeWizard === 'user'
          ? formSubmissionMethods
          : [];
      if (showsAddressTypeChoice.length === 0) return;

      put(
        identity,
        'navAddress:livesInNorway',
        component.customLabels?.livesInNorway,
        forSubmissionMethods(metadata, showsAddressTypeChoice),
      );
    }
  };

  put('form', 'title', form.title, {
    section: 'Skjema',
    componentKey: 'form',
    componentType: 'form',
    conditional: false,
  });

  const visit = (
    component,
    section,
    parentConditions,
    parentCustomConditions,
    parentIsConditional,
  ) => {
    if (!component || typeof component !== 'object') return;

    const identity = getIdentity(component);
    const currentSection =
      component.type === 'panel' && component.title ? component.title : section || 'Annet';
    const ownCondition =
      typeof component.conditional?.show === 'boolean' && component.conditional.when
        ? [{
            when: component.conditional.when,
            equals: component.conditional.eq,
            operator: component.conditional.show ? '=' : '≠',
          }]
        : [];
    const ownCustomConditions =
      typeof component.customConditional === 'string' && component.customConditional.trim()
        ? [component.customConditional.trim()]
        : [];
    const conditions = [...parentConditions, ...ownCondition];
    const customConditions = [...parentCustomConditions, ...ownCustomConditions];
    const conditional =
      parentIsConditional ||
      conditions.length > 0 ||
      customConditions.length > 0 ||
      component.hidden === true ||
      Boolean(component.customConditional);
    const metadata = {
      section: currentSection,
      componentKey: component.key || '',
      componentType: component.type || '',
      componentNavId: component.navId || '',
      conditional,
      conditions,
      customConditions,
    };

    if (component.type === 'panel') {
      put(identity, 'title', component.title, metadata);
    } else if (component.type === 'navSkjemagruppe') {
      put(identity, 'legend', component.legend, metadata);
    } else if (!internalLabelTypes.has(component.type) && !component.hideLabel) {
      put(identity, 'label', component.label, metadata);
    }

    for (const field of [
      'description',
      'additionalDescriptionLabel',
      'additionalDescriptionText',
      'content',
      'errorLabel',
      'placeholder',
    ]) {
      put(identity, field, component[field], metadata);
    }

    put(identity, 'customMessage', component.validate?.customMessage, metadata);
    extractConfiguredComponentText(component, identity, metadata);

    const options = Array.isArray(component.values) ? component.values : [];
    for (const [index, option] of options.entries()) {
      const optionId = option.value ?? index;
      put(identity, `option:${optionId}`, option.label, metadata);
      put(identity, `option-description:${optionId}`, option.description, metadata);
    }

    for (const child of Array.isArray(component.components) ? component.components : []) {
      visit(child, currentSection, conditions, customConditions, conditional);
    }
    for (const child of Array.isArray(component.columns) ? component.columns : []) {
      visit(child, currentSection, conditions, customConditions, conditional);
    }
    for (const row of Array.isArray(component.rows) ? component.rows : []) {
      for (const child of Array.isArray(row) ? row : []) {
        visit(child, currentSection, conditions, customConditions, conditional);
      }
    }
  };

  for (const component of form.components ?? []) {
    visit(component, '', [], [], false);
  }
  return items;
};

const buildState = (revision) => {
  const form = showJson(revision, trackedPaths[0]);
  const localTranslations = showJson(revision, trackedPaths[1]);
  const globalNynorsk = flattenGlobalTranslations(showJson(revision, trackedPaths[2]), 'nn-NO');
  const globalEnglish = flattenGlobalTranslations(showJson(revision, trackedPaths[3]), 'en');
  const items = extractVisibleText(form);
  const publishedLanguages = getPublishedLanguages(form);

  for (const item of items.values()) {
    item.nb = item.source;
    item.publishedLanguages = publishedLanguages;
    if (publishedLanguages.includes('nn')) {
      item.nn =
        localTranslations['nn-NO']?.[item.source] ??
        globalNynorsk[item.source] ??
        item.source;
      item.nnSource = localTranslations['nn-NO']?.[item.source]
        ? 'skjema'
        : globalNynorsk[item.source]
          ? 'felles'
          : 'bokmål';
    }
    if (publishedLanguages.includes('en')) {
      item.en =
        localTranslations.en?.[item.source] ??
        globalEnglish[item.source] ??
        item.source;
      item.enSource = localTranslations.en?.[item.source]
        ? 'skjema'
        : globalEnglish[item.source]
          ? 'felles'
          : 'bokmål';
    }
  }
  items.publishedLanguages = publishedLanguages;
  return items;
};

const visibilitySignature = (item) =>
  JSON.stringify([
    Boolean(item?.conditional),
    item?.conditions ?? [],
    item?.customConditions ?? [],
  ]);

const sameText = (left, right) =>
  Boolean(left) &&
  Boolean(right) &&
  JSON.stringify(left.publishedLanguages) === JSON.stringify(right.publishedLanguages) &&
  visibilitySignature(left) === visibilitySignature(right) &&
  [...new Set([...left.publishedLanguages, ...right.publishedLanguages])].every(
    (language) => left[language] === right[language],
  );

const alignMovedItems = (previousState, state) => {
  const usesFallbackIdentity = (identity) => identity.startsWith('fallback:');
  const removed = [...previousState].filter(([identity]) => !state.has(identity));
  const added = new Map([...state].filter(([identity]) => !previousState.has(identity)));
  const itemSignature = (item) =>
    JSON.stringify([item.componentType, item.componentKey, item.field]);

  for (const [previousIdentity, previousItem] of removed) {
    const candidates = [...added].filter(
      ([currentIdentity, item]) =>
        (usesFallbackIdentity(previousIdentity) || usesFallbackIdentity(currentIdentity)) &&
        itemSignature(item) === itemSignature(previousItem),
    );
    const matchingText = candidates.filter(([, item]) => sameText(previousItem, item));
    const match =
      matchingText.length === 1
        ? matchingText[0]
        : candidates.length === 1
          ? candidates[0]
          : undefined;
    if (!match) continue;

    const [currentIdentity, currentItem] = match;
    state.delete(currentIdentity);
    currentItem.identity = previousItem.identity;
    state.set(previousIdentity, currentItem);
    added.delete(currentIdentity);
  }
};

const baselineRevision = git([
  'rev-list',
  '-1',
  `--before=${startInstant}`,
  gitRef,
]);

if (!baselineRevision) {
  throw new Error(`No repository revision exists before ${fromDate}.`);
}

const rawCandidateCommits = git([
  'log',
  '--reverse',
  `--since=${startInstant}`,
  `--until=${endInstant}`,
  '--format=%H',
  gitRef,
  '--',
  ...trackedPaths,
])
  .split('\n')
  .filter(Boolean);

const commitMetadata = new Map();
const latestFormCommitByPublication = new Map();

for (const revision of rawCandidateCommits) {
  const [timestamp, subject] = git(['show', '-s', '--format=%cI%x00%s', revision]).split('\0');
  const changedPaths = new Set(
    git(['diff-tree', '--no-commit-id', '--name-only', '-r', revision])
      .split('\n')
      .filter(Boolean),
  );
  const isFormSpecific =
    changedPaths.has(trackedPaths[0]) || changedPaths.has(trackedPaths[1]);
  const monorepoReference = subject.match(/monorepo ref: ([0-9a-f]+)/)?.[1];
  const publicationKey = isFormSpecific ? (monorepoReference ?? revision) : undefined;
  const metadata = {
    revision,
    timestamp,
    subject,
    isFormSpecific,
    monorepoReference,
    publicationKey,
  };
  commitMetadata.set(revision, metadata);
  if (publicationKey) latestFormCommitByPublication.set(publicationKey, revision);
}

const formPublicationCommits = new Set(latestFormCommitByPublication.values());
const pairedFormCommits = new Set(
  rawCandidateCommits.filter((revision) => {
    const metadata = commitMetadata.get(revision);
    return (
      metadata.isFormSpecific &&
      latestFormCommitByPublication.get(metadata.publicationKey) !== revision
    );
  }),
);
const candidateCommits = rawCandidateCommits.filter(
  (revision) => !pairedFormCommits.has(revision),
);
const formPublicationCount = formPublicationCommits.size;

const baseline = {
  revision: baselineRevision,
  timestamp: startInstant,
  title: `Gjeldende ved inngangen til ${periodSentence}`,
  kind: 'baseline',
  state: buildState(baselineRevision),
};

const events = [];
let previousState = baseline.state;

for (const revision of candidateCommits) {
  const metadata = commitMetadata.get(revision);
  const { timestamp, subject } = metadata;
  const state = buildState(revision);
  alignMovedItems(previousState, state);
  const changes = [];
  const identities = new Set([...previousState.keys(), ...state.keys()]);

  for (const identity of identities) {
    const before = previousState.get(identity);
    const after = state.get(identity);
    if (!sameText(before, after)) {
      changes.push({ identity, before, after });
    }
  }

  const isFormPublication = formPublicationCommits.has(revision);
  if (changes.length || isFormPublication) {
    events.push({
      revision,
      timestamp,
      subject,
      kind: isFormPublication ? 'form' : 'global',
      changes,
      state,
    });
  }
  previousState = state;
}

const states = [baseline, ...events];
const allIdentities = new Set(states.flatMap(({ state }) => [...state.keys()]));
const histories = [];

for (const identity of allIdentities) {
  const versions = [];
  for (const statePoint of states) {
    const item = statePoint.state.get(identity);
    const last = versions.at(-1);
    if (!item) {
      if (last?.item) versions.push({ event: statePoint, item: null });
    } else if (!last?.item || !sameText(last.item, item)) {
      versions.push({ event: statePoint, item });
    }
  }

  const representative =
    states.at(-1).state.get(identity) ??
    [...versions].reverse().find(({ item }) => item)?.item;
  histories.push({
    identity,
    representative,
    versions,
    changed: versions.length > 1 || !baseline.state.has(identity),
  });
}

histories.sort((left, right) => {
  const sectionComparison = left.representative.section.localeCompare(
    right.representative.section,
    'nb',
  );
  if (sectionComparison) return sectionComparison;
  return left.representative.source.localeCompare(right.representative.source, 'nb');
});

const groupChanges = (changes) => {
  const groups = new Map();
  for (const change of changes) {
    const signature = JSON.stringify([
      change.before && [change.before.nb, change.before.nn, change.before.en],
      change.after && [change.after.nb, change.after.nn, change.after.en],
      visibilitySignature(change.before),
      visibilitySignature(change.after),
    ]);
    const group = groups.get(signature) ?? {
      before: change.before,
      after: change.after,
      contexts: [],
    };
    const item = change.after ?? change.before;
    group.contexts.push(
      `${item.section}: ${describeField(item.field)} (${item.componentKey || item.componentType})`,
    );
    groups.set(signature, group);
  }
  return [...groups.values()];
};

const languageName = Object.fromEntries(
  Object.entries(languageDefinitions).map(([language, { name }]) => [language, name]),
);
const languageAdjective = {
  nn: 'nynorske',
  en: 'engelske',
};
const languagePreposition = {
  nn: 'nynorsk',
  en: 'engelsk',
};

const renderText = (value) =>
  `<span class="text-value">${escapeHtml(plainText(value) || 'Ikke vist')}</span>`;

const renderLanguageValue = (item, language) =>
  item && !item.publishedLanguages.includes(language)
    ? '<span class="text-value">Ikke publisert for dette språket</span>'
    : renderText(item?.[language]);

const describeVisibility = (item) => {
  if (!item) return 'Ikke vist';
  const conditions = item.conditions ?? [];
  const customConditions = item.customConditions ?? [];
  const descriptions = conditions.map(
    ({ when, equals, operator = '=' }) => `${when} ${operator} ${equals}`,
  );
  if (customConditions.length) {
    descriptions.push(
      customConditions.length === 1
        ? 'en egendefinert renderer-betingelse er oppfylt'
        : `${customConditions.length} egendefinerte renderer-betingelser er oppfylt`,
    );
  }
  if (descriptions.length) return `Vises når ${descriptions.join(' og ')}`;
  return item.conditional ? 'Vises betinget' : 'Vises uten registrert betingelse';
};

const renderChangeGroup = (group) => {
  const languages = [
    ...new Set([
      ...(group.before?.publishedLanguages ?? []),
      ...(group.after?.publishedLanguages ?? []),
    ]),
  ].filter((language) => group.before?.[language] !== group.after?.[language]);
  const visibilityChanged =
    visibilitySignature(group.before) !== visibilitySignature(group.after);
  const customConditionChanged =
    JSON.stringify(group.before?.customConditions ?? []) !==
    JSON.stringify(group.after?.customConditions ?? []);
  return `
    <div class="change-group">
      <p class="context">${escapeHtml(group.contexts.join(' · '))}</p>
      ${
        visibilityChanged
          ? `<div class="language-change">
              <h4>Visningsbetingelse</h4>
              <div class="before-after">
                <div><span class="change-label removed">Før</span>${renderText(describeVisibility(group.before))}</div>
                <div><span class="change-label added">Etter</span>${renderText(describeVisibility(group.after))}</div>
              </div>
              ${
                customConditionChanged
                  ? '<p class="context">Den egendefinerte renderer-betingelsen ble endret. Selve uttrykket vises ikke i rapporten.</p>'
                  : ''
              }
            </div>`
          : ''
      }
      ${languages
        .map((language) => {
          const sourceField = language === 'nn' ? 'nnSource' : language === 'en' ? 'enSource' : null;
          const beforeSource = sourceField ? group.before?.[sourceField] : undefined;
          const afterSource = sourceField ? group.after?.[sourceField] : undefined;
          const activeSourceText = plainText(group.after?.source ?? group.before?.source);
          let sourceNote = '';
          if (afterSource === 'bokmål' && beforeSource && beforeSource !== 'bokmål') {
            sourceNote = `Den ${languageAdjective[language]} oversettelsesnøkkelen for «${activeSourceText}» manglet etter denne hendelsen. FyllUt viste derfor bokmålsteksten som fallback. Den ${languageAdjective[language]} ressursen inneholdt ikke norsk tekst.`;
          } else if (beforeSource === 'bokmål' && afterSource && afterSource !== 'bokmål') {
            sourceNote = `FyllUt fant igjen en oversettelse på ${languagePreposition[language]} for den aktive bokmålsnøkkelen, og sluttet derfor å vise bokmål som fallback.`;
          } else if (beforeSource === 'skjema' && afterSource === 'felles') {
            sourceNote = `Den skjemaspesifikke oversettelsen på ${languagePreposition[language]} ble fjernet i denne hendelsen. FyllUt brukte deretter den allerede eksisterende felles oversettelsen. Derfor står teksten i «Etter» ikke som en ny verdi i denne committen.`;
          } else if (beforeSource === 'felles' && afterSource === 'skjema') {
            sourceNote = `En skjemaspesifikk oversettelse på ${languagePreposition[language]} ble lagt til og overstyrte den felles oversettelsen.`;
          }
          return `
            <div class="language-change">
              <h4>${languageName[language]}</h4>
              <div class="before-after">
                <div><span class="change-label removed">Før</span>${renderLanguageValue(group.before, language)}</div>
                <div><span class="change-label added">Etter</span>${renderLanguageValue(group.after, language)}</div>
              </div>
              ${sourceNote ? `<p class="fallback-note">${escapeHtml(sourceNote)}</p>` : ''}
            </div>`;
        })
        .join('')}
      ${
        group.contexts.length > 1
          ? `<p class="usage-count">Samme tekst forekom ${group.contexts.length} steder i skjemaet.</p>`
          : ''
      }
    </div>`;
};

const eventTypeLabel = (event) =>
  event.kind === 'form' ? 'Skjemapublisering' : 'Felles oversettelse';

const timelineHtml = events
  .map((event) => {
    const groups = groupChanges(event.changes);
    const monorepoReference = event.subject.match(/monorepo ref: ([0-9a-f]+)/)?.[1];
    return `
      <article class="timeline-event ${event.changes.length ? '' : 'no-text-change'}">
        <div class="timeline-marker" aria-hidden="true"></div>
        <div class="timeline-heading">
          <div>
            <p class="eyebrow">${eventTypeLabel(event)}</p>
            <h3>${escapeHtml(formatTimestamp(event.timestamp))}</h3>
          </div>
          <span class="badge ${event.changes.length ? 'changed' : 'unchanged'}">
            ${event.changes.length ? `${groups.length} synlig endring${groups.length === 1 ? '' : 'er'}` : 'Ingen synlig endring'}
          </span>
        </div>
        ${
          event.changes.length
            ? groups.map(renderChangeGroup).join('')
            : `<p>Publiseringen inneholdt tekniske eller administrative endringer, men ingen av tekstene i rapporten ble endret.</p>`
        }
        <p class="commit">
          <a href="${commitLink(event.revision)}" target="_blank" rel="noopener noreferrer">${shortHash(event.revision)}</a>
          ${monorepoReference ? ` · monorepo <code>${shortHash(monorepoReference)}</code>` : ''}
        </p>
      </article>`;
  })
  .join('');

const renderVersion = ({ event, item }, index, versions) => {
  if (!item) {
    return `<div class="version"><p class="version-date">Fra ${escapeHtml(formatTimestamp(event.timestamp))}</p><p>Teksten ble fjernet.</p></div>`;
  }
  const next = versions[index + 1]?.event;
  const period =
    event.kind === 'baseline'
      ? `${formatDate(fromDate)} til ${next ? formatTimestamp(next.timestamp) : formatDate(toDate)}`
      : `${formatTimestamp(event.timestamp)}${next ? ` til ${formatTimestamp(next.timestamp)}` : ` til ${formatDate(toDate)}`}`;
  const conditionDescription = item.conditional ? `${describeVisibility(item)}.` : '';
  return `
    <div class="version">
      <p class="version-date">${escapeHtml(period)}</p>
      ${conditionDescription ? `<p class="context">${escapeHtml(conditionDescription)}</p>` : ''}
      <dl class="language-grid">
        ${item.publishedLanguages
          .map(
            (language) => `
              <div class="lang lang-${language}">
                <dt>${languageName[language]}${
                  language === 'nb'
                    ? ''
                    : ` <small>${
                        item[`${language}Source`] === 'bokmål'
                          ? 'viste bokmål'
                          : item[`${language}Source`] === 'felles'
                            ? 'felles oversettelse'
                            : 'skjemaoversettelse'
                      }</small>`
                }</dt>
                <dd>${renderText(item[language])}</dd>
              </div>`,
          )
          .join('')}
      </dl>
    </div>`;
};

const inventoryHtml = histories
  .map(({ identity, representative, versions, changed }) => {
    const searchableText = [
      representative.section,
      representative.componentKey,
      ...versions.flatMap(({ item }) =>
        item ? item.publishedLanguages.map((language) => item[language]) : [],
      ),
    ].join(' ');
    return `
      <article
        class="text-card"
        data-changed="${changed}"
        data-section="${escapeHtml(representative.section)}"
        data-search="${escapeHtml(plainText(searchableText).toLocaleLowerCase('nb-NO'))}"
      >
        <header>
          <div>
            <p class="eyebrow">${escapeHtml(representative.section)} · ${escapeHtml(describeField(representative.field))}</p>
            <h3>${escapeHtml(plainText(representative.source).slice(0, 140))}${plainText(representative.source).length > 140 ? '…' : ''}</h3>
          </div>
          <div class="badges">
            ${changed ? `<span class="badge changed">Endret i ${escapeHtml(periodLabel)}</span>` : `<span class="badge unchanged">Uendret i ${escapeHtml(periodLabel)}</span>`}
            ${representative.conditional ? '<span class="badge conditional">Betinget</span>' : ''}
          </div>
        </header>
        <p class="technical-reference"><code>${escapeHtml(representative.componentKey || identity)}</code>${
          representative.componentNavId
            ? ` · stabil komponent-ID <code>${escapeHtml(representative.componentNavId)}</code>`
            : ''
        }</p>
        ${versions.map(renderVersion).join('')}
      </article>`;
  })
  .join('');

const sections = [...new Set(histories.map(({ representative }) => representative.section))].sort(
  (left, right) => left.localeCompare(right, 'nb'),
);
const changedItems = histories.filter(({ changed }) => changed).length;
const visibleEvents = events.filter(({ changes }) => changes.length);
const languageStates = states.filter(
  ({ state }, index) =>
    index === 0 ||
    JSON.stringify(state.publishedLanguages) !==
      JSON.stringify(states[index - 1].state.publishedLanguages),
);
const publishedLanguageNames = (languages) => languages.map((language) => languageName[language]).join(' og ');
const languageStatusHtml = languageStates
  .map(({ timestamp, kind, state }, index) => {
    const date = index === 0 ? formatDate(fromDate) : formatTimestamp(timestamp);
    const status = index === 0 ? 'Ved periodens start' : kind === 'form' ? 'Etter skjemapubliseringen' : 'Etter oversettelsesendringen';
    return `<li><strong>${escapeHtml(status)}</strong>, ${escapeHtml(date)}: ${escapeHtml(publishedLanguageNames(state.publishedLanguages))}.</li>`;
  })
  .join('');
const languageChangeSummary =
  languageStates.length === 1
    ? `Publiseringsspråkene endret seg ikke i ${periodSentence}.`
    : `Publiseringsspråkene endret seg ${languageStates.length - 1} ${languageStates.length === 2 ? 'gang' : 'ganger'} i ${periodSentence}.`;
const summaryCategory = (item) => {
  if (item.componentType === 'alertstripe') return 'varseltekster';
  if (item.field.startsWith('sender:') || item.field.startsWith('identity:')) {
    return 'felttekster';
  }
  if (item.field.startsWith('description:')) {
    return 'hjelpetekster';
  }
  return {
    title: 'titler',
    legend: 'gruppetitler',
    label: 'felttekster',
    description: 'hjelpetekster',
    additionalDescriptionLabel: 'titler for utvidet hjelpetekst',
    additionalDescriptionText: 'utvidede hjelpetekster',
    content: 'informasjonstekster',
    errorLabel: 'feiltekster',
    placeholder: 'plassholdertekster',
    customMessage: 'valideringsmeldinger',
  }[item.field] ?? 'tekster';
};
const formatSummaryCategories = (categories) => {
  const values = [...categories].sort((left, right) => left.localeCompare(right, 'nb'));
  if (values.length < 2) return values[0];
  return `${values.slice(0, -1).join(', ')} og ${values.at(-1)}`;
};
const contentChangeCategories = visibleEvents.flatMap(({ changes }) => changes).reduce(
  (categories, { before, after }) => {
    const item = after ?? before;
    if (!after) categories.removed.add(summaryCategory(before));
    else if (!before) categories.added.add(summaryCategory(after));
    else if (before.nb !== after.nb) categories.replaced.add(summaryCategory(item));
    else {
      const translated = [...new Set([...before.publishedLanguages, ...after.publishedLanguages])]
        .some((language) => before[language] !== after[language]);
      if (translated) categories.translated.add(summaryCategory(item));
      if (visibilitySignature(before) !== visibilitySignature(after)) {
        categories.visibility.add(summaryCategory(item));
      }
    }
    return categories;
  },
  {
    added: new Set(),
    removed: new Set(),
    replaced: new Set(),
    translated: new Set(),
    visibility: new Set(),
  },
);
const categoryChangeSummary = [
  contentChangeCategories.replaced.size
    ? `Endringene omfatter oppdaterte ${formatSummaryCategories(contentChangeCategories.replaced)}.`
    : '',
  contentChangeCategories.added.size
    ? `Det ble lagt til ${formatSummaryCategories(contentChangeCategories.added)}.`
    : '',
  contentChangeCategories.removed.size
    ? `Det ble fjernet ${formatSummaryCategories(contentChangeCategories.removed)}.`
    : '',
  contentChangeCategories.translated.size
    ? `Oversettelsene ble oppdatert for ${formatSummaryCategories(contentChangeCategories.translated)}.`
    : '',
  contentChangeCategories.visibility.size
    ? `Visningsbetingelsene ble oppdatert for ${formatSummaryCategories(contentChangeCategories.visibility)}.`
    : '',
  languageStates.length > 1
    ? `Skjemaet ble også publisert med språkene ${publishedLanguageNames(
        languageStates.at(-1).state.publishedLanguages,
      )} fra ${formatTimestamp(languageStates.at(-1).timestamp)}.`
    : '',
]
  .filter(Boolean)
  .join(' ');
const contentChangeSummaryHtml = categoryChangeSummary
  ? `<p>${escapeHtml(categoryChangeSummary)}</p>`
  : '<p>Ingen tekster i skjemadefinisjonen ble lagt til, fjernet eller endret i perioden.</p>';
if (!histories.length) {
  throw new Error(
    `The form ${formPath} had no user-visible text between ${fromDate} and ${toDate}.`,
  );
}
const endRevision =
  git(['rev-list', '-1', `--before=${endInstant}`, gitRef]) || candidateCommits.at(-1) || baselineRevision;
const metadataRevision =
  [endRevision, ...[...candidateCommits].reverse(), baselineRevision].find((revision) => {
    const form = showJson(revision, trackedPaths[0]);
    return form.title || form.name || form.path;
  }) ?? endRevision;
const formMetadata = showJson(metadataRevision, trackedPaths[0]);
const formTitle = formMetadata.title || formMetadata.name || formPath;
const formNumber = formMetadata.skjemanummer || formMetadata.properties?.skjemanummer || formPath;
const generatedDate = new Intl.DateTimeFormat('nb-NO', {
  dateStyle: 'long',
  timeZone,
}).format(new Date());

const focusHistory = focusText
  ? histories.find(({ versions }) =>
      versions.some(({ item }) => item && plainText(item.source) === plainText(focusText)),
    ) ??
    histories.find(({ versions }) =>
      versions.some(({ item }) =>
        item && plainText(item.source).toLocaleLowerCase('nb-NO').includes(
          plainText(focusText).toLocaleLowerCase('nb-NO'),
        ),
      ),
    )
  : undefined;

if (focusText && !focusHistory) {
  throw new Error(`Could not find focus text in the form history: ${focusText}`);
}

const focus = focusHistory?.representative;
const focusLabel = 'Fokusteksten';
const focusDependentHistories = focus
  ? histories.filter(({ identity, versions }) =>
      identity !== focusHistory.identity &&
      versions.some(({ item }) =>
        item?.conditions?.some(({ when }) => when === focus.componentKey) ||
        item?.customConditions?.some((condition) => condition.includes(focus.componentKey)),
      ),
    )
  : [];
const focusDependentHtml = focusDependentHistories.length
  ? `
      <div class="focus-dependent">
        <h3>Varsel og annen tekst som utløses av svaret</h3>
        <p class="section-intro">Her vises tekst som kommer fram etter et bestemt svar på fokusspørsmålet.</p>
        ${focusDependentHistories
          .map(({ representative, versions, changed }) => {
            const answers = [
              ...new Set(
                versions.flatMap(({ item }) =>
                  (item?.conditions ?? [])
                    .filter(({ when }) => when === focus.componentKey)
                    .map(({ equals }) => equals),
                ),
              ),
            ];
            const answerLabel = answers
              .map((answer) => answer === 'ja' ? 'Ja' : answer)
              .join(', ');
            const textType =
              representative.componentType === 'alertstripe'
                ? 'Varselstekst'
                : describeField(representative.field);
            return `
              <article class="dependent-text">
                <div class="timeline-heading">
                  <div>
                    <p class="eyebrow">${escapeHtml(textType)}</p>
                    <h4>Vises når svaret er «${escapeHtml(answerLabel)}»</h4>
                  </div>
                  <span class="badge ${changed ? 'changed' : 'unchanged'}">
                    ${changed ? `Endret i ${escapeHtml(periodLabel)}` : `Uendret i ${escapeHtml(periodLabel)}`}
                  </span>
                </div>
                ${versions.map(renderVersion).join('')}
              </article>`;
          })
          .join('')}
      </div>`
  : '';
const focusNavigation = focus
  ? `<a href="#konklusjon">${escapeHtml(focusLabel)}</a>`
  : '';
const focusSection = focus
  ? `
    <section id="konklusjon">
      <h2>${escapeHtml(focusLabel)} ${focusHistory.changed ? `ble endret i ${periodLabel}` : `ble ikke endret i ${periodLabel}`}</h2>
      <p class="section-intro">${
        focusHistory.changed
          ? `Git-historikken viser at denne teksten fikk ny ordlyd i ${periodSentence}. De konkrete versjonene og tidspunktene står i tidslinjen og tekstoversikten.`
          : `Den samme teksten var publisert gjennom hele ${periodSentence}, også etter eventuelle skjemapubliseringer og endringer i felles oversettelser.`
      }</p>
      <div class="finding">
        <div>
          <p class="eyebrow">Komponent <code>${escapeHtml(focus.componentKey || focus.identity)}</code></p>
          <h3>"${escapeHtml(plainText(focus.nb))}"</h3>
          <p>${
            focusHistory.changed
              ? `Teksten hadde ${focusHistory.versions.filter(({ item }) => item).length} dokumenterte versjoner i perioden.`
              : `Teksten var uendret fra ${formatDate(fromDate)} til ${formatDate(toDate)}.`
          }</p>
        </div>
        <dl class="language-grid">
          ${focus.publishedLanguages
            .map(
              (language) =>
                `<div><dt>${languageName[language]}</dt><dd>${renderText(focus[language])}</dd></div>`,
            )
            .join('')}
        </dl>
      </div>
      ${focusDependentHtml}
    </section>`
  : '';
const publicationDates = events
  .filter(({ kind }) => kind === 'form')
  .map(({ timestamp }) => formatDate(timestamp.slice(0, 10)));
const publicationExplanation = formPublicationCount
  ? `${formPublicationCount} ${formPublicationCount === 1 ? 'versjon' : 'versjoner'} av selve skjemaet ble publisert: ${publicationDates.join(', ')}.`
  : `Selve skjemaet ble ikke publisert i ${periodSentence}.`;

const html = `<!doctype html>
<html lang="nb">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Teksthistorikk ${escapeHtml(periodLabel)} · ${escapeHtml(formNumber)}</title>
  <style>
    :root {
      color-scheme: light;
      --nav-deep: #00243a;
      --nav-blue: #0056b4;
      --nav-light: #e6f0ff;
      --ink: #18202a;
      --muted: #52606d;
      --line: #d8dee4;
      --paper: #ffffff;
      --canvas: #f4f6f8;
      --changed: #8b1e1e;
      --changed-bg: #fde8e8;
      --ok: #176b3a;
      --ok-bg: #e6f4ea;
      --conditional: #744b00;
      --conditional-bg: #fff3cd;
      --shadow: 0 10px 28px rgba(0, 36, 58, 0.08);
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      color: var(--ink);
      background: var(--canvas);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }
    a { color: var(--nav-blue); text-underline-offset: 0.16em; }
    code {
      padding: 0.1rem 0.3rem;
      border-radius: 0.25rem;
      background: #eef1f4;
      font-size: 0.88em;
      overflow-wrap: anywhere;
    }
    .skip-link {
      position: fixed;
      top: 0.5rem;
      left: 0.5rem;
      z-index: 100;
      padding: 0.65rem 1rem;
      color: white;
      background: var(--nav-deep);
      transform: translateY(-150%);
    }
    .skip-link:focus { transform: translateY(0); }
    .hero {
      padding: 4.5rem max(1.25rem, calc((100vw - 1180px) / 2)) 3.5rem;
      color: white;
      background:
        radial-gradient(circle at 86% 20%, rgba(102, 203, 255, 0.28), transparent 26rem),
        linear-gradient(135deg, #001b2b, var(--nav-deep));
    }
    .hero .eyebrow { color: #b9dcff; }
    .hero h1 {
      max-width: 920px;
      margin: 0.35rem 0 1rem;
      font-size: clamp(2.2rem, 6vw, 4.8rem);
      letter-spacing: -0.04em;
      line-height: 1.02;
    }
    .form-number { white-space: nowrap; }
    .hero .lead {
      max-width: 780px;
      margin: 0;
      color: #e8f3ff;
      font-size: 1.2rem;
    }
    .eyebrow {
      margin: 0;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 750;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .page-nav {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      gap: 0.25rem;
      overflow-x: auto;
      padding: 0.6rem max(1rem, calc((100vw - 1180px) / 2));
      border-bottom: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.96);
      backdrop-filter: blur(10px);
    }
    .page-nav a {
      flex: 0 0 auto;
      padding: 0.55rem 0.8rem;
      border-radius: 0.4rem;
      color: var(--nav-deep);
      font-weight: 650;
      text-decoration: none;
    }
    .page-nav a:hover, .page-nav a:focus-visible { background: var(--nav-light); }
    main {
      width: min(1180px, calc(100% - 2rem));
      margin: 0 auto;
      padding-top: 50px;
    }
    section { padding: 3.4rem 0 0; scroll-margin-top: 4rem; }
    section > h2 {
      margin: 0 0 0.4rem;
      font-size: clamp(1.65rem, 3vw, 2.45rem);
      letter-spacing: -0.025em;
    }
    .section-intro { max-width: 820px; margin: 0 0 1.5rem; color: var(--muted); }
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
      margin-top: 0;
    }
    .metric {
      position: relative;
      padding: 1.2rem;
      border: 1px solid var(--line);
      border-radius: 0.75rem;
      background: var(--paper);
      box-shadow: var(--shadow);
    }
    .metric:focus-visible { outline: 3px solid #99c7ff; outline-offset: 2px; }
    .metric strong { display: block; color: var(--nav-deep); font-size: 2rem; line-height: 1; }
    .metric span { color: var(--muted); font-size: 0.9rem; }
    .metric-help {
      position: absolute;
      top: calc(100% + 0.55rem);
      left: 0;
      z-index: 30;
      display: none;
      width: min(21rem, calc(100vw - 4rem));
      margin: 0;
      padding: 0.75rem;
      border-radius: 0.45rem;
      color: white;
      background: var(--nav-deep);
      box-shadow: var(--shadow);
      font-size: 0.84rem;
    }
    .metric:hover .metric-help,
    .metric:focus .metric-help,
    .metric:focus-within .metric-help { display: block; }
    .finding {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 1.5rem;
      padding: 1.6rem;
      border: 2px solid var(--nav-blue);
      border-radius: 0.8rem;
      background: var(--paper);
      box-shadow: var(--shadow);
    }
    .finding h3 { margin: 0.25rem 0 0.75rem; font-size: 1.45rem; }
    .finding p { margin: 0; }
    .finding .language-grid { margin: 0; }
    .focus-dependent { margin-top: 1.6rem; }
    .focus-dependent > h3 { margin-bottom: 0.25rem; font-size: 1.35rem; }
    .dependent-text {
      padding: 1.2rem;
      border: 1px solid var(--line);
      border-left: 5px solid var(--conditional);
      border-radius: 0.65rem;
      background: var(--paper);
      box-shadow: var(--shadow);
    }
    .dependent-text h4 { margin: 0.2rem 0 0; font-size: 1.05rem; }
    .language-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
      gap: 0.7rem;
      margin: 0;
    }
    .language-grid > div {
      min-width: 0;
      padding: 0.8rem;
      border: 1px solid var(--line);
      border-radius: 0.55rem;
      background: #fafbfc;
    }
    dt { color: var(--muted); font-size: 0.78rem; font-weight: 750; text-transform: uppercase; }
    dt small { display: block; margin-top: 0.15rem; font-weight: 500; letter-spacing: 0; text-transform: none; }
    dd { margin: 0.35rem 0 0; }
    .text-value { white-space: pre-line; }
    .timeline { position: relative; margin-left: 0.5rem; padding-left: 2rem; }
    .timeline::before {
      position: absolute;
      top: 0.5rem;
      bottom: 0;
      left: 0.45rem;
      width: 2px;
      background: #abc5de;
      content: "";
    }
    .timeline-event {
      position: relative;
      margin-bottom: 1.2rem;
      padding: 1.3rem;
      border: 1px solid var(--line);
      border-radius: 0.75rem;
      background: var(--paper);
    }
    .timeline-marker {
      position: absolute;
      top: 1.4rem;
      left: -2.1rem;
      width: 0.95rem;
      height: 0.95rem;
      border: 3px solid white;
      border-radius: 50%;
      background: var(--nav-blue);
      box-shadow: 0 0 0 2px var(--nav-blue);
    }
    .timeline-event.no-text-change .timeline-marker { background: #6b7280; box-shadow: 0 0 0 2px #6b7280; }
    .timeline-heading, .text-card header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }
    .timeline-heading h3, .text-card h3 { margin: 0.2rem 0 0; }
    .change-group { margin-top: 1.15rem; padding-top: 1.15rem; border-top: 1px solid var(--line); }
    .context, .usage-count, .technical-reference, .commit { color: var(--muted); font-size: 0.88rem; }
    .language-change h4 { margin: 1rem 0 0.45rem; }
    .before-after { display: grid; grid-template-columns: 1fr 1fr; gap: 0.7rem; }
    .before-after > div { padding: 0.75rem; border-radius: 0.5rem; background: #fafbfc; }
    .change-label { display: block; width: max-content; margin-bottom: 0.35rem; font-size: 0.75rem; font-weight: 750; text-transform: uppercase; }
    .change-label.removed { color: var(--changed); }
    .change-label.added { color: var(--ok); }
    .fallback-note {
      margin: 0.7rem 0 0;
      padding: 0.65rem 0.75rem;
      border-left: 4px solid var(--conditional);
      color: #4c3700;
      background: var(--conditional-bg);
      font-size: 0.88rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      width: max-content;
      padding: 0.25rem 0.5rem;
      border-radius: 999px;
      font-size: 0.76rem;
      font-weight: 750;
      white-space: nowrap;
    }
    .badge.changed { color: var(--changed); background: var(--changed-bg); }
    .badge.unchanged { color: var(--ok); background: var(--ok-bg); }
    .badge.conditional { color: var(--conditional); background: var(--conditional-bg); }
    .badges { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 0.35rem; }
    .controls {
      position: sticky;
      top: 3.9rem;
      z-index: 10;
      display: grid;
      grid-template-columns: 2fr repeat(3, 1fr);
      gap: 0.7rem;
      margin-bottom: 1rem;
      padding: 0.9rem;
      border: 1px solid var(--line);
      border-radius: 0.7rem;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: var(--shadow);
      backdrop-filter: blur(10px);
    }
    label { color: var(--muted); font-size: 0.82rem; font-weight: 700; }
    input, select {
      display: block;
      width: 100%;
      min-height: 2.7rem;
      margin-top: 0.25rem;
      padding: 0.55rem 0.65rem;
      border: 1px solid #8796a5;
      border-radius: 0.35rem;
      color: var(--ink);
      background: white;
      font: inherit;
    }
    input:focus, select:focus { outline: 3px solid #99c7ff; outline-offset: 1px; }
    .results-count { margin: 0 0 0.8rem; color: var(--muted); }
    .text-card {
      margin-bottom: 0.8rem;
      padding: 1.15rem;
      border: 1px solid var(--line);
      border-radius: 0.65rem;
      background: var(--paper);
    }
    .text-card[hidden] { display: none; }
    .text-card h3 { max-width: 850px; font-size: 1.05rem; font-weight: 680; }
    .version { margin-top: 0.9rem; padding-top: 0.9rem; border-top: 1px solid var(--line); }
    .version-date { margin: 0 0 0.55rem; color: var(--nav-blue); font-size: 0.82rem; font-weight: 750; }
    .method {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .method > div {
      padding: 1.2rem;
      border: 1px solid var(--line);
      border-radius: 0.65rem;
      background: var(--paper);
    }
    .method h3 { margin-top: 0; }
    .method li { margin-bottom: 0.5rem; }
    footer { margin-top: 4rem; padding: 2rem max(1rem, calc((100vw - 1180px) / 2)); color: #d8e9f7; background: var(--nav-deep); }
    @media (max-width: 800px) {
      .metrics, .language-grid, .finding, .method { grid-template-columns: 1fr; }
      .controls { position: static; grid-template-columns: 1fr; }
      .before-after { grid-template-columns: 1fr; }
      .timeline-heading, .text-card header { flex-direction: column; }
      .badges { justify-content: flex-start; }
    }
    @media print {
      .page-nav, .controls { display: none; }
      body { background: white; font-size: 10pt; }
      .hero { padding: 1.5rem; color: black; background: white; }
      .hero .eyebrow, .hero .lead { color: black; }
      main { width: 100%; }
      section { break-before: page; }
      main { padding-top: 0; }
      .metrics { margin-top: 1rem; }
      .metric-help { position: static; display: block; width: auto; margin-top: 0.5rem; color: black; background: white; box-shadow: none; }
      .metric, .timeline-event, .text-card, .finding { box-shadow: none; break-inside: avoid; }
    }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Hopp til innholdet</a>
  <header class="hero">
    <p class="eyebrow">Dokumentert fra Git-historikken</p>
    <h1>Teksthistorikk for <span class="form-number">${escapeHtml(formNumber)}</span> i ${escapeHtml(periodLabel)}</h1>
    <p class="lead">Brukersynlig tekst som er lagret i skjemadefinisjonen for "${escapeHtml(formTitle)}", på språkene skjemaet faktisk var publisert på. Rapporten skiller mellom skjematekster og felles FyllUt-oversettelser.</p>
  </header>
  <nav class="page-nav" aria-label="Innhold">
    <a href="#oppsummering">Oppsummering</a>
    <a href="#språk">Publiserte språk</a>
    ${focusNavigation}
    <a href="#tidslinje">Tidslinje</a>
    <a href="#alle-tekster">Skjematekster</a>
    <a href="#metode">Metode og kilder</a>
  </nav>
  <main id="main">
    <div class="metrics" aria-label="Nøkkeltall">
      <div class="metric" tabindex="0">
        <strong>${formPublicationCount}</strong><span>skjemapubliseringer i ${escapeHtml(periodLabel)}</span>
        <p class="metric-help">${escapeHtml(publicationExplanation)}</p>
      </div>
      <div class="metric" tabindex="0">
        <strong>${visibleEvents.length}</strong><span>hendelser med synlige endringer</span>
        <p class="metric-help">Et tidspunkt der tekst eller en visningsbetingelse fra skjemadefinisjonen endret seg for brukeren. Dette inkluderer både skjemapubliseringer og endringer i felles oversettelser.</p>
      </div>
      <div class="metric" tabindex="0">
        <strong>${histories.length}</strong><span>tekstplasseringer fra skjemadefinisjonen kartlagt</span>
        <p class="metric-help">Hvert sted en tekst vises, for eksempel en overskrift, et spørsmål, en hjelpetekst eller et svaralternativ. Samme ord kan forekomme flere steder.</p>
      </div>
      <div class="metric" tabindex="0">
        <strong>${changedItems}</strong><span>tekstplasseringer endret i perioden</span>
        <p class="metric-help">Tekstplasseringer der bokmål, nynorsk eller engelsk fikk en annen ordlyd minst én gang i ${periodSentence}.</p>
      </div>
    </div>

    <section id="oppsummering">
      <h2>Endringer i innhold</h2>
      <p class="section-intro">Denne oversikten oppsummerer tekstinnholdet som endret seg i ${escapeHtml(periodSentence)}.</p>
      ${contentChangeSummaryHtml}
    </section>

    <section id="språk">
      <h2>Publiserte språk</h2>
      <p class="section-intro">${escapeHtml(languageChangeSummary)} Bare disse språkene er tatt med i tidslinjen og tekstoversikten.</p>
      <ul>${languageStatusHtml}</ul>
    </section>

    ${focusSection}

    <section id="tidslinje">
      <h2>Når tekstene endret seg</h2>
      <p class="section-intro">Tidslinjen viser endringer som faktisk påvirket tekst i dette skjemaet. Felles oversettelser kunne endre nynorsk eller engelsk uten at <code>${escapeHtml(formPath)}</code> ble publisert på nytt. Tidene vises i tidssonen <code>${escapeHtml(timeZone)}</code> og er basert på commit-tidspunktet.</p>
      <div class="timeline">${timelineHtml}</div>
    </section>

    <section id="alle-tekster">
      <h2>Skjemadefinisjonens brukersynlige tekster</h2>
      <p class="section-intro">Listen dekker tekstplasseringer fra skjemadefinisjonen som var aktive minst én gang i ${periodSentence}. "Betinget" betyr at visningen avhenger av et tidligere svar, valgt innsendingsmåte eller en annen renderer-betingelse. Når et publisert språk viser "viste bokmål", fantes det ikke et treff i verken skjemaets eller FyllUts felles oversettelser på det tidspunktet.</p>
      <div class="controls" aria-label="Filtrer tekstoversikten">
        <label>Søk i tekst eller komponent
          <input id="search" type="search" placeholder="For eksempel vedlegg, adresse eller et spørsmål">
        </label>
        <label>Vis
          <select id="change-filter">
            <option value="all">Alle tekster</option>
            <option value="true">Bare endrede</option>
            <option value="false">Bare uendrede</option>
          </select>
        </label>
        <label>Språk
          <select id="language-filter">
            <option value="all">Alle publiserte språk</option>
            ${[...new Set(languageStates.flatMap(({ state }) => state.publishedLanguages))]
              .map((language) => `<option value="${language}">${languageName[language]}</option>`)
              .join('')}
          </select>
        </label>
        <label>Seksjon
          <select id="section-filter">
            <option value="all">Alle seksjoner</option>
            ${sections.map((section) => `<option value="${escapeHtml(section)}">${escapeHtml(section)}</option>`).join('')}
          </select>
        </label>
      </div>
      <p id="results-count" class="results-count" aria-live="polite"></p>
      <div id="inventory">${inventoryHtml}</div>
    </section>

    <section id="metode">
      <h2>Metode og kilder</h2>
      <p class="section-intro">Rapporten er laget fra publiserte filer, ikke fra skjermbilder eller antakelser om hva som kan ha vært i produksjon.</p>
      <div class="method">
        <div>
          <h3>Hva som er tatt med</h3>
          <ul>
            <li>Skjemadefinisjonen <a href="${repositoryUrl}/blob/${metadataRevision}/${trackedPaths[0]}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(trackedPaths[0])}</code></a>.</li>
            <li>Skjemaspesifikke oversettelser i <a href="${repositoryUrl}/blob/${metadataRevision}/${trackedPaths[1]}" target="_blank" rel="noopener noreferrer"><code>${escapeHtml(trackedPaths[1])}</code></a>.</li>
            <li>Felles nynorsk- og engelskressurser under <code>resources/global-translations-*.json</code>.</li>
            <li>Tekst fra skjemadefinisjonen som FyllUt renderer: titler, felttekster, beskrivelser, informasjonstekst, svaralternativer, utvidet hjelpetekst, plassholdere, egendefinerte valideringsmeldinger og konfigurerte tekster i sammensatte komponenter.</li>
          </ul>
        </div>
        <div>
          <h3>Avgrensninger</h3>
          <ul>
            <li>Komponent-ID-er, tekniske nøkler, betingelsesuttrykk og publiseringsmetadata regnes ikke som brukersynlig tekst.</li>
            <li><code>addAnother</code> og <code>vedleggstittel</code> er konfigurasjonsfelt, ikke tekst som FyllUt viser direkte.</li>
            <li>Tooltip-felt er utelatt fordi den aktuelle FyllUt-renderingen ikke bruker <code>component.tooltip</code>.</li>
            <li>Innebygd grensesnitttekst som knapper og standardfeil er ikke skjemaets egen tekst og er derfor ikke del av inventaret.</li>
            <li>Renderer-eid tekst i sammensatte komponenter er ikke kopiert inn i rapporten. Slik tekst må dokumenteres fra den renderer-versjonen som var i bruk på det aktuelle tidspunktet.</li>
            <li>Commit-tidspunkt er brukt som dokumenterbart publiseringstidspunkt. Rapporten hevder ikke når en bestemt nettleserøkt lastet den nye ressursen.</li>
          </ul>
        </div>
      </div>
      <p class="commit">Baseline: <a href="${commitLink(baselineRevision)}" target="_blank" rel="noopener noreferrer">${shortHash(baselineRevision)}</a>, siste repositorytilstand før ${escapeHtml(formatDate(fromDate))}. Generert ${escapeHtml(generatedDate)}.</p>
    </section>
  </main>
  <footer>
    <p>${escapeHtml(formNumber)} · ${escapeHtml(formTitle)} · teksthistorikk for ${escapeHtml(periodSentence)}</p>
  </footer>
  <script>
    const cards = [...document.querySelectorAll('.text-card')];
    const search = document.querySelector('#search');
    const changeFilter = document.querySelector('#change-filter');
    const languageFilter = document.querySelector('#language-filter');
    const sectionFilter = document.querySelector('#section-filter');
    const resultsCount = document.querySelector('#results-count');

    const updateFilters = () => {
      const query = search.value.trim().toLocaleLowerCase('nb-NO');
      let visible = 0;
      for (const card of cards) {
        const matchesSearch = !query || card.dataset.search.includes(query);
        const matchesChange =
          changeFilter.value === 'all' || card.dataset.changed === changeFilter.value;
        const matchesSection =
          sectionFilter.value === 'all' || card.dataset.section === sectionFilter.value;
        card.hidden = !(matchesSearch && matchesChange && matchesSection);
        if (!card.hidden) visible += 1;
      }
      for (const language of document.querySelectorAll('.lang')) {
        language.hidden =
          languageFilter.value !== 'all' && !language.classList.contains('lang-' + languageFilter.value);
      }
      resultsCount.textContent = visible + ' av ' + cards.length + ' tekstplasseringer vises';
    };

    search.addEventListener('input', updateFilters);
    changeFilter.addEventListener('change', updateFilters);
    languageFilter.addEventListener('change', updateFilters);
    sectionFilter.addEventListener('change', updateFilters);
    updateFilters();
  </script>
</body>
</html>`;

writeFileSync(output, html);
console.log(
  JSON.stringify(
    {
      output,
      formPath,
      from: fromDate,
      to: toDate,
      formPublications: formPublicationCount,
      relevantTextEvents: visibleEvents.length,
      inventoryItems: histories.length,
      changedItems,
      focusFound: Boolean(focusHistory),
      focusChanged: focusHistory?.changed,
    },
    null,
    2,
  ),
);
