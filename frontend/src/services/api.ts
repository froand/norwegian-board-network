const API_BASE = '/api';

export interface SearchResult {
  persons: { id: string; name: string; type: string }[];
  companies: { id: string; name: string; orgNumber: string; type: string }[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: 'person' | 'company' | 'political_party' | 'government_body';
  group: string;
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
