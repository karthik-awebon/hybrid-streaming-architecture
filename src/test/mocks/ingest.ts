import { IngestRecord } from '@/types/ingest';

export const mockIngestInput = {
  text: 'This is some test content for ingestion.',
};

export const mockIngestRecord: IngestRecord = {
  text: 'This is some test content for ingestion.',
  embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
};

export const mockIngestRecords: IngestRecord[] = [
  mockIngestRecord,
  {
    text: 'Another piece of content.',
    embedding: [0.5, 0.4, 0.3, 0.2, 0.1],
  },
];
