import { useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, GraphNode } from '../services/api';
import * as THREE from 'three';
import { useI18n } from '../I18nContext';

const NODE_COLORS: Record<string, string> = {
  person: '#60a5fa',
  company: '#34d399',
  political_party: '#f472b6',
  government_body: '#fbbf24',
};

const LINK_COLORS: Record<string, string> = {
  board: '#34d399',
  political: '#f472b6',
  government: '#fbbf24',
  executive: '#a78bfa',
};

interface Props {
  data: GraphData;
  onNodeClick: (node: GraphNode) => void;
  selectedNode: GraphNode | null;
  highlightedNodeIds?: Set<string>;
  darkMode?: boolean;
}

export default function NetworkGraph({ data, onNodeClick, selectedNode, highlightedNodeIds, darkMode }: Props) {
  const { t } = useI18n();
  const fgRef = useRef<any>(null);

  useEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge').strength(-200);
      fgRef.current.d3Force('link').distance(80);
    }
  }, []);

  // Focus on selected node
  useEffect(() => {
    if (selectedNode && fgRef.current) {
      const node = selectedNode as any;
      if (node.x !== undefined) {
        const distance = 150;
        const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 0);
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: (node.z || 0) * distRatio },
          { x: node.x, y: node.y, z: node.z || 0 },
          1000
        );
      }
    }
  }, [selectedNode]);

  const nodeThreeObject = useCallback((node: any) => {
    const isSelected = selectedNode?.id === node.id;
    const isHighlighted = highlightedNodeIds?.has(node.id) === true;
    const hasHighlights = (highlightedNodeIds?.size || 0) > 0;
    const color = NODE_COLORS[node.type] || '#94a3b8';
    const radius = node.type === 'person' ? 5 : 7;

    const group = new THREE.Group();

    // Sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: hasHighlights && !isSelected && !isHighlighted ? 0.35 : 0.9,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Selection ring
    if (isSelected) {
      const ringGeometry = new THREE.RingGeometry(radius + 2, radius + 3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#cf0a2c',
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      group.add(ring);
    } else if (isHighlighted) {
      const ringGeometry = new THREE.RingGeometry(radius + 1.5, radius + 2.5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#1f4f7f',
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      group.add(ring);
    }

    // Text label
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;
    ctx.font = '24px Sans-Serif';
    ctx.fillStyle = darkMode ? '#e0e0e0' : '#1a1a2e';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(40, 10, 1);
    sprite.position.set(0, -(radius + 6), 0);
    group.add(sprite);

    return group;
  }, [highlightedNodeIds, selectedNode, darkMode]);

  const nodeLabel = useCallback((node: GraphNode) => {
    const badgeColor = NODE_COLORS[node.type] || '#475569';
    const typeLabel = node.type === 'person'
      ? t('node.person')
      : node.type === 'company'
      ? t('node.company')
      : node.type === 'political_party'
      ? t('node.party')
      : t('node.government');
    const partyLine = node.type === 'person' && node.meta?.party
      ? `<div style="font-size:12px;color:#cbd5e1;margin-top:4px;">${escapeHtml(node.meta.party)}</div>`
      : '';

    return `
      <div style="background:#111827;color:#ffffff;padding:10px 12px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);max-width:240px;">
        <div style="font-weight:700;font-size:14px;line-height:1.4;">${escapeHtml(node.name)}</div>
        ${partyLine}
        <div style="margin-top:8px;display:inline-block;background:${badgeColor};color:#ffffff;border-radius:9999px;padding:3px 8px;font-size:11px;font-weight:700;">
          ${escapeHtml(typeLabel)}
        </div>
      </div>
    `;
  }, [t]);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeId="id"
      nodeLabel={nodeLabel}
      nodeThreeObject={nodeThreeObject}
      nodeThreeObjectExtend={false}
      linkColor={(link: any) => LINK_COLORS[link.category] || '#475569'}
      linkWidth={1.5}
      linkOpacity={0.6}
      linkDirectionalParticles={2}
      linkDirectionalParticleWidth={1.5}
      linkDirectionalParticleSpeed={0.005}
      linkLabel={(link: any) => link.label || ''}
      onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
      backgroundColor={darkMode ? '#0f0f1a' : '#faf9f7'}
      width={window.innerWidth}
      height={window.innerHeight - 70}
      showNavInfo={false}
    />
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
