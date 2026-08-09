export interface DocHeading {
  readonly text: string;
  readonly id: string;
  readonly level: number;
}

export interface DocCodeBlock {
  readonly id: string;
  readonly language?: string;
  readonly code: string;
  readonly headingId?: string;
  readonly headingText?: string;
  readonly startLine: number;
}

export interface DocEntry {
  readonly id: string;
  readonly title: string;
  readonly text: string;
  readonly codeContent: string;
  readonly codeBlocks: readonly DocCodeBlock[];
  readonly path: string;
  readonly headings: readonly DocHeading[];
}
