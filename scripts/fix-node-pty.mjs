// npm tappar körrättigheten på node-ptys spawn-helper vid installation, utan den
// misslyckas posix_spawnp när terminalen startas. Körs som postinstall.
import { chmodSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..', 'node_modules', 'node-pty', 'prebuilds');
if (existsSync(root)) {
  for (const dir of readdirSync(root)) {
    const helper = join(root, dir, 'spawn-helper');
    if (existsSync(helper)) chmodSync(helper, 0o755);
  }
}
