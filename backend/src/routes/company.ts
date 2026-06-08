import { Router } from 'express';
import { getAllTimelines, getAllConflicts } from '../services/political-data.js';

export const companyRoutes = Router();

// Map curated org IDs (without 'org-' prefix) to real Brreg org numbers
const ORG_NUMBER_MAP: Record<string, string> = {
  'nho': '955600436',
  'dnb': '984851006',
  'equinor': '923609016',
  'telenor': '982463718',
  'norsk-hydro': '914778271',
};

// State ownership percentages (from regjeringen.no/eierskapsmeldingen)
const STATE_OWNERSHIP: Record<string, { percent: number; source: string }> = {
  '923609016': { percent: 67, source: 'Nærings- og fiskeridepartementet' },
  '984851006': { percent: 34, source: 'Nærings- og fiskeridepartementet' },
  '982463718': { percent: 54, source: 'Nærings- og fiskeridepartementet' },
  '914778271': { percent: 34.3, source: 'Nærings- og fiskeridepartementet' },
};

interface CompanyDetails {
  orgNumber: string;
  name: string;
  organizationForm: string;
  industry: string[];
  employees: number | null;
  founded: string | null;
  registered: string | null;
  location: string | null;
  website: string | null;
  ownershipSector: string | null;
  purpose: string | null;
  isStateOwned: boolean;
  isPubliclyListed: boolean;
  isBankrupt: boolean;
  lastAnnualReport: string | null;
  phone: string | null;
  stateOwnershipPercent: number | null;
  stateOwnershipSource: string | null;
  politicalConnections: PoliticalConnection[];
  entanglementScore: number;
  revolvingDoorCount: number;
}

interface PoliticalConnection {
  personId: string;
  personName: string;
  role: string;
  category: 'board' | 'political' | 'government' | 'executive';
  startYear: number;
  endYear?: number;
  isRevolvingDoor: boolean;
  previousPoliticalRole?: string;
}

function resolveOrgNumber(input: string): string {
  return ORG_NUMBER_MAP[input] || input;
}

function getPoliticalConnectionsForOrg(orgId: string): {
  connections: PoliticalConnection[];
  entanglementScore: number;
  revolvingDoorCount: number;
} {
  const timelines = getAllTimelines();
  const conflicts = getAllConflicts();
  const connections: PoliticalConnection[] = [];

  for (const timeline of timelines) {
    for (const pos of timeline.positions) {
      if (pos.orgId === orgId) {
        // Check if this person had a political/government role BEFORE this position
        const politicalRoles = timeline.positions.filter(
          (p) =>
            (p.category === 'political' || p.category === 'government') &&
            p.startYear < pos.startYear
        );

        const isRevolvingDoor = politicalRoles.length > 0 &&
          (pos.category === 'board' || pos.category === 'executive');

        const previousPoliticalRole = isRevolvingDoor
          ? politicalRoles
              .sort((a, b) => b.startYear - a.startYear)[0]
              ?.role + ' (' + politicalRoles.sort((a, b) => b.startYear - a.startYear)[0]?.orgName + ')'
          : undefined;

        connections.push({
          personId: timeline.personId,
          personName: timeline.personName,
          role: pos.role,
          category: pos.category,
          startYear: pos.startYear,
          endYear: pos.endYear,
          isRevolvingDoor,
          previousPoliticalRole,
        });
      }
    }
  }

  const revolvingDoorCount = connections.filter((c) => c.isRevolvingDoor).length;

  // Entanglement score (0-100):
  // - Each political connection: +15
  // - Each revolving door: +25
  // - Each active conflict: +20
  // - Cap at 100
  const orgConflicts = conflicts.filter(
    (c) => c.boardOrg === orgId.replace('org-', '') ||
      connections.some((conn) => conn.personId === c.personId)
  );

  const score = Math.min(
    100,
    connections.length * 15 + revolvingDoorCount * 25 + orgConflicts.length * 20
  );

  return { connections, entanglementScore: score, revolvingDoorCount };
}

companyRoutes.get('/:orgNumber', async (req, res) => {
  const { orgNumber } = req.params;
  const resolvedOrgNumber = resolveOrgNumber(orgNumber);
  const orgId = `org-${orgNumber}`;

  // Get political connections regardless of Brreg lookup success
  const { connections, entanglementScore, revolvingDoorCount } =
    getPoliticalConnectionsForOrg(orgId);

  try {
    const response = await fetch(
      `https://data.brreg.no/enhetsregisteret/api/enheter/${resolvedOrgNumber}`
    );

    if (!response.ok) {
      // Even if Brreg fails, return political connection data
      if (connections.length > 0) {
        res.json({
          orgNumber: resolvedOrgNumber,
          name: orgNumber,
          organizationForm: 'Ukjent',
          industry: [],
          employees: null,
          founded: null,
          registered: null,
          location: null,
          website: null,
          ownershipSector: null,
          purpose: null,
          isStateOwned: false,
          isPubliclyListed: false,
          isBankrupt: false,
          lastAnnualReport: null,
          phone: null,
          stateOwnershipPercent: null,
          stateOwnershipSource: null,
          politicalConnections: connections,
          entanglementScore,
          revolvingDoorCount,
        });
        return;
      }
      res.status(404).json({ error: 'Company not found' });
      return;
    }

    const data = await response.json();

    const industries: string[] = [];
    if (data.naeringskode1) industries.push(data.naeringskode1.beskrivelse);
    if (data.naeringskode2) industries.push(data.naeringskode2.beskrivelse);
    if (data.naeringskode3) industries.push(data.naeringskode3.beskrivelse);

    const address = data.forretningsadresse;
    const location = address
      ? `${(address.adresse || []).join(', ')}, ${address.postnummer} ${address.poststed}`
      : null;

    const sectorDesc = data.institusjonellSektorkode?.beskrivelse || null;
    const isStateOwned = sectorDesc?.toLowerCase().includes('statlig') || false;

    const stateOwnership = STATE_OWNERSHIP[resolvedOrgNumber];

    const details: CompanyDetails = {
      orgNumber: data.organisasjonsnummer,
      name: data.navn,
      organizationForm: data.organisasjonsform?.beskrivelse || data.organisasjonsform?.kode || 'Ukjent',
      industry: industries,
      employees: data.antallAnsatte ?? null,
      founded: data.stiftelsesdato || null,
      registered: data.registreringsdatoEnhetsregisteret || null,
      location,
      website: data.hjemmeside || null,
      ownershipSector: sectorDesc,
      purpose: data.vedtektsfestetFormaal?.join(' ') || null,
      isStateOwned,
      isPubliclyListed: data.organisasjonsform?.kode === 'ASA',
      isBankrupt: data.konkurs || false,
      lastAnnualReport: data.sisteInnsendteAarsregnskap || null,
      phone: data.telefon || null,
      stateOwnershipPercent: stateOwnership?.percent ?? null,
      stateOwnershipSource: stateOwnership?.source ?? null,
      politicalConnections: connections,
      entanglementScore,
      revolvingDoorCount,
    };

    res.json(details);
  } catch (error) {
    console.error('Company details error:', error);
    res.status(500).json({ error: 'Failed to fetch company details' });
  }
});
