import { getOrgSectors, getPersonTimeline } from './political-data.js';
import { getPersonDetails } from './stortinget.js';

interface StortingetSakerResponse {
  saker_liste?: StortingetSakApi[];
}

interface StortingetSakApi {
  id: number | string;
  tittel?: string | null;
  korttittel?: string | null;
  henvisning?: string | null;
  behandlet_sesjon_id?: string | null;
  sist_oppdatert_dato?: string | null;
  komite?: { navn?: string | null } | null;
  emne_liste?: Array<{ navn?: string | null }> | null;
}

interface RawBudgetProposal {
  proposalId: string;
  title: string;
  shortTitle?: string;
  reference?: string;
  sessionId?: string;
  committee?: string;
  category: string;
  sectors: string[];
  updatedAt?: string;
}

export type BudgetMatchReason = 'committee_assignment' | 'sector_interest' | 'party_priority';

export interface BudgetProposalMatch {
  proposalId: string;
  title: string;
  shortTitle?: string;
  reference?: string;
  sessionId?: string;
  committee?: string;
  category: string;
  relevanceScore: number;
  matchReason: BudgetMatchReason;
  matchedSectors: string[];
  updatedAt?: string;
}

export interface PersonBudgetMatch {
  personId: string;
  personName: string;
  party?: string;
  committees: string[];
  sectors: string[];
  totalMatches: number;
  budgetProposals: BudgetProposalMatch[];
  source: string;
  generatedAt: string;
}

const STORTINGET_SAKER_BASE_URL = 'https://data.stortinget.no/eksport/saker?format=json&status=3';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const BUDGET_KEYWORDS = [
  'statsbudsjett',
  'budsjett',
  'bevilgning',
  'nasjonalbudsjett',
  'saldering',
  'prop 1 s',
];

const MAJOR_BUDGET_KEYWORDS = [
  'prop 1 s',
  'revidert nasjonalbudsjett',
  'tilleggsbevilgninger og omprioriteringer',
  'ny saldering av statsbudsjettet',
  'saldering',
];

const SECTOR_KEYWORDS: Record<string, string[]> = {
  energi: ['energi', 'olje', 'gass', 'kraft', 'petroleum'],
  finans: ['finans', 'bank', 'okonomi', 'skatt', 'avgift'],
  helse: ['helse', 'sykehus', 'legemiddel', 'omsorg'],
  samferdsel: ['samferdsel', 'transport', 'vei', 'bane', 'luftfart'],
  klima: ['klima', 'miljo', 'natur', 'utslipp'],
  forsvar: ['forsvar', 'militaer', 'beredskap'],
  justis: ['justis', 'politi', 'domstol', 'kriminal'],
  utdanning: ['utdanning', 'skole', 'forskning', 'universitet'],
  naring: ['naring', 'industri', 'havbruk', 'sjomat', 'landbruk'],
  digitalisering: ['digital', 'teknologi', 'forvaltning'],
};

const COMMITTEE_SECTOR_MAP: Record<string, string[]> = {
  finanskomiteen: ['finans', 'okonomi'],
  'energi og miljokomiteen': ['energi', 'klima'],
  'helse og omsorgskomiteen': ['helse'],
  naeringskomiteen: ['naring', 'energi', 'sjomat', 'landbruk'],
  'transport og kommunikasjonskomiteen': ['samferdsel'],
  justiskomiteen: ['justis', 'beredskap'],
  'utenriks og forsvarskomiteen': ['forsvar', 'beredskap'],
  'utdannings og forskningskomiteen': ['utdanning'],
  'kommunal og forvaltningskomiteen': ['digitalisering', 'forvaltning'],
};

let budgetCache: { expiresAt: number; proposals: RawBudgetProposal[] } | null = null;

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function toIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;

  const dotNetDate = /\/Date\((\d+)([+-]\d{4})?\)\//.exec(value);
  if (dotNetDate) {
    const millis = Number(dotNetDate[1]);
    if (!Number.isNaN(millis)) return new Date(millis).toISOString();
  }

  const parsed = Date.parse(value);
  if (!Number.isNaN(parsed)) return new Date(parsed).toISOString();

  return undefined;
}

function getSessionIds(): string[] {
  const now = new Date();
  // Stortinget sessions typically start in autumn and run "YYYY-YYYY+1".
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [`${startYear}-${startYear + 1}`, `${startYear - 1}-${startYear}`];
}

