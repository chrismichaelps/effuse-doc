import pkg from '../../package.json';

const deps = pkg.dependencies;

export const versions = {
	core: deps['@effuse/core'],
	router: deps['@effuse/router'],
	store: deps['@effuse/store'],
	ink: deps['@effuse/ink'],
	i18n: deps['@effuse/i18n'],
	query: deps['@effuse/query'],
};
