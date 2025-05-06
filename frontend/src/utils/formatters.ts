/**
 * Format a number as Dominican Pesos (RD$)
 * @param value The number to format
 * @returns Formatted currency string or '-' if value is null/undefined
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return `RD$${value.toLocaleString('es-DO')}`;
}

/**
 * Format a date string to a human-readable date and time
 * @param dateStr ISO date string
 * @returns Formatted date and time string or '-' if date is invalid
 */
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  
  try {
    const date = new Date(dateStr);
    
    // Use Intl.DateTimeFormat for localized formatting
    return new Intl.DateTimeFormat('es-DO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  } catch (error) {
    console.error('Error formatting date', error);
    return '-';
  }
}