export function calcularIrpjCsll(faturamento, regime, lucroRealApurado = 0, anexoSimples = '', periodo = 'anual') {
    const aliquotas = { irpj: 0.15, adicional: 0.10, csll: 0.09 };
    const limiteAdicional = periodo === 'anual' ? 240000 : 60000;
    
    let baseIrpj = 0;
    let baseCsll = 0;

    if (regime === 'presumido') {
        // Se for comércio (Anexo I ou II), base é 8% e 12%. Serviço (III, IV, V) é 32%.
        const isComercio = anexoSimples === 'anexoI' || anexoSimples === 'anexoII';
        const presuncaoIrpj = isComercio ? 0.08 : 0.32;
        const presuncaoCsll = isComercio ? 0.12 : 0.32;
        
        baseIrpj = faturamento * presuncaoIrpj;
        baseCsll = faturamento * presuncaoCsll;
    } else if (regime === 'real') {
        baseIrpj = lucroRealApurado;
        baseCsll = lucroRealApurado;
    }

    let irpj = 0;
    let adicional = 0;
    let csll = 0;

    if (baseIrpj > 0) {
        irpj = baseIrpj * aliquotas.irpj;
        if (baseIrpj > limiteAdicional) {
            adicional = (baseIrpj - limiteAdicional) * aliquotas.adicional;
        }
    }

    if (baseCsll > 0) {
        csll = baseCsll * aliquotas.csll;
    }

    return {
        irpj: { valor: irpj, aliquota: faturamento > 0 ? (irpj / faturamento) * 100 : 0 },
        adicional: { valor: adicional, aliquota: faturamento > 0 ? (adicional / faturamento) * 100 : 0 },
        csll: { valor: csll, aliquota: faturamento > 0 ? (csll / faturamento) * 100 : 0 }
    };
}