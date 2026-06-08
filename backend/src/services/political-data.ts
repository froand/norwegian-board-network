import type { GraphData, GraphNode, GraphLink } from '../types.js';

// Sample data representing Norwegian political/government figures and connections
// Sources: stortinget.no, regjeringen.no, proff.no (all public information)
// Focus: Mapping potential conflicts of interest and revolving door patterns

export interface PositionTimeline {
  personId: string;
  personName: string;
  positions: {
    orgId: string;
    orgName: string;
    role: string;
    category: 'board' | 'political' | 'government' | 'executive';
    sector?: string;
    startYear: number;
    endYear?: number; // undefined = current
  }[];
}

export interface ConflictOfInterest {
  personId: string;
  personName: string;
  politicalRole: string;
  politicalOrg: string;
  boardRole: string;
  boardOrg: string;
  sector: string;
  conflictType: 'revolving_door' | 'concurrent' | 'sector_overlap' | 'shared_network';
  description: string;
  severity: 'high' | 'medium' | 'low';
}

// Sector tags for organizations to detect regulatory conflicts
const ORG_SECTORS: Record<string, string[]> = {
  'org-equinor': ['energi', 'olje', 'klima'],
  'org-dnb': ['finans', 'bank'],
  'org-telenor': ['telekom', 'teknologi', 'digitalisering'],
  'org-norsk-hydro': ['energi', 'industri', 'aluminium'],
  'org-nho': ['næringsliv', 'arbeidsliv'],
  'org-finansdepartementet': ['finans', 'skatt', 'økonomi'],
  'org-naringsdepartementet': ['næringsliv', 'industri', 'energi'],
  'org-utenriksdepartementet': ['utenriks', 'handel', 'bistand'],
};

