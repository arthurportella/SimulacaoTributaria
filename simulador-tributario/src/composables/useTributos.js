// src/composables/useTributos.js

import { ref, computed } from 'vue';

const tabelas = {
  anexoI: [ { ate: 180000, aliquota: 0.04, deduzir: 0 }, { ate: 360000, aliquota: 0.073, deduzir: 5940 }, { ate: 720000, aliquota: 0.095, deduzir: 13860 }, { ate: 1800000, aliquota: 0.107, deduzir: 22500 }, { ate: 3600000, aliquota: 0.143, deduzir: 87300 }, { ate: 4800000, aliquota: 0.19, deduzir: 378000 }, ],
  anexoII: [ { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.078, deduzir: 5940 }, { ate: 720000, aliquota: 0.10, deduzir: 13860 }, { ate: 1800000, aliquota: 0.112, deduzir: 22500 }, { ate: 3600000, aliquota: 0.147, deduzir: 85500 }, { ate: 4800000, aliquota: 0.30, deduzir: 720000 }, ],
  anexoIII: [ { ate: 180000, aliquota: 0.06, deduzir: 0 }, { ate: 360000, aliquota: 0.112, deduzir: 9360 }, { ate: 720000, aliquota: 0.135, deduzir: 17640 }, { ate: 1800000, aliquota: 0.16, deduzir: 35640 }, { ate: 3600000, aliquota: 0.21, deduzir: 125640 }, { ate: 4800000, aliquota: 0.33, deduzir: 648000 }, ],
  anexoIV: [ { ate: 180000, aliquota: 0.045, deduzir: 0 }, { ate: 360000, aliquota: 0.09, deduzir: 8100 }, { ate: 720000, aliquota: 0.102, deduzir: 12420 }, { ate: 1800000, aliquota: 0.14, deduzir: 39780 }, { ate: 3600000, aliquota: 0.22, deduzir: 183780 }, { ate: 4800000, aliquota: 0.33, deduzir: 828000 }, ],
  anexoV: [ { ate: 180000, aliquota: 0.155, deduzir: 0 }, { ate: 360000, aliquota: 0.18, deduzir: 4500 }, { ate: 720000, aliquota: 0.195, deduzir: 9900 }, { ate: 1800000, aliquota: 0.205, deduzir: 17100 }, { ate: 3600000, aliquota: 0.23, deduzir: 62100 }, { ate: 4800000, aliquota: 0.305, deduzir: 540000 }, ],
};

function somarDetalhes(detalhesArray, faturamentoTotal) {
  const total = {};
  detalhesArray.forEach(detalhesTrimestre => {
    for (const key in detalhesTrimestre) {
      if (typeof detalhesTrimestre[key] === 'object' && detalhesTrimestre[key] !== null && detalhesTrimestre[key].valor !== undefined) {
        if (!total[key]) {
          total[key] = { aliquota: 0, valor: 0 };
        }
        total[key].valor += detalhesTrimestre[key].valor;
      } else if (detalhesTrimestre[key] !== '-') {
         total[key] = detalhesTrimestre[key];
      }
    }
  });

  if (faturamentoTotal > 0) {
    for (const key in total) {
        if (total[key] && typeof total[key] === 'object' && total[key].valor !== undefined) {
            total[key].aliquota = (total[key].valor / faturamentoTotal) * 100;
        }
    }
  }

  return total;
}

