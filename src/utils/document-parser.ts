import mammoth from 'mammoth';
import { logger } from '@/utils/logger';
import { ValidationError, AppError } from '@/utils/errors';
import { parseImageToMarkdown } from '@/actions/ingest';

/**
 * Extracts text from a PDF file.
 */
async function parsePdf(file: File): Promise<string> {
  try {
    // Dynamic import to avoid SSR issues with browser-only APIs like DOMMatrix
    const pdfjsLib = await import('pdfjs-dist');

    // Configure pdfjs worker if in browser
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      // Use the local worker from the public folder
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Array,
      useWorkerFetch: false, // Avoid worker fetching issues in some environments
    });

    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas 2d context');
        }
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport, canvas }).promise;
        const base64Image = canvas.toDataURL('image/jpeg', 0.8);

        // Process this page through the VLM Server Action
        const pageMarkdown = await parseImageToMarkdown(base64Image);
        fullText += pageMarkdown + '\n\n';
      } catch (pageError) {
        logger.warn(`Error parsing page ${i} of PDF ${file.name}`, { error: pageError });
        continue; // Skip failed pages but continue parsing others
      }
    }

    if (!fullText.trim()) {
      throw new Error('No text content found in PDF');
    }

    return fullText.trim();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    logger.error('Error parsing PDF', {
      message: errorMessage,
      fileName: file.name,
      stack: error?.stack,
    });
    throw new AppError(`Failed to parse PDF: ${file.name} - ${errorMessage}`, 500, error);
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
    case 'md':
      return parseTxt(file);
    default:
      throw new ValidationError(`Unsupported file type: ${extension}`);
  }
}
