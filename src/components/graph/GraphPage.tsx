import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { getAllEntries, putEntry, deleteEntry } from '../../lib/db/entries';
import { EntryDetail } from '../entries/EntryDetail';
import type { JournalEntry } from '../../types';

const TYPE_COLORS: Record<string, string> = {
  work_log:     '#6366f1',
  decision:     '#d97706',
  problem:      '#dc2626',
  solution:     '#16a34a',
  meeting_note: '#2563eb',
  task:         '#7c3aed',
  learning:     '#0891b2',
  blocker:      '#b91c1c',
  risk:         '#ea580c',
};

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  kind: 'entry' | 'tag';
  entry?: JournalEntry;
  color: string;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  linkType: 'tag' | 'reference';
}

export function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [entryCount, setEntryCount] = useState(0);

  const buildGraph = useCallback(async () => {
    const entries = await getAllEntries();
    setEntryCount(entries.length);
    setLoading(false);

    const container = containerRef.current;
    const svgEl = svgRef.current;
    if (!container || !svgEl) return;

    const W = container.clientWidth;
    const H = container.clientHeight || 520;

    // Clear previous render
    d3.select(svgEl).selectAll('*').remove();

    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    const entryNodeMap = new Map<string, GraphNode>();
    const tagNodeMap = new Map<string, GraphNode>();

    // Entry nodes
    for (const e of entries) {
      const node: GraphNode = {
        id: `entry:${e.id}`,
        label: e.raw_text.slice(0, 40) + (e.raw_text.length > 40 ? '…' : ''),
        kind: 'entry',
        entry: e,
        color: TYPE_COLORS[e.entry_type] ?? '#888',
        radius: 7,
      };
      nodes.push(node);
      entryNodeMap.set(e.id, node);
    }

    // Tag nodes + entry→tag links
    for (const e of entries) {
      for (const tag of e.tags) {
        if (!tagNodeMap.has(tag)) {
          const tagNode: GraphNode = {
            id: `tag:${tag}`,
            label: `#${tag}`,
            kind: 'tag',
            color: '#a1a1aa',
            radius: 5,
          };
          nodes.push(tagNode);
          tagNodeMap.set(tag, tagNode);
        }
        links.push({
          source: `entry:${e.id}`,
          target: `tag:${tag}`,
          linkType: 'tag',
        });
      }
    }

    // Entry→Entry links (manual references)
    for (const e of entries) {
      for (const linkedId of (e.links ?? [])) {
        if (entryNodeMap.has(linkedId)) {
          links.push({
            source: `entry:${e.id}`,
            target: `entry:${linkedId}`,
            linkType: 'reference',
          });
        }
      }
    }

    const svg = d3.select(svgEl)
      .attr('width', W)
      .attr('height', H);

    // Zoom/pan container
    const g = svg.append('g');
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Build node id → index lookup
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    // Resolve string source/target → node objects for simulation
    const simLinks = links.map((l) => ({
      ...l,
      source: nodeById.get(l.source as string)!,
      target: nodeById.get(l.target as string)!,
    })).filter((l) => l.source && l.target);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink<GraphNode, typeof simLinks[0]>(simLinks)
        .id((d) => d.id)
        .distance((l) => l.linkType === 'reference' ? 80 : 55)
        .strength((l) => l.linkType === 'reference' ? 0.8 : 0.4)
      )
      .force('charge', d3.forceManyBody().strength(-60))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius((d) => d.radius + 4));

    // Links
    const link = g.append('g')
      .selectAll('line')
      .data(simLinks)
      .join('line')
      .attr('stroke', (d) => d.linkType === 'reference' ? '#6366f1' : '#d4d4d8')
      .attr('stroke-width', (d) => d.linkType === 'reference' ? 1.5 : 0.8)
      .attr('stroke-opacity', 0.7);

    // Nodes
    const node = (g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle') as d3.Selection<SVGCircleElement, GraphNode, SVGGElement, unknown>)
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', (d) => d.kind === 'tag' ? 0.5 : 0.85)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5)
      .attr('cursor', (d) => d.kind === 'entry' ? 'pointer' : 'default')
      .on('mouseenter', (_event, d) => setHoveredNode(d))
      .on('mouseleave', () => setHoveredNode(null))
      .on('click', (_event, d) => {
        if (d.kind === 'entry' && d.entry) setSelectedEntry(d.entry);
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Labels for tag nodes only (entry labels are in tooltip)
    const tagLabels = g.append('g')
      .selectAll('text')
      .data(nodes.filter((n) => n.kind === 'tag'))
      .join('text')
      .text((d) => d.label)
      .attr('font-size', '9px')
      .attr('fill', 'var(--color-muted-fg)')
      .attr('text-anchor', 'middle')
      .attr('dy', (d) => -d.radius - 2)
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (d) => (d.source as GraphNode).x!)
        .attr('y1', (d) => (d.source as GraphNode).y!)
        .attr('x2', (d) => (d.target as GraphNode).x!)
        .attr('y2', (d) => (d.target as GraphNode).y!);

      node
        .attr('cx', (d) => d.x!)
        .attr('cy', (d) => d.y!);

      tagLabels
        .attr('x', (d) => d.x!)
        .attr('y', (d) => d.y!);
    });

    return () => simulation.stop();
  }, []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    buildGraph().then((c) => { cleanup = c; });
    const handler = () => buildGraph();
    window.addEventListener('workgraph:entry-saved', handler);
    return () => {
      cleanup?.();
      window.removeEventListener('workgraph:entry-saved', handler);
    };
  }, [buildGraph]);

  function handleUpdate(updated: JournalEntry) {
    setSelectedEntry((prev) => (prev?.id === updated.id ? updated : prev));
    putEntry(updated);
    window.dispatchEvent(new CustomEvent('workgraph:entry-saved'));
  }
  function handleDelete(id: string) {
    setSelectedEntry(null);
    deleteEntry(id).then(() => window.dispatchEvent(new CustomEvent('workgraph:entry-saved')));
  }

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h1 className="text-xl font-semibold text-foreground">Graph</h1>
          {!loading && (
            <p className="text-xs text-muted-foreground">{entryCount} entries</p>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center flex-1 text-sm text-muted-foreground">
            Loading graph…
          </div>
        )}

        {/* Hover tooltip */}
        {hoveredNode && hoveredNode.kind === 'entry' && hoveredNode.entry && (
          <div className="absolute top-4 right-4 z-10 bg-card border border-border rounded-md p-3 max-w-xs shadow-md pointer-events-none">
            <p className="text-xs font-medium text-foreground mb-1">
              {hoveredNode.entry.entry_type.replace('_', ' ')}
              {hoveredNode.entry.project && (
                <span className="text-muted-foreground ml-1">· {hoveredNode.entry.project}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-3">
              {hoveredNode.entry.raw_text.slice(0, 120)}
            </p>
          </div>
        )}

        <div ref={containerRef} className="relative flex-1 min-h-[520px] bg-card border border-border rounded-md overflow-hidden">
          <svg ref={svgRef} className="w-full h-full" />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground shrink-0">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              {type.replace('_', ' ')}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            tag
          </span>
        </div>
      </div>

      {selectedEntry && (
        <EntryDetail
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onNavigate={setSelectedEntry}
        />
      )}
    </>
  );
}
