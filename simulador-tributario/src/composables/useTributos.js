import { ref, computed } from 'vue';
import { SimplesNacional } from '../core/regimes/SimplesNacional.js';
import { LucroPresumido } from '../core/regimes/LucroPresumido.js';
import { LucroReal } from '../core/regimes/LucroReal.js';
import { parseNumber } from '../utils/formatters.js';

// CORREÇÃO: Função matemática que calcula a % final
function somarDetalhes(listaDetalhes, faturamentoTotal) {
    const total = {};
    const fatTotalNum = Number(faturamentoTotal) || 0;

    // 1. Soma os valores (R$)
    listaDetalhes.forEach(detalhe => {
        for (const key in detalhe) {
            if (!total[key]) total[key] = { valor: 0, aliquota: 0 };
            
            const valorItem = typeof detalhe[key] === 'object' ? detalhe[key].valor : detalhe[key];
            
            if (valorItem) {
                total[key].valor += valorItem;
            }
        }
    });

    // 2. AQUI ESTÁ O SEGREDO: Recalcula a % baseada no total anual
    if (fatTotalNum > 0) {
        for (const key in total) {
            total[key].aliquota = (total[key].valor / fatTotalNum) * 100;
        }
    }

    return total;
}

export function useTributos() {
    const resultados = ref(null);
    const resultadosTrimestrais = ref(null);

    function simularImpostos(inputsRaw, periodo = 'anual') {
        const inputs = inputsRaw; 
        const calcSimples = new SimplesNacional(inputs);
        const calcPresumido = new LucroPresumido(inputs);
        const calcReal = new LucroReal(inputs);

        let totais = { simples: { v:0, d:[] }, presumido: { v:0, d:[] }, real: { v:0, d:[] }, anexoSimples: '' };
        let faturamentoTotal = 0;

        // Garante numérico
        if (periodo === 'anual') {
            faturamentoTotal = typeof inputs.faturamentoAnual === 'string' ? parseNumber(inputs.faturamentoAnual) : inputs.faturamentoAnual;
            const despesas = inputs.despesasAnual;
            const baseICMS = inputs.anexoSimples === 'anexoI' ? (typeof inputs.faturamentoComercio.anual === 'string' ? parseNumber(inputs.faturamentoComercio.anual) : inputs.faturamentoComercio.anual) : faturamentoTotal;

            const resSimples = calcSimples.calcular(faturamentoTotal, despesas, periodo, baseICMS);
            const resPresumido = calcPresumido.calcular(faturamentoTotal, despesas, baseICMS, periodo);
            const resReal = calcReal.calcular(faturamentoTotal, despesas, baseICMS, periodo);

            totais.simples.v = resSimples.valorImpostos; totais.simples.d.push(resSimples.detalhes); totais.anexoSimples = resSimples.anexo;
            totais.presumido.v = resPresumido.valorImpostos; totais.presumido.d.push(resPresumido.detalhes);
            totais.real.v = resReal.valorImpostos; totais.real.d.push(resReal.detalhes);
        } else {
            // Trimestral
            faturamentoTotal = Object.values(inputs.faturamentosTrimestrais).reduce((a, b) => a + (typeof b === 'string' ? parseNumber(b) : b), 0);
            const trimestralRes = {};

            ['t1', 't2', 't3', 't4'].forEach(trim => {
                const fatTrim = typeof inputs.faturamentosTrimestrais[trim] === 'string' ? parseNumber(inputs.faturamentosTrimestrais[trim]) : inputs.faturamentosTrimestrais[trim];
                const despTrim = inputs.despesasTrimestrais[trim];
                const valComercio = inputs.faturamentoComercio.trimestral[trim];
                const baseICMSTrim = inputs.anexoSimples === 'anexoI' ? (typeof valComercio === 'string' ? parseNumber(valComercio) : valComercio) : fatTrim;

                const rs = calcSimples.calcular(fatTrim, despTrim, periodo, baseICMSTrim);
                const rp = calcPresumido.calcular(fatTrim, despTrim, baseICMSTrim, periodo);
                const rr = calcReal.calcular(fatTrim, despTrim, baseICMSTrim, periodo);

                totais.simples.v += rs.valorImpostos; totais.simples.d.push(rs.detalhes); totais.anexoSimples = rs.anexo;
                totais.presumido.v += rp.valorImpostos; totais.presumido.d.push(rp.detalhes);
                totais.real.v += rr.valorImpostos; totais.real.d.push(rr.detalhes);

                trimestralRes[trim] = { simples: rs, presumido: rp, real: rr, faturamento: fatTrim };
            });
            resultadosTrimestrais.value = trimestralRes;
        }

        // Consolidação com passagem do faturamentoTotal
        const consolidar = (regimeObj) => ({
            valorImpostos: regimeObj.v,
            cargaTributariaPercentual: faturamentoTotal > 0 ? (regimeObj.v / faturamentoTotal) * 100 : 0,
            detalhes: somarDetalhes(regimeObj.d, faturamentoTotal), // <--- IMPORTANTE: Passando o total
            anexo: regimeObj.anexoSimples || undefined
        });

        resultados.value = {
            simples: consolidar(totais.simples),
            presumido: consolidar(totais.presumido),
            real: consolidar(totais.real)
        };
    }

    const rankedResults = computed(() => {
        if (!resultados.value) return {};
        const lista = [
            { nome: 'Simples Nacional', valor: resultados.value.simples.valorImpostos },
            { nome: 'Lucro Presumido', valor: resultados.value.presumido.valorImpostos },
            { nome: 'Lucro Real', valor: resultados.value.real.valorImpostos },
        ];
        lista.sort((a, b) => a.valor - b.valor);
        const ranks = {};
        lista.forEach((r, i) => ranks[r.nome] = i + 1);
        return ranks;
    });

    const melhorRegime = computed(() => {
        if (!rankedResults.value) return 'N/A';
        const entries = Object.entries(rankedResults.value);
        const winner = entries.find(e => e[1] === 1);
        return winner ? winner[0] : 'N/A';
    });

    return { resultados, resultadosTrimestrais, simularImpostos, rankedResults, melhorRegime };
}