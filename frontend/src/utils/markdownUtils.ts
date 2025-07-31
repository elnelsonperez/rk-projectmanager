import { marked } from 'marked';

// Configure marked for basic markdown support
marked.setOptions({
  breaks: true, // Support line breaks
  gfm: true, // GitHub flavored markdown
});

/**
 * Convert markdown text to HTML
 * Supports basic formatting: bold, italic, lists, line breaks
 */
export function convertMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';
  
  try {
    // Convert markdown to HTML
    const html = marked(markdown);
    return typeof html === 'string' ? html : '';
  } catch (error) {
    console.error('Error converting markdown:', error);
    // Fallback: return plain text with line breaks
    return markdown.replace(/\n/g, '<br>');
  }
}

/**
 * Strip HTML tags from text (for display purposes)
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}