async function fetchSakerForSession(sessionId: string): Promise<StortingetSakApi[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${STORTINGET_SAKER_BASE_URL}&sesjonid=${encodeURIComponent(sessionId)}`, {
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`Stortinget saker request failed (${response.status}) for session ${sessionId}`);
    }

    const data = (await response.json()) as StortingetSakerResponse;
    return Array.isArray(data.saker_liste) ? data.saker_liste : [];
  } finally {
    clearTimeout(timeout);
  }
}

function isBudgetCase(sak: StortingetSakApi): boolean {
  const text = normalizeText(
    `${sak.tittel ?? ''} ${sak.korttittel ?? ''} ${sak.henvisning ?? ''} ${
      sak.emne_liste?.map((e) => e.navn ?? '').join(' ') ?? ''
    }`
  );

  return BUDGET_KEYWORDS.some((keyword) => text.includes(keyword));
}

function isMajorBudgetProposal(proposal: RawBudgetProposal): boolean {
  const text = normalizeText(`${proposal.title} ${proposal.reference ?? ''}`);
  return MAJOR_BUDGET_KEYWORDS.some((keyword) => text.includes(keyword));
}

function extractSectors(text: string): string[] {
  const normalized = normalizeText(text);
  const padded = ` ${normalized} `;
  const tokens = new Set(normalized.split(' ').filter(Boolean));
  const sectors: string[] = [];

  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    const hasMatch = keywords.some((keyword) => {
      const normalizedKeyword = normalizeText(keyword);
      if (!normalizedKeyword) return false;
      if (normalizedKeyword.includes(' ')) {
        return padded.includes(` ${normalizedKeyword} `);
      }
      return tokens.has(normalizedKeyword);
    });

    if (hasMatch) {
      sectors.push(sector);
    }
  }

  return sectors;
}

function sectorsFromCommitteeName(committee?: string): string[] {
  if (!committee) return [];
  const normalized = normalizeText(committee);
  const sectors = new Set<string>();

  for (const [committeeName, mappedSectors] of Object.entries(COMMITTEE_SECTOR_MAP)) {
    if (normalized.includes(committeeName)) {
      for (const sector of mappedSectors) sectors.add(sector);
    }
  }

  for (const sector of extractSectors(committee)) sectors.add(sector);

  return Array.from(sectors);
}

function inferCategory(sak: StortingetSakApi, sectors: string[]): string {
  if (sectors.length > 0) return sectors[0];
  const committeeSectors = sectorsFromCommitteeName(sak.komite?.navn ?? undefined);
  if (committeeSectors.length > 0) return committeeSectors[0];
  return 'statsbudsjett';
}

function toRawBudgetProposal(sak: StortingetSakApi): RawBudgetProposal {
  const subjectText = sak.emne_liste?.map((e) => e.navn ?? '').join(' ') ?? '';
  const allText = `${sak.tittel ?? ''} ${sak.korttittel ?? ''} ${sak.henvisning ?? ''} ${subjectText} ${
    sak.komite?.navn ?? ''
  }`;
  const sectors = Array.from(
    new Set<string>([
      ...extractSectors(allText),
      ...sectorsFromCommitteeName(sak.komite?.navn ?? undefined),
    ])
  );

  const proposalId = String(sak.id);
  return {
    proposalId,
    title: sak.tittel?.trim() || sak.korttittel?.trim() || `Sak ${proposalId}`,
    shortTitle: sak.korttittel?.trim() || undefined,
    reference: sak.henvisning?.trim() || undefined,
    sessionId: sak.behandlet_sesjon_id ?? undefined,
    committee: sak.komite?.navn?.trim() || undefined,
    category: inferCategory(sak, sectors),
    sectors,
    updatedAt: toIsoDate(sak.sist_oppdatert_dato),
  };
}

async function fetchBudgetProposals(): Promise<RawBudgetProposal[]> {
  const now = Date.now();
  if (budgetCache && budgetCache.expiresAt > now) return budgetCache.proposals;

  const sessionIds = getSessionIds();
  const groupedCases = await Promise.all(sessionIds.map((sessionId) => fetchSakerForSession(sessionId)));
  const allCases = groupedCases.flat();

  const byId = new Map<string, RawBudgetProposal>();
  for (const sak of allCases) {
    if (!isBudgetCase(sak)) continue;
    const proposal = toRawBudgetProposal(sak);
    const existing = byId.get(proposal.proposalId);

    if (!existing) {
      byId.set(proposal.proposalId, proposal);
      continue;
    }

    const existingUpdated = existing.updatedAt ? Date.parse(existing.updatedAt) : 0;
    const proposalUpdated = proposal.updatedAt ? Date.parse(proposal.updatedAt) : 0;
    if (proposalUpdated >= existingUpdated) {
      byId.set(proposal.proposalId, proposal);
    }
  }

  const proposals = Array.from(byId.values()).sort((a, b) => {
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bTime - aTime;
  });

  budgetCache = {
    expiresAt: now + CACHE_TTL_MS,
    proposals,
  };

  return proposals;
}

function getPersonSectorSignals(personId: string): string[] {
  const timeline = getPersonTimeline(personId);
  if (!timeline) return [];

  const orgSectors = getOrgSectors();
  const sectors = new Set<string>();

  for (const position of timeline.positions) {
    if (position.sector) {
      for (const sector of extractSectors(position.sector)) sectors.add(sector);
      sectors.add(normalizeText(position.sector));
    }

    for (const sector of orgSectors[position.orgId] ?? []) {
      for (const extracted of extractSectors(sector)) sectors.add(extracted);
      sectors.add(normalizeText(sector));
    }

    const positionSectors = extractSectors(`${position.orgName} ${position.role}`);
    for (const sector of positionSectors) sectors.add(sector);
  }

  return Array.from(sectors).filter(Boolean);
}

function normalizeCommitteeNames(committees: string[]): string[] {
  return Array.from(new Set(committees.map((committee) => normalizeText(committee)).filter(Boolean)));
}

function scoreBudgetMatch(input: {
  proposal: RawBudgetProposal;
  normalizedCommittees: string[];
  personSectors: Set<string>;
  hasPartyAffiliation: boolean;
}): { score: number; reason: BudgetMatchReason; matchedSectors: string[] } | null {
  const { proposal, normalizedCommittees, personSectors, hasPartyAffiliation } = input;
  const normalizedProposalCommittee = normalizeText(proposal.committee ?? '');
  const committeeMatch = normalizedProposalCommittee
    ? normalizedCommittees.some((committee) => committee === normalizedProposalCommittee)
    : false;

  const proposalSectors = new Set<string>([
    ...proposal.sectors,
    ...sectorsFromCommitteeName(proposal.committee),
  ]);
  const matchedSectors = Array.from(proposalSectors).filter((sector) => personSectors.has(sector));

  const partyPriority = hasPartyAffiliation && isMajorBudgetProposal(proposal);

  let reason: BudgetMatchReason | null = null;
  let score = 0;

  if (committeeMatch) {
    reason = 'committee_assignment';
    score = Math.max(score, 68);
  }

  if (matchedSectors.length > 0) {
    if (!reason) reason = 'sector_interest';
    score = Math.max(score, 72 + Math.min(18, matchedSectors.length * 6));
  }

  if (committeeMatch && matchedSectors.length > 0) {
    reason = 'committee_assignment';
    score = Math.max(score, 88);
  }

  if (!reason && partyPriority) {
    reason = 'party_priority';
    score = Math.max(score, 45);
  }

  if (!reason || score < 40) return null;

  return {
    score: Math.min(score, 99),
    reason,
    matchedSectors,
  };
}

export async function getBudgetMatchesForPerson(personId: string): Promise<PersonBudgetMatch | null> {
  const details = await getPersonDetails(personId);
  if (!details) return null;

  const budgetProposals = await fetchBudgetProposals();
  const normalizedCommittees = normalizeCommitteeNames(details.committees ?? []);
  const personSectors = new Set<string>(getPersonSectorSignals(personId));

  const matches: BudgetProposalMatch[] = [];
  for (const proposal of budgetProposals) {
    const match = scoreBudgetMatch({
      proposal,
      normalizedCommittees,
      personSectors,
      hasPartyAffiliation: Boolean(details.party),
    });
    if (!match) continue;

    matches.push({
      proposalId: proposal.proposalId,
      title: proposal.title,
      shortTitle: proposal.shortTitle,
      reference: proposal.reference,
      sessionId: proposal.sessionId,
      committee: proposal.committee,
      category: proposal.category,
      relevanceScore: match.score,
      matchReason: match.reason,
      matchedSectors: match.matchedSectors,
      updatedAt: proposal.updatedAt,
    });
  }

  matches.sort((a, b) => {
    if (b.relevanceScore !== a.relevanceScore) return b.relevanceScore - a.relevanceScore;
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bTime - aTime;
  });

  const capped = matches.slice(0, 15);

  return {
    personId,
    personName: details.name,
    party: details.party,
    committees: details.committees ?? [],
    sectors: Array.from(personSectors).sort(),
    totalMatches: matches.length,
    budgetProposals: capped,
    source: 'data.stortinget.no/eksport/saker',
    generatedAt: new Date().toISOString(),
  };
}
