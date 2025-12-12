// src/utils/formatters.js

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function parseNumber(formattedValue) {
  if (typeof formattedValue === 'number') return formattedValue; // Se já for número, retorna ele mesmo
  if (!formattedValue || typeof formattedValue !== 'string') return 0;
  return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
}

export function formatValue(value) {
    if (typeof value === 'object' && value !== null && value.valor !== undefined) {
        if (value.valor === 0) return '-';
        return `R$ ${formatNumber(value.valor)}`;
    }
    if (value === null || value === undefined || value === 0 || isNaN(value) || value === '-') return '-';
    return `R$ ${formatNumber(value)}`;
}

export function formatTaxRate(detail) {
  if (!detail || detail === '-' || typeof detail !== 'object' || detail.aliquota === undefined) {
    return '-';
  }
  // Permite exibir alíquotas muito pequenas, mas oculta se for realmente 0
  if (Math.abs(detail.aliquota) < 0.01 || isNaN(detail.aliquota)) {
      return '-';
  }
  
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(detail.aliquota) + '%';
}