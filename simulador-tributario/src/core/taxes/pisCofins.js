export function calcularPisCofins(faturamento, regime, despesasCredito = 0) {
    const config = {
        presumido: { pis: 0.0065, cofins: 0.03, cumulativo: true },
        real: { pis: 0.0165, cofins: 0.076, cumulativo: false }
    };

    const regras = config[regime];
    if (!regras) return { pis_pasep: { valor: 0, aliquota: 0 }, cofins: { valor: 0, aliquota: 0 } };

    // Débitos
    const pisDebito = faturamento * regras.pis;
    const cofinsDebito = faturamento * regras.cofins;

    // Créditos (Apenas Lucro Real)
    let pisCredito = 0;
    let cofinsCredito = 0;

    if (!regras.cumulativo && despesasCredito > 0) {
        pisCredito = despesasCredito * regras.pis;
        cofinsCredito = despesasCredito * regras.cofins;
    }

    const pisDevido = Math.max(0, pisDebito - pisCredito);
    const cofinsDevido = Math.max(0, cofinsDebito - cofinsCredito);

    return {
        // AQUI: Renomeado para pis_pasep para aparecer no relatório
        pis_pasep: { valor: pisDevido, aliquota: faturamento > 0 ? (pisDevido / faturamento) * 100 : regras.pis * 100 },
        cofins: { valor: cofinsDevido, aliquota: faturamento > 0 ? (cofinsDevido / faturamento) * 100 : regras.cofins * 100 }
    };
}