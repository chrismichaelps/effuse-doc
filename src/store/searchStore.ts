import { createStore, connectDevTools } from '@effuse/store';
import { effect } from '@effuse/core';
import { i18nStore } from './appI18n.js';
import { loadDocsIndex, type DocEntry } from '../utils/docsIndexer.js';
import { searchDocs, type SearchResultItem } from '../utils/searchEngine.js';
import {
	Option,
	some,
	none,
	getOrElse,
	Either,
	right,
	tryCatch,
	isRight,
	taggedEnum,
} from '../utils/data/index.js';

const STORE_NAME = 'search';
const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 50;

type SearchErrorQueryTooShort = {
	readonly _tag: 'QueryTooShort';
	readonly query: string;
	readonly minLength: number;
};

type SearchErrorIndexNotLoaded = {
	readonly _tag: 'IndexNotLoaded';
};

type SearchErrorExecution = {
	readonly _tag: 'Execution';
	readonly message: string;
	readonly query: string;
};

type SearchError =
	| SearchErrorQueryTooShort
	| SearchErrorIndexNotLoaded
	| SearchErrorExecution;

type SearchModalClosed = { readonly _tag: 'Closed' };
type SearchModalOpening = { readonly _tag: 'Opening' };
type SearchModalOpen = { readonly _tag: 'Open' };
type SearchModalClosing = { readonly _tag: 'Closing' };
type SearchModalState =
	| SearchModalClosed
	| SearchModalOpening
	| SearchModalOpen
	| SearchModalClosing;

type SearchStatusIdle = { readonly _tag: 'Idle' };
type SearchStatusLoading = { readonly _tag: 'Loading'; readonly query: string };
type SearchStatusResults = {
	readonly _tag: 'Results';
	readonly query: string;
	readonly results: readonly SearchResultItem[];
};
type SearchStatusError = {
	readonly _tag: 'Error';
	readonly error: SearchError;
};
type SearchStatus =
	| SearchStatusIdle
	| SearchStatusLoading
	| SearchStatusResults
	| SearchStatusError;

const ModalState = taggedEnum<SearchModalState>();
const SearchStatusState = taggedEnum<SearchStatus>();

interface SearchState {
	query: string;
	modalState: SearchModalState;
	searchStatus: SearchStatus;
	selectedIndex: number;
	docsIndex: readonly DocEntry[];
}

interface SearchActions {
	setQuery: (query: string) => void;
	search: (query: string) => void;
	clearResults: () => void;
	open: () => void;
	close: () => void;
	toggle: () => void;
	selectNext: () => void;
	selectPrevious: () => void;
	getSelected: () => SearchResultItem | null;
	init: () => void;
	indexDocs: () => Promise<void>;
}

const performSearch = (
	query: string,
	docs: readonly DocEntry[]
): Either<SearchError, readonly SearchResultItem[]> => {
	if (query.length < MIN_QUERY_LENGTH) {
		return right([]);
	}

	return tryCatch<readonly SearchResultItem[], SearchError>(
		() => searchDocs(docs, query),
		(err): SearchErrorExecution => ({
			_tag: 'Execution',
			message: err instanceof Error ? err.message : 'Unknown search error',
			query,
		})
	);
};

const safeGetSelected = (
	results: readonly SearchResultItem[],
	selectedIndex: number
): Option<SearchResultItem> => {
	const item = results[selectedIndex];
	return item !== undefined ? some(item) : none();
};

