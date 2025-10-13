// src/composables/useTributos.js

import { ref, computed } from 'vue';

const tabelas = {
  anexoI: [ { ate: 180000, aliquota: 0.04, deduzir: 0 }, { ate: 360000, aliquota: 0.073, deduzir: 5940 }, { ate: 720000, aliquota: 0.095, deduzir: 13860 }, { ate: 1800000, aliquota: 0.107, deduzir: 22500 }, { ate: 3600000, aliquota: 0.143, deduzir: 87300 }, { ate: 4800000, aliquota: 0.19, deduzir: 378000 }, ],
  anexoII: [ { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.078, deduzir: 5940 }, { ate: 720000, aliquota: 0.10, deduzir: 13860 }, { ate: 1800000, aliquota: 0.112, deduzir: 22500 }, { ate: 3600000, aliquota: 0.147, deduzir: 85500 }, { ate: 4800000, aliquota: 0.30, deduzir: 720000 }, ],
  anexoIII: [ { ate: 180000, aliquota: 0.06, deduzir: 0 }, { ate: 360000, aliquota: 0.112, deduzir: 9360 }, { ate: 720000, aliquota: 0.135, deduzir: 17640 }, { ate: 1800000, aliquota: 0.16, deduzir: 35640 }, { ate: 3600000, aliquota: 0.21, deduzir: 125640 }, { ate: 4800000, aliquota: 0.33, deduzir: 648000 }, ],
  anexoIV: [ { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.09, deduzir: 8100 }, { ate: 720000, aliquota: 0.102, deduzir: 12420 }, { ate: 1800000, aliquota: 0.14, deduzir: 39780 }, { ate: 3600000, aliquota: 0.22, deduzir: 183780 }, { ate: 4800000, aliquota: 0.33, deduzir: 828000 }, ],
  anexoV: [ { ate: 180000, aliquota: 0.155, deduzir: 0 }, { ate: 360000, aliquota: 0.18, deduzir: 4500 }, { ate: 720000, aliquota: 0.195, deduzir: 9900 }, { ate: 1800000, aliquota: 0.205, deduzir: 17100 }, { ate: 3600000, aliquota: 0.23, deduzir: 62100 }, { ate: 4800000, aliquota: 0.305, deduzir: 540000 }, ],
};

