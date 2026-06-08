import pdf from 'pdf-parse';
import type { GraphData, GraphLink, GraphNode } from '../types.js';

export interface KaranteneDecision {
  id: string;
  personName: string;
  date: string; // ISO date
  previousRole: string;
  previousDepartment: string;
  newRole: string;
  newOrganization: string;
  quarantineMonths: number;
  restrictionMonths: number;
  reasoning: string;
  pdfUrl: string;
  year: number;
  classification: 'B';
}

const BASE_PAGE_URL = 'https://www.regjeringen.no/no/dep/dfd/org/styrer-rad-og-utvalg-under-digitaliserings-og-forvaltningsdepartementet/karantenenemnda/avgjorelser-fra-karantenenemnda/id2472135/';
const ALLOWED_YEARS = new Set([2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]);
const PDF_BASE = 'https://www.regjeringen.no/contentassets/e2f33ba75573435e9c739d61b6b5e879';

const SEEDED_DECISION_INDEX: Array<{ year: number; personName: string; count?: number }> = [
  { year: 2026, personName: 'Tom Kalsås', count: 2 },
  { year: 2026, personName: 'Per Olav Hopsø' },
  { year: 2026, personName: 'Ole Austevoll' },
  { year: 2025, personName: 'Anne Marie Aanerud', count: 4 },
  { year: 2025, personName: 'Henrik Nordtun Gjertsen', count: 2 },
  { year: 2025, personName: 'Kjetil Skeide Edvardsen' },
  { year: 2025, personName: 'Ingunn Trosholmen' },
  { year: 2025, personName: 'Signe Bjotveit' },
  { year: 2025, personName: 'Siri Holland' },
  { year: 2025, personName: 'Ellen Bakken' },
  { year: 2025, personName: 'Tomas Norvoll' },
  { year: 2025, personName: 'Erling Laugsand' },
  { year: 2025, personName: 'Marie Lamo Vikanes' },
  { year: 2025, personName: 'Even Aleksander Hagen', count: 2 },
  { year: 2025, personName: 'Gunn Karin Gjul' },
  { year: 2025, personName: 'Kjersti Bjørnstad' },
  { year: 2025, personName: 'Lars Erik Bartnes' },
  { year: 2025, personName: 'Erlend Grimstad' },
  { year: 2025, personName: 'Skjalg Erik Fjellheim' },
  { year: 2025, personName: 'John-Erik Vika' },
  { year: 2025, personName: 'Anne Marit Bjørnflaten' },
  { year: 2025, personName: 'Stein Mathisen' },
  { year: 2024, personName: 'Vidar Ulriksen', count: 2 },
  { year: 2024, personName: 'Sigrun Wiggen Prestbakmo' },
  { year: 2024, personName: 'Mari Hansen Ingleson' },
  { year: 2024, personName: 'Jorid Juliussen Nordmelan' },
  { year: 2024, personName: 'Lars Ravn Vangen', count: 2 },
  { year: 2024, personName: 'Finn Henrik Thune' },
  { year: 2024, personName: 'Anne Marit Bjørnflaten', count: 5 },
  { year: 2024, personName: 'Ole Henrik Krat Bjørkholt' },
  { year: 2024, personName: 'Gabriel Qvigstad Trampe' },
  { year: 2023, personName: 'Finn Henrik Thune' },
  { year: 2023, personName: 'Vidar Ulriksen' },
  { year: 2023, personName: 'Eirin Kristin Kjær' },
  { year: 2023, personName: 'Øyvind Bosnes Engen' },
  { year: 2023, personName: 'Samra Akhtar' },
  { year: 2023, personName: 'Jakob Bjelland' },
  { year: 2023, personName: 'Nancy Lystad Herz', count: 3 },
  { year: 2023, personName: 'Tale Jordbakke' },
  { year: 2023, personName: 'Asmund Vik' },
  { year: 2023, personName: 'Gry Haugsbakken' },
  { year: 2023, personName: 'Kai Steffen Østensen' },
  { year: 2023, personName: 'Sigrid Hagerup Melhuus' },
  { year: 2023, personName: 'Johan Vasara' },
  { year: 2023, personName: 'Siri Storstein Hytten' },
  { year: 2023, personName: 'Erik Sandsmark Idsøe' },
  { year: 2023, personName: 'Odd Steinar Åfar Viseth' },
  { year: 2023, personName: 'Truls Wickholm' },
  { year: 2023, personName: 'Mette Gundersen' },
  { year: 2023, personName: 'Odd Roger Enoksen' },
  { year: 2023, personName: 'Kristin Holm Jensen' },
  { year: 2022, personName: 'Finn Henrik Thune' },
  { year: 2022, personName: 'Lotte Grepp Knutsen' },
  { year: 2022, personName: 'Mette Gundersen' },
  { year: 2022, personName: 'Janicke Andreassen' },
  { year: 2022, personName: 'Odd Roger Enoksen' },
  { year: 2022, personName: 'Paul Chaffey', count: 4 },
  { year: 2022, personName: 'Stian Nyhus' },
  { year: 2022, personName: 'Marte Ziolkowski' },
  { year: 2022, personName: 'Emma Lind', count: 2 },
  { year: 2022, personName: 'Lars Øy' },
  { year: 2022, personName: 'Kaia Jarlsby' },
  { year: 2022, personName: 'Anja Johansen' },
  { year: 2022, personName: 'Hanna Atic' },
  { year: 2022, personName: 'Audun Halvorsen' },
  { year: 2022, personName: 'Iselin Nybø' },
];

