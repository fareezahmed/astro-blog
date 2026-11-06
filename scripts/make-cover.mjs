#!/usr/bin/env node
// Renders a 1200x630 cover image for a post from an SVG template, using the
// sharp library that Astro already depends on.
//
//   node scripts/make-cover.mjs --title "Post title" --out src/content/blog/covers/post.png
//   options: --eyebrow "ASTRO FIELD NOTES" --footer "fareezahmed.github.io/astro-blog"
//            --tag "Built with Astro 7" --accent "#a78bfa"
//
// The illustration is the islands idea: a grid of static page blocks with one
// block lit up, the island that ships JavaScript.

import sharp from 'sharp';
import { parseArgs } from 'node:util';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const { values: opts } = parseArgs({
  options: {
    title: { type: 'string' },
    out: { type: 'string' },
    eyebrow: { type: 'string', default: 'ASTRO FIELD NOTES' },
    footer: { type: 'string', default: 'fareezahmed.github.io/astro-blog' },
    tag: { type: 'string', default: 'Built with Astro 7' },
    accent: { type: 'string', default: '#a78bfa' },
  },
});

if (!opts.title || !opts.out) {
  console.error('Usage: node scripts/make-cover.mjs --title "..." --out path.png');
  process.exit(1);
}

const W = 1200;
const H = 630;
const FONT = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/** Greedy word wrap using an average glyph width; good enough for a title. */
function wrap(text, fontSize, maxWidth, maxLines) {
  const avg = fontSize * 0.5;
  const perLine = Math.floor(maxWidth / avg);
  const words = text.split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > perLine && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/\s+\S*$/, '') + '…';
    return kept;
  }
  return lines;
}

const escape = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Title sizing: shrink until it fits in three lines.
let fontSize = 60;
let lines = wrap(opts.title, fontSize, 640, 3);
while (lines.join(' ').endsWith('…') && fontSize > 40) {
  fontSize -= 4;
  lines = wrap(opts.title, fontSize, 640, 3);
}
const lineHeight = fontSize * 1.15;
const titleTop = 300 - ((lines.length - 1) * lineHeight) / 2;

// Island grid on the right: 4x3 blocks, one lit.
const cols = 4, rows = 3, size = 92, gap = 18;
const gridW = cols * size + (cols - 1) * gap;
const gridH = rows * size + (rows - 1) * gap;
const gx = W - 90 - gridW;
const gy = (H - gridH) / 2 + 10;
const lit = { c: 2, r: 1 };
let blocks = '';
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const x = gx + c * (size + gap);
    const y = gy + r * (size + gap);
    const isLit = c === lit.c && r === lit.r;
    if (isLit) {
      blocks += `
      <rect x="${x - 26}" y="${y - 26}" width="${size + 52}" height="${size + 52}" rx="34" fill="url(#glow)"/>
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="${opts.accent}"/>
      <rect x="${x + 18}" y="${y + 22}" width="${size - 36}" height="10" rx="5" fill="#fff" opacity="0.9"/>
      <rect x="${x + 18}" y="${y + 42}" width="${size - 52}" height="10" rx="5" fill="#fff" opacity="0.7"/>
      <rect x="${x + 18}" y="${y + 62}" width="28" height="10" rx="5" fill="#fff" opacity="0.5"/>`;
    } else {
      blocks += `
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="#ffffff" opacity="0.06" stroke="#ffffff" stroke-opacity="0.12"/>
      <rect x="${x + 18}" y="${y + 22}" width="${size - 36}" height="10" rx="5" fill="#ffffff" opacity="0.22"/>
      <rect x="${x + 18}" y="${y + 42}" width="${size - 52}" height="10" rx="5" fill="#ffffff" opacity="0.16"/>
      <rect x="${x + 18}" y="${y + 62}" width="28" height="10" rx="5" fill="#ffffff" opacity="0.12"/>`;
    }
  }
}

// Gentle wave lines behind the grid, the "sea" the islands sit in.
let waves = '';
for (let i = 0; i < 6; i++) {
  const y = 120 + i * 90;
  waves += `<path d="M ${gx - 120} ${y} q 80 -22 160 0 t 160 0 t 160 0 t 160 0" fill="none" stroke="${opts.accent}" stroke-opacity="${0.05 + i * 0.015}" stroke-width="2"/>`;
}

const svg = `
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0e0b1d"/>
      <stop offset="1" stop-color="#1b1336"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${opts.accent}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${opts.accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="corner" cx="0" cy="0" r="0.9">
      <stop offset="0" stop-color="${opts.accent}" stop-opacity="0.18"/>
      <stop offset="1" stop-color="${opts.accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#corner)"/>
  ${waves}
  ${blocks}

  <g font-family="${FONT}">
    <circle cx="90" cy="92" r="7" fill="${opts.accent}"/>
    <text x="110" y="99" font-size="20" font-weight="700" letter-spacing="3" fill="${opts.accent}">${escape(opts.eyebrow)}</text>

    ${lines
      .map(
        (l, i) =>
          `<text x="90" y="${titleTop + i * lineHeight}" font-size="${fontSize}" font-weight="700" letter-spacing="-1.5" fill="#f5f3ff">${escape(l)}</text>`,
      )
      .join('\n    ')}

    <text x="90" y="${H - 72}" font-size="20" fill="#c4b5fd" opacity="0.8">${escape(opts.footer)}</text>
    <g>
      <rect x="${W - 90 - 190}" y="${H - 98}" width="190" height="40" rx="20" fill="#ffffff" opacity="0.08" stroke="#ffffff" stroke-opacity="0.15"/>
      <text x="${W - 90 - 95}" y="${H - 72}" font-size="17" font-weight="600" text-anchor="middle" fill="#e9e5ff">${escape(opts.tag)}</text>
    </g>
  </g>
</svg>`;

await mkdir(dirname(opts.out), { recursive: true });
await sharp(Buffer.from(svg), { density: 144 }).resize(W, H).png({ compressionLevel: 9 }).toFile(opts.out);
console.log(`wrote ${opts.out}`);