export const searchStore = createStore<SearchState & SearchActions>(
	STORE_NAME,
	{
		query: '',
		modalState: ModalState.Closed({}),
		searchStatus: SearchStatusState.Idle({}),
		selectedIndex: 0,
		docsIndex: [],

		setQuery(query: string) {
			this.query.value = query;
			this.selectedIndex.value = 0;
		},

		search(query: string) {
			this.query.value = query;
			this.selectedIndex.value = 0;

			if (query.length < MIN_QUERY_LENGTH) {
				const newStatus = SearchStatusState.Idle({});
				this.searchStatus.value = newStatus;
				return;
			}

			const newStatus = SearchStatusState.Loading({ query });
			this.searchStatus.value = newStatus;

			setTimeout(() => {
				const result = performSearch(query, this.docsIndex.value);

				if (isRight(result)) {
					const successStatus = SearchStatusState.Results({
						query,
						results: result.right,
					});
					this.searchStatus.value = successStatus;
				} else {
					const errorStatus = SearchStatusState.Error({
						error: result.left,
					});
					this.searchStatus.value = errorStatus;
				}
			}, DEBOUNCE_MS);
		},

		clearResults() {
			this.query.value = '';
			const newStatus = SearchStatusState.Idle({});
			this.searchStatus.value = newStatus;
			this.selectedIndex.value = 0;
		},

		open() {
			const currentModal = this.modalState.value;
			const newState = ModalState.$match<SearchModalState>(currentModal, {
				Closed: () => ModalState.Opening({}),
				Opening: () => ModalState.Opening({}),
				Open: () => ModalState.Open({}),
				Closing: () => ModalState.Closing({}),
			});
			this.modalState.value = newState;
		},

		close() {
			const currentModal = this.modalState.value;
			const newState = ModalState.$match<SearchModalState>(currentModal, {
				Closed: () => ModalState.Closed({}),
				Opening: () => ModalState.Closing({}),
				Open: () => ModalState.Closing({}),
				Closing: () => ModalState.Closing({}),
			});
			this.modalState.value = newState;
			this.clearResults();
		},

		toggle() {
			const currentModal = this.modalState.value;
			ModalState.$match(currentModal, {
				Closed: () => this.open(),
				Opening: () => {},
				Open: () => this.close(),
				Closing: () => {},
			});
		},

		selectNext() {
			const currentStatus = this.searchStatus.value;
			let results: readonly SearchResultItem[] = [];
			SearchStatusState.$match(currentStatus, {
				Idle: () => {},
				Loading: () => {},
				Results: ({ results: r }) => {
					results = r;
				},
				Error: () => {},
			});

			const len = results.length;
			if (len > 0) {
				this.selectedIndex.value = (this.selectedIndex.value + 1) % len;
			}
		},

		selectPrevious() {
			const currentStatus = this.searchStatus.value;
			let results: readonly SearchResultItem[] = [];
			SearchStatusState.$match(currentStatus, {
				Idle: () => {},
				Loading: () => {},
				Results: ({ results: r }) => {
					results = r;
				},
				Error: () => {},
			});

			const len = results.length;
			if (len > 0) {
				this.selectedIndex.value = (this.selectedIndex.value - 1 + len) % len;
			}
		},

		getSelected(): SearchResultItem | null {
			const currentStatus = this.searchStatus.value;
			let results: readonly SearchResultItem[] = [];
			SearchStatusState.$match(currentStatus, {
				Idle: () => {},
				Loading: () => {},
				Results: ({ results: r }) => {
					results = r;
				},
				Error: () => {},
			});

			return getOrElse(
				safeGetSelected(results, this.selectedIndex.value),
				() => null
			);
		},

		async indexDocs() {
			const locale = i18nStore.locale.value || 'en';
			const docs = await loadDocsIndex(locale);
			this.docsIndex.value = docs;
		},

		init() {
			if (typeof window !== 'undefined') {
				this.indexDocs();

				effect(() => {
					const locale = i18nStore.locale.value;
					if (locale) {
						this.indexDocs();
					}
				});

				const handleKeyDown = (e: KeyboardEvent) => {
					if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
						e.preventDefault();
						this.toggle();
					}

					let isOpen = false;
					ModalState.$match(this.modalState.value, {
						Closed: () => {
							isOpen = false;
						},
						Opening: () => {
							isOpen = true;
						},
						Open: () => {
							isOpen = true;
						},
						Closing: () => {
							isOpen = true;
						},
					});

					if (e.key === 'Escape' && isOpen) {
						e.preventDefault();
						this.close();
					}
				};
				window.addEventListener('keydown', handleKeyDown);
			}
		},
	},
	{ devtools: true }
);

connectDevTools(searchStore);

export type SearchStore = typeof searchStore;
export type { SearchResultItem, SearchError, SearchModalState, SearchStatus };
