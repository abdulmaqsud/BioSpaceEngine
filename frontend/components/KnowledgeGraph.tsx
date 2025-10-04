'use client';

import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

interface Entity {
  id: number;
  text: string;
  entity_type: string;
  study: number;
}

interface Triple {
  id: number;
  subject: string;
  predicate: string;
  object: string;
}

interface KnowledgeGraphProps {
  entities: Entity[];
  triples: Triple[];
}

export default function KnowledgeGraph({ entities, triples }: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  useEffect(() => {
    if (!entities.length || !triples.length) {
      // Show message when no data
      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove();
      svg.append("text")
        .attr("x", 400)
        .attr("y", 280)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("fill", "#666")
        .text("Knowledge Graph Coming Soon");
      svg.append("text")
        .attr("x", 400)
        .attr("y", 310)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .attr("fill", "#999")
        .text("Entity extraction in progress...");
      svg.append("text")
        .attr("x", 400)
        .attr("y", 340)
        .attr("text-anchor", "middle")
        .attr("font-size", "12px")
        .attr("fill", "#999")
        .text("This will show relationships between research concepts");
      return;
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 600;

    svg.attr("width", width).attr("height", height);

    // Create nodes from entities
    const nodes = entities.map(entity => ({
      id: entity.text,
      type: entity.entity_type,
      study: entity.study,
      group: entity.entity_type
    }));

    // Create links from triples
    const links = triples.map(triple => ({
      source: triple.subject,
      target: triple.object,
      type: triple.predicate
    }));

    // Filter to only include nodes that have connections
    const connectedNodes = new Set([
      ...links.map(l => l.source),
      ...links.map(l => l.target)
    ]);
    const filteredNodes = nodes.filter(node => connectedNodes.has(node.id));

    // Create force simulation
    const simulation = d3.forceSimulation(filteredNodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(30));

    // Create color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter().append("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2);

    // Create nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(filteredNodes)
      .enter().append("circle")
      .attr("r", 15)
      .attr("fill", d => colorScale(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(selectedNode === d.id ? null : d.id);
      })
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 20);
        // Show tooltip
        const tooltip = d3.select("body").append("div")
          .attr("class", "tooltip")
          .style("position", "absolute")
          .style("background", "rgba(0,0,0,0.8)")
          .style("color", "white")
          .style("padding", "8px")
          .style("border-radius", "4px")
          .style("font-size", "12px")
          .style("pointer-events", "none")
          .style("z-index", "1000");
        
        tooltip.html(`
          <strong>${d.id}</strong><br/>
          Type: ${d.type}<br/>
          Study: ${d.study}
        `);
      })
      .on("mousemove", function(event) {
        const tooltip = d3.select(".tooltip");
        tooltip
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function() {
        d3.select(this).attr("r", 15);
        d3.selectAll(".tooltip").remove();
      });

    // Add labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(filteredNodes)
      .enter().append("text")
      .text(d => d.id.length > 15 ? d.id.substring(0, 15) + "..." : d.id)
      .attr("font-size", "10px")
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("pointer-events", "none");

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node
        .attr("cx", d => d.x)
        .attr("cy", d => d.y);

      labels
        .attr("x", d => d.x)
        .attr("y", d => d.y);
    });

    // Highlight selected node
    if (selectedNode) {
      node.style("opacity", d => 
        d.id === selectedNode || 
        links.some(l => (l.source === d.id && l.target === selectedNode) || 
                       (l.target === d.id && l.source === selectedNode)) ? 1 : 0.3
      );
      link.style("opacity", l => 
        l.source === selectedNode || l.target === selectedNode ? 1 : 0.3
      );
    }

  }, [entities, triples, selectedNode]);

  if (!entities.length || !triples.length) {
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
          {entities.length} entities, {triples.length} relationships
        </div>
      </div>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <svg ref={svgRef} className="w-full h-96 border border-gray-300 rounded"></svg>
      </div>
      
      <div className="text-sm text-gray-600">
        <p><strong>Instructions:</strong> Click on nodes to highlight connections. Hover for details.</p>
        {selectedNode && (
          <p className="mt-2 text-blue-600">
            Selected: <strong>{selectedNode}</strong>
          </p>
        )}
      </div>
    </div>
  );
}
