import { TABELAS_SIMPLES, PARTILHAS_SIMPLES } from '../constants/tabelasSimples';

export class SimplesNacional {
    constructor(inputs) {
        this.inputs = inputs;
    }

    calcular(faturamentoPeriodo, despesasPeriodo, periodo, faturamentoBaseICMS) {
        const { rbt12, anexoSimples, encargos, despesasAnual, faturamentoAnual } = this.inputs;
        if (!rbt12 || !faturamentoPeriodo) return { valorImpostos: 0, anexo: 'N/A', detalhes: {} };

        // 1. Determinação do Anexo (Fator R)
        let anexoCalculado = anexoSimples;
        let nomeAnexo = anexoSimples.replace('anexo', '');
        
        if (anexoSimples === 'anexoIII' && rbt12 > 0) {
            const folha12m = despesasAnual.salarios + despesasAnual.proLabore;
            const fatorR = folha12m / rbt12;
            if (fatorR < 0.28) {
                anexoCalculado = 'anexoV';
                nomeAnexo = 'V (Fator R)';
            } else {
                nomeAnexo = 'III';
            }
        }

        // 2. Alíquota Efetiva
        const tabela = TABELAS_SIMPLES[anexoCalculado];
        if (!tabela) return { valorImpostos: 0, anexo: 'Erro', detalhes: {} };

        const faixa = tabela.find(f => rbt12 <= f.ate) || tabela[tabela.length - 1];
        const aliquotaEfetiva = rbt12 > 0 ? ((rbt12 * faixa.aliquota) - faixa.deduzir) / rbt12 : 0;
        const impostoPrincipalDAS = faturamentoPeriodo * aliquotaEfetiva;

        // 3. Impostos "Por Fora" (Sublimite e Anexo IV)
        const sublimite = 3600000;
        let issExterno = 0, icmsExterno = 0, inssPatronalExterno = 0;
        
        // Verifica estouro do sublimite (usa faturamento anual total para verificar a condição)
        const totalAno = periodo === 'anual' ? faturamentoAnual : rbt12; 
        
        if (totalAno > sublimite) {
            issExterno = faturamentoPeriodo * (encargos.iss / 100);
            
            if (['anexoI', 'anexoII'].includes(anexoSimples)) {
                const debito = faturamentoBaseICMS * (encargos.icms / 100);
                // Simplificação de crédito para o exemplo
                const credito = 0; 
                icmsExterno = Math.max(0, debito - credito);
            }
        }

        if (anexoCalculado === 'anexoIV') {
            inssPatronalExterno = (despesasPeriodo.salarios + despesasPeriodo.proLabore) * (encargos.inss / 100);
        }

        const fgts = despesasPeriodo.salarios * (encargos.fgts / 100);
        const valorTotal = impostoPrincipalDAS + fgts + issExterno + icmsExterno + inssPatronalExterno;

        // 4. Detalhamento (Partilha)
        const partilha = PARTILHAS_SIMPLES[anexoCalculado] || PARTILHAS_SIMPLES['anexoIII'];
        const fatia = (perc) => impostoPrincipalDAS * (perc / 100);

        return {
            valorImpostos: valorTotal,
            anexo: nomeAnexo.toUpperCase(),
            detalhes: {
                irpj: { valor: fatia(partilha.irpj), aliquota: (aliquotaEfetiva * partilha.irpj) },
                csll: { valor: fatia(partilha.csll), aliquota: (aliquotaEfetiva * partilha.csll) },
                cofins: { valor: fatia(partilha.cofins), aliquota: (aliquotaEfetiva * partilha.cofins) },
                pis_pasep: { valor: fatia(partilha.pis), aliquota: (aliquotaEfetiva * partilha.pis) },
                cpp: { valor: fatia(partilha.cpp), aliquota: (aliquotaEfetiva * partilha.cpp) },
                iss: { valor: fatia(partilha.iss) + issExterno, aliquota: 0 }, // Simplificado para exibição
                icms: { valor: fatia(partilha.icms) + icmsExterno, aliquota: 0 },
                ipi: { valor: fatia(partilha.ipi), aliquota: (aliquotaEfetiva * partilha.ipi) },
                inss: { valor: fatia(partilha.cpp) + inssPatronalExterno, aliquota: 0 },
                fgts: { valor: fgts, aliquota: encargos.fgts }
            }
        };
    }
}