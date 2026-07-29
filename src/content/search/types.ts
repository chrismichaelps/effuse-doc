export interface SearchResultItem {
  id: string;
  documentId: string;
  text: string;
  score: number;
  heading?: string;
  filePath?: string;
  anchor?: string;
  matchedIn?: 'title' | 'content' | 'code' | 'heading';
}

export interface SearchResponse {
  readonly results: readonly SearchResultItem[];
}