export function useTributos() {
    const resultados = ref(null);

    function calcularSimplesNacional(inputs, faturamentoPeriodo, despesasPeriodo, periodo, faturamentoBaseICMS) {
        const { rbt12, anexoSimples, encargos, despesasAnual } = inputs;
        const folhaPagamento12m = despesasAnual.salarios + despesasAnual.proLabore;
        if (!rbt12 || !faturamentoPeriodo) return { valorImpostos: 0, anexo: 'N/A', detalhes: {} };
        
        let anexoCalculado = anexoSimples;
        let nomeAnexo = anexoSimples.replace('anexo', '');
        if (anexoSimples === 'anexoIII' && rbt12 > 0) {
            const fatorR = folhaPagamento12m / rbt12;
            if (fatorR < 0.28) { anexoCalculado = 'anexoV'; nomeAnexo = 'V (pelo Fator R)'; } else { nomeAnexo = 'III';}
        }
        
        const tabela = tabelas[anexoCalculado];
        if(!tabela) return { valorImpostos: 0, anexo: 'Inválido', detalhes: {} };

        const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
        const { aliquota, deduzir } = faixa;
        const aliquotaEfetiva = rbt12 > 0 ? ((rbt12 * aliquota) - deduzir) / rbt12 : 0;
        
        const impostoPrincipalDAS = faturamentoPeriodo * aliquotaEfetiva;
        const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100;
        const aliquotaIcms = encargos.icms / 100;
        
        const fgts = despesasPeriodo.salarios * aliquotaFgts;
        const sublimite = 3600000;
        let issForaDoSimples = 0;
        let icmsForaDoSimples = 0;
        const faturamentoTotalAnual = periodo === 'anual'
            ? inputs.faturamentoAnual
            : Object.values(inputs.faturamentosTrimestrais).reduce((a, b) => a + b, 0);

        if (faturamentoTotalAnual > sublimite) {
            issForaDoSimples = faturamentoPeriodo * aliquotaIss;
            icmsForaDoSimples = faturamentoBaseICMS * aliquotaIcms;
        }

        const valorImpostos = impostoPrincipalDAS + fgts + issForaDoSimples + icmsForaDoSimples;
        
        const detalhes = {
            simplesNacional: { aliquota: aliquotaEfetiva * 100, valor: impostoPrincipalDAS },
            iss: { aliquota: aliquotaIss * 100, valor: issForaDoSimples },
            icms: { aliquota: aliquotaIcms * 100, valor: icmsForaDoSimples },
            fgts: { aliquota: aliquotaFgts * 100, valor: fgts },
        };

        return { valorImpostos, anexo: nomeAnexo.toUpperCase(), detalhes };
    }

    function calcularLucroPresumido(inputs, faturamentoPeriodo, despesasPeriodo, faturamentoBaseICMS, periodo) {
        const { encargos } = inputs;
        if (!faturamentoPeriodo) return { valorImpostos: 0, detalhes: {} };

        const aliquotaPis = 0.0065; const aliquotaCofins = 0.03; const aliquotaBasePresuncao = 0.32;
        const aliquotaIrpjPrincipal = 0.15; const aliquotaIrpjAdicional = 0.10; const aliquotaCsll = 0.09;

        const pis = faturamentoPeriodo * aliquotaPis;
        const cofins = faturamentoPeriodo * aliquotaCofins;
        const baseCalculoIRPJCSLL = faturamentoPeriodo * aliquotaBasePresuncao;
        
        // CORREÇÃO APLICADA AQUI
        const limiteAdicional = periodo === 'anual' ? 240000 : 60000;
        
        const irpjPrincipal = baseCalculoIRPJCSLL * aliquotaIrpjPrincipal;
        let adicionalIRPJ = 0;
        if (baseCalculoIRPJCSLL > limiteAdicional) {
            adicionalIRPJ = (baseCalculoIRPJCSLL - limiteAdicional) * aliquotaIrpjAdicional;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        const csll = baseCalculoIRPJCSLL * aliquotaCsll;
        const impostosFederais = pis + cofins + irpj + csll;

        const aliquotaInss = encargos.inss / 100; const aliquotaInssTerceiros = encargos.inssTerceiros / 100;
        const aliquotaRat = encargos.rat / 100; const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100; const aliquotaIcms = encargos.icms / 100;
        const aliquotaIpi = encargos.ipi / 100;

        const folhaTotal = despesasPeriodo.salarios + despesasPeriodo.proLabore;
        const baseFolhaSalarios = despesasPeriodo.salarios;
        const iss = faturamentoPeriodo * aliquotaIss; const icms = faturamentoBaseICMS * aliquotaIcms;
        const ipi = faturamentoPeriodo * aliquotaIpi; const inss = folhaTotal * aliquotaInss;
        const inssTerceiros = baseFolhaSalarios * aliquotaInssTerceiros; const rat = baseFolhaSalarios * aliquotaRat;
        const fgts = baseFolhaSalarios * aliquotaFgts;

        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;
        const valorImpostos = impostosFederais + outrosEncargos;

        const aliquotaAdicionalIRPJFaturamento = faturamentoPeriodo > 0 ? (adicionalIRPJ / faturamentoPeriodo) : 0;
        const detalhes = {
            pis_pasep: { aliquota: aliquotaPis * 100, valor: pis },
            cofins: { aliquota: aliquotaCofins * 100, valor: cofins },
            irpj: { aliquota: aliquotaBasePresuncao * aliquotaIrpjPrincipal * 100, valor: irpjPrincipal },
            adicionalIRPJ: { aliquota: aliquotaAdicionalIRPJFaturamento * 100, valor: adicionalIRPJ },
            csll: { aliquota: aliquotaBasePresuncao * aliquotaCsll * 100, valor: csll },
            ipi: { aliquota: aliquotaIpi * 100, valor: ipi }, iss: { aliquota: aliquotaIss * 100, valor: iss },
            icms: { aliquota: aliquotaIcms * 100, valor: icms }, inss: { aliquota: aliquotaInss * 100, valor: inss },
            inssTerceiros: { aliquota: aliquotaInssTerceiros * 100, valor: inssTerceiros },
            rat: { aliquota: aliquotaRat * 100, valor: rat }, fgts: { aliquota: aliquotaFgts * 100, valor: fgts },
        };
        return { valorImpostos, detalhes };
    }

    function calcularLucroReal(inputs, faturamentoPeriodo, despesasPeriodo, faturamentoBaseICMS, periodo) {
        const { encargos } = inputs;
        if (!faturamentoPeriodo) return { valorImpostos: 0, detalhes: {} };

        const aliquotaPisDebito = 0.0165; const aliquotaCofinsDebito = 0.076;
        const aliquotaIrpjPrincipal = 0.15; const aliquotaIrpjAdicional = 0.10; const aliquotaCsll = 0.09;
        
        const baseCalculoCreditos = despesasPeriodo.comprasInternas + despesasPeriodo.comprasInterestaduais + despesasPeriodo.comprasImportadas + despesasPeriodo.insumoServicos + despesasPeriodo.energiaAluguelFretes + despesasPeriodo.depreciacao;
        const pisDebito = faturamentoPeriodo * aliquotaPisDebito; const cofinsDebito = faturamentoPeriodo * aliquotaCofinsDebito;
        const pisCredito = baseCalculoCreditos * aliquotaPisDebito; const cofinsCredito = baseCalculoCreditos * aliquotaCofinsDebito;
        const pisDevido = Math.max(0, pisDebito - pisCredito); const cofinsDevido = Math.max(0, cofinsDebito - cofinsCredito);
        const impostosSobreReceita = pisDevido + cofinsDevido;

        const aliquotaInss = encargos.inss / 100; const aliquotaInssTerceiros = encargos.inssTerceiros / 100;
        const aliquotaRat = encargos.rat / 100; const aliquotaFgts = encargos.fgts / 100;
        const aliquotaIss = encargos.iss / 100; const aliquotaIcms = encargos.icms / 100;
        const aliquotaIpi = encargos.ipi / 100;
        
        const folhaTotal = despesasPeriodo.salarios + despesasPeriodo.proLabore;
        const baseFolhaSalarios = despesasPeriodo.salarios;
        const iss = faturamentoPeriodo * aliquotaIss; const icms = faturamentoBaseICMS * aliquotaIcms;
        const ipi = faturamentoPeriodo * aliquotaIpi; const inss = folhaTotal * aliquotaInss;
        const inssTerceiros = baseFolhaSalarios * aliquotaInssTerceiros; const rat = baseFolhaSalarios * aliquotaRat;
        const fgts = baseFolhaSalarios * aliquotaFgts;
        const outrosEncargos = iss + icms + ipi + inss + inssTerceiros + rat + fgts;

        const despesasOperacionais = Object.values(despesasPeriodo).reduce((acc, valor) => acc + (valor || 0), 0);
        const lucroAntesIRCS = faturamentoPeriodo - despesasOperacionais - outrosEncargos - impostosSobreReceita;

        let irpjPrincipal = 0; let adicionalIRPJ = 0; let csll = 0;
        if (lucroAntesIRCS > 0) {
            // CORREÇÃO APLICADA AQUI
            const limiteAdicional = periodo === 'anual' ? 240000 : 60000;
            irpjPrincipal = lucroAntesIRCS * aliquotaIrpjPrincipal;
            if (lucroAntesIRCS > limiteAdicional) {
                adicionalIRPJ = (lucroAntesIRCS - limiteAdicional) * aliquotaIrpjAdicional;
            }
            csll = lucroAntesIRCS * aliquotaCsll;
        }
        const irpj = irpjPrincipal + adicionalIRPJ;
        
        const valorImpostos = impostosSobreReceita + irpj + csll + outrosEncargos;

        const detalhes = { 
            pis_pasep: { aliquota: faturamentoPeriodo > 0 ? (pisDevido / faturamentoPeriodo) * 100 : 0, valor: pisDevido },
            cofins: { aliquota: faturamentoPeriodo > 0 ? (cofinsDevido / faturamentoPeriodo) * 100 : 0, valor: cofinsDevido },
            irpj: { aliquota: faturamentoPeriodo > 0 ? (irpjPrincipal / faturamentoPeriodo) * 100 : 0, valor: irpjPrincipal },
            adicionalIRPJ: { aliquota: faturamentoPeriodo > 0 ? (adicionalIRPJ / faturamentoPeriodo) * 100 : 0, valor: adicionalIRPJ },
            csll: { aliquota: faturamentoPeriodo > 0 ? (csll / faturamentoPeriodo) * 100 : 0, valor: csll },
            ipi: { aliquota: aliquotaIpi * 100, valor: ipi }, iss: { aliquota: aliquotaIss * 100, valor: iss },
            icms: { aliquota: aliquotaIcms * 100, valor: icms }, inss: { aliquota: aliquotaInss * 100, valor: inss },
            inssTerceiros: { aliquota: aliquotaInssTerceiros * 100, valor: inssTerceiros },
            rat: { aliquota: aliquotaRat * 100, valor: rat }, fgts: { aliquota: aliquotaFgts * 100, valor: fgts },
        };
        return { valorImpostos, detalhes };
    }

    function simularImpostos(inputs, periodo = 'anual') {
        let faturamentoTotal = 0;
        const regimes = ['simples', 'presumido', 'real'];
        const totais = {};
        regimes.forEach(r => {
            totais[r] = { valorImpostos: 0, detalhes: [] };
        });

        if (periodo === 'anual') {
            faturamentoTotal = inputs.faturamentoAnual;
            const despesasPeriodo = { ...inputs.despesasAnual };
            const faturamentoBaseICMS = inputs.anexoSimples === 'anexoI' ? inputs.faturamentoComercio.anual : faturamentoTotal;

            const simplesResult = calcularSimplesNacional(inputs, faturamentoTotal, despesasPeriodo, periodo, faturamentoBaseICMS);
            totais.simples.valorImpostos = simplesResult.valorImpostos;
            totais.simples.detalhes.push(simplesResult.detalhes);
            totais.simples.anexo = simplesResult.anexo;

            const presumidoResult = calcularLucroPresumido(inputs, faturamentoTotal, despesasPeriodo, faturamentoBaseICMS, periodo);
            totais.presumido.valorImpostos = presumidoResult.valorImpostos;
            totais.presumido.detalhes.push(presumidoResult.detalhes);
            
            const realResult = calcularLucroReal(inputs, faturamentoTotal, despesasPeriodo, faturamentoBaseICMS, periodo);
            totais.real.valorImpostos = realResult.valorImpostos;
            totais.real.detalhes.push(realResult.detalhes);

        } else { // Trimestral
            const faturamentos = Object.values(inputs.faturamentosTrimestrais);
            faturamentoTotal = faturamentos.reduce((a, b) => a + b, 0);
            
            for (const trim of ['t1', 't2', 't3', 't4']) {
                const faturamentoTrimestre = inputs.faturamentosTrimestrais[trim];
                const despesasTrimestre = inputs.despesasTrimestrais[trim];
                const faturamentoBaseICMSTrimestre = inputs.anexoSimples === 'anexoI' ? inputs.faturamentoComercio.trimestral[trim] : faturamentoTrimestre;
                
                const simplesResult = calcularSimplesNacional(inputs, faturamentoTrimestre, despesasTrimestre, periodo, faturamentoBaseICMSTrimestre);
                totais.simples.valorImpostos += simplesResult.valorImpostos;
                totais.simples.detalhes.push(simplesResult.detalhes);
                totais.simples.anexo = simplesResult.anexo;

                const presumidoResult = calcularLucroPresumido(inputs, faturamentoTrimestre, despesasTrimestre, faturamentoBaseICMSTrimestre, periodo);
                totais.presumido.valorImpostos += presumidoResult.valorImpostos;
                totais.presumido.detalhes.push(presumidoResult.detalhes);
                
                const realResult = calcularLucroReal(inputs, faturamentoTrimestre, despesasTrimestre, faturamentoBaseICMSTrimestre, periodo);
                totais.real.valorImpostos += realResult.valorImpostos;
                totais.real.detalhes.push(realResult.detalhes);
            }
        }

        const detalhesSimples = { ...somarDetalhes(totais.simples.detalhes, faturamentoTotal), 'simples nacional (DAS)': somarDetalhes(totais.simples.detalhes, faturamentoTotal).simplesNacional, pis_pasep: '-', cofins: '-', irpj: '-', adicionalIRPJ: '-', csll: '-', ipi: '-', inss: '-', inssTerceiros: '-', rat: '-' };
        if (detalhesSimples.simplesNacional) delete detalhesSimples.simplesNacional;

        resultados.value = {
            simples: {
                valorImpostos: totais.simples.valorImpostos,
                cargaTributariaPercentual: faturamentoTotal > 0 ? (totais.simples.valorImpostos / faturamentoTotal) * 100 : 0,
                anexo: totais.simples.anexo,
                detalhes: detalhesSimples,
            },
            presumido: {
                valorImpostos: totais.presumido.valorImpostos,
                cargaTributariaPercentual: faturamentoTotal > 0 ? (totais.presumido.valorImpostos / faturamentoTotal) * 100 : 0,
                detalhes: { ...somarDetalhes(totais.presumido.detalhes, faturamentoTotal), 'simples nacional (DAS)': '-' },
            },
            real: {
                valorImpostos: totais.real.valorImpostos,
                cargaTributariaPercentual: faturamentoTotal > 0 ? (totais.real.valorImpostos / faturamentoTotal) * 100 : 0,
                detalhes: { ...somarDetalhes(totais.real.detalhes, faturamentoTotal), 'simples nacional (DAS)': '-' },
            },
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