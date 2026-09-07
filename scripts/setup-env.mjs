import { readFile, writeFile } from 'node:fs/promises';

// Run from the repository root with npm run setup. Existing settings stay intact.
for (const workspace of ['server', 'client']) {
  const template = new URL(`../${workspace}/.env.example`, import.meta.url);
  const destination = new URL(`../${workspace}/.env`, import.meta.url);
  const contents = await readFile(template, 'utf8');
  try {
    await writeFile(destination, contents, { flag: 'wx' });
    console.log(`Created ${workspace}/.env from its example.`);
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    console.log(`Kept existing ${workspace}/.env.`);
  }
}
console.log('Set your MongoDB connection and follow docs/FIREBASE_SETUP.md to enable sign-in.');
