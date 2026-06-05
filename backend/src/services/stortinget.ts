import type { GraphData, GraphNode, GraphLink } from '../types.js';

// Stortinget.no open data API
const STORTINGET_BASE = 'https://data.stortinget.no/eksport';

interface StortingetRepresentant {
  id: string;
  fornavn: string;
  etternavn: string;
  foedselsdato: string;
  kjoenn: number;
  fylke: { id: string; navn: string };
  parti: { id: string; navn: string; representert_parti: boolean };
  vara_representant: boolean;
}

interface StortingetResponse {
  representanter_liste: StortingetRepresentant[];
}

// Map Stortinget party IDs to our org IDs
const PARTY_ID_MAP: Record<string, { id: string; name: string }> = {
  'A': { id: 'org-arbeiderpartiet', name: 'Arbeiderpartiet' },
  'H': { id: 'org-hoyre', name: 'Høyre' },
  'Sp': { id: 'org-senterpartiet', name: 'Senterpartiet' },
  'FrP': { id: 'org-fremskrittspartiet', name: 'Fremskrittspartiet' },
  'SV': { id: 'org-sosialistisk-venstreparti', name: 'Sosialistisk Venstreparti' },
  'V': { id: 'org-venstre', name: 'Venstre' },
  'KrF': { id: 'org-kristelig-folkeparti', name: 'Kristelig Folkeparti' },
  'MDG': { id: 'org-miljopartiet-de-gronne', name: 'Miljøpartiet De Grønne' },
  'R': { id: 'org-rodt', name: 'Rødt' },
  'PF': { id: 'org-pasientfokus', name: 'Pasientfokus' },
};

let cachedRepresentatives: StortingetRepresentant[] | null = null;

async function fetchRepresentatives(): Promise<StortingetRepresentant[]> {
  if (cachedRepresentatives) return cachedRepresentatives;

  try {
    const res = await fetch(`${STORTINGET_BASE}/representanter?format=json&periodeid=2021-2025`);
    if (!res.ok) throw new Error(`Stortinget API error: ${res.status}`);
    const data: StortingetResponse = await res.json();
    cachedRepresentatives = data.representanter_liste || [];
    return cachedRepresentatives;
  } catch (e) {
    console.error('Failed to fetch from Stortinget API:', e);
    return [];
  }
}

export async function getPartyRepresentatives(partyId: string): Promise<GraphData> {
  const reps = await fetchRepresentatives();

  // Map our internal party ID to Stortinget party code
  let stortingetPartyCode: string | null = null;
  for (const [code, info] of Object.entries(PARTY_ID_MAP)) {
    if (info.id === partyId) {
      stortingetPartyCode = code;
      break;
    }
  }

  if (!stortingetPartyCode) return { nodes: [], links: [] };

  const partyReps = reps.filter(
    (r) => r.parti.id === stortingetPartyCode && !r.vara_representant
  );

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seenNodes = new Set<string>();

  // Add party node
  const partyInfo = PARTY_ID_MAP[stortingetPartyCode];
  nodes.push({
    id: partyInfo.id,
    name: partyInfo.name,
    type: 'political_party',
    group: 'political',
  });
  seenNodes.add(partyInfo.id);

  // Add Stortinget node
  const stortingetId = 'org-stortinget';
  nodes.push({
    id: stortingetId,
    name: 'Stortinget',
    type: 'government_body',
    group: 'government',
  });
  seenNodes.add(stortingetId);

  // Add representatives
  for (const rep of partyReps) {
    const personId = `person-${rep.fornavn.toLowerCase()}-${rep.etternavn.toLowerCase()}`.replace(/\s+/g, '-');

    if (!seenNodes.has(personId)) {
      nodes.push({
        id: personId,
        name: `${rep.fornavn} ${rep.etternavn}`,
        type: 'person',
        group: 'person',
        imageUrl: `https://data.stortinget.no/eksport/personbilde?personid=${rep.id}&storrelse=middels`,
        meta: {
          party: partyInfo.name,
          fylke: rep.fylke.navn,
          stortingetId: rep.id,
        },
      });
      seenNodes.add(personId);
    }

    // Link to party
    links.push({
      source: personId,
      target: partyInfo.id,
      label: 'Medlem',
      category: 'political',
    });

    // Link to Stortinget
    links.push({
      source: personId,
      target: stortingetId,
      label: `Stortingsrep. (${rep.fylke.navn})`,
      category: 'political',
    });
  }

  return { nodes, links };
}

export async function getAllStortingetData(): Promise<GraphData> {
  const reps = await fetchRepresentatives();

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const seenNodes = new Set<string>();

  // Add Stortinget node
  nodes.push({ id: 'org-stortinget', name: 'Stortinget', type: 'government_body', group: 'government' });
  seenNodes.add('org-stortinget');

  // Add all parties
  for (const [code, info] of Object.entries(PARTY_ID_MAP)) {
    if (!seenNodes.has(info.id)) {
      nodes.push({ id: info.id, name: info.name, type: 'political_party', group: 'political' });
      seenNodes.add(info.id);
    }
  }

  // Add all non-vara representatives
  for (const rep of reps.filter((r) => !r.vara_representant)) {
    const personId = `person-${rep.fornavn.toLowerCase()}-${rep.etternavn.toLowerCase()}`.replace(/\s+/g, '-');
    const partyInfo = PARTY_ID_MAP[rep.parti.id];
    if (!partyInfo) continue;

    if (!seenNodes.has(personId)) {
      nodes.push({
        id: personId,
        name: `${rep.fornavn} ${rep.etternavn}`,
        type: 'person',
        group: 'person',
        imageUrl: `https://data.stortinget.no/eksport/personbilde?personid=${rep.id}&storrelse=middels`,
        meta: {
          party: partyInfo.name,
          fylke: rep.fylke.navn,
          stortingetId: rep.id,
        },
      });
      seenNodes.add(personId);
    }

    links.push({ source: personId, target: partyInfo.id, label: 'Medlem', category: 'political' });
    links.push({ source: personId, target: 'org-stortinget', label: `Stortingsrep. (${rep.fylke.navn})`, category: 'political' });
  }

  return { nodes, links };
}

export async function searchStortingetPersons(query: string): Promise<GraphNode[]> {
  const reps = await fetchRepresentatives();
  const q = query.toLowerCase();

  return reps
    .filter((r) => `${r.fornavn} ${r.etternavn}`.toLowerCase().includes(q))
    .slice(0, 15)
    .map((r) => ({
      id: `person-${r.fornavn.toLowerCase()}-${r.etternavn.toLowerCase()}`.replace(/\s+/g, '-'),
      name: `${r.fornavn} ${r.etternavn}`,
      type: 'person' as const,
      group: 'person',
    }));
}
