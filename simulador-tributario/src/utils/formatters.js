// src/utils/formatters.js

export function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function parseNumber(formattedValue) {
  if (!formattedValue || typeof formattedValue !== 'string') return 0;
  return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
}

/**
 * Formata apenas o valor monetário do detalhe tributário ou um valor numérico direto.
 *
 * @param {Object | Number | string} value - Objeto de detalhe {aliquota, valor}, valor numérico, ou '-'.
 * @returns {string} - O valor formatado como "R$ X.XXX,XX" ou "-".
 */
export function formatValue(value) {
    // Caso seja o objeto de detalhe {aliquota, valor}
    if (typeof value === 'object' && value !== null && value.valor !== undefined) {
        if (value.valor === 0) return '-';
        return `R$ ${formatNumber(value.valor)}`;
    }
    
    // Caso seja um valor numérico direto (usado nos TOTAlS) ou a string '-'
    if (value === null || value === undefined || value === 0 || isNaN(value) || value === '-') return '-';
    return `R$ ${formatNumber(value)}`;
}

/**
 * Formata apenas a alíquota de um objeto de detalhe tributário para exibição.
 *
 * @param {Object | string} detail - O objeto contendo a alíquota (em %) e o valor, ou '-' se não se aplica.
 * @returns {string} - A alíquota formatada como "X,XX%" ou "-".
 */
export function formatTaxRate(detail) {
  // Verifica se o detalhe é nulo, indefinido, '-', ou não possui alíquota válida
  if (!detail || detail === '-' || typeof detail !== 'object' || detail.aliquota === undefined) {
    return '-';
  }

  // Verifica se a alíquota é 0 ou NaN
  if (detail.aliquota === 0 || isNaN(detail.aliquota)) {
      return '-';
  }
  
  // A alíquota está em percentual (ex: 4.80 para 4,80%)
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(detail.aliquota) + '%';
}