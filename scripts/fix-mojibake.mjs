import { readFileSync, writeFileSync } from 'node:fs';

function fixString(str) {
  return Buffer.from(str, 'latin1').toString('utf8');
}

function walk(value) {
  if (typeof value === 'string') {
    return fixString(value);
  }
  if (Array.isArray(value)) {
    return value.map(walk);
  }
  if (value !== null && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = walk(value[key]);
    }
    return result;
  }
  return value;
}

for (const filePath of process.argv.slice(2)) {
  const raw = readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw);
  const fixed = walk(parsed);
  writeFileSync(filePath, JSON.stringify(fixed, null, 2) + '\n');
  console.log(`Fixed: ${filePath}`);
}
