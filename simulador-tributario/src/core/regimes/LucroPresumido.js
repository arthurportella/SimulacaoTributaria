import { calcularPisCofins } from '../taxes/pisCofins';
import { calcularIrpjCsll } from '../taxes/irpjCsll';

export class LucroPresumido {
    constructor(inputs) {
        this.inputs = inputs;
    }

    calcular(faturamento, despesas, faturamentoBaseICMS, periodo) {
        if (!faturamento) return { valorImpostos: 0, detalhes: {} };
        const { encargos, anexoSimples } = this.inputs;

        // 1. Federais
        const pisCofins = calcularPisCofins(faturamento, 'presumido');
        const irpjCsll = calcularIrpjCsll(faturamento, 'presumido', 0, anexoSimples, periodo);

        // 2. Outros Encargos
        const iss = faturamento * (encargos.iss / 100);
        const ipi = faturamento * (encargos.ipi / 100);
        
        // 3. CÁLCULO DO ICMS (Conforme solicitado)
        // Débito = Faturamento * 17% (exemplo)
        const debitoIcms = faturamentoBaseICMS * (encargos.icms / 100);
        
        // Crédito = Compras * 12% (exemplo)
        // Somamos os créditos de todos os tipos de compra
        const creditoComprasInternas = despesas.comprasInternas * (encargos.icmsInterno || 0) / 100;
        const creditoComprasInterestaduais = despesas.comprasInterestaduais * (encargos.icmsInterestadual || 0) / 100;
        const creditoComprasImportadas = despesas.comprasImportadas * (encargos.icmsImportacao || 0) / 100;
        
        const totalCreditoIcms = creditoComprasInternas + creditoComprasInterestaduais + creditoComprasImportadas;
        
        // Resultado Líquido (se crédito for maior, imposto é 0)
        const icmsLiquido = Math.max(0, debitoIcms - totalCreditoIcms);

        // 4. Folha e Totais
        const folha = despesas.salarios + despesas.proLabore;
        const inss = folha * (encargos.inss / 100);
        const inssTerceiros = despesas.salarios * (encargos.inssTerceiros / 100);
        const rat = despesas.salarios * (encargos.rat / 100);
        const fgts = despesas.salarios * (encargos.fgts / 100);

        const total = pisCofins.pis_pasep.valor + pisCofins.cofins.valor + 
                      irpjCsll.irpj.valor + irpjCsll.adicional.valor + irpjCsll.csll.valor +
                      iss + ipi + icmsLiquido + inss + inssTerceiros + rat + fgts;

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