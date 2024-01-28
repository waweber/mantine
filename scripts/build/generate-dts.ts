import path from 'node:path';
import { execa } from 'execa';
import fs from 'fs-extra';

export async function generateDts(packagePath: string) {
  await execa('yarn', ['tsc', '--project', path.join(packagePath, 'tsconfig.build.json')]);

  // Duplicate the type definitions for ESM
  await generateESMDts(packagePath);
}

// Rewrite relative imports to reference the index.js explicitly. This is
// required to support TypeScript projects with "moduleResolution": "nodenext"
// set, as these rules require relative imports to include the file extension
// and do not support implicit index.js.
// See https://github.com/mantinedev/mantine/issues/4991
async function generateESMDts(packagePath: string) {
  const explicitIndexRegex = /^export \* from '(\.\/.*)';$/gm;
  const explicitIndexReplacement = 'export * from \'$1/index.js\'';
  const inPath = path.join(packagePath, 'lib/index.d.ts');
  const outPath = path.join(packagePath, 'lib/index.d.mts');

  const dtsContent = (await fs.readFile(inPath)).toString();
  const withExplicitIndex = dtsContent.replace(explicitIndexRegex, explicitIndexReplacement);
  await fs.writeFile(outPath, withExplicitIndex);
}
