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
		<section class="sidebar-versions">
			<h4 class="sidebar-versions-title">{title.value}</h4>
			<ul class="sidebar-versions-list list-none p-0 m-0">
				<For each={pkgList} keyExtractor={(item) => item.name}>
					{(item) => (
						<li class="sidebar-version-item">
							<span class="sv-name ">{item.value.name}</span>
							<span class="sv-version">v{item.value.version}</span>
						</li>
					)}
				</For>
			</ul>
		</section>
	),
});
