'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface GraphEntityNode {
  id: number;
  label: string;
  entity_type: string;
  occurrence_count?: number;
  study_id?: number | null;
}

export interface GraphTriple {
  id: number;
  subject: string;
  predicate: string;
  object: string;
  subject_id?: number;
  object_id?: number;
}

interface KnowledgeGraphProps {
  entities: GraphEntityNode[];
  triples: GraphTriple[];
}

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  rawId: number;
  type: string;
  occurrenceCount: number;
  group: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  id: number;
  subject: string;
  predicate: string;
  object: string;
  source: string | number | GraphNode;
  target: string | number | GraphNode;
  subject_id?: number;
  object_id?: number;
}

const EMPTY_MESSAGE = {
  title: 'Knowledge Graph Coming Soon',
  subtitle: 'Entity extraction in progress...',
  footer: 'This will show relationships between research concepts',
};

export default function KnowledgeGraph({ entities, triples }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const filteredTriples = useMemo(
    () => triples.filter((triple: GraphTriple) => Boolean(triple.subject && triple.object)),
    [triples],
  );

  const graphLinks = useMemo<GraphLink[]>(
    () =>
      filteredTriples.map((triple: GraphTriple) => ({
        ...triple,
        source: triple.subject,
        target: triple.object,
      })),
    [filteredTriples],
  );

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      return;
    }

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    if (!entities.length || !graphLinks.length) {
      svg
        .append('text')
        .attr('x', 400)
        .attr('y', 280)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('fill', '#666')
        .text(EMPTY_MESSAGE.title);
      svg
        .append('text')
        .attr('x', 400)
        .attr('y', 312)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .attr('fill', '#999')
        .text(EMPTY_MESSAGE.subtitle);
      svg
        .append('text')
        .attr('x', 400)
        .attr('y', 342)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#999')
        .text(EMPTY_MESSAGE.footer);
      return;
    }

    const width = 800;
    const height = 600;
    svg.attr('width', width).attr('height', height);

    const entityIndex = new Map<string, GraphEntityNode>();
    entities.forEach((entity: GraphEntityNode) => {
      entityIndex.set(entity.label, entity);
      entityIndex.set(entity.label.toLowerCase(), entity);
      entityIndex.set(String(entity.id), entity);
    });

    const nodes: GraphNode[] = entities.map((entity: GraphEntityNode) => ({
      id: entity.label,
      rawId: entity.id,
      type: entity.entity_type,
      occurrenceCount: entity.occurrence_count ?? 0,
      group: entity.entity_type,
    }));

    const connectedLabels = new Set([
      ...graphLinks.map((triple: GraphLink) => triple.subject),
      ...graphLinks.map((triple: GraphLink) => triple.object),
    ]);

    const filteredNodes = nodes.filter((node: GraphNode) => connectedLabels.has(node.id));

    const linkForce = d3
      .forceLink<GraphNode, GraphLink>(graphLinks)
      .id((nodeDatum: GraphNode) => nodeDatum.id)
      .distance(120);

    const simulation = d3
      .forceSimulation<GraphNode>(filteredNodes)
      .force('link', linkForce)
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(32));

    const colorScale = d3.scaleOrdinal<string, string>(d3.schemeCategory10);

    const link = svg
      .append('g')
      .attr('stroke', '#64748b')
      .attr('stroke-opacity', 0.45)
      .selectAll<SVGLineElement, GraphLink>('line')
      .data(graphLinks)
      .enter()
      .append('line')
      .attr('stroke-width', 1.5);

    const adjacency = new Map<string, Set<string>>();
    graphLinks.forEach((linkDatum: GraphLink) => {
      if (!adjacency.has(linkDatum.subject)) {
        adjacency.set(linkDatum.subject, new Set());
      }
      if (!adjacency.has(linkDatum.object)) {
        adjacency.set(linkDatum.object, new Set());
      }
      adjacency.get(linkDatum.subject)?.add(linkDatum.object);
      adjacency.get(linkDatum.object)?.add(linkDatum.subject);
    });

    const nodeById = new Map<string, GraphNode>();
    filteredNodes.forEach((nodeDatum: GraphNode) => {
      nodeById.set(nodeDatum.id, nodeDatum);
      nodeById.set(nodeDatum.id.toLowerCase(), nodeDatum);
    });

    const resolvePosition = (value: string | number | GraphNode | undefined) => {
      if (value && typeof value !== 'string' && typeof value !== 'number') {
        return { x: value.x ?? width / 2, y: value.y ?? height / 2 };
      }

      if (typeof value === 'string') {
        const targetNode = nodeById.get(value) ?? nodeById.get(value.toLowerCase());
        if (targetNode) {
          return { x: targetNode.x ?? width / 2, y: targetNode.y ?? height / 2 };
        }
      }

      if (typeof value === 'number') {
        const targetNode = nodeById.get(String(value));
        if (targetNode) {
          return { x: targetNode.x ?? width / 2, y: targetNode.y ?? height / 2 };
        }
      }

      return { x: width / 2, y: height / 2 };
    };

    const node = svg
      .append('g')
      .selectAll<SVGCircleElement, GraphNode>('circle')
      .data(filteredNodes)
      .enter()
      .append('circle')
      .attr('r', 16)
  .attr('fill', (datum: GraphNode) => colorScale(datum.group))
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('click', (_: PointerEvent, datum: GraphNode) => {
        setSelectedNode((current) => (current === datum.id ? null : datum.id));
      })
      .on('mouseover', function (this: SVGCircleElement, event: PointerEvent, datum: GraphNode) {
        d3.select<SVGCircleElement, GraphNode>(this).attr('r', 20);
        const tooltip = d3
          .select<HTMLBodyElement, unknown>('body')
          .append('div')
          .attr('class', 'biospace-graph-tooltip')
          .style('position', 'absolute')
          .style('background', 'rgba(15,23,42,0.92)')
          .style('color', '#e2e8f0')
          .style('padding', '8px 12px')
          .style('border-radius', '6px')
          .style('font-size', '12px')
          .style('pointer-events', 'none')
          .style('z-index', '1000');

        const entity =
          entityIndex.get(datum.id) ??
          entityIndex.get(datum.id.toLowerCase()) ??
          entityIndex.get(String(datum.rawId));
        tooltip.html(`
          <strong>${datum.id}</strong><br/>
          Type: ${datum.type}<br/>
          Occurrences: ${entity?.occurrence_count ?? datum.occurrenceCount ?? '—'}
        `);
      })
      .on('mousemove', (event: PointerEvent) => {
        const tooltip = d3.select<HTMLDivElement, unknown>('.biospace-graph-tooltip');
        if (!tooltip.empty()) {
          tooltip.style('left', `${event.pageX + 12}px`).style('top', `${event.pageY - 8}px`);
        }
      })
      .on('mouseout', function handleMouseOut(this: SVGCircleElement) {
        d3.select<SVGCircleElement, GraphNode>(this).attr('r', 16);
        d3.selectAll('.biospace-graph-tooltip').remove();
      });

    const labels = svg
      .append('g')
      .selectAll<SVGTextElement, GraphNode>('text')
      .data(filteredNodes)
      .enter()
      .append('text')
  .text((datum: GraphNode) => (datum.id.length > 18 ? `${datum.id.slice(0, 18)}…` : datum.id))
      .attr('font-size', '11px')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('fill', '#e2e8f0')
      .style('pointer-events', 'none');

    simulation.on('tick', () => {
      link
        .attr('x1', (linkDatum: GraphLink) => resolvePosition(linkDatum.source).x)
        .attr('y1', (linkDatum: GraphLink) => resolvePosition(linkDatum.source).y)
        .attr('x2', (linkDatum: GraphLink) => resolvePosition(linkDatum.target).x)
        .attr('y2', (linkDatum: GraphLink) => resolvePosition(linkDatum.target).y);

      node
        .attr('cx', (datum: GraphNode) => datum.x ?? width / 2)
        .attr('cy', (datum: GraphNode) => datum.y ?? height / 2);
      labels
        .attr('x', (datum: GraphNode) => datum.x ?? width / 2)
        .attr('y', (datum: GraphNode) => datum.y ?? height / 2);
    });

    if (selectedNode) {
      node.style('opacity', (datum: GraphNode) => {
        const isSelected = datum.id === selectedNode;
        const neighbours = adjacency.get(selectedNode ?? '') ?? new Set<string>();
        const reverseNeighbours = adjacency.get(datum.id) ?? new Set<string>();
        const isNeighbour = neighbours.has(datum.id) || reverseNeighbours.has(selectedNode ?? '');
        return isSelected || isNeighbour ? 1 : 0.25;
      });
      link.style('opacity', (linkDatum: GraphLink) =>
        linkDatum.subject === selectedNode || linkDatum.object === selectedNode ? 1 : 0.2,
      );
    } else {
      node.style('opacity', 0.95);
      link.style('opacity', 0.45);
    }

    return () => {
      simulation.stop();
      d3.selectAll('.biospace-graph-tooltip').remove();
    };
  }, [entities, graphLinks, selectedNode]);

  if (!entities.length || !filteredTriples.length) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No graph data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Interactive Knowledge Graph</h3>
        <div className="text-sm text-gray-600">
          {entities.length} entities, {filteredTriples.length} relationships
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-slate-900/40 p-4">
        <svg ref={svgRef} className="h-96 w-full rounded border border-slate-700" role="img" aria-label="Knowledge graph visualization" />
      </div>

      <div className="text-sm text-gray-600">
        <p>
          <strong>Instructions:</strong> Click nodes to highlight neighbours. Hover to view occurrence counts.
        </p>
        {selectedNode && (
          <p className="mt-2 text-sky-500">
            Selected node: <strong>{selectedNode}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
