import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import DetailModal from './DetailModal';

function TreeVisualization() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [visibleSection, setVisibleSection] = useState(0);
  const svgRef = useRef();

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/data')
      .then(response => {
        if (!response.ok) { throw new Error('Network response was not ok'); }
        return response.json();
      })
      .then(fetchedData => {
        const rootNode = { id: 'root', type: 'root', details: { company: 'Ajay Raj Bharadwaj' } };
        fetchedData.nodes.push(rootNode);
        fetchedData.nodes.forEach(node => {
          if (node.type === 'branch') { node.primaryBranch = 'root'; }
        });
        setData(fetchedData);
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error);
        setError(error.message);
      });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      
      if (scrollPosition >= windowHeight * 0.5) { // Start showing tree earlier
        const section = Math.floor((scrollPosition - windowHeight * 0.5) / windowHeight);
        setVisibleSection(Math.max(0, Math.min(2, section)));
      } else {
        setVisibleSection(-1); // Hide tree when at the top
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (data && svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.selectAll('*').remove();

      // Make SVG responsive
      const width = Math.min(window.innerWidth * 0.95, 1920); // Cap max width
      const height = window.innerHeight;
      
      svg.attr('width', '100%')
         .attr('height', height)
         .attr('preserveAspectRatio', 'xMidYMid meet')
         .attr('viewBox', [0, 0, width, height]);

      // Center the main group
      const g = svg.append('g')
                  .attr('transform', `translate(${width * 0.2}, ${height / 2})`);

      const root = d3.stratify()
        .id(d => d.id)
        .parentId(d => d.primaryBranch)
        (data.nodes);

      const branches = ['branch-prod', 'branch-eng', 'branch-ent'].map(branchId => {
        return root.children.find(child => child.id === branchId);
      });

      branches.forEach((branch, index) => {
        if (branch) {
          const branchG = g.append('g')
            .attr('class', `branch-section ${index === visibleSection ? 'visible' : ''}`)
            .style('opacity', index === visibleSection ? 1 : 0)
            .style('transition', 'opacity 0.5s ease');

          // Adjust tree layout
          const treeLayout = d3.tree()
            .nodeSize([120, 300]) // Adjusted for better spacing
            .separation((a, b) => a.parent === b.parent ? 1.5 : 2);

          const branchData = treeLayout(branch);

          // Calculate branch bounds
          let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
          branchData.descendants().forEach(d => {
            minX = Math.min(minX, d.x);
            maxX = Math.max(maxX, d.x);
            minY = Math.min(minY, d.y);
            maxY = Math.max(maxY, d.y);
          });

          // Center the branch vertically
          const centerY = (maxY - minY) / 2;
          branchG.attr('transform', `translate(0, ${-centerY})`);

          // Draw links
          branchG.append('g')
            .selectAll('path')
            .data(branchData.links())
            .join('path')
            .attr('d', d3.linkHorizontal()
              .x(d => d.y)
              .y(d => d.x))
            .attr('fill', 'none')
            .attr('stroke', '#778da9')
            .attr('stroke-width', 2)
            .attr('opacity', 0.7);

          // Draw nodes
          const nodes = branchG.append('g')
            .selectAll('g')
            .data(branchData.descendants())
            .join('g')
            .attr('transform', d => `translate(${d.y},${d.x})`);

          nodes.each(function(d) {
            const isExperience = d.data.type === 'experience';
            const nodeGroup = d3.select(this);

            if (isExperience) {
              // Experience nodes (cards)
              nodeGroup.style('cursor', 'pointer')
                .on('click', (event, d_clicked) => {
                  setSelectedNode(d_clicked.data);
                });

              nodeGroup.append('rect')
                .attr('width', 280) // Slightly smaller cards
                .attr('height', 120)
                .attr('x', -140)
                .attr('y', -60)
                .attr('rx', 15)
                .attr('fill', '#1b263b')
                .attr('stroke', '#415a77')
                .attr('stroke-width', 2)
                .attr('filter', 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))');

              const text = nodeGroup.append('text')
                .attr('text-anchor', 'middle')
                .style('font-size', '18px') // Slightly smaller text
                .attr('fill', '#e0e1dd');

              text.append('tspan')
                .attr('x', 0)
                .attr('dy', '-1.6em')
                .style('font-weight', 'bold')
                .text(d.data.details.role);

              text.append('tspan')
                .attr('x', 0)
                .attr('dy', '1.6em')
                .text(d.data.details.company);

              text.append('tspan')
                .attr('x', 0)
                .attr('dy', '1.6em')
                .style('font-style', 'italic')
                .style('fill', '#a9b4c2')
                .text(d.data.details.duration);

            } else {
              // Branch nodes (circles)
              nodeGroup.append('circle')
                .attr('r', 20)
                .attr('fill', '#e5b85c')
                .attr('stroke', '#fff')
                .attr('stroke-width', 2);

              nodeGroup.append('text')
                .attr('dy', '0.35em')
                .attr('x', d.children ? -40 : 40)
                .attr('text-anchor', d.children ? 'end' : 'start')
                .style('font-size', '24px')
                .style('font-weight', 'bold')
                .attr('fill', 'white')
                .text(d.data.type === 'root' ? d.data.details.company : d.data.label);
            }
          });
        }
      });

      // Add resize handler
      const handleResize = () => {
        const newWidth = Math.min(window.innerWidth * 0.95, 1920);
        svg.attr('width', '100%')
           .attr('viewBox', [0, 0, newWidth, height]);
        g.attr('transform', `translate(${newWidth * 0.2}, ${height / 2})`);
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [data, visibleSection]);

  if (error) { return <div style={{ color: 'red' }}>Error: Could not fetch data.</div>; }
  if (!data) { return <div>Loading data from backend...</div>; }

  return (
    <div className="portfolio-container">
      <div className="header-section">
        <h1>Ajay Raj Bharadwaj</h1>
        <p>The Living Portfolio</p>
      </div>
      <div className={`tree-container ${visibleSection >= 0 ? 'visible' : ''}`}>
        <svg ref={svgRef}></svg>
      </div>
      {selectedNode && (
        <DetailModal node={selectedNode} onClose={() => setSelectedNode(null)} />
      )}
    </div>
  );
}

export default TreeVisualization;