import { Router } from 'express';
import { getCompanyRoles, getPersonRolesNetwork } from '../services/brreg.js';
import { getPoliticalData, getPersonPoliticalNetwork, getPersonTimeline, getAllTimelines, getConflictsForPerson, getAllConflicts } from '../services/political-data.js';
import { getPartyRepresentatives, getPersonDetails } from '../services/stortinget.js';
import type { GraphData } from '../types.js';

export const graphRoutes = Router();

// Get full overview graph (political data + optional company data)
graphRoutes.get('/overview', (_req, res) => {
  const data = getPoliticalData();
  res.json(data);
});

// Get graph centered on a specific person (combines political + brreg data)
graphRoutes.get('/person/:personId', async (req, res) => {
  const { personId } = req.params;

  // Get political connections
  const political = getPersonPoliticalNetwork(personId);

  // Also try to find their brreg roles by extracting the name from the ID
  const personName = personId
    .replace('person-', '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  let brreg: GraphData = { nodes: [], links: [] };
  try {
    brreg = await getPersonRolesNetwork(personName);
  } catch (e) {
    console.error('Failed to fetch brreg roles for person:', e);
  }

  // Merge both
  const merged = mergeGraphData(political, brreg);
  res.json(merged);
});

// Get graph for a company (from brreg.no)
graphRoutes.get('/company/:orgNumber', async (req, res) => {
  const { orgNumber } = req.params;
  try {
    const data = await getCompanyRoles(orgNumber);
    res.json(data);
  } catch (error) {
    console.error('Company graph error:', error);
    res.status(500).json({ error: 'Failed to fetch company data' });
  }
});

// Search a person by name and get all their roles
graphRoutes.get('/person-by-name/:name', async (req, res) => {
  const { name } = req.params;
  try {
    const political = getPersonPoliticalNetwork(
      `person-${name.toLowerCase().replace(/\s+/g, '-')}`
    );
    const brreg = await getPersonRolesNetwork(name);
    const merged = mergeGraphData(political, brreg);
    res.json(merged);
  } catch (error) {
    console.error('Person search error:', error);
    res.status(500).json({ error: 'Failed to fetch person data' });
  }
});

// Merge multiple data sources for a combined graph
graphRoutes.get('/expand/:nodeId', async (req, res) => {
  const { nodeId } = req.params;

  const result: GraphData = { nodes: [], links: [] };

  // If it's a person, get their political network + brreg roles
  if (nodeId.startsWith('person-')) {
    const political = getPersonPoliticalNetwork(nodeId);
    result.nodes.push(...political.nodes);
    result.links.push(...political.links);

    const personName = nodeId
      .replace('person-', '')
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    try {
      const brreg = await getPersonRolesNetwork(personName);
      result.nodes.push(...brreg.nodes);
      result.links.push(...brreg.links);
    } catch (e) {
      // continue with what we have
    }
  }

  // If it's a company with org number, fetch from brreg
  if (nodeId.startsWith('org-') && /^\d+$/.test(nodeId.replace('org-', ''))) {
    const orgNumber = nodeId.replace('org-', '');
    const companyData = await getCompanyRoles(orgNumber);
    result.nodes.push(...companyData.nodes);
    result.links.push(...companyData.links);
  }

  // If it's a political party, fetch representatives from Stortinget
  if (nodeId.startsWith('org-') && !(/^\d+$/.test(nodeId.replace('org-', '')))) {
    try {
      const partyData = await getPartyRepresentatives(nodeId);
      result.nodes.push(...partyData.nodes);
      result.links.push(...partyData.links);
    } catch (e) {
      // continue without stortinget data
    }
  }

  res.json(result);
});

function mergeGraphData(a: GraphData, b: GraphData): GraphData {
  const nodeMap = new Map(a.nodes.map((n) => [n.id, n]));
  for (const node of b.nodes) {
    if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
  }

  const linkSet = new Set(a.links.map((l) => `${l.source}-${l.target}-${l.label}`));
  const links = [...a.links];
  for (const link of b.links) {
    const key = `${link.source}-${link.target}-${link.label}`;
    if (!linkSet.has(key)) {
      linkSet.add(key);
      links.push(link);
    }
  }

  return { nodes: Array.from(nodeMap.values()), links };
}

// Timeline endpoints
graphRoutes.get('/timeline/:personId', (req, res) => {
  const { personId } = req.params;
  const timeline = getPersonTimeline(personId);
  if (!timeline) {
    res.status(404).json({ error: 'No timeline data for this person' });
    return;
  }
  res.json(timeline);
});

graphRoutes.get('/timelines', (_req, res) => {
  res.json(getAllTimelines());
});

// Conflict of interest endpoints
graphRoutes.get('/conflicts', (_req, res) => {
  res.json(getAllConflicts());
});

graphRoutes.get('/conflicts/:personId', (req, res) => {
  const { personId } = req.params;
  res.json(getConflictsForPerson(personId));
});

// Person details with positions
graphRoutes.get('/person-details/:personId', async (req, res) => {
  const { personId } = req.params;
  try {
    const details = await getPersonDetails(personId);
    if (!details) {
      res.status(404).json({ error: 'Person not found in Stortinget data' });
      return;
    }
    res.json(details);
  } catch (e) {
    console.error('Error fetching person details:', e);
    res.status(500).json({ error: 'Failed to fetch person details' });
  }
});
