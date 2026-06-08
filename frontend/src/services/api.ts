const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export interface SearchResult {
  persons: { id: string; name: string; type: string }[];
  companies: { id: string; name: string; orgNumber: string; type: string }[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'person' | 'company' | 'political_party' | 'government_body';
  group: string;
  imageUrl?: string;
  meta?: {
    party?: string;
    fylke?: string;
    stortingetId?: string;
  };
}

export interface GraphLink {
  source: string;
  target: string;
  label: string;
  category: 'board' | 'political' | 'government' | 'executive';
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export async function search(query: string): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getOverviewGraph(): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph/overview`);
  if (!res.ok) throw new Error('Failed to fetch graph');
  return res.json();
}

export async function getPersonGraph(personId: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph/person/${encodeURIComponent(personId)}`);
  if (!res.ok) throw new Error('Failed to fetch person graph');
  return res.json();
}

export async function getPersonByNameGraph(name: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph/person-by-name/${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Failed to fetch person graph');
  return res.json();
}

export async function getCompanyGraph(orgNumber: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph/company/${encodeURIComponent(orgNumber)}`);
  if (!res.ok) throw new Error('Failed to fetch company graph');
  return res.json();
}

export async function expandNode(nodeId: string): Promise<GraphData> {
  const res = await fetch(`${API_BASE}/graph/expand/${encodeURIComponent(nodeId)}`);
  if (!res.ok) throw new Error('Failed to expand node');
  return res.json();
}

// Timeline types and API
export interface TimelinePosition {
  orgId: string;
  orgName: string;
  role: string;
  category: 'board' | 'political' | 'government' | 'executive';
  sector?: string;
  startYear: number;
  endYear?: number;
}

export interface PersonTimeline {
  personId: string;
  personName: string;
  positions: TimelinePosition[];
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
  severity: 'critical' | 'high' | 'medium' | 'low';
  classification?: 'A' | 'B' | 'C' | 'D';
  sources?: { label: string; url: string }[];
}

export async function getPersonTimeline(personId: string): Promise<PersonTimeline | null> {
  const res = await fetch(`${API_BASE}/graph/timeline/${encodeURIComponent(personId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch timeline');
  return res.json();
}

export async function getAllConflicts(): Promise<ConflictOfInterest[]> {
  const res = await fetch(`${API_BASE}/graph/conflicts`);
  if (!res.ok) throw new Error('Failed to fetch conflicts');
  return res.json();
}

export interface ShortestPathResult {
  path: { nodes: string[]; links: { source: string; target: string; label: string }[] } | null;
}

export async function getShortestPath(fromId: string, toId: string): Promise<ShortestPathResult> {
  const res = await fetch(`${API_BASE}/graph/shortest-path?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`);
  if (!res.ok) throw new Error('Failed to find path');
  return res.json();
}

export interface Cluster {
  id: string;
  members: { id: string; name: string }[];
  sharedOrgs: { id: string; name: string }[];
  strength: number;
}

export async function getClusters(): Promise<Cluster[]> {
  const res = await fetch(`${API_BASE}/graph/clusters`);
  if (!res.ok) throw new Error('Failed to fetch clusters');
  return res.json();
}

export async function getPersonConflicts(personId: string): Promise<ConflictOfInterest[]> {
  const res = await fetch(`${API_BASE}/graph/conflicts/${encodeURIComponent(personId)}`);
  if (!res.ok) throw new Error('Failed to fetch conflicts');
  return res.json();
}

// Company details
export interface PoliticalConnection {
  personId: string;
  personName: string;
  role: string;
  category: 'board' | 'political' | 'government' | 'executive';
  startYear: number;
  endYear?: number;
  isRevolvingDoor: boolean;
  previousPoliticalRole?: string;
}

export interface LiveBoardMember {
  name: string;
  role: string;
  roleCode: string;
  groupCode: string;
  isPolitician: boolean;
  politicianId?: string;
}

export interface CompanyDetails {
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
  liveBoard: LiveBoardMember[];
  isDeleted?: boolean;
  deletedDate?: string | null;
}

export async function getCompanyDetails(orgNumber: string): Promise<CompanyDetails | null> {
  const res = await fetch(`${API_BASE}/company/${encodeURIComponent(orgNumber)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch company details');
  return res.json();
}

// Person details with positions
export interface PersonPosition {
  title: string;
  organization: string;
  type: 'political' | 'government' | 'private' | 'board' | 'committee';
  startYear?: number;
  endYear?: number | null;
  isCurrent: boolean;
  description?: string;
}

export interface PersonDetails {
  id: string;
  name: string;
  party?: string;
  fylke?: string;
  email?: string;
  birthYear?: number;
  imageUrl?: string;
  committees?: string[];
  currentPositions: PersonPosition[];
  pastPositions: PersonPosition[];
}

export async function getPersonDetails(personId: string): Promise<PersonDetails | null> {
  const res = await fetch(`${API_BASE}/graph/person-details/${encodeURIComponent(personId)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to fetch person details');
  return res.json();
}

export interface KaranteneDecision {
  id: string;
  personName: string;
  date: string;
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

export async function getKarantene(personId: string): Promise<KaranteneDecision[]> {
  const res = await fetch(`${API_BASE}/karantene/${encodeURIComponent(personId)}`);
  if (!res.ok) throw new Error('Failed to fetch karantene decisions');
  return res.json();
}
