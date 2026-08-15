import { discoverServerRegistry, writeServerRegistryModule } from '@effuse/cli';

const registry = discoverServerRegistry(process.cwd());
const outputPath = writeServerRegistryModule(registry);

console.log(
  `[effuse] generated ${registry.entries.length} server endpoints at ${outputPath}`
);
