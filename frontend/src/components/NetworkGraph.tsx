import { useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import type { GraphData, GraphNode } from '../services/api';
import * as THREE from 'three';

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
}

export default function NetworkGraph({ data, onNodeClick, selectedNode }: Props) {
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
    const color = NODE_COLORS[node.type] || '#94a3b8';
    const radius = node.type === 'person' ? 5 : 7;

    const group = new THREE.Group();

    // Sphere
    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshLambertMaterial({
      color,
      transparent: true,
      opacity: 0.9,
    });
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);

    // Selection ring
    if (isSelected) {
      const ringGeometry = new THREE.RingGeometry(radius + 2, radius + 3, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: '#ffffff',
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
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, 128, 40);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(40, 10, 1);
    sprite.position.set(0, -(radius + 6), 0);
    group.add(sprite);

    return group;
  }, [selectedNode]);

  return (
    <ForceGraph3D
      ref={fgRef}
      graphData={data}
      nodeId="id"
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
      backgroundColor="#0f172a"
      width={window.innerWidth}
      height={window.innerHeight}
      showNavInfo={false}
    />
  );
}
