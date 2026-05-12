#!/usr/bin/env node
// Generates pwa-192x192.png and pwa-512x512.png from favicon.svg using sharp.
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, '..');
const svgPath = join(root, 'public', 'favicon.svg');
const outDir = join(root, 'public', 'icons');

mkdirSync(outDir, { recursive: true });

const svg = readFileSync(svgPath);

for (const size of [192, 512]) {
  const outPath = join(outDir, `pwa-${size}x${size}.png`);
  await sharp(svg)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(outPath);
  console.log(`✓ public/icons/pwa-${size}x${size}.png`);
}
