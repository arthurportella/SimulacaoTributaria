import { calcularPisCofins } from '../taxes/pisCofins';
import { calcularIrpjCsll } from '../taxes/irpjCsll';

export class LucroReal {
    constructor(inputs) {
        this.inputs = inputs;
    }

    calcular(faturamento, despesas, faturamentoBaseICMS, periodo) {
        if (!faturamento) return { valorImpostos: 0, detalhes: {} };
        const { encargos } = this.inputs;

        // 1. PIS/COFINS (Não cumulativo)
        const baseCredito = despesas.comprasInternas + despesas.comprasInterestaduais + 
                            despesas.insumoServicos + despesas.energiaAluguelFretes + despesas.depreciacao;

        const pisCofins = calcularPisCofins(faturamento, 'real', baseCredito);

        // 2. Outros Encargos
        const iss = faturamento * (encargos.iss / 100);
        const ipi = faturamento * (encargos.ipi / 100);
        
        // 3. CÁLCULO DO ICMS
        const debitoIcms = faturamentoBaseICMS * (encargos.icms / 100);
        
        const creditoComprasInternas = despesas.comprasInternas * (encargos.icmsInterno || 0) / 100;
        const creditoComprasInterestaduais = despesas.comprasInterestaduais * (encargos.icmsInterestadual || 0) / 100;
        const creditoComprasImportadas = despesas.comprasImportadas * (encargos.icmsImportacao || 0) / 100;
        
        const totalCreditoIcms = creditoComprasInternas + creditoComprasInterestaduais + creditoComprasImportadas;
        const icmsLiquido = Math.max(0, debitoIcms - totalCreditoIcms);

        const folha = despesas.salarios + despesas.proLabore;
        const inss = folha * (encargos.inss / 100);
        const inssTerceiros = despesas.salarios * (encargos.inssTerceiros / 100);
        const rat = despesas.salarios * (encargos.rat / 100);
        const fgts = despesas.salarios * (encargos.fgts / 100);

        const outrosImpostos = iss + ipi + icmsLiquido + inss + inssTerceiros + rat + fgts + 
                               pisCofins.pis_pasep.valor + pisCofins.cofins.valor;
        
        // 4. Apuração do Lucro Real (Deduzindo impostos da base)
        const totalDespesasOperacionais = Object.values(despesas).reduce((a, b) => a + b, 0);
        const lucroLiquido = faturamento - totalDespesasOperacionais - outrosImpostos; 

        const irpjCsll = calcularIrpjCsll(faturamento, 'real', Math.max(0, lucroLiquido), null, periodo);

        const total = outrosImpostos + irpjCsll.irpj.valor + irpjCsll.adicional.valor + irpjCsll.csll.valor;

        return {
            valorImpostos: total,
            detalhes: {
                ...pisCofins,
                irpj: irpjCsll.irpj,
                adicionalIRPJ: irpjCsll.adicional,
                csll: irpjCsll.csll,
                iss: { valor: iss, aliquota: encargos.iss },
                icms: { valor: icmsLiquido, aliquota: encargos.icms },
                ipi: { valor: ipi, aliquota: encargos.ipi },
                inss: { valor: inss, aliquota: encargos.inss },
                inssTerceiros: { valor: inssTerceiros, aliquota: encargos.inssTerceiros },
                rat: { valor: rat, aliquota: encargos.rat },
                fgts: { valor: fgts, aliquota: encargos.fgts }
            }
        };
    }
}