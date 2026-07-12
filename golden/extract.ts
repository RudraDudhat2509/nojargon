import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';

// Fetch each golden URL, extract main copy with Readability, write golden/pages/<i>.txt,
// and scaffold golden/labels.json (label: null) for Rudra to fill with 1|2|3.
async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const urls: string[] = JSON.parse(readFileSync(join(here, 'urls.json'), 'utf8'));
  const pagesDir = join(here, 'pages');
  mkdirSync(pagesDir, { recursive: true });

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]!;
    try {
      const html = await (await fetch(url)).text();
      const { document } = parseHTML(html);
      const parsed = new Readability(document as unknown as Document, { charThreshold: 50 }).parse();
      const text = (parsed?.textContent ?? '').trim();
      writeFileSync(join(pagesDir, `${i}.txt`), text);
      console.log(`[${i}] ${url} -> ${text.length} chars`);
    } catch (e) {
      console.error(`[${i}] ${url} FAILED: ${(e as Error).message}`);
      writeFileSync(join(pagesDir, `${i}.txt`), '');
    }
  }

  const labelsPath = join(here, 'labels.json');
  if (!existsSync(labelsPath)) {
    const template = urls.map((url) => ({ url, label: null }));
    writeFileSync(labelsPath, JSON.stringify(template, null, 2));
    console.log(`\nWrote ${labelsPath}. Fill each "label" with 1 (fluff) | 2 (mixed) | 3 (substance), then run npm run eval:m1.`);
  }
}

main();
