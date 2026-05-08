import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { logger } from '@/utils/logger';
import { ValidationError, AppError } from '@/utils/errors';

// Configure pdfjs worker
// In a real Next.js app, this might need a more robust setup like copying the worker to public/
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Extracts text from a PDF file.
 */
async function parsePdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: unknown) => (item as { str?: string }).str || '')
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    logger.error('Error parsing PDF', { error, fileName: file.name });
    throw new AppError(`Failed to parse PDF: ${file.name}`, 500, error);
  }
}

/**
 * Extracts text from a DOCX file.
 */
async function parseDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  } catch (error) {
    logger.error('Error parsing DOCX', { error, fileName: file.name });
    throw new AppError(`Failed to parse DOCX: ${file.name}`, 500, error);
  }
}

/**
 * Extracts text from a plain text file.
 */
async function parseTxt(file: File): Promise<string> {
  try {
    return await file.text();
  } catch (error) {
    logger.error('Error parsing TXT', { error, fileName: file.name });
    throw new AppError(`Failed to parse TXT: ${file.name}`, 500, error);
  }
}

/**
 * Parses a document file and extracts its text content.
 * Supported formats: PDF, DOCX, TXT.
 *
 * @param file - The File object to parse.
 * @returns A promise that resolves to the extracted text.
 * @throws ValidationError if the file type is unsupported.
 * @throws AppError if parsing fails.
 */
export async function parseDocument(file: File): Promise<string> {
  const extension = file.name.split('.').pop()?.toLowerCase();

  logger.info(`Parsing document: ${file.name} (type: ${extension})`);

  switch (extension) {
    case 'pdf':
      return parsePdf(file);
    case 'docx':
      return parseDocx(file);
    case 'txt':
      return parseTxt(file);
    default:
      throw new ValidationError(`Unsupported file type: ${extension}`);
  }
}
