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
    
    function getDespesasOperacionaisAnual(inputs) {
        return Object.values(inputs.despesas).reduce((acc, valor) => acc + (valor || 0), 0);
    }

    function calcularSimplesNacional(inputs) {
        const { rbt12, faturamentoAnual, anexoSimples, despesas, encargos } = inputs;
        const folhaPagamento12m = despesas.salarios + despesas.proLabore;
        if (!rbt12 || !faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, anexo: 'N/A', detalhes: {} };
        
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
        
        const impostoPrincipalDAS = faturamentoAnual * aliquotaEfetiva;
        const fgts = despesas.salarios * (encargos.fgts / 100);
        const sublimite = 3600000;
        let issForaDoSimples = 0;
        let icmsForaDoSimples = 0;
        if (faturamentoAnual > sublimite) {
            issForaDoSimples = faturamentoAnual * (encargos.iss / 100);
            icmsForaDoSimples = faturamentoAnual * (encargos.icms / 100);
        }

        const valorImpostos = impostoPrincipalDAS + fgts + issForaDoSimples + icmsForaDoSimples;
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;
        
        const detalhes = {
            simplesNacional: impostoPrincipalDAS,
            iss: issForaDoSimples,
            icms: icmsForaDoSimples,
            fgts: fgts,
        };

        return { valorImpostos, cargaTributariaPercentual, anexo: nomeAnexo.toUpperCase(), detalhes };
    }

    function calcularLucroPresumido(inputs) {
        const { faturamentoAnual, despesas, encargos } = inputs;
        if (!faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, detalhes: {} };

        const basePresuncao = 0.32;
        const pis = faturamentoAnual * 0.0065;
        const cofins = faturamentoAnual * 0.03;
        const baseCalculoIRPJCSLL = faturamentoAnual * basePresuncao;
        const limiteAdicionalAnual = 240000;
        
        const irpjPrincipal = baseCalculoIRPJCSLL * 0.15;
        let adicionalIRPJ = 0;
        if (baseCalculoIRPJCSLL > limiteAdicionalAnual) {
            adicionalIRPJ = (baseCalculoIRPJCSLL - limiteAdicionalAnual) * 0.10;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        const csll = baseCalculoIRPJCSLL * 0.09;
        const impostosFederais = pis + cofins + irpj + csll;

        const folhaTotal = despesas.salarios + despesas.proLabore;
        const baseFolhaSalarios = despesas.salarios;
        const iss = faturamentoAnual * (encargos.iss / 100);
        const icms = faturamentoAnual * (encargos.icms / 100);
        const ipi = faturamentoAnual * (encargos.ipi / 100);
        const inss = folhaTotal * (encargos.inss / 100);
        const inssTerceiros = baseFolhaSalarios * (encargos.inssTerceiros / 100);
        const rat = baseFolhaSalarios * (encargos.rat / 100);
        const fgts = baseFolhaSalarios * (encargos.fgts / 100);

        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;
        const valorImpostos = impostosFederais + outrosEncargos;
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;

        const detalhes = { pis, cofins, irpj: irpjPrincipal, adicionalIRPJ, csll, ipi, iss, icms, inss, inssTerceiros, rat, fgts };

        return { valorImpostos, cargaTributariaPercentual, detalhes };
    }

    function calcularLucroReal(inputs) {
        const { faturamentoAnual, despesas, encargos } = inputs;
        if (!faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, detalhes: {} };

        const baseCalculoCreditos = despesas.comprasInternas + despesas.comprasInterestaduais + despesas.comprasImportadas + despesas.insumoServicos + despesas.energiaAluguelFretes + despesas.depreciacao;
        const pisDebito = faturamentoAnual * 0.0165;
        const cofinsDebito = faturamentoAnual * 0.076;
        const pisCredito = baseCalculoCreditos * 0.0165;
        const cofinsCredito = baseCalculoCreditos * 0.076;
        const pisDevido = Math.max(0, pisDebito - pisCredito);
        const cofinsDevido = Math.max(0, cofinsDebito - cofinsCredito);
        const impostosSobreReceita = pisDevido + cofinsDevido;
        
        const folhaTotal = despesas.salarios + despesas.proLabore;
        const baseFolhaSalarios = despesas.salarios;
        const iss = faturamentoAnual * (encargos.iss / 100);
        const icms = faturamentoAnual * (encargos.icms / 100);
        const ipi = faturamentoAnual * (encargos.ipi / 100);
        const inss = folhaTotal * (encargos.inss / 100);
        const inssTerceiros = baseFolhaSalarios * (encargos.inssTerceiros / 100);
        const rat = baseFolhaSalarios * (encargos.rat / 100);
        const fgts = baseFolhaSalarios * (encargos.fgts / 100);
        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;

        const despesasAnual = getDespesasOperacionaisAnual(inputs);
        const lucroAntesIRCS = faturamentoAnual - despesasAnual - outrosEncargos - impostosSobreReceita;

        let irpjPrincipal = 0;
        let adicionalIRPJ = 0;
        let csll = 0;
        if (lucroAntesIRCS > 0) {
            const limiteAdicionalAnual = 240000;
            irpjPrincipal = lucroAntesIRCS * 0.15;
            if (lucroAntesIRCS > limiteAdicionalAnual) {
                adicionalIRPJ = (lucroAntesIRCS - limiteAdicionalAnual) * 0.10;
            }
            csll = lucroAntesIRCS * 0.09;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        
        const valorImpostos = impostosSobreReceita + irpj + csll + outrosEncargos;
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;
        
        const detalhes = { pis: pisDevido, cofins: cofinsDevido, irpj: irpjPrincipal, adicionalIRPJ, csll, ipi, iss, icms, inss, inssTerceiros, rat, fgts };

        return { valorImpostos, cargaTributariaPercentual, detalhes };
    }

    function simularImpostos(inputs) {
        resultados.value = {
            simples: calcularSimplesNacional(inputs),
            presumido: calcularLucroPresumido(inputs),
            real: calcularLucroReal(inputs),
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