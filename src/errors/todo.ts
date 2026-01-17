import { TaggedError } from '../utils/data/index.js';

export class TodoError extends TaggedError('TodoError')<{
	readonly message: string;
	readonly operation: 'fetch' | 'add' | 'update' | 'delete' | 'toggle';
	readonly todoId?: number;
	readonly cause?: unknown;
}> {
	override toString(): string {
		const idPart = this.todoId !== undefined ? ` (id: ${this.todoId})` : '';
		return `${this._tag} [${this.operation}]${idPart}: ${this.message}`;
	}
}
