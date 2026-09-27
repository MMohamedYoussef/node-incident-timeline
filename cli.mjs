import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline, renderHtml } from './src/timeline.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
try {
  const input = path.resolve(process.argv[2] ?? path.join(root, 'fixtures', 'events.json'));
  const output = path.resolve(process.argv[3] ?? path.join(root, 'examples'));
  const result = buildTimeline(JSON.parse(await readFile(input, 'utf8')));
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'timeline.json'), JSON.stringify(result, null, 2) + '\n');
  await writeFile(path.join(output, 'timeline.html'), renderHtml(result));
  console.log(`${result.events.length} events, status ${result.status}, resolution ${result.resolution_minutes ?? 'open'} minutes`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
