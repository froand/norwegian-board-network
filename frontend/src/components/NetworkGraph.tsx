import { useRef, useCallback, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { GraphData, GraphNode } from '../services/api';

const NODE_COLORS: Record<string, string> = {
  person: '#60a5fa',        // blue
  company: '#34d399',       // green
  political_party: '#f472b6', // pink
  government_body: '#fbbf24', // amber
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
      fgRef.current.d3Force('charge').strength(-300);
      fgRef.current.d3Force('link').distance(100);
    }
  }, []);

  // Focus on selected node
  useEffect(() => {
    if (selectedNode && fgRef.current) {
      fgRef.current.centerAt(
        (selectedNode as any).x,
        (selectedNode as any).y,
        800
      );
      fgRef.current.zoom(2, 800);
    }
  }, [selectedNode]);

  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = Math.max(12 / globalScale, 3);
      const isSelected = selectedNode?.id === node.id;
      const radius = node.type === 'person' ? 6 : 8;

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = NODE_COLORS[node.type] || '#94a3b8';
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(label, node.x, node.y + radius + 2);
    },
    [selectedNode]
  );

  const paintLink = useCallback(
    (link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const start = link.source;
      const end = link.target;
      if (!start || !end || typeof start.x !== 'number') return;

      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = LINK_COLORS[link.category] || '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Link label
      if (globalScale > 1.5) {
        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        const fontSize = Math.max(9 / globalScale, 2);
        ctx.font = `${fontSize}px Sans-Serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(link.label || '', midX, midY);
      }
    },
    []
  );

  return (
    <ForceGraph2D
      ref={fgRef}
      graphData={data}
      nodeId="id"
      nodeCanvasObject={paintNode}
      nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
      }}
      linkCanvasObject={paintLink}
      onNodeClick={(node: any) => onNodeClick(node as GraphNode)}
      backgroundColor="#0f172a"
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
}
