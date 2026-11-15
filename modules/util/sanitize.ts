import DOMPurify from 'dompurify';

/**
 * Sanitize HTML to prevent XSS attacks.
 * Uses DOMPurify with a customized configuration.
 * This allows safe HTML tags through while stripping dangerous ones.
 *
 * @param dirty - The untrusted HTML string to sanitize
 * @returns The sanitized HTML string
 */
export function utilSanitizeHTML(dirty: string): string {
  if (!dirty) return '';

  return DOMPurify.sanitize(dirty, {
    ADD_TAGS: ['use']
  });
}
