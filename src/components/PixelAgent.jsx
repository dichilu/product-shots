import React, { useMemo } from 'react';

// Palette mapping
const COLORS = {
  T: 'transparent',
  K: '#1e293b', // Black / Outline
  S: '#fde047', // Skin tone (cute yellow like emoji or #fed7aa)
  W: '#ffffff', // White
  R: '#ef4444', // Red
  B: '#3b82f6', // Blue
  G: '#22c55e', // Green
  D: '#475569', // Dark Grey
  L: '#94a3b8', // Light Grey
  P: '#db2777', // Pink/Purple
  Y: '#f59e0b', // Yellow
  C: '#06b6d4', // Cyan (Lens)
  O: '#f97316', // Orange
  N: '#8b5cf6', // Indigo
};

// Skin tone
const SK = '#fed7aa'; // light skin

// We define characters as 14x14 grids.
// ARMS are separate to animate them!
// The torso/head is the base.

const AGENT_DESIGNS = {
  creativeDirector: {
    // Artist with Beret (Red) and Purple outfit
    body: [
      "TTTTTTTTTTTTTT",
      "TTTTTRRRRRTTTT",
      "TTTTRRRRRRRTTT",
      "TTTTKSSSSSSTTT",
      "TTTTKSKSKSTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTTKKKKTTTTT",
      "TTTTTNNNNTTTTT",
      "TTTTNNWWNNTTTT",
      "TTTTNNNNNNTTTT",
      "TTTTTKTTKTTTTT",
      "TTTTKKTTKKTTTT",
      "TTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTT",
    ],
    armLeft: { color: 'N', idle: [7, 3], working: [8, 3], ya: [5, 2] },
    armRight: { color: 'N', idle: [7, 10], working: [8, 10], ya: [5, 11] },
  },
  promptEngineer: {
    // Nerd with Glasses (Cyan) and Blue hoodie
    body: [
      "TTTTTTTTTTTTTT",
      "TTTTTKKKKKTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTKCKCKCTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTTKKKKTTTTT",
      "TTTTTBBBBTTTTT",
      "TTTTBBWWBTTTTT",
      "TTTTBBBBBBTTTT",
      "TTTTTBBBBTTTTT",
      "TTTTTKTTKTTTTT",
      "TTTTKKTTKKTTTT",
      "TTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTT",
    ],
    armLeft: { color: 'B', idle: [7, 3], working: [8, 4], ya: [4, 2] },
    armRight: { color: 'B', idle: [7, 10], working: [8, 9], ya: [4, 11] },
  },
  photographer: {
    // Photographer with Dark grey vest and Camera
    body: [
      "TTTTTTTTTTTTTT",
      "TTTTTKKKKKTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTKSKSKSTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTTKKKKTTTTT",
      "TTTTTDSSDDTTTT",
      "TTTTDDCCDDTTTT",
      "TTTTDDCCDDTTTT",
      "TTTTTDDDDTTTTT",
      "TTTTTKTTKTTTTT",
      "TTTTKKTTKKTTTT",
      "TTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTT",
    ],
    armLeft: { color: 'D', idle: [7, 3], working: [7, 4], ya: [4, 2] },
    armRight: { color: 'D', idle: [7, 10], working: [7, 9], ya: [4, 11] },
  },
  qualityInspector: {
    // Inspector with Magnifying glass and Green suit
    body: [
      "TTTTTTTTTTTTTT",
      "TTTTGGGGGGTTTT",
      "TTTGGGGGGGGTTT",
      "TTTTKSSSSSSTTT",
      "TTTTKSKSKSTTTT",
      "TTTTKSSSSSSTTT",
      "TTTTTKKKKTTTTT",
      "TTTTTGGGGTTTTT",
      "TTTTGGWWGGTTTT",
      "TTTTGGGGGGTTTT",
      "TTTTTKTTKTTTTT",
      "TTTTKKTTKKTTTT",
      "TTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTT",
    ],
    armLeft: { color: 'G', idle: [7, 3], working: [6, 2], ya: [4, 2] },
    armRight: { color: 'G', idle: [7, 10], working: [8, 10], ya: [4, 11] },
  },
};

export default function PixelAgent({ agent = 'creativeDirector', status = 'pending' }) {
  // Map our old roles to the matching pixel character if they don't exactly match
  const design = AGENT_DESIGNS[agent] || AGENT_DESIGNS.creativeDirector;
  
  // Calculate arm positions based on status
  // status: 'pending' | 'working' | 'done'
  const armState = status === 'done' ? 'ya' : status === 'working' ? 'working' : 'idle';
  
  const leftPos = design.armLeft[armState];
  const rightPos = design.armRight[armState];

  const pixels = useMemo(() => {
    const arr = [];
    // Render body
    design.body.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        let color = COLORS[char];
        if (char === 'S') color = SK; // special override for skin tone
        
        if (color && color !== 'transparent') {
          arr.push(<rect key={`b-${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />);
        }
      }
    });

    // Render arms (2x2 rects or 1x2 rects depending on style, let's do 2x2 to make them chunky)
    const renderArm = (pos, armColorChar, side) => {
      const [y, x] = pos;
      const c = COLORS[armColorChar];
      // Hand (skin)
      arr.push(<rect key={`h-${side}`} x={x} y={status === 'done' ? y - 1 : y + 1} width="2" height="1" fill={SK} />);
      // Sleeve
      arr.push(<rect key={`s-${side}`} x={x} y={y} width="2" height="1" fill={c} />);
    };

    renderArm(leftPos, design.armLeft.color, 'left');
    renderArm(rightPos, design.armRight.color, 'right');

    return arr;
  }, [design, armState, status]);

  // If pending, grey out slightly. If working, add bounce animation.
  let className = "pixel-agent";
  let style = { width: '48px', height: '48px', flexShrink: 0, transition: 'all 0.3s ease' };
  
  if (status === 'pending') {
    style.opacity = 0.4;
    style.filter = 'grayscale(100%)';
  }
  if (status === 'working') className += " animate-bounce-slow";
  if (status === 'done') className += " animate-ya-pop";

  return (
    <div className={className} style={style}>
      <svg viewBox="0 0 14 14" width="100%" height="100%" style={{ shapeRendering: 'crispEdges' }}>
        {pixels}
      </svg>
    </div>
  );
}
