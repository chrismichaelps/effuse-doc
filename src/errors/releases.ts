import { TaggedError } from '../utils/data/index.js';

export class ReleasesError extends TaggedError('ReleasesError')<{
  readonly message: string;
  readonly statusCode?: number;
}> {
  override toString(): string {
    return `[${this._tag}] ${this.statusCode ? `(${this.statusCode}) ` : ''}${this.message}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      _tag: this._tag,
      message: this.message,
      statusCode: this.statusCode,
    };
  }
}
