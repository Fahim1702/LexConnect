import { access, readFile, readdir } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? filesIn(join(directory, entry.name)) : [join(directory, entry.name)]));
  return nested.flat();
}

const sourceRoot = fileURLToPath(new URL('../client/src', import.meta.url));
const files = (await filesIn(sourceRoot)).filter((file) => ['.js', '.jsx'].includes(extname(file)));
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const ast = parse(source, { sourceType: 'module', plugins: ['jsx'] });
  for (const statement of ast.program.body) {
    if (statement.type !== 'ImportDeclaration' || !statement.source.value.startsWith('.')) continue;
    const imported = resolve(dirname(file), statement.source.value);
    await access(imported);
  }
}
console.log(`Parsed ${files.length} frontend source files and resolved their local imports successfully.`);
