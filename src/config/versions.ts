import pkg from '../../package.json';

const deps = pkg.dependencies;
const devDeps = pkg.devDependencies;

export const versions = {
  cli: '1.0.3',
  compiler: devDeps['@effuse/compiler'],
  core: deps['@effuse/core'],
  router: deps['@effuse/router'],
  store: deps['@effuse/store'],
  ink: deps['@effuse/ink'],
  i18n: deps['@effuse/i18n'],
  query: deps['@effuse/query'],
  server: deps['@effuse/server'],
  use: deps['@effuse/use'],
};
