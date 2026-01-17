import { TaggedError } from '../utils/data/index.js';

export class I18nError extends TaggedError('I18nError')<{
	readonly locale: string;
	readonly statusCode?: number;
	readonly cause?: unknown;
}> {
	override toString(): string {
		const statusPart =
			this.statusCode !== undefined ? ` (${this.statusCode})` : '';
		return `${this._tag}${statusPart}: Failed to load translations for ${this.locale}`;
	}
}