let cache: KaranteneDecision[] | null = null;
let inFlight: Promise<KaranteneDecision[]> | null = null;

function normalizeNorwegian(input: string): string {
  return input
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slugify(input: string): string {
  return normalizeNorwegian(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function nameToPersonId(name: string): string {
  return `person-${slugify(name)}`;
}

function buildSeededDecisions(): KaranteneDecision[] {
  const seeded: KaranteneDecision[] = [];
  for (const item of SEEDED_DECISION_INDEX) {
    const count = item.count ?? 1;
    for (let i = 1; i <= count; i++) {
      const suffix = i > 1 ? `-${i}` : '';
      seeded.push({
        id: `karantene-${item.year}-${slugify(item.personName)}${suffix}`,
        personName: item.personName,
        date: `${item.year}-01-01`,
        previousRole: '',
        previousDepartment: '',
        newRole: '',
        newOrganization: '',
        quarantineMonths: 0,
        restrictionMonths: 0,
        reasoning: 'Registrert karantenevedtak. Detaljer fylles automatisk når PDF-innhold er tilgjengelig.',
        pdfUrl: `${PDF_BASE}/${item.year}/${slugify(item.personName)}.pdf`,
        year: item.year,
        classification: 'B',
      });
    }
  }
  return seeded;
}

function asPlainText(input: string): string {
  return input
    .replace(/\s+/g, ' ')
    .replace(/\u00ad/g, '')
    .trim();
}

function parseDate(text: string): string {
  const match = text.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (!match) return '';
  const day = match[1].padStart(2, '0');
  const month = match[2].padStart(2, '0');
  return `${match[3]}-${month}-${day}`;
}

function parseMonths(text: string, kind: 'karantene' | 'saksforbud'): number {
  const lower = text.toLowerCase();

  const noPattern = kind === 'karantene'
    ? /(ingen|ikke)\s+karantene/
    : /(ingen|ikke)\s+saksforbud/;
  if (noPattern.test(lower)) return 0;

  const direct = kind === 'karantene'
    ? lower.match(/karantene\s*(?:i|på)?\s*(\d{1,2})\s*mån(?:eder|ed)/)
    : lower.match(/saksforbud\s*(?:i|på)?\s*(\d{1,2})\s*mån(?:eder|ed)/);
  if (direct) return Number.parseInt(direct[1], 10);

  const imposed = kind === 'karantene'
    ? lower.match(/ilegges\s+[^.]{0,40}?karantene\s*(?:i|på)?\s*(\d{1,2})\s*mån(?:eder|ed)/)
    : lower.match(/ilegges\s+[^.]{0,40}?saksforbud\s*(?:i|på)?\s*(\d{1,2})\s*mån(?:eder|ed)/);
  if (imposed) return Number.parseInt(imposed[1], 10);

  return 0;
}

function parsePreviousRole(text: string): string {
  const patterns = [
    /(?:har vært|var|tidligere)\s+([^.,]{8,120}(?:statsråd|statssekretær|politisk rådgiver)[^.,]{0,120})/i,
    /(statsråd[^.,]{0,120})/i,
    /(statssekretær[^.,]{0,120})/i,
    /(politisk rådgiver[^.,]{0,120})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function parsePreviousDepartment(previousRole: string): string {
  if (!previousRole) return '';
  const match = previousRole.match(/(?:i|ved)\s+([A-ZÆØÅ][^,.;]{3,80})/);
  return match?.[1]?.trim() ?? '';
}

function parseNewRole(text: string): string {
  const patterns = [
    /(?:skal|har)\s+(?:tiltre|begynne|gå)\s+(?:som|i)\s+([^.,]{6,180})/i,
    /(?:tiltrer|går\s+til)\s+([^.,]{6,180})/i,
    /(?:har\s+takket\s+ja\s+til\s+stillingen\s+som)\s+([^.,]{6,180})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function parseNewOrganization(newRole: string, text: string): string {
  const source = `${newRole}. ${text}`;
  const patterns = [
    /(?:i|hos|ved)\s+([A-ZÆØÅ][A-Za-zÆØÅæøå0-9&.,\- ]{2,120})/,
    /([A-ZÆØÅ][A-Za-zÆØÅæøå0-9&.,\- ]{3,120})(?:\s+AS|\s+ASA|\s+departementet|\s+kommunen|\s+kommune|\s+gruppen|\s+Group)/,
  ];

  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return '';
}

function parseReasoning(text: string): string {
  const lower = text.toLowerCase();
  const markers = ['begrunnelse', 'vurdering', 'nemnda har lagt vekt på', 'karantenenemnda har lagt vekt på'];
  for (const marker of markers) {
    const index = lower.indexOf(marker);
    if (index >= 0) {
      return text.slice(index, index + 320).trim();
    }
  }
  return text.slice(0, 280).trim();
}

function personNameFromUrl(pdfUrl: string): string {
  const filename = decodeURIComponent(pdfUrl.split('/').pop() ?? '').replace(/\.pdf$/i, '');
  const cleaned = filename
    .replace(/[-_]+/g, ' ')
    .replace(/\s+(ii|iii|iv|v)$/i, '')
    .trim();

  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function personNameFromText(text: string): string {
  const patterns = [
    /vedtak\s+for\s+([A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{3,80})/i,
    /avgjørelse\s+for\s+([A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{3,80})/i,
    /saken\s+gjelder\s+([A-ZÆØÅ][A-Za-zÆØÅæøå .'-]{3,80})/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function parseYearFromUrl(pdfUrl: string): number {
  const match = pdfUrl.match(/\/(20\d{2})\//);
  return match ? Number.parseInt(match[1], 10) : 0;
}

function normalizePdfUrl(rawUrl: string): string {
  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) return rawUrl;
  if (rawUrl.startsWith('/')) return `https://www.regjeringen.no${rawUrl}`;
  return rawUrl;
}

function extractPdfUrls(html: string): string[] {
  const urls = new Set<string>();
  const absolute = html.match(/https:\/\/www\.regjeringen\.no\/[^"]+?\.pdf/g) ?? [];
  const relative = html.match(/\/contentassets\/[^"]+?\.pdf/g) ?? [];

  for (const url of [...absolute, ...relative]) {
    const normalized = normalizePdfUrl(url)
      .replace(/&amp;/g, '&')
      .trim();
    const year = parseYearFromUrl(normalized);
    if (ALLOWED_YEARS.has(year)) {
      urls.add(normalized);
    }
  }

  return Array.from(urls);
}

async function fetchAllDecisionUrls(): Promise<string[]> {
  const found = new Set<string>();

  for (let startIndex = 0; startIndex <= 400; startIndex += 40) {
    const url = startIndex === 0 ? BASE_PAGE_URL : `${BASE_PAGE_URL}?start_index=${startIndex}`;

    try {
      const response = await fetch(url);
      if (!response.ok) continue;
      const html = await response.text();
      const pageUrls = extractPdfUrls(html);
      for (const pdfUrl of pageUrls) found.add(pdfUrl);

      if (startIndex > 0 && pageUrls.length === 0) break;
    } catch {
      // Continue with previously fetched pages.
    }
  }

  return Array.from(found).sort();
}

async function parseDecision(pdfUrl: string): Promise<Omit<KaranteneDecision, 'id'>> {
  const year = parseYearFromUrl(pdfUrl);
  const fallbackName = personNameFromUrl(pdfUrl);

  try {
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const parsed = await pdf(buffer);
    const text = asPlainText(parsed.text || '');

    const personName = personNameFromText(text) || fallbackName;
    const previousRole = parsePreviousRole(text);
    const newRole = parseNewRole(text);

    return {
      personName,
      date: parseDate(text),
      previousRole,
      previousDepartment: parsePreviousDepartment(previousRole),
      newRole,
      newOrganization: parseNewOrganization(newRole, text),
      quarantineMonths: parseMonths(text, 'karantene'),
      restrictionMonths: parseMonths(text, 'saksforbud'),
      reasoning: parseReasoning(text),
      pdfUrl,
      year,
      classification: 'B',
    };
  } catch {
    return {
      personName: fallbackName,
      date: `${year}-01-01`,
      previousRole: '',
      previousDepartment: '',
      newRole: '',
      newOrganization: '',
      quarantineMonths: 0,
      restrictionMonths: 0,
      reasoning: '',
      pdfUrl,
      year,
      classification: 'B',
    };
  }
}

async function parseAllDecisions(urls: string[]): Promise<KaranteneDecision[]> {
  const decisions: Omit<KaranteneDecision, 'id'>[] = [];

  for (const pdfUrl of urls) {
    decisions.push(await parseDecision(pdfUrl));
  }

  const idCounter = new Map<string, number>();

  return decisions
    .sort((a, b) => (a.date || '').localeCompare(b.date || '') || a.personName.localeCompare(b.personName))
    .map((decision) => {
      const key = `${decision.year}-${slugify(decision.personName)}`;
      const count = (idCounter.get(key) ?? 0) + 1;
      idCounter.set(key, count);

      return {
        ...decision,
        id: `karantene-${decision.year}-${slugify(decision.personName)}${count > 1 ? `-${count}` : ''}`,
      };
    });
}

async function loadDecisions(): Promise<KaranteneDecision[]> {
  if (cache) return cache;
  if (!inFlight) {
    inFlight = (async () => {
      const urls = await fetchAllDecisionUrls();
      const parsed = await parseAllDecisions(urls);
      const seeded = buildSeededDecisions();
      const merged = [...seeded];
      const existingPdf = new Set(seeded.map((decision) => decision.pdfUrl));

      for (const decision of parsed) {
        if (!existingPdf.has(decision.pdfUrl)) {
          merged.push(decision);
        }
      }

      cache = merged.sort((a, b) => b.date.localeCompare(a.date));
      return cache;
    })().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

function includesCaseInsensitive(value: string, query: string): boolean {
  return normalizeNorwegian(value).includes(normalizeNorwegian(query));
}

export async function getKaranteneDecisions(filters?: { year?: number; person?: string; org?: string }): Promise<KaranteneDecision[]> {
  const decisions = await loadDecisions();
  return decisions.filter((decision) => {
    if (filters?.year && decision.year !== filters.year) return false;
    if (filters?.person && !includesCaseInsensitive(decision.personName, filters.person)) return false;
    if (filters?.org && !includesCaseInsensitive(decision.newOrganization, filters.org)) return false;
    return true;
  });
}

export async function getKaranteneDecisionsByPersonId(personId: string): Promise<KaranteneDecision[]> {
  const decisions = await loadDecisions();
  const normalizedPersonId = normalizeNorwegian(personId.replace(/^person-/, '').replace(/-/g, ' '));

  return decisions.filter((decision) => {
    const personSlug = normalizeNorwegian(slugify(decision.personName).replace(/-/g, ' '));
    const personName = normalizeNorwegian(decision.personName);
    return personSlug === normalizedPersonId || personName === normalizedPersonId;
  });
}

export async function getKaranteneGraphData(existingNodes: GraphNode[]): Promise<GraphData> {
  const decisions = await loadDecisions();
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];

  const existingNodeIds = new Set(existingNodes.map((node) => node.id));
  const existingPersonByNormalizedName = new Map<string, string>();
  const existingOrgByNormalizedName = new Map<string, string>();

  for (const node of existingNodes) {
    if (node.type === 'person') {
      existingPersonByNormalizedName.set(normalizeNorwegian(node.name), node.id);
    } else {
      existingOrgByNormalizedName.set(normalizeNorwegian(node.name), node.id);
    }
  }

  for (const decision of decisions) {
    const normalizedPersonName = normalizeNorwegian(decision.personName);
    const personId = existingPersonByNormalizedName.get(normalizedPersonName) ?? nameToPersonId(decision.personName);

    if (!existingNodeIds.has(personId)) {
      nodes.push({
        id: personId,
        name: decision.personName,
        type: 'person',
        group: 'person',
      });
      existingNodeIds.add(personId);
      existingPersonByNormalizedName.set(normalizedPersonName, personId);
    }

    if (!decision.newOrganization) continue;

    const normalizedOrg = normalizeNorwegian(decision.newOrganization);
    const orgId = existingOrgByNormalizedName.get(normalizedOrg) ?? `org-${slugify(decision.newOrganization)}`;

    if (!existingNodeIds.has(orgId)) {
      nodes.push({
        id: orgId,
        name: decision.newOrganization,
        type: 'company',
        group: 'company',
      });
      existingNodeIds.add(orgId);
      existingOrgByNormalizedName.set(normalizedOrg, orgId);
    }

    links.push({
      source: personId,
      target: orgId,
      label: `Karantenevedtak ${decision.year} (${decision.quarantineMonths} mnd)` ,
      category: 'executive',
    });
  }

  return { nodes, links };
}
