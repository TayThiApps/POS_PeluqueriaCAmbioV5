export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function parseCurrency(value: string): number {
  // Remove currency symbols and parse
  const cleaned = value.replace(/[€\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}
