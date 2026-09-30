import fs from 'node:fs';
import path from 'node:path';

const source = path.resolve('contracts', 'managed', 'cairn');
const destinations = [
  path.resolve('frontend', 'src', 'managed'),
  path.resolve('frontend', 'public', 'managed'),
];

if (!fs.existsSync(source)) {
  throw new Error(`Managed artifacts not found at ${source}. Run npm run compile first.`);
}

for (const destination of destinations) {
  fs.rmSync(destination, { recursive: true, force: true });
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
  console.log(`Synced managed artifacts to ${path.relative(process.cwd(), destination)}`);
}
