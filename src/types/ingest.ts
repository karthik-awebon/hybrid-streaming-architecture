export interface IngestRecord {
  text: string;
  embedding: number[];
}

export type IngestStatus = 'idle' | 'chunking' | 'embedding' | 'uploading' | 'success' | 'error';
