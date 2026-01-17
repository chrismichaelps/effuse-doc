import { createStore, connectDevTools } from '@effuse/store';
import { taggedEnum } from '../utils/data/index.js';

type SidebarOpen = { readonly _tag: 'Open'; readonly wasCollapsed: boolean };
type SidebarClosed = { readonly _tag: 'Closed'; readonly wasOpen: boolean };
type SidebarCollapsed = {
	readonly _tag: 'Collapsed';
	readonly wasOpen: boolean;
};
type SidebarState = SidebarOpen | SidebarClosed | SidebarCollapsed;

const State = taggedEnum<SidebarState>();

interface DocsUIState {
	sidebarState: SidebarState;
	openSections: Record<string, boolean>;
}

interface DocsUIActions {
	open: () => void;
	close: () => void;
	toggleSidebar: () => void;
	toggleSidebarMobile: () => void;
	collapse: () => void;
	expand: () => void;
	toggleSection: (title: string) => void;
	isSectionOpen: (title: string) => boolean;
	isSidebarOpen: () => boolean;
	isSidebarVisible: () => boolean;
	isSidebarCollapsed: () => boolean;
	getSidebarWidth: () => number;
	getSidebarClasses: () => string;
}

export const docsStore = createStore<DocsUIActions & DocsUIState>(
	'docsUI',
	{
		sidebarState: State.Closed({ wasOpen: false }),
		openSections: {
			'Getting Started': true,
			'Core Concepts': true,
			Advanced: false,
			Examples: false,
		},

		open() {
			this.sidebarState.value = State.$match<SidebarState>(
				this.sidebarState.value,
				{
					Closed: () => State.Open({ wasCollapsed: false }),
					Collapsed: () => State.Open({ wasCollapsed: true }),
					Open: () => State.Open({ wasCollapsed: false }),
				}
			);
		},

		close() {
			this.sidebarState.value = State.$match<SidebarState>(
				this.sidebarState.value,
				{
					Open: () => State.Closed({ wasOpen: true }),
					Collapsed: () => State.Closed({ wasOpen: true }),
					Closed: () => State.Closed({ wasOpen: false }),
				}
			);
		},

		toggleSidebar() {
			this.sidebarState.value = State.$match<SidebarState>(
				this.sidebarState.value,
				{
					Open: () => State.Collapsed({ wasOpen: true }),
					Closed: () => State.Collapsed({ wasOpen: false }),
					Collapsed: () => State.Open({ wasCollapsed: true }),
				}
			);
		},

		toggleSidebarMobile() {
			const isVisible = State.$match(this.sidebarState.value, {
				Open: () => true,
				Closed: () => false,
				Collapsed: () => true,
			});
			if (isVisible) {
				this.sidebarState.value = State.Closed({ wasOpen: true });
			} else {
				this.sidebarState.value = State.Open({ wasCollapsed: false });
			}
		},

		collapse() {
			this.sidebarState.value = State.$match<SidebarState>(
				this.sidebarState.value,
				{
					Open: () => State.Collapsed({ wasOpen: true }),
					Closed: () => State.Collapsed({ wasOpen: false }),
					Collapsed: () => State.Collapsed({ wasOpen: false }),
				}
			);
		},

		expand() {
			this.sidebarState.value = State.$match<SidebarState>(
				this.sidebarState.value,
				{
					Collapsed: () => State.Open({ wasCollapsed: true }),
					Open: () => State.Open({ wasCollapsed: false }),
					Closed: () => State.Closed({ wasOpen: false }),
				}
			);
		},

		toggleSection(title: string) {
			const current = { ...this.openSections.value };
			current[title] = !current[title];
			this.openSections.value = current;
		},

		isSectionOpen(title: string) {
			return !!this.openSections.value[title];
		},

		isSidebarOpen() {
			return State.$match(this.sidebarState.value, {
				Open: () => true,
				Closed: () => false,
				Collapsed: () => false,
			});
		},

		isSidebarVisible() {
			return State.$match(this.sidebarState.value, {
				Open: () => true,
				Closed: () => false,
				Collapsed: () => true,
			});
		},

		isSidebarCollapsed() {
			return State.$match(this.sidebarState.value, {
				Collapsed: () => true,
				Open: () => false,
				Closed: () => false,
			});
		},

		getSidebarWidth() {
			return State.$match(this.sidebarState.value, {
				Collapsed: () => 64,
				Open: () => 280,
				Closed: () => 0,
			});
		},

		getSidebarClasses() {
			return State.$match(this.sidebarState.value, {
				Collapsed: () => 'sidebar-collapsed',
				Open: () => 'sidebar-open',
				Closed: () => 'sidebar-closed',
			});
		},
	},
	{ devtools: true }
);

connectDevTools(docsStore);

export type { SidebarState };
export const isSidebarOpen = () => docsStore.isSidebarOpen();
export const isSidebarCollapsed = () => docsStore.isSidebarCollapsed();
export const toggleSidebar = () => docsStore.toggleSidebar();
export const closeSidebar = () => docsStore.close();
export const expandSidebar = () => docsStore.expand();
