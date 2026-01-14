import { define, signal, For, computed } from '@effuse/core';
import { versions } from '../../config/versions';
import { i18nStore } from '../../store/appI18n';

const packages = [
	{ name: '@effuse/core', version: versions.core },
	{ name: '@effuse/router', version: versions.router },
	{ name: '@effuse/store', version: versions.store },
	{ name: '@effuse/ink', version: versions.ink },
	{ name: '@effuse/i18n', version: versions.i18n },
	{ name: '@effuse/query', version: versions.query },
];

export const SidebarVersions = define({
	script: () => {
		const pkgList = signal(packages);
		const title = computed(
			() => i18nStore.translations.value?.sidebar?.ecosystem
		);
		return { pkgList, title };
	},
	template: ({ pkgList, title }) => (
		<div class="sidebar-versions">
			<div class="sidebar-versions-title">{title.value}</div>
			<div class="sidebar-versions-list">
				<For each={pkgList} keyExtractor={(item) => item.name}>
					{(item) => (
						<div class="sidebar-version-item">
							<span class="sv-name ">{item.value.name}</span>
							<span class="sv-version">v{item.value.version}</span>
						</div>
					)}
				</For>
			</div>
		</div>
	),
});
