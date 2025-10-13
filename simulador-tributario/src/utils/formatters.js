// src/utils/formatters.js

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
} // Ponto e vírgula removido daqui

export function parseNumber(formattedValue) {
  if (!formattedValue || typeof formattedValue !== 'string') return 0;
  return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
}

export function formatValue(value) {
    if (value === null || value === undefined || value === 0 || isNaN(value)) return '-';
    return `R$ ${formatNumber(value)}`;
} // Ponto e vírgula removido daqui