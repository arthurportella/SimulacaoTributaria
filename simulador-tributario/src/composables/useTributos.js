// src/composables/useTributos.js

import { ref, computed } from 'vue';

// As tabelas de alíquotas do Simples Nacional (sem alterações)
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

        if (!rbt12 || !faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0, anexo: 'N/A' };
        
        let anexoCalculado = anexoSimples;
        let nomeAnexo = anexoSimples.replace('anexo', '');

        if (anexoSimples === 'anexoIII' && rbt12 > 0) {
            const fatorR = folhaPagamento12m / rbt12;
            if (fatorR < 0.28) { 
                anexoCalculado = 'anexoV'; 
                nomeAnexo = 'V (pelo Fator R)'; 
            } else {
                nomeAnexo = 'III';
            }
        }
        
        const tabela = tabelas[anexoCalculado];
        if(!tabela) return { valorImpostos: 0, cargaTributariaPercentual: 0, anexo: 'Inválido' };

        const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
        const { aliquota, deduzir } = faixa;
        const aliquotaEfetiva = rbt12 > 0 ? ((rbt12 * aliquota) - deduzir) / rbt12 : 0;
        
        const impostoPrincipalDAS = faturamentoAnual * aliquotaEfetiva;


        const fgts = despesas.salarios * (encargos.fgts / 100);

        const sublimite = 3600000;
        let issForaDoSimples = 0;
        let icmsForaDoSimples = 0;

        if (faturamentoAnual > sublimite) {
            // Se a receita ultrapassa 3.6M, calculamos ISS e ICMS por fora
            issForaDoSimples = faturamentoAnual * (encargos.iss / 100);
            icmsForaDoSimples = faturamentoAnual * (encargos.icms / 100);
        }

        const valorImpostos = impostoPrincipalDAS + fgts + issForaDoSimples + icmsForaDoSimples;
        
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;

        return { valorImpostos, cargaTributariaPercentual, anexo: nomeAnexo.toUpperCase() };
    }

    function calcularLucroPresumido(inputs) {
        const { faturamentoAnual, despesas, encargos } = inputs;

        if (!faturamentoAnual) {
            return { valorImpostos: 0, cargaTributariaPercentual: 0 };
        }

        // --- CÁLCULO DOS IMPOSTOS FEDERAIS (PIS, COFINS, IRPJ, CSLL) ---
        const basePresuncao = 0.32; // Para serviços
        const pis = faturamentoAnual * 0.0065;
        const cofins = faturamentoAnual * 0.03;
        
        const baseCalculoIRPJCSLL = faturamentoAnual * basePresuncao;
        const limiteAdicionalAnual = 240000;
        
        let irpj = baseCalculoIRPJCSLL * 0.15;
        if (baseCalculoIRPJCSLL > limiteAdicionalAnual) {
            irpj += (baseCalculoIRPJCSLL - limiteAdicionalAnual) * 0.10;
        }
        const csll = baseCalculoIRPJCSLL * 0.09;

        const impostosFederais = pis + cofins + irpj + csll;

        // --- CÁLCULO DE TODOS OS OUTROS ENCARGOS E IMPOSTOS ADICIONAIS ---
        const folhaTotal = despesas.salarios + despesas.proLabore;
        const baseFolhaSalarios = despesas.salarios;

        // Encargos sobre o Faturamento
        const iss = faturamentoAnual * (encargos.iss / 100);
        const icms = faturamentoAnual * (encargos.icms / 100);
        const ipi = faturamentoAnual * (encargos.ipi / 100);
        // Nota: Os ICMS/IPI específicos de entrada/saída não costumam entrar na carga tributária geral
        // de serviço no Presumido, mas mantive o cálculo caso seu modelo de negócio precise.
        const icmsInterno = faturamentoAnual * (encargos.icmsInterno / 100);
        const icmsInterestadual = faturamentoAnual * (encargos.icmsInterestadual / 100);
        const icmsImportacao = faturamentoAnual * (encargos.icmsImportacao / 100);
        const ipiEntrada = faturamentoAnual * (encargos.ipiEntrada / 100);

        // Encargos sobre a Folha de Pagamento
        const inss = folhaTotal * (encargos.inss / 100);
        const inssTerceiros = baseFolhaSalarios * (encargos.inssTerceiros / 100);
        const rat = baseFolhaSalarios * (encargos.rat / 100);
        const fgts = baseFolhaSalarios * (encargos.fgts / 100);

        // Soma de todos os encargos adicionais
        const outrosEncargos = 
            iss + icms + ipi + icmsInterno + icmsInterestadual + icmsImportacao + ipiEntrada +
            inss + inssTerceiros + rat + fgts;

        // --- SOMA FINAL ---
        const valorImpostos = impostosFederais + outrosEncargos;
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;

        return { valorImpostos, cargaTributariaPercentual };
    }

    function calcularLucroReal(inputs) {
        const { faturamentoAnual, despesas, encargos } = inputs;

        if (!faturamentoAnual) return { valorImpostos: 0, cargaTributariaPercentual: 0 };

        // --- CÁLCULO DE PIS/COFINS NÃO-CUMULATIVO (COM CRÉDITOS) ---
        const baseCalculoCreditos = 
            despesas.comprasInternas +
            despesas.comprasInterestaduais +
            despesas.comprasImportadas +
            despesas.insumoServicos +
            despesas.energiaAluguelFretes +
            despesas.depreciacao;

        const pisDebito = faturamentoAnual * 0.0165;
        const cofinsDebito = faturamentoAnual * 0.076;
        const pisCredito = baseCalculoCreditos * 0.0165;
        const cofinsCredito = baseCalculoCreditos * 0.076;
        const pisDevido = Math.max(0, pisDebito - pisCredito);
        const cofinsDevido = Math.max(0, cofinsDebito - cofinsCredito);
        const impostosSobreReceita = pisDevido + cofinsDevido;
        
        // --- CÁLCULO DE TODOS OS OUTROS ENCARGOS E IMPOSTOS ADICIONAIS ---
        const folhaTotal = despesas.salarios + despesas.proLabore;
        const baseFolhaSalarios = despesas.salarios;
        
        // Encargos sobre o Faturamento
        const iss = faturamentoAnual * (encargos.iss / 100);
        const icms = faturamentoAnual * (encargos.icms / 100);
        const ipi = faturamentoAnual * (encargos.ipi / 100);
        const icmsInterno = faturamentoAnual * (encargos.icmsInterno / 100);
        const icmsInterestadual = faturamentoAnual * (encargos.icmsInterestadual / 100);
        const icmsImportacao = faturamentoAnual * (encargos.icmsImportacao / 100);
        const ipiEntrada = faturamentoAnual * (encargos.ipiEntrada / 100);

        // Encargos sobre a Folha de Pagamento
        const inss = folhaTotal * (encargos.inss / 100);
        const inssTerceiros = baseFolhaSalarios * (encargos.inssTerceiros / 100);
        const rat = baseFolhaSalarios * (encargos.rat / 100);
        const fgts = baseFolhaSalarios * (encargos.fgts / 100);

        // Soma de todos os encargos adicionais
        const outrosEncargos = 
            iss + icms + ipi + icmsInterno + icmsInterestadual + icmsImportacao + ipiEntrada +
            inss + inssTerceiros + rat + fgts;

        // --- CÁLCULO DO IRPJ E CSLL ---
        const despesasAnual = getDespesasOperacionaisAnual(inputs);
        // Nota: A variável 'outrosEncargos' e a função 'getEncargosAdicionaisAnual' calculam a mesma coisa.
        // Usaremos 'outrosEncargos' que já calculamos para clareza.
        const lucroAntesIRCS = faturamentoAnual - despesasAnual - outrosEncargos - impostosSobreReceita;

        let irpj = 0; 
        let csll = 0;
        if (lucroAntesIRCS > 0) {
            const limiteAdicionalAnual = 240000;
            irpj = lucroAntesIRCS * 0.15;
            if (lucroAntesIRCS > limiteAdicionalAnual) {
                irpj += (lucroAntesIRCS - limiteAdicionalAnual) * 0.10;
            }
            csll = lucroAntesIRCS * 0.09;
        }
        
        // --- SOMA FINAL ---
        const valorImpostos = impostosSobreReceita + irpj + csll + outrosEncargos;
        const cargaTributariaPercentual = faturamentoAnual > 0 ? (valorImpostos / faturamentoAnual) * 100 : 0;
        
        return { valorImpostos, cargaTributariaPercentual };
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
        // ALTERAÇÃO: O critério de ranqueamento agora é o 'valorImpostos'
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