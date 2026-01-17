import { defineLayer } from '@effuse/core';
import { searchStore } from '../store/searchStore';
import { SearchModal } from '../components/SearchModal';
import { SearchTrigger } from '../components/SearchTrigger';

export const SearchLayer = defineLayer({
	name: 'search',
	dependencies: [],
	store: searchStore,
	deriveProps: (store) => ({
		modalState: store.modalState,
		query: store.query,
		searchStatus: store.searchStatus,
		selectedIndex: store.selectedIndex,
	}),
	provides: {
		search: () => searchStore,
	},
	components: {
		SearchModal,
		SearchTrigger,
	},
	onMount: () => {
		console.log('[SearchLayer] mounted');
	},
	onUnmount: () => {
		console.log('[SearchLayer] unmounted');
	},
	onError: (err) => {
		console.error('[SearchLayer] error:', err.message);
	},
	setup: (ctx) => {
		ctx.store.init();
		return () => {
			console.log('[SearchLayer] cleanup');
		};
	},
});
