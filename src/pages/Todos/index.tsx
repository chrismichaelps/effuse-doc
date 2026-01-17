import { define, signal, computed, effect, For, useHead } from '@effuse/core';
import { isTaggedError } from '@effuse/core';
import { useInfiniteQuery, useMutation } from '@effuse/query';
import { Ink } from '@effuse/ink';
import type {
	todosStore as TodosStoreType,
	Todo,
} from '../../store/todosStore.js';
import { DocsLayout } from '../../components/docs/DocsLayout';
import { useInfiniteScroll } from '../../hooks/index.js';
import type { i18nStore as I18nStoreType } from '../../store/appI18n';
import { triggerHaptic } from '../../components/Haptics';
import { TodoError } from '../../errors/index.js';
import '../../styles/examples.css';

const API_BASE = 'https://jsonplaceholder.typicode.com';
const PAGE_SIZE = 10;

export const TodosPage = define({
	script: ({ useCallback, useStore }) => {
		const i18nStore = useStore('i18n') as typeof I18nStoreType;
		const todosStore = useStore('todosStore') as typeof TodosStoreType;

		const t = computed(() => i18nStore.translations.value?.examples?.todos);

		const editInputValue = signal('');
		const inputValue = signal('');

		effect(() => {
			useHead({
				title: `${t.value?.title as string} - Effuse Playground`,
				description: t.value?.description as string,
			});
		});

		const isEditModalOpen = computed(() => todosStore.isEditModalOpen());

		const todosQuery = useInfiniteQuery<Todo[], number>({
			queryKey: ['todos'],
			queryFn: async ({ pageParam }) => {
				const url = `${API_BASE}/todos?userId=1&_page=${pageParam}&_limit=${PAGE_SIZE}`;
				const response = await fetch(url);
				if (!response.ok) {
					throw new TodoError({
						message: `Failed to fetch todos (HTTP ${response.status})`,
						operation: 'fetch',
					});
				}
				return response.json() as Promise<Todo[]>;
			},
			initialPageParam: 1,
			getNextPageParam: (lastPage, allPages) =>
				lastPage.length < PAGE_SIZE ? undefined : allPages.length + 1,
			staleTime: 60000,
		});

		const addMutation = useMutation<Todo, { title: string }>({
			mutationFn: async ({ title }) => {
				const response = await fetch(`${API_BASE}/todos`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title, completed: false, userId: 1 }),
				});
				if (!response.ok) {
					throw new TodoError({
						message: `Failed to add todo (HTTP ${response.status})`,
						operation: 'add',
					});
				}
				return response.json() as Promise<Todo>;
			},
			onSuccess: (data) => {
				const newTodo: Todo = { ...data, id: todosStore.generateId() };
				todosStore.addTodo(newTodo);
			},
		});

		const filteredTodos = computed(() => {
			const filterValue = todosStore.filter.value;
			const todos = todosStore.todos.value;
			switch (filterValue) {
				case 'completed':
					return todos.filter((t) => t.completed);
				case 'pending':
					return todos.filter((t) => !t.completed);
				case 'all':
				default:
					return todos;
			}
		});
		const totalCount = computed(() => todosStore.todos.value.length);
		const completedCount = computed(
			() => todosStore.todos.value.filter((t) => t.completed).length
		);
		const pendingCount = computed(
			() => totalCount.value - completedCount.value
		);
		const isAdding = computed(() => addMutation.isPending.value);
		const isLoading = computed(
			() => todosStore.todos.value.length === 0 && todosQuery.isPending.value
		);

		const setFilter = (f: 'all' | 'completed' | 'pending') =>
			todosStore.setFilter(f);
		const toggleTodo = (id: number) => todosStore.toggleTodo(id);
		const deleteTodo = (id: number) => todosStore.deleteTodo(id);
		const openEditModal = (todo: Todo) => {
			editInputValue.value = todo.title;
			todosStore.openEditModal(todo);
		};
		const closeEditModal = () => todosStore.closeEditModal();
		const saveEdit = () => {
			todosStore.saveEditWithTitle(editInputValue.value);
		};

		const handleAddTodo = useCallback(() => {
			const title = inputValue.value.trim();
			if (title && !addMutation.isPending.value) {
				addMutation.mutate({ title });
				inputValue.value = '';
			}
		});

		const handleInputChange = useCallback((e: Event) => {
			inputValue.value = (e.target as HTMLInputElement).value;
		});

		const handleKeyDown = useCallback((e: KeyboardEvent) => {
			if (e.key === 'Enter') {
				handleAddTodo();
			}
		});

		const loadMore = useCallback(() => {
			if (
				todosQuery.hasNextPage.value &&
				!todosQuery.isFetchingNextPage.value
			) {
				todosQuery.fetchNextPage();
			}
		});

		const infiniteScroll = useInfiniteScroll({
			threshold: 100,
		});

		infiniteScroll.onLoadMore(() => loadMore());

		const syncedPageCount = signal(0);

		effect(() => {
			const pages = todosQuery.allPagesData.value;
			if (pages && pages.length > syncedPageCount.value) {
				if (syncedPageCount.value === 0) {
					todosStore.setTodos(pages.flat());
				} else {
					const newPages = pages.slice(syncedPageCount.value);
					const newTodos = newPages.flat();
					todosStore.appendTodos(newTodos);
				}
				syncedPageCount.value = pages.length;
			}
		});

		const codeSnippet = `
\`\`\`tsx
const query = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam }) => fetchTodos(pageParam)
});

const mutation = useMutation({
  mutationFn: (id) => toggleTodo(id)
});
\`\`\``.trim();

		return {
			t,
			todosQuery,
			filteredTodos,
			totalCount,
			completedCount,
			pendingCount,
			isEditModalOpen,
			editInputValue,
			inputValue,
			handleAddTodo,
			handleInputChange,
			handleKeyDown,
			isAdding,
			isLoading,
			setFilter,
			toggleTodo,
			deleteTodo,
			openEditModal,
			closeEditModal,
			saveEdit,
			loadMore,
			handleScroll: infiniteScroll.handleScroll,
			hasNextPage: todosQuery.hasNextPage,
			isFetchingNextPage: todosQuery.isFetchingNextPage,
			codeSnippet,
			filter: todosStore.filter,
		};
	},
	template: ({
		t,
		filteredTodos,
		totalCount,
		completedCount,
		pendingCount,
		isEditModalOpen,
		editInputValue,
		inputValue,
		handleAddTodo,
		handleInputChange,
		handleKeyDown,
		isAdding,
		isLoading,
		setFilter,
		toggleTodo,
		deleteTodo,
		openEditModal,
		closeEditModal,
		saveEdit,
		loadMore,
		handleScroll,
		hasNextPage,
		isFetchingNextPage,
		todosQuery,
		codeSnippet,
		filter,
	}) => (
		<DocsLayout currentPath="/todos">
			<section class="example-container">
				{computed(() =>
					isEditModalOpen.value ? (
						<div class="modal-overlay">
							<div class="modal-backdrop" onClick={() => closeEditModal()} />
							<article
								class="modal-card"
								role="dialog"
								aria-modal="true"
								aria-labelledby="todo-modal-title"
							>
								<header class="px-6 py-4 bg-white/5">
									<h3
										id="todo-modal-title"
										class="text-xl font-bold text-white"
									>
										{t.value?.editTodo}
									</h3>
								</header>
								<div class="p-6">
									<label class="block mb-2 text-sm font-medium text-slate-400">
										{t.value?.todoTitle}
									</label>
									<input
										type="text"
										value={editInputValue}
										onInput={(e: Event) =>
											(editInputValue.value = (
												e.target as HTMLInputElement
											).value)
										}
										onKeyDown={(e: KeyboardEvent) => {
											if (e.key === 'Enter') saveEdit();
											if (e.key === 'Escape') closeEditModal();
										}}
										class="example-input"
										placeholder={
											t.value?.enterTodoTitlePlaceholder ??
											'Enter todo title...'
										}
										autoFocus
									/>
								</div>
								<footer class="px-6 py-4 bg-white/5 flex justify-end gap-3">
									<button
										type="button"
										onClick={() => closeEditModal()}
										class="btn-secondary"
									>
										{t.value?.cancel}
									</button>
									<button
										type="button"
										onClick={() => saveEdit()}
										class="btn-premium"
									>
										{t.value?.saveChanges}
									</button>
								</footer>
							</article>
						</div>
					) : null
				)}

				<header class="example-header">
					<h1 class="example-title">{t.value?.title}</h1>
					<p class="example-description">{t.value?.description}</p>
				</header>

				<details
					class="example-card"
					style="padding: 1.5rem; margin-top: 2rem;"
				>
					<summary
						class="stat-label"
						style="margin-bottom: 1rem; cursor: pointer; outline: none;"
					>
						{(t.value as any)?.howItWorks}
					</summary>
					<div style="margin-top: 1rem;">
						<figure>
							<Ink content={codeSnippet} />
						</figure>
					</div>
				</details>

				<section
					class="example-info flex flex-wrap justify-center gap-3 mb-10"
					aria-label="Example features"
				>
					<span class="example-badge">useInfiniteQuery</span>
					<span class="example-badge">Portal Modal</span>
					<span
						class="example-badge"
						style="background: rgba(141, 240, 204, 0.1); color: var(--accent-mint); border-color: rgba(141, 240, 204, 0.1);"
					>
						@effuse/store
					</span>
				</section>

				<section class="example-card" aria-label="Add new todo">
					<div class="flex gap-3">
						<input
							type="text"
							placeholder={t.value?.addPlaceholder ?? ''}
							value={inputValue}
							onInput={handleInputChange}
							onKeyDown={handleKeyDown}
							class="example-input"
							aria-label="New todo title"
						/>
						<button
							type="button"
							onClick={() => {
								triggerHaptic('light');
								handleAddTodo();
							}}
							class={() =>
								inputValue.value.trim().length > 0 && !isAdding.value
									? 'btn-premium'
									: 'btn-premium opacity-50 cursor-not-allowed'
							}
						>
							{isAdding.value ? t.value?.adding : t.value?.add}
						</button>
					</div>
				</section>

				<section class="stat-grid" aria-label="Task statistics">
					<article
						class="stat-card"
						style="background: rgba(255, 255, 255, 0.03); border-color: rgba(255, 255, 255, 0.05);"
					>
						<h4 class="stat-label">{t.value?.total}</h4>
						<div class="stat-value" style="color: var(--text-primary);">
							{totalCount.value}
						</div>
					</article>
					<article class="stat-card">
						<h4 class="stat-label">{t.value?.completed}</h4>
						<div class="stat-value">{completedCount.value}</div>
					</article>
					<article
						class="stat-card"
						style="background: rgba(182, 157, 248, 0.03); border-color: rgba(182, 157, 248, 0.1);"
					>
						<h4 class="stat-label">{t.value?.pending}</h4>
						<div class="stat-value" style="color: var(--accent-lilac);">
							{pendingCount.value}
						</div>
					</article>
				</section>

				<nav class="flex justify-center gap-2 mb-6" aria-label="Filter todos">
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setFilter('all');
						}}
						class={() =>
							filter.value === 'all' ? 'btn-premium' : 'btn-secondary'
						}
						style="padding: 0.5rem 1rem;"
					>
						{t.value?.all}
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setFilter('completed');
						}}
						class={() =>
							filter.value === 'completed' ? 'btn-premium' : 'btn-secondary'
						}
						style="padding: 0.5rem 1rem;"
					>
						{t.value?.completed}
					</button>
					<button
						type="button"
						onClick={() => {
							triggerHaptic('light');
							setFilter('pending');
						}}
						class={() =>
							filter.value === 'pending' ? 'btn-premium' : 'btn-secondary'
						}
						style="padding: 0.5rem 1rem;"
					>
						{t.value?.pending}
					</button>
				</nav>

				<section
					class="example-card"
					style="padding: 0; overflow: hidden;"
					aria-label="Todo list"
				>
					<div
						class="max-h-[500px] overflow-y-auto custom-scrollbar"
						onScroll={handleScroll}
					>
						{computed(() =>
							isLoading.value ? (
								<div class="p-12 text-center text-slate-500 italic">
									{t.value?.loadingTodos}
								</div>
							) : null
						)}

						{computed(() =>
							!isLoading.value && totalCount.value === 0 ? (
								<div class="p-12 text-center text-slate-500 italic">
									{t.value?.noTodos}
								</div>
							) : null
						)}

						<ul class="todo-list list-none p-0 m-0">
							<For each={filteredTodos} keyExtractor={(t) => t.id}>
								{(todoSignal) => (
									<li class="px-6 py-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
										<button
											type="button"
											onClick={() => {
												triggerHaptic('light');
												toggleTodo(todoSignal.value.id);
											}}
											aria-label={`Toggle ${todoSignal.value.title}`}
											class={() =>
												todoSignal.value.completed
													? 'w-6 h-6 rounded-full bg-mint text-slate-900 flex items-center justify-center flex-shrink-0 animate-water-drop'
													: 'w-6 h-6 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center flex-shrink-0 transition-colors'
											}
											style={() => ({
												background: todoSignal.value.completed
													? 'var(--accent-mint)'
													: 'rgba(255,255,255,0.05)',
											})}
										>
											{todoSignal.value.completed ? (
												<span class="text-[10px] font-black">✓</span>
											) : null}
										</button>
										<div class="flex-1 min-w-0">
											<p
												class={() =>
													todoSignal.value.completed
														? 'text-slate-500 line-through'
														: 'text-slate-200 font-medium'
												}
											>
												{todoSignal.value.title}
											</p>
										</div>
										<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
											<button
												type="button"
												onClick={() => openEditModal(todoSignal.value)}
												class="btn-secondary"
												style="padding: 0.3rem 0.8rem; font-size: 0.75rem;"
											>
												{t.value?.edit}
											</button>
											<button
												type="button"
												onClick={() => deleteTodo(todoSignal.value.id)}
												class="btn-secondary"
												style="padding: 0.3rem 0.8rem; font-size: 0.75rem; border-color: rgba(255, 100, 100, 0.2); color: #ff6b6b;"
											>
												{t.value?.delete}
											</button>
										</div>
										<span class="flex-shrink-0 example-badge">
											ID: {todoSignal.value.id}
										</span>
									</li>
								)}
							</For>
						</ul>

						{computed(() =>
							todosQuery.isFetching.value && totalCount.value > 0 ? (
								<div class="p-4 text-center text-slate-500 text-sm bg-white/[0.01]">
									{todosQuery.isFetchingNextPage.value
										? t.value?.loadingMore
										: t.value?.refreshing}
								</div>
							) : null
						)}
					</div>

					{computed(() =>
						hasNextPage.value ? (
							<div class="p-4 text-center bg-white/5">
								<button
									onClick={() => loadMore()}
									class="btn-secondary w-full max-w-xs mx-auto"
									disabled={isFetchingNextPage.value}
								>
									{isFetchingNextPage.value
										? t.value?.loadingMore
										: t.value?.loadMore}
								</button>
							</div>
						) : null
					)}

					{computed(() =>
						todosQuery.isError.value ? (
							<div class="p-4 bg-red-500/10 text-red-400 border-t border-red-500/20 text-center text-sm">
								{isTaggedError(todosQuery.error.value)
									? todosQuery.error.value.toString()
									: todosQuery.error.value?.message || 'Error loading todos'}
							</div>
						) : null
					)}
				</section>
			</section>
		</DocsLayout>
	),
});