export function useTributos() {
    const resultados = ref(null);
    
    // eslint-disable-next-line no-unused-vars
    function getDespesasOperacionaisAnual(inputs) {
        return Object.values(inputs.despesas).reduce((acc, valor) => acc + (valor || 0), 0);
    }

    function calcularSimplesNacional(inputs, periodo) {
        const { rbt12, faturamentoAnual, anexoSimples, despesas, encargos } = inputs;
        const folhaPagamento12m = despesas.salarios + despesas.proLabore;
        if (!rbt12 || !faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, anexo: 'N/A', detalhes: {} };
        
        const faturamento = periodo === 'trimestral' ? faturamentoAnual / 4 : faturamentoAnual;
        
        let anexoCalculado = anexoSimples;
        let nomeAnexo = anexoSimples.replace('anexo', '');
        if (anexoSimples === 'anexoIII' && rbt12 > 0) {
            const fatorR = folhaPagamento12m / rbt12;
            if (fatorR < 0.28) { anexoCalculado = 'anexoV'; nomeAnexo = 'V (pelo Fator R)'; } else { nomeAnexo = 'III';}
        }
        
        const tabela = tabelas[anexoCalculado];
        if(!tabela) return { valorImpostos: 0, cargaTributariaPercentual: 0, anexo: 'Inválido', detalhes: {} };

        const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
        const { aliquota, deduzir } = faixa;
        const aliquotaEfetiva = rbt12 > 0 ? ((rbt12 * aliquota) - deduzir) / rbt12 : 0;
        
        const impostoPrincipalDAS = faturamento * aliquotaEfetiva;

        // Alíquotas Folha e Outros
        const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100;
        const aliquotaIcms = encargos.icms / 100;
        
        const fgts = (periodo === 'trimestral' ? despesas.salarios / 4 : despesas.salarios) * aliquotaFgts;
        const sublimite = 3600000;
        let issForaDoSimples = 0;
        let icmsForaDoSimples = 0;
        if (faturamentoAnual > sublimite) {
            issForaDoSimples = faturamento * aliquotaIss;
            icmsForaDoSimples = faturamento * aliquotaIcms;
        }

        const valorImpostos = impostoPrincipalDAS + fgts + issForaDoSimples + icmsForaDoSimples;
        const cargaTributariaPercentual = faturamento > 0 ? (valorImpostos / faturamento) * 100 : 0;
        
        // ESTRUTURA DE DETALHES MODIFICADA
        const detalhes = {
            simplesNacional: { aliquota: aliquotaEfetiva * 100, valor: impostoPrincipalDAS },
            iss: { aliquota: aliquotaIss * 100, valor: issForaDoSimples },
            icms: { aliquota: aliquotaIcms * 100, valor: icmsForaDoSimples },
            fgts: { aliquota: aliquotaFgts * 100, valor: fgts }, // FGTS (calculado sobre salários)
        };

        return { valorImpostos, cargaTributariaPercentual, anexo: nomeAnexo.toUpperCase(), detalhes };
    }

    function calcularLucroPresumido(inputs, periodo) {
        const { faturamentoAnual, despesas, encargos } = inputs;
        if (!faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, detalhes: {} };

        const faturamento = periodo === 'trimestral' ? faturamentoAnual / 4 : faturamentoAnual;

        // Alíquotas Federais
        const aliquotaPis = 0.0065;
        const aliquotaCofins = 0.03;
        const aliquotaBasePresuncao = 0.32;
        const aliquotaIrpjPrincipal = 0.15;
        const aliquotaIrpjAdicional = 0.10;
        const aliquotaCsll = 0.09;

        const pis = faturamento * aliquotaPis;
        const cofins = faturamento * aliquotaCofins;
        const baseCalculoIRPJCSLL = faturamento * aliquotaBasePresuncao;
        const limiteAdicionalTrimestral = 60000;
        const limiteAdicionalAnual = 240000;
        
        const irpjPrincipal = baseCalculoIRPJCSLL * aliquotaIrpjPrincipal;
        let adicionalIRPJ = 0;
        let aliquotaAdicionalIRPJFaturamento = 0;
        const limiteAdicional = periodo === 'trimestral' ? limiteAdicionalTrimestral : limiteAdicionalAnual;
        if (baseCalculoIRPJCSLL > limiteAdicional) {
            adicionalIRPJ = (baseCalculoIRPJCSLL - limiteAdicional) * aliquotaIrpjAdicional;
            // Cálculo da Alíquota do Adicional em relação ao Faturamento (para exibição)
            aliquotaAdicionalIRPJFaturamento = faturamento > 0 ? (adicionalIRPJ / faturamento) : 0;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        const csll = baseCalculoIRPJCSLL * aliquotaCsll;
        const impostosFederais = pis + cofins + irpj + csll;

        // Alíquotas Folha e Outros
        const aliquotaInss = encargos.inss / 100;
        const aliquotaInssTerceiros = encargos.inssTerceiros / 100;
        const aliquotaRat = encargos.rat / 100;
        const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100;
        const aliquotaIcms = encargos.icms / 100;
        const aliquotaIpi = encargos.ipi / 100;

        const folhaTotal = (periodo === 'trimestral' ? (despesas.salarios + despesas.proLabore) / 4 : (despesas.salarios + despesas.proLabore));
        const baseFolhaSalarios = (periodo === 'trimestral' ? despesas.salarios / 4 : despesas.salarios);
        const iss = faturamento * aliquotaIss;
        const icms = faturamento * aliquotaIcms;
        const ipi = faturamento * aliquotaIpi;
        const inss = folhaTotal * aliquotaInss;
        const inssTerceiros = baseFolhaSalarios * aliquotaInssTerceiros;
        const rat = baseFolhaSalarios * aliquotaRat;
        const fgts = baseFolhaSalarios * aliquotaFgts;

        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;
        const valorImpostos = impostosFederais + outrosEncargos;
        const cargaTributariaPercentual = faturamento > 0 ? (valorImpostos / faturamento) * 100 : 0;

        // ESTRUTURA DE DETALHES MODIFICADA
        const detalhes = {
            pis_pasep: { aliquota: aliquotaPis * 100, valor: pis },
            cofins: { aliquota: aliquotaCofins * 100, valor: cofins },
            irpj: { aliquota: aliquotaBasePresuncao * aliquotaIrpjPrincipal * 100, valor: irpjPrincipal },
            adicionalIRPJ: { aliquota: aliquotaAdicionalIRPJFaturamento * 100, valor: adicionalIRPJ },
            csll: { aliquota: aliquotaBasePresuncao * aliquotaCsll * 100, valor: csll },
            ipi: { aliquota: aliquotaIpi * 100, valor: ipi },
            iss: { aliquota: aliquotaIss * 100, valor: iss },
            icms: { aliquota: aliquotaIcms * 100, valor: icms },
            inss: { aliquota: aliquotaInss * 100, valor: inss },
            inssTerceiros: { aliquota: aliquotaInssTerceiros * 100, valor: inssTerceiros },
            rat: { aliquota: aliquotaRat * 100, valor: rat },
            fgts: { aliquota: aliquotaFgts * 100, valor: fgts },
        };

        return { valorImpostos, cargaTributariaPercentual, detalhes };
    }

    function calcularLucroReal(inputs, periodo) {
        const { faturamentoAnual, despesas, encargos } = inputs;
        if (!faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, detalhes: {} };

        const faturamento = periodo === 'trimestral' ? faturamentoAnual / 4 : faturamentoAnual;
        const despesasPeriodo = {};
        for (const key in despesas) {
            despesasPeriodo[key] = periodo === 'trimestral' ? despesas[key] / 4 : despesas[key];
        }


        // Alíquotas Federais
        const aliquotaPisDebito = 0.0165;
        const aliquotaCofinsDebito = 0.076;
        const aliquotaIrpjPrincipal = 0.15;
        const aliquotaIrpjAdicional = 0.10;
        const aliquotaCsll = 0.09;
        
        const baseCalculoCreditos = despesasPeriodo.comprasInternas + despesasPeriodo.comprasInterestaduais + despesasPeriodo.comprasImportadas + despesasPeriodo.insumoServicos + despesasPeriodo.energiaAluguelFretes + despesasPeriodo.depreciacao;
        const pisDebito = faturamento * aliquotaPisDebito;
        const cofinsDebito = faturamento * aliquotaCofinsDebito;
        const pisCredito = baseCalculoCreditos * aliquotaPisDebito;
        const cofinsCredito = baseCalculoCreditos * aliquotaCofinsDebito;
        const pisDevido = Math.max(0, pisDebito - pisCredito);
        const cofinsDevido = Math.max(0, cofinsDebito - cofinsCredito);
        const impostosSobreReceita = pisDevido + cofinsDevido;

        // Alíquotas Folha e Outros
        const aliquotaInss = encargos.inss / 100;
        const aliquotaInssTerceiros = encargos.inssTerceiros / 100;
        const aliquotaRat = encargos.rat / 100;
        const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100;
        const aliquotaIcms = encargos.icms / 100;
        const aliquotaIpi = encargos.ipi / 100;
        
        const folhaTotal = despesasPeriodo.salarios + despesasPeriodo.proLabore;
        const baseFolhaSalarios = despesasPeriodo.salarios;
        const iss = faturamento * aliquotaIss;
        const icms = faturamento * aliquotaIcms;
        const ipi = faturamento * aliquotaIpi;
        const inss = folhaTotal * aliquotaInss;
        const inssTerceiros = baseFolhaSalarios * aliquotaInssTerceiros;
        const rat = baseFolhaSalarios * aliquotaRat;
        const fgts = baseFolhaSalarios * aliquotaFgts;
        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;

        const despesasOperacionais = Object.values(despesasPeriodo).reduce((acc, valor) => acc + (valor || 0), 0);
        const lucroAntesIRCS = faturamento - despesasOperacionais - outrosEncargos - impostosSobreReceita;

        let irpjPrincipal = 0;
        let adicionalIRPJ = 0;
        let csll = 0;
        let aliquotaIrpjFaturamento = 0;
        let aliquotaAdicionalIRPJFaturamento = 0;
        let aliquotaCsllFaturamento = 0;

        if (lucroAntesIRCS > 0) {
            const limiteAdicionalTrimestral = 60000;
            const limiteAdicionalAnual = 240000;
            const limiteAdicional = periodo === 'trimestral' ? limiteAdicionalTrimestral : limiteAdicionalAnual;
            irpjPrincipal = lucroAntesIRCS * aliquotaIrpjPrincipal;
            if (lucroAntesIRCS > limiteAdicional) {
                adicionalIRPJ = (lucroAntesIRCS - limiteAdicional) * aliquotaIrpjAdicional;
            }
            csll = lucroAntesIRCS * aliquotaCsll;

            // Cálculo da Alíquota do IRPJ/CSLL em relação ao Faturamento (para exibição)
            aliquotaIrpjFaturamento = faturamento > 0 ? (irpjPrincipal / faturamento) : 0;
            aliquotaAdicionalIRPJFaturamento = faturamento > 0 ? (adicionalIRPJ / faturamento) : 0;
            aliquotaCsllFaturamento = faturamento > 0 ? (csll / faturamento) : 0;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        
        const valorImpostos = impostosSobreReceita + irpj + csll + outrosEncargos;
        const cargaTributariaPercentual = faturamento > 0 ? (valorImpostos / faturamento) * 100 : 0;
        
        // ESTRUTURA DE DETALHES MODIFICADA
        const detalhes = { 
            // PIS/COFINS (Alíquota é o valor devido dividido pelo faturamento)
            pis_pasep: { aliquota: faturamento > 0 ? (pisDevido / faturamento) * 100 : 0, valor: pisDevido },
            cofins: { aliquota: faturamento > 0 ? (cofinsDevido / faturamento) * 100 : 0, valor: cofinsDevido },
            // IRPJ/CSLL (Alíquota é o valor calculado dividido pelo faturamento)
            irpj: { aliquota: aliquotaIrpjFaturamento * 100, valor: irpjPrincipal },
            adicionalIRPJ: { aliquota: aliquotaAdicionalIRPJFaturamento * 100, valor: adicionalIRPJ },
            csll: { aliquota: aliquotaCsllFaturamento * 100, valor: csll },
            ipi: { aliquota: aliquotaIpi * 100, valor: ipi },
            iss: { aliquota: aliquotaIss * 100, valor: iss },
            icms: { aliquota: aliquotaIcms * 100, valor: icms },
            // Encargos sobre a folha
            inss: { aliquota: aliquotaInss * 100, valor: inss },
            inssTerceiros: { aliquota: aliquotaInssTerceiros * 100, valor: inssTerceiros },
            rat: { aliquota: aliquotaRat * 100, valor: rat },
            fgts: { aliquota: aliquotaFgts * 100, valor: fgts },
        };

        return { valorImpostos, cargaTributariaPercentual, detalhes };
    }

    function simularImpostos(inputs, periodo = 'anual') {
        // Renomeando 'pis' para 'pis_pasep' para melhor correspondência com as chaves (se necessário)
        const simplesCalculado = calcularSimplesNacional(inputs, periodo);
        const presumidoCalculado = calcularLucroPresumido(inputs, periodo);
        const realCalculado = calcularLucroReal(inputs, periodo);

        // O Simples Nacional não detalha PIS/COFINS/IRPJ/CSLL. Vamos garantir que as chaves existam com valor '-' para o Simples.
        const detalhesSimples = {
            pis_pasep: '-',
            cofins: '-',
            irpj: '-',
            adicionalIRPJ: '-',
            csll: '-',
            ipi: '-',
            inss: '-',
            inssTerceiros: '-',
            rat: '-',
            // Os demais tributos (ISS, ICMS, FGTS) já estão calculados/detalhados no simplesCalculado.detalhes
            ...simplesCalculado.detalhes,
            // Revertendo o nome simplesNacional para SIMPLES NACIONAL (DAS)
            'simples nacional (DAS)': simplesCalculado.detalhes.simplesNacional,
            simplesNacional: undefined
        };
        delete detalhesSimples.simplesNacional;

        // O Lucro Presumido não detalha o campo SIMPLES NACIONAL (DAS).
        const detalhesPresumido = { ...presumidoCalculado.detalhes, 'simples nacional (DAS)': '-' };

        // O Lucro Real também não detalha o campo SIMPLES NACIONAL (DAS).
        const detalhesReal = { ...realCalculado.detalhes, 'simples nacional (DAS)': '-' };


        resultados.value = {
            simples: { ...simplesCalculado, detalhes: detalhesSimples },
            presumido: { ...presumidoCalculado, detalhes: detalhesPresumido },
            real: { ...realCalculado, detalhes: detalhesReal },
        };
    }

    const rankedResults = computed(() => {
        if (!resultados.value) return {};
        const regimes = [
            { nome: 'Simples Nacional', valor: resultados.value.simples.valorImpostos },
            { nome: 'Lucro Presumido', valor: resultados.value.presumido.valorImpostos },
            { nome: 'Lucro Real', valor: resultados.value.real.valorImpostos },
        ];
        regimes.sort((a, b) => a.valor - b.valor);
        const ranks = {};
        regimes.forEach((regime, index) => { ranks[regime.nome] = index + 1; });
        return ranks;
    });

    const melhorRegime = computed(() => {
        if (!resultados.value || !Object.keys(rankedResults.value).length) return 'N/A';
        const regimes = Object.entries(rankedResults.value);
        const vencedor = regimes.find(r => r[1] === 1);
        return vencedor ? vencedor[0] : 'N/A';
    });

    return { resultados, simularImpostos, rankedResults, melhorRegime };
}