// Timeline data showing when positions were held
const timelines: PositionTimeline[] = [
  {
    personId: 'person-monica-maeland',
    personName: 'Monica Mæland',
    positions: [
      { orgId: 'org-hoyre', orgName: 'Høyre', role: 'Stortingsrepresentant', category: 'political', startYear: 2005, endYear: 2013 },
      { orgId: 'org-naringsdepartementet', orgName: 'Nærings- og fiskeridepartementet', role: 'Næringsminister', category: 'government', sector: 'næringsliv', startYear: 2013, endYear: 2018 },
      { orgId: 'org-dnb', orgName: 'DNB ASA', role: 'Styremedlem', category: 'board', sector: 'finans', startYear: 2022 },
    ],
  },
  {
    personId: 'person-torbjorn-roe-isaksen',
    personName: 'Torbjørn Røe Isaksen',
    positions: [
      { orgId: 'org-hoyre', orgName: 'Høyre', role: 'Stortingsrepresentant', category: 'political', startYear: 2009, endYear: 2021 },
      { orgId: 'org-naringsdepartementet', orgName: 'Nærings- og fiskeridepartementet', role: 'Næringsminister', category: 'government', sector: 'næringsliv', startYear: 2018, endYear: 2020 },
      { orgId: 'org-nho', orgName: 'NHO', role: 'Adm. direktør', category: 'executive', sector: 'næringsliv', startYear: 2022 },
    ],
  },
  {
    personId: 'person-nikolai-astrup',
    personName: 'Nikolai Astrup',
    positions: [
      { orgId: 'org-hoyre', orgName: 'Høyre', role: 'Stortingsrepresentant', category: 'political', startYear: 2009, endYear: 2021 },
      { orgId: 'org-equinor', orgName: 'Equinor ASA', role: 'Styremedlem', category: 'board', sector: 'energi', startYear: 2022 },
    ],
  },
  {
    personId: 'person-jan-tore-sanner',
    personName: 'Jan Tore Sanner',
    positions: [
      { orgId: 'org-hoyre', orgName: 'Høyre', role: 'Stortingsrepresentant', category: 'political', startYear: 2001, endYear: 2021 },
      { orgId: 'org-finansdepartementet', orgName: 'Finansdepartementet', role: 'Finansminister', category: 'government', sector: 'finans', startYear: 2020, endYear: 2021 },
      { orgId: 'org-norsk-hydro', orgName: 'Norsk Hydro ASA', role: 'Styremedlem', category: 'board', sector: 'energi', startYear: 2022 },
    ],
  },
  {
    personId: 'person-jonas-gahr-store',
    personName: 'Jonas Gahr Støre',
    positions: [
      { orgId: 'org-utenriksdepartementet', orgName: 'Utenriksdepartementet', role: 'Utenriksminister', category: 'government', startYear: 2005, endYear: 2012 },
      { orgId: 'org-arbeiderpartiet', orgName: 'Arbeiderpartiet', role: 'Partileder', category: 'political', startYear: 2014 },
      { orgId: 'org-statsministerens-kontor', orgName: 'Statsministerens kontor', role: 'Statsminister', category: 'government', startYear: 2021 },
    ],
  },
  {
    personId: 'person-erna-solberg',
    personName: 'Erna Solberg',
    positions: [
      { orgId: 'org-hoyre', orgName: 'Høyre', role: 'Partileder', category: 'political', startYear: 2004 },
      { orgId: 'org-statsministerens-kontor', orgName: 'Statsministerens kontor', role: 'Statsminister', category: 'government', startYear: 2013, endYear: 2021 },
      { orgId: 'org-stortinget', orgName: 'Stortinget', role: 'Stortingsrepresentant', category: 'political', startYear: 2021 },
    ],
  },
  {
    personId: 'person-anniken-huitfeldt',
    personName: 'Anniken Huitfeldt',
    positions: [
      { orgId: 'org-arbeiderpartiet', orgName: 'Arbeiderpartiet', role: 'Stortingsrepresentant', category: 'political', startYear: 1997, endYear: 2023 },
      { orgId: 'org-stortinget', orgName: 'Stortinget', role: 'Leder utenriks- og forsvarskomiteen', category: 'political', startYear: 2017, endYear: 2021 },
      { orgId: 'org-utenriksdepartementet', orgName: 'Utenriksdepartementet', role: 'Utenriksminister', category: 'government', startYear: 2021, endYear: 2023 },
    ],
  },
  {
    personId: 'person-trygve-slagsvold-vedum',
    personName: 'Trygve Slagsvold Vedum',
    positions: [
      { orgId: 'org-senterpartiet', orgName: 'Senterpartiet', role: 'Partileder', category: 'political', startYear: 2014 },
      { orgId: 'org-stortinget', orgName: 'Stortinget', role: 'Stortingsrepresentant', category: 'political', startYear: 2005, endYear: 2021 },
      { orgId: 'org-finansdepartementet', orgName: 'Finansdepartementet', role: 'Finansminister', category: 'government', sector: 'finans', startYear: 2021 },
    ],
  },
];

// Detected conflicts of interest (based on public analysis)
const conflicts: ConflictOfInterest[] = [
  {
    personId: 'person-torbjorn-roe-isaksen',
    personName: 'Torbjørn Røe Isaksen',
    politicalRole: 'Næringsminister (2018-2020)',
    politicalOrg: 'Nærings- og fiskeridepartementet',
    boardRole: 'Adm. direktør (2022-)',
    boardOrg: 'NHO',
    sector: 'næringsliv',
    conflictType: 'revolving_door',
    description: 'Gikk fra å regulere næringslivet som minister til å lede NHO — næringslivets hovedorganisasjon. Kort karantenetid mellom rollene.',
    severity: 'high',
  },
  {
    personId: 'person-monica-maeland',
    personName: 'Monica Mæland',
    politicalRole: 'Næringsminister (2013-2018)',
    politicalOrg: 'Nærings- og fiskeridepartementet',
    boardRole: 'Styremedlem (2022-)',
    boardOrg: 'DNB ASA',
    sector: 'finans',
    conflictType: 'revolving_door',
    description: 'Tidligere næringsminister med ansvar for statlig eierskap, nå i styret til statsdominert bank.',
    severity: 'medium',
  },
  {
    personId: 'person-nikolai-astrup',
    personName: 'Nikolai Astrup',
    politicalRole: 'Stortingsrepresentant, Digitaliseringsminister',
    politicalOrg: 'Høyre / Kommunaldepartementet',
    boardRole: 'Styremedlem (2022-)',
    boardOrg: 'Equinor ASA',
    sector: 'energi',
    conflictType: 'sector_overlap',
    description: 'Tidligere politiker med innflytelse på energipolitikk, nå i styret til statens største energiselskap.',
    severity: 'medium',
  },
  {
    personId: 'person-jan-tore-sanner',
    personName: 'Jan Tore Sanner',
    politicalRole: 'Finansminister (2020-2021)',
    politicalOrg: 'Finansdepartementet',
    boardRole: 'Styremedlem (2022-)',
    boardOrg: 'Norsk Hydro ASA',
    sector: 'energi',
    conflictType: 'revolving_door',
    description: 'Tidligere finansminister med budsjettansvar, raskt over i industristyret etter regjeringsskiftet.',
    severity: 'medium',
  },
];

const politicalNodes: GraphNode[] = [
  { id: 'person-jonas-gahr-store', name: 'Jonas Gahr Støre', type: 'person', group: 'person' },
  { id: 'person-erna-solberg', name: 'Erna Solberg', type: 'person', group: 'person' },
  { id: 'person-trygve-slagsvold-vedum', name: 'Trygve Slagsvold Vedum', type: 'person', group: 'person' },
  { id: 'person-jan-tore-sanner', name: 'Jan Tore Sanner', type: 'person', group: 'person' },
  { id: 'person-anniken-huitfeldt', name: 'Anniken Huitfeldt', type: 'person', group: 'person' },
  { id: 'person-nikolai-astrup', name: 'Nikolai Astrup', type: 'person', group: 'person' },
  { id: 'person-monica-maeland', name: 'Monica Mæland', type: 'person', group: 'person' },
  { id: 'person-torbjorn-roe-isaksen', name: 'Torbjørn Røe Isaksen', type: 'person', group: 'person' },

  { id: 'org-arbeiderpartiet', name: 'Arbeiderpartiet', type: 'political_party', group: 'political' },
  { id: 'org-hoyre', name: 'Høyre', type: 'political_party', group: 'political' },
  { id: 'org-senterpartiet', name: 'Senterpartiet', type: 'political_party', group: 'political' },

  { id: 'org-statsministerens-kontor', name: 'Statsministerens kontor', type: 'government_body', group: 'government' },
  { id: 'org-finansdepartementet', name: 'Finansdepartementet', type: 'government_body', group: 'government' },
  { id: 'org-utenriksdepartementet', name: 'Utenriksdepartementet', type: 'government_body', group: 'government' },
  { id: 'org-naringsdepartementet', name: 'Nærings- og fiskeridepartementet', type: 'government_body', group: 'government' },
  { id: 'org-stortinget', name: 'Stortinget', type: 'government_body', group: 'government' },

  { id: 'org-dnb', name: 'DNB ASA', type: 'company', group: 'company' },
  { id: 'org-equinor', name: 'Equinor ASA', type: 'company', group: 'company' },
  { id: 'org-telenor', name: 'Telenor ASA', type: 'company', group: 'company' },
  { id: 'org-norsk-hydro', name: 'Norsk Hydro ASA', type: 'company', group: 'company' },
  { id: 'org-nho', name: 'NHO', type: 'company', group: 'company' },
];

