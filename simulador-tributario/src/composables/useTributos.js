// src/composables/useTributos.js

import { ref, computed } from 'vue';

// Todas as tabelas de alíquotas do Simples Nacional
const tabelas = {
  anexoI: [ // Comércio
    { ate: 180000, aliquota: 0.04, deduzir: 0 }, { ate: 360000, aliquota: 0.073, deduzir: 5940 }, { ate: 720000, aliquota: 0.095, deduzir: 13860 }, { ate: 1800000, aliquota: 0.107, deduzir: 22500 }, { ate: 3600000, aliquota: 0.143, deduzir: 87300 }, { ate: 4800000, aliquota: 0.19, deduzir: 378000 },
  ],
  anexoII: [ // Indústria
    { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.078, deduzir: 5940 }, { ate: 720000, aliquota: 0.10, deduzir: 13860 }, { ate: 1800000, aliquota: 0.112, deduzir: 22500 }, { ate: 3600000, aliquota: 0.147, deduzir: 85500 }, { ate: 4800000, aliquota: 0.30, deduzir: 720000 },
  ],
  anexoIII: [
    { ate: 180000, aliquota: 0.06, deduzir: 0 }, { ate: 360000, aliquota: 0.112, deduzir: 9360 }, { ate: 720000, aliquota: 0.135, deduzir: 17640 }, { ate: 1800000, aliquota: 0.16, deduzir: 35640 }, { ate: 3600000, aliquota: 0.21, deduzir: 125640 }, { ate: 4800000, aliquota: 0.33, deduzir: 648000 },
  ],
  anexoIV: [ // Serviços (advocacia, obras, etc.)
    { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.09, deduzir: 8100 }, { ate: 720000, aliquota: 0.102, deduzir: 12420 }, { ate: 1800000, aliquota: 0.14, deduzir: 39780 }, { ate: 3600000, aliquota: 0.22, deduzir: 183780 }, { ate: 4800000, aliquota: 0.33, deduzir: 828000 },
  ],
  anexoV: [
    { ate: 180000, aliquota: 0.155, deduzir: 0 }, { ate: 360000, aliquota: 0.18, deduzir: 4500 }, { ate: 720000, aliquota: 0.195, deduzir: 9900 }, { ate: 1800000, aliquota: 0.205, deduzir: 17100 }, { ate: 3600000, aliquota: 0.23, deduzir: 62100 }, { ate: 4800000, aliquota: 0.305, deduzir: 540000 },
  ],
};

// A função principal que será exportada e usada no App.vue
export function useTributos() {
    const resultados = ref(null);

    function calcularSimplesNacional(inputs) {
        const { rbt12, folhaPagamento12m, faturamentoMes, anexoSimples } = inputs;
        if (!rbt12 || !faturamentoMes) return { total: 0, aliquotaEfetiva: 0, anexo: 'N/A' };
        
        let anexoCalculado = anexoSimples;
        let nomeAnexo = anexoSimples.replace('anexo', '');
        
        // Regra do Fator R: se o anexo for III, pode virar V
        if (anexoSimples === 'anexoIII') {
            const fatorR = folhaPagamento12m / rbt12;
            if (fatorR < 0.28) {
                anexoCalculado = 'anexoV';
                nomeAnexo = 'V';
            }
        }
        
        const tabela = tabelas[anexoCalculado];
        if(!tabela) return { total: 0, aliquotaEfetiva: 0, anexo: 'Inválido' };

        const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
        const { aliquota, deduzir } = faixa;
        const aliquotaEfetiva = ((rbt12 * aliquota) - deduzir) / rbt12;
        const total = faturamentoMes * aliquotaEfetiva;
        return { total, aliquotaEfetiva, anexo: nomeAnexo.toUpperCase() };
    }

    function calcularLucroPresumido(inputs) {
        const { faturamentoMes } = inputs;
        if (!faturamentoMes) return { total: 0, aliquotaEfetiva: 0 };
        const basePresuncao = 0.32;
        const pis = faturamentoMes * 0.0065;
        const cofins = faturamentoMes * 0.03;
        const iss = faturamentoMes * 0.05;
        const baseCalculoIRPJCSLL = faturamentoMes * basePresuncao;
        let irpj = baseCalculoIRPJCSLL * 0.15;
        if (baseCalculoIRPJCSLL > 20000) irpj += (baseCalculoIRPJCSLL - 20000) * 0.10;
        const csll = baseCalculoIRPJCSLL * 0.09;
        const total = pis + cofins + iss + irpj + csll;
        const aliquotaEfetiva = total / faturamentoMes;
        return { total, aliquotaEfetiva };
    }

    function calcularLucroReal(inputs) {
        const { faturamentoMes, custoServico, proLabore, aluguel, folhaPagamento12m } = inputs;
        if (!faturamentoMes) return { total: 0, aliquotaEfetiva: 0 };
        const folhaMes = (folhaPagamento12m / 12);
        const totalDespesas = custoServico + proLabore + aluguel + folhaMes;
        const lucroAntesImpostos = faturamentoMes - totalDespesas;
        let irpj = 0; let csll = 0;
        if (lucroAntesImpostos > 0) {
            irpj = lucroAntesImpostos * 0.15;
            if (lucroAntesImpostos > 20000) irpj += (lucroAntesImpostos - 20000) * 0.10;
            csll = lucroAntesImpostos * 0.09;
        }
        const pis = faturamentoMes * 0.0165;
        const cofins = faturamentoMes * 0.076;
        const total = pis + cofins + irpj + csll;
        const aliquotaEfetiva = faturamentoMes > 0 ? total / faturamentoMes : 0;
        return { total, aliquotaEfetiva };
    }

    // Função que roda todos os cálculos
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
            { nome: 'Simples Nacional', valor: resultados.value.simples.total },
            { nome: 'Lucro Presumido', valor: resultados.value.presumido.total },
            { nome: 'Lucro Real', valor: resultados.value.real.total },
        ];
        regimes.sort((a, b) => a.valor - b.valor);
        const ranks = {};
        regimes.forEach((regime, index) => {
            ranks[regime.nome] = index + 1;
        });
        return ranks;
    });

    const melhorRegime = computed(() => {
        if (!resultados.value) return 'N/A';
        const regimes = Object.entries(rankedResults.value);
        const vencedor = regimes.find(r => r[1] === 1);
        return vencedor ? vencedor[0] : 'N/A';
    });

    return {
        resultados,
        simularImpostos,
        rankedResults,
        melhorRegime
    };
}