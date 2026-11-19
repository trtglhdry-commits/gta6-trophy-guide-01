// Leonida Trophy Guide — the program that hands this entry in.
//
// It runs on Node 22 with the standard library only, in a fresh container with
// no network: it copies this repository's app/ (the offline guide and tracker)
// and screenshots/ (four renders of the guide in a browser) to /output, then
// writes /output/dossier.json with the vendored make.fun library, which is the
// summary the judge reads. vendor/makefun-frontend.ts is the kit's copy and is
// left exactly as handed out: the scorer rebuilds the dossier with its own copy
// and the two must match byte for byte.
//
// The guide itself is plain static files — index.html, app.js, style.css and
// app/data/trophies.json — served by any static server with app/ at its root.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyFolder(name: string): void {
  const source = join(repoRoot, name);
  if (!existsSync(source)) return;
  cpSync(source, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyFolder('app');
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
copyFolder('screenshots');

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the
// bytes; the others refuse an entry the scorer would refuse — more than 4
// screenshots or one over 256 KiB; more than 993 files and directories in app/
// or 48 MiB of app files, which count beside /output's own 1000-entry cap with
// its screenshots/ and dossier.json.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