const politicalLinks: GraphLink[] = [
  // Party leadership
  { source: 'person-jonas-gahr-store', target: 'org-arbeiderpartiet', label: 'Partileder', category: 'political' },
  { source: 'person-erna-solberg', target: 'org-hoyre', label: 'Partileder', category: 'political' },
  { source: 'person-trygve-slagsvold-vedum', target: 'org-senterpartiet', label: 'Partileder', category: 'political' },
  { source: 'person-jan-tore-sanner', target: 'org-hoyre', label: 'Medlem', category: 'political' },
  { source: 'person-anniken-huitfeldt', target: 'org-arbeiderpartiet', label: 'Medlem', category: 'political' },
  { source: 'person-nikolai-astrup', target: 'org-hoyre', label: 'Medlem', category: 'political' },
  { source: 'person-monica-maeland', target: 'org-hoyre', label: 'Medlem', category: 'political' },
  { source: 'person-torbjorn-roe-isaksen', target: 'org-hoyre', label: 'Medlem', category: 'political' },

  // Government positions
  { source: 'person-jonas-gahr-store', target: 'org-statsministerens-kontor', label: 'Statsminister', category: 'government' },
  { source: 'person-trygve-slagsvold-vedum', target: 'org-finansdepartementet', label: 'Finansminister', category: 'government' },
  { source: 'person-anniken-huitfeldt', target: 'org-utenriksdepartementet', label: 'Utenriksminister', category: 'government' },
  { source: 'person-erna-solberg', target: 'org-statsministerens-kontor', label: 'Tidl. Statsminister (2013-2021)', category: 'government' },
  { source: 'person-jan-tore-sanner', target: 'org-finansdepartementet', label: 'Tidl. Finansminister', category: 'government' },
  { source: 'person-monica-maeland', target: 'org-naringsdepartementet', label: 'Tidl. Næringsminister', category: 'government' },

  // Stortinget
  { source: 'person-erna-solberg', target: 'org-stortinget', label: 'Stortingsrepresentant', category: 'political' },
  { source: 'person-nikolai-astrup', target: 'org-stortinget', label: 'Stortingsrepresentant', category: 'political' },
  { source: 'person-jan-tore-sanner', target: 'org-stortinget', label: 'Stortingsrepresentant', category: 'political' },

  // Board/corporate positions (public information about revolving doors)
  { source: 'person-torbjorn-roe-isaksen', target: 'org-nho', label: 'Adm. direktør', category: 'executive' },
  { source: 'person-monica-maeland', target: 'org-dnb', label: 'Styremedlem', category: 'board' },
  { source: 'person-nikolai-astrup', target: 'org-equinor', label: 'Tidl. styremedlem', category: 'board' },
];

export function getPoliticalData(): GraphData {
  return {
    nodes: [...politicalNodes],
    links: [...politicalLinks],
  };
}

export function searchPoliticalPersons(query: string): GraphNode[] {
  const q = query.toLowerCase();
  return politicalNodes.filter(
    (n) => n.name.toLowerCase().includes(q)
  );
}

export function getPersonPoliticalNetwork(personId: string): GraphData {
  const relevantLinks = politicalLinks.filter(
    (l) => l.source === personId || l.target === personId
  );

  const nodeIds = new Set<string>();
  nodeIds.add(personId);
  relevantLinks.forEach((l) => {
    nodeIds.add(l.source);
    nodeIds.add(l.target);
  });

  const nodes = politicalNodes.filter((n) => nodeIds.has(n.id));
  return { nodes, links: relevantLinks };
}

export function getPersonTimeline(personId: string): PositionTimeline | null {
  return timelines.find((t) => t.personId === personId) || null;
}

export function getAllTimelines(): PositionTimeline[] {
  return timelines;
}

export function getConflictsForPerson(personId: string): ConflictOfInterest[] {
  return conflicts.filter((c) => c.personId === personId);
}

export function getAllConflicts(): ConflictOfInterest[] {
  return conflicts;
}

export function getOrgSectors(): Record<string, string[]> {
  return ORG_SECTORS;
}
