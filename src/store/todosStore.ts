import { createStore, connectDevTools } from '@effuse/store';
import { taggedEnum, Option, some, none } from '../utils/data/index.js';

export interface Todo {
	id: number;
	userId: number;
	title: string;
	completed: boolean;
}

type TodoFilter = 'all' | 'completed' | 'pending';

type EditModalClosed = { readonly _tag: 'Closed' };
type EditModalOpen = {
	readonly _tag: 'Open';
	readonly editingTodo: Todo;
	readonly title: string;
};
type EditModalState = EditModalClosed | EditModalOpen;

const EditModal = taggedEnum<EditModalState>();

interface TodosUIState {
	todos: Todo[];
	newTodoTitle: string;
	editModalState: EditModalState;
	filter: TodoFilter;
}

let nextLocalId = 1000;

const todoFilterPredicate =
	(filter: TodoFilter) =>
	(todo: Todo): boolean => {
		switch (filter) {
			case 'completed':
				return todo.completed;
			case 'pending':
				return !todo.completed;
			default:
				return true;
		}
	};

export const todosStore = createStore<
	TodosUIState & {
		setTodos: (todos: Todo[]) => void;
		appendTodos: (todos: Todo[]) => void;
		addTodo: (todo: Todo) => void;
		deleteTodo: (id: number) => void;
		toggleTodo: (id: number) => void;
		updateTodo: (id: number, title: string) => void;
		openEditModal: (todo: Todo) => void;
		closeEditModal: () => void;
		setEditTitle: (title: string) => void;
		saveEdit: () => void;
		saveEditWithTitle: (title: string) => void;
		setNewTodoTitle: (title: string) => void;
		setFilter: (filter: TodoFilter) => void;
		generateId: () => number;
		getFilteredTodos: () => readonly Todo[];
		getEditModalState: () => EditModalState;
		isEditModalOpen: () => boolean;
		getEditingTodo: () => Option<Todo>;
		getEditTitle: () => string;
	}
>(
	'todosUI',
	{
		todos: [],
		newTodoTitle: '',
		editModalState: EditModal.Closed({}),
		filter: 'all',
		setTodos(todos: Todo[]) {
			this.todos.value = todos;
		},
		appendTodos(todos: Todo[]) {
			this.todos.value = [...this.todos.value, ...todos];
		},
		addTodo(todo: Todo) {
			this.todos.value = [todo, ...this.todos.value];
			this.newTodoTitle.value = '';
		},
		deleteTodo(id: number) {
			this.todos.value = this.todos.value.filter((t) => t.id !== id);
		},
		toggleTodo(id: number) {
			this.todos.value = this.todos.value.map((todo) =>
				todo.id === id ? { ...todo, completed: !todo.completed } : todo
			);
		},
		updateTodo(id: number, title: string) {
			this.todos.value = this.todos.value.map((todo) =>
				todo.id === id ? { ...todo, title } : todo
			);
		},
		openEditModal(todo: Todo) {
			const newState = EditModal.Open({ editingTodo: todo, title: todo.title });
			this.editModalState.value = newState;
		},
		closeEditModal() {
			const newState = EditModal.Closed({});
			this.editModalState.value = newState;
		},
		setEditTitle(title: string) {
			const currentState = this.editModalState.value;
			EditModal.$match(currentState, {
				Closed: () => {},
				Open: ({ editingTodo }) => {
					const newState = EditModal.Open({ editingTodo, title });
					this.editModalState.value = newState;
				},
			});
		},
		saveEdit() {
			const currentState = this.editModalState.value;
			EditModal.$match(currentState, {
				Closed: () => {},
				Open: ({ editingTodo, title }) => {
					const trimmedTitle = title.trim();
					if (trimmedTitle) {
						this.todos.value = this.todos.value.map((t) =>
							t.id === editingTodo.id ? { ...t, title: trimmedTitle } : t
						);
					}
					const newState = EditModal.Closed({});
					this.editModalState.value = newState;
				},
			});
		},
		saveEditWithTitle(title: string) {
			const currentState = this.editModalState.value;
			EditModal.$match(currentState, {
				Closed: () => {},
				Open: ({ editingTodo }) => {
					const trimmedTitle = title.trim();
					if (trimmedTitle) {
						this.todos.value = this.todos.value.map((t) =>
							t.id === editingTodo.id ? { ...t, title: trimmedTitle } : t
						);
					}
					const newState = EditModal.Closed({});
					this.editModalState.value = newState;
				},
			});
		},
		setNewTodoTitle(title: string) {
			this.newTodoTitle.value = title;
		},
		setFilter(filter: TodoFilter) {
			this.filter.value = filter;
		},
		generateId() {
			return nextLocalId++;
		},
		getFilteredTodos() {
			return this.todos.value.filter(todoFilterPredicate(this.filter.value));
		},
		getEditModalState() {
			return this.editModalState.value;
		},
		isEditModalOpen() {
			const state = this.editModalState.value;
			return EditModal.$match(state, {
				Closed: () => false,
				Open: () => true,
			});
		},
		getEditingTodo(): Option<Todo> {
			const state = this.editModalState.value;
			return EditModal.$match(state, {
				Closed: () => none(),
				Open: ({ editingTodo }) => some(editingTodo),
			});
		},
		getEditTitle() {
			const state = this.editModalState.value;
			return EditModal.$match(state, {
				Closed: () => '',
				Open: ({ title }) => title,
			});
		},
	},
	{ devtools: true }
);
connectDevTools(todosStore);

export type { EditModalState };
