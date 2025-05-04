/**
 * Format a number as Dominican Pesos (RD$)
 * @param value The number to format
 * @returns Formatted currency string or '-' if value is null/undefined
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '-';
  return `RD$${value.toLocaleString('es-DO')}`;
}