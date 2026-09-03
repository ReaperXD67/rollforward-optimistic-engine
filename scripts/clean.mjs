import { rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const workspace = resolve(process.cwd());
const output = resolve(workspace, 'dist');

if (!output.startsWith(`${workspace}${sep}`) || output === workspace) {
  throw new Error(`Refusing to clean unexpected path: ${output}`);
}

await rm(output, { recursive: true, force: true });

