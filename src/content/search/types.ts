export interface SearchCodePreview {
  readonly language?: string;
  readonly section?: string;
  readonly lines: readonly string[];
  readonly startLine: number;
  readonly truncatedBefore: boolean;
  readonly truncatedAfter: boolean;
  readonly additionalMatches: number;
}

export interface SearchResultItem {
  id: string;
  documentId: string;
  text: string;
  score: number;
  heading?: string;
  filePath?: string;
  anchor?: string;
  matchedIn?: 'title' | 'content' | 'code' | 'heading';
  code?: SearchCodePreview;
}

export interface SearchResponse {
  readonly results: readonly SearchResultItem[];
}
