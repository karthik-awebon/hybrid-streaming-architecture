import { DEFAULT_CHUNK_SIZE, DEFAULT_CHUNK_OVERLAP } from '@/constants';

export function chunkText(
  text: string,
  chunkSize: number = DEFAULT_CHUNK_SIZE,
  overlap: number = DEFAULT_CHUNK_OVERLAP
): string[] {
  if (!text) return [];

  // Split by paragraphs first to try and keep context together
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length <= chunkSize) {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      // If a single paragraph is longer than chunk size, split it by words
      if (paragraph.length > chunkSize) {
        const words = paragraph.split(' ');
        let wordChunk = '';

        for (const word of words) {
          if ((wordChunk + ' ' + word).length <= chunkSize) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk);
              // Handle overlap
              const overlapWords = wordChunk.split(' ').slice(-overlap).join(' ');
              wordChunk = overlapWords + ' ' + word;
            } else {
              wordChunk = word; // Word is longer than chunk size, just add it
            }
          }
        }
        if (wordChunk) {
          currentChunk = wordChunk;
        } else {
          currentChunk = '';
        }
      } else {
        currentChunk = paragraph;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks.map((chunk) => chunk.trim()).filter((chunk) => chunk.length > 0);
}
