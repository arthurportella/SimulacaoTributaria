<template>
  <div id="app-container">
    <AppHeader />

    <FormInputs
      :modelValue="inputs"
      @update:modelValue="updateInputs"
      v-model:periodo="periodo"
      :despesas-config="despesasConfig"
      :encargos-config="encargosConfig"
    />

    <ActionButtons
      @reset="resetForm"
      @calculate="handleCalculation"
      @export-pdf="generateNativePDF"
      :is-results-visible="!!resultados"
      :periodo="periodo"
    />
    
    <template v-if="resultados">
      <ResultsSummary
        :resultados="resultados"
        :ranked-results="rankedResults"
        :melhor-regime="melhorRegime"
        :periodo="periodo"
        v-model:simulationName="simulationName"
        @save="saveSimulation"
      />

      <ResultsCharts :resultados="resultados" :periodo="periodo" />

      <ResultsDetails
        :resultados="resultados"
        :tributos-detalhados="tributosDetalhados"
      />
    </template>

    <SimulationHistory
      v-if="history.length > 0"
      :history="history"
      @load="loadSimulation"
      @delete="deleteSimulation"
    />

    <AppFooter />

    <ToastNotification :show="showToast" :message="toastMessage" />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import { useTributos } from './composables/useTributos.js';
import { parseNumber, formatNumber } from './utils/formatters.js';

// Importação dos Componentes
import AppHeader from './components/AppHeader.vue';
import FormInputs from './components/FormInputs.vue';
import ActionButtons from './components/ActionButtons.vue';
import ResultsSummary from './components/ResultsSummary.vue';
import ResultsCharts from './components/ResultsCharts.vue';
import ResultsDetails from './components/ResultsDetails.vue';
import SimulationHistory from './components/SimulationHistory.vue';
import AppFooter from './components/AppFooter.vue';
import ToastNotification from './components/ToastNotification.vue';

const periodo = ref('anual');

// --- LÓGICA DE EXPORTAÇÃO PARA PDF ---
function generateNativePDF() {
  if (!resultados.value) return;
  triggerToast('Gerando relatório profissional em PDF...');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;

  // Cores da Identidade Visual
  const primaryColor = '#4CAF50';
  const primaryColorRGB = [76, 175, 80];
  const highlightBgColorRGB = [232, 245, 233];
  const highlightBorderColorRGB = [165, 214, 167];
  const darkHeaderColorRGB = [46, 125, 50];

  const addHeader = (isFirstPage = false) => {
    if (!isFirstPage) {
        yPos = 30;
    } else {
        pdf.setTextColor(primaryColor);
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Relatório de Simulação Tributária', margin, 20);
        
        pdf.setTextColor(100);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('Gerado por: Simulador de Planejamento Tributário', margin, 26);
        
        const generationDate = new Date().toLocaleString('pt-BR');
        pdf.text(`Data de Geração: ${generationDate}`, pageWidth - margin, 26, { align: 'right' });
        
        pdf.setDrawColor(220);
        pdf.line(margin, 32, pageWidth - margin, 32);
        yPos = 42;
    }
  };

  const addFooter = () => {
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setDrawColor(220);
      pdf.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      pdf.setFontSize(7);
      pdf.setTextColor(150);
      const disclaimer = 'Importante: As informações deste simulador servem apenas para orientação geral e não significam o aconselhamento para a tomada de decisão. Consulte sempre um profissional habilitado.';
      const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - margin * 2);
      pdf.text(splitDisclaimer, margin, pageHeight - 20);
      
      pdf.setFontSize(8);
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };
  
  const checkPageBreak = (neededSpace) => {
      if (yPos + neededSpace > pageHeight - 30) {
          pdf.addPage();
          addHeader();
      }
  }

  addHeader(true);

  if (periodo.value === 'anual') {
    const faturamentoTotalAnual = parseNumber(inputs.faturamentoAnual);
    const despesasAnuaisTotais = inputs.despesasAnual;
    const inputData = [
        ['Faturamento Anual Projetado:', `R$ ${formatNumber(faturamentoTotalAnual)}`],
        ['Receita Bruta (12 Meses):', `R$ ${inputs.rbt12}`],
        ['Total de Despesas com Salários:', `R$ ${formatNumber(parseNumber(despesasAnuaisTotais.salarios))}`],
        ['Total Outras Despesas:', `R$ ${formatNumber(parseNumber(despesasAnuaisTotais.energiaAluguelFretes) + parseNumber(despesasAnuaisTotais.depreciacao) + parseNumber(despesasAnuaisTotais.demaisDespesas))}`],
        ['Período de Cálculo:', 'Anual'],
    ];

    pdf.setTextColor(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dados da Simulação:', margin, yPos);
    yPos += 2;
    
    autoTable(pdf, { startY: yPos, body: inputData, theme: 'plain', styles: { fontSize: 10, cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { halign: 'left' } } });
    yPos = pdf.lastAutoTable.finalY + 10;
    
    pdf.text(`Resumo da Carga Tributária Anual Total:`, margin, yPos);
    yPos += 2;
    
    autoTable(pdf, { startY: yPos, head: [['Enquadramento', 'Valor dos Impostos', '% s/ Faturamento']], body: [ ['Lucro Presumido', `R$ ${formatNumber(resultados.value.presumido.valorImpostos)}`, `${formatNumber(resultados.value.presumido.cargaTributariaPercentual)}%`], ['Lucro Real', `R$ ${formatNumber(resultados.value.real.valorImpostos)}`, `${formatNumber(resultados.value.real.cargaTributariaPercentual)}%`], ['Simples Nacional', `R$ ${formatNumber(resultados.value.simples.valorImpostos)}`, `${formatNumber(resultados.value.simples.cargaTributariaPercentual)}%`] ], theme: 'grid', headStyles: { fillColor: primaryColorRGB, textColor: 255, fontStyle: 'bold' }, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left' } } });
    yPos = pdf.lastAutoTable.finalY + 8;

    pdf.setFillColor(...highlightBgColorRGB);
    pdf.setDrawColor(...highlightBorderColorRGB);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 12, 'FD');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkHeaderColorRGB);
    pdf.text(`🏆 Melhor Regime Projetado: ${melhorRegime.value}`, margin + 3, yPos + 7.5);
    yPos += 20;

    pdf.setTextColor(40);
    pdf.setFontSize(12);
    pdf.text('Detalhamento dos Cálculos Anuais Totais:', margin, yPos);
    yPos += 2;

    const bodyData = tributosDetalhados.map(t => {
        const pVal = resultados.value.presumido.detalhes[t.key]?.valor;
        const rVal = resultados.value.real.detalhes[t.key]?.valor;
        const sVal = resultados.value.simples.detalhes[t.key]?.valor;
        return [ t.nome, pVal > 0 ? `R$ ${formatNumber(pVal)}` : '-', rVal > 0 ? `R$ ${formatNumber(rVal)}` : '-', sVal > 0 ? `R$ ${formatNumber(sVal)}` : '-' ]
    });

    autoTable(pdf, { startY: yPos, head: [['Tributo', 'Lucro Presumido (R$)', 'Lucro Real (R$)', 'Simples Nacional (R$)']], body: bodyData, theme: 'grid', headStyles: { fillColor: darkHeaderColorRGB }, foot: [ [ { content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.presumido.valorImpostos)}`, styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.real.valorImpostos)}`, styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.simples.valorImpostos)}`, styles: { fontStyle: 'bold' } } ] ], footStyles: { fillColor: [236, 240, 241], textColor: 0, fontStyle: 'bold' }, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left' } } });
  
  } else {
    if (!resultadosTrimestrais.value) {
      triggerToast('Erro: Calcule os resultados do trimestre antes de gerar o PDF.');
      return;
    }

    pdf.setTextColor(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Dados da Simulação:', margin, yPos);
    yPos += 2;
    
    // CORREÇÃO APLICADA AQUI
    const inputDataGeral = [
        ['1º Trimestre Faturamento:', `R$ ${inputs.faturamentosTrimestrais.t1}`],
        ['2º Trimestre Faturamento:', `R$ ${inputs.faturamentosTrimestrais.t2}`],
        ['3º Trimestre Faturamento:', `R$ ${inputs.faturamentosTrimestrais.t3}`],
        ['4º Trimestre Faturamento:', `R$ ${inputs.faturamentosTrimestrais.t4}`],
        ['Receita Bruta (12 Meses):', `R$ ${inputs.rbt12}`],
        ['Atividade Principal:', `${inputs.anexoSimples.replace('anexo', 'Anexo ')}`],
        ['Período de Cálculo:', 'Trimestral'],
    ];

    autoTable(pdf, { startY: yPos, body: inputDataGeral, theme: 'plain', styles: { fontSize: 10, cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 }, 1: { halign: 'left' } } });
    yPos = pdf.lastAutoTable.finalY + 10;

    for (let i = 1; i <= 4; i++) {
        const trimKey = `t${i}`;
        const trimData = resultadosTrimestrais.value[trimKey];
        if (!trimData || trimData.faturamento === 0) continue;

        checkPageBreak(80);

        pdf.setTextColor(40);
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Resumo do ${i}º Trimestre`, margin, yPos);
        yPos += 2;
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Faturamento do Período: R$ ${formatNumber(trimData.faturamento)}`, margin, yPos + 5);
        yPos += 9;

        autoTable(pdf, {
            startY: yPos,
            head: [['Enquadramento', 'Valor dos Impostos', '% s/ Faturamento']],
            body: [
                ['Lucro Presumido', `R$ ${formatNumber(trimData.presumido.valorImpostos)}`, `${formatNumber((trimData.presumido.valorImpostos / trimData.faturamento) * 100)}%`],
                ['Lucro Real', `R$ ${formatNumber(trimData.real.valorImpostos)}`, `${formatNumber((trimData.real.valorImpostos / trimData.faturamento) * 100)}%`],
                ['Simples Nacional', `R$ ${formatNumber(trimData.simples.valorImpostos)}`, `${formatNumber((trimData.simples.valorImpostos / trimData.faturamento) * 100)}%`],
            ],
            theme: 'grid',
            headStyles: { fillColor: primaryColorRGB, textColor: 255, fontStyle: 'bold' },
            styles: { halign: 'right' },
            columnStyles: { 0: { halign: 'left' } },
        });
        yPos = pdf.lastAutoTable.finalY + 15;
    }

    pdf.addPage();
    addHeader();

    pdf.setTextColor(40);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Resumo da Carga Tributária Anual Total:`, margin, yPos);
    yPos += 2;
    
    autoTable(pdf, { startY: yPos, head: [['Enquadramento', 'Valor dos Impostos', '% s/ Faturamento']], body: [ ['Lucro Presumido', `R$ ${formatNumber(resultados.value.presumido.valorImpostos)}`, `${formatNumber(resultados.value.presumido.cargaTributariaPercentual)}%`], ['Lucro Real', `R$ ${formatNumber(resultados.value.real.valorImpostos)}`, `${formatNumber(resultados.value.real.cargaTributariaPercentual)}%`], ['Simples Nacional', `R$ ${formatNumber(resultados.value.simples.valorImpostos)}`, `${formatNumber(resultados.value.simples.cargaTributariaPercentual)}%`] ], theme: 'grid', headStyles: { fillColor: primaryColorRGB, textColor: 255, fontStyle: 'bold' }, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left' } } });
    yPos = pdf.lastAutoTable.finalY + 8;

    pdf.setFillColor(...highlightBgColorRGB);
    pdf.setDrawColor(...highlightBorderColorRGB);
    pdf.rect(margin, yPos, pageWidth - margin * 2, 12, 'FD');
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...darkHeaderColorRGB);
    pdf.text(`🏆 Melhor Regime Projetado (Anual): ${melhorRegime.value}`, margin + 3, yPos + 7.5);
  }

  addFooter();
  pdf.save(`relatorio-tributario-${simulationName.value || 'simulacao'}-${Date.now()}.pdf`);
}


// --- DEMAIS FUNÇÕES DO SCRIPT (SEM ALTERAÇÃO) ---
const showToast = ref(false);
const toastMessage = ref('');
function triggerToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
}

const despesaTemplate = { proLabore: '0,00', salarios: '395.000,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '13.500,00', depreciacao: '31.500,00', demaisDespesas: '322.000,00' };

const defaultInputs = {
  faturamentoAnual: '3.923.000,00',
  faturamentosTrimestrais: { t1: '980.750,00', t2: '980.750,00', t3: '980.750,00', t4: '980.750,00' },
  rbt12: '3.923.000,00',
  anexoSimples: 'anexoIII',
  faturamentoComercio: {
    anual: '0,00',
    trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' }
  },
  faturamentoComercioST: {
    anual: '0,00',
    trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' }
  },
  despesasAnual: { proLabore: '0,00', salarios: '1.580.000,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '54.000,00', depreciacao: '126.000,00', demaisDespesas: '1.288.000,00' },
  despesasTrimestrais: {
    t1: { ...despesaTemplate },
    t2: { ...despesaTemplate },
    t3: { ...despesaTemplate },
    t4: { ...despesaTemplate },
  },
  encargos: { ipi: '0,00', iss: '4,00', icms: '0,00', rat: '1,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00' }
};
const inputs = reactive(JSON.parse(JSON.stringify(defaultInputs)));

function updateInputs(newValues) {
  Object.assign(inputs, newValues);
}

function resetForm() {
    const emptyDespesa = { proLabore: '0,00', salarios: '0,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '0,00', depreciacao: '0,00', demaisDespesas: '0,00' };
    const emptyInputs = {
      faturamentoAnual: '0,00',
      faturamentosTrimestrais: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' },
      rbt12: '0,00', anexoSimples: 'anexoIII',
      faturamentoComercio: {
        anual: '0,00',
        trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' }
      },
      faturamentoComercioST: {
        anual: '0,00',
        trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' }
      },
      despesasAnual: { ...emptyDespesa },
      despesasTrimestrais: { t1: { ...emptyDespesa }, t2: { ...emptyDespesa }, t3: { ...emptyDespesa }, t4: { ...emptyDespesa } },
      encargos: { ipi: '0,00', iss: '0,00', icms: '0,00', rat: '0,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00' }
    };
    Object.assign(inputs, emptyInputs);
    resultados.value = null;
    triggerToast('Formulário limpo!');
}

function getNumericInputs() {
  const numeric = {
    faturamentoAnual: parseNumber(inputs.faturamentoAnual),
    faturamentosTrimestrais: {
      t1: parseNumber(inputs.faturamentosTrimestrais.t1),
      t2: parseNumber(inputs.faturamentosTrimestrais.t2),
      t3: parseNumber(inputs.faturamentosTrimestrais.t3),
      t4: parseNumber(inputs.faturamentosTrimestrais.t4),
    },
    rbt12: parseNumber(inputs.rbt12),
    anexoSimples: inputs.anexoSimples,
    faturamentoComercio: {
        anual: parseNumber(inputs.faturamentoComercio.anual),
        trimestral: {
            t1: parseNumber(inputs.faturamentoComercio.trimestral.t1),
            t2: parseNumber(inputs.faturamentoComercio.trimestral.t2),
            t3: parseNumber(inputs.faturamentoComercio.trimestral.t3),
            t4: parseNumber(inputs.faturamentoComercio.trimestral.t4),
        }
    },
    faturamentoComercioST: {
        anual: parseNumber(inputs.faturamentoComercioST.anual),
        trimestral: {
            t1: parseNumber(inputs.faturamentoComercioST.trimestral.t1),
            t2: parseNumber(inputs.faturamentoComercioST.trimestral.t2),
            t3: parseNumber(inputs.faturamentoComercioST.trimestral.t3),
            t4: parseNumber(inputs.faturamentoComercioST.trimestral.t4),
        }
    },
    despesasAnual: {},
    despesasTrimestrais: { t1: {}, t2: {}, t3: {}, t4: {} },
    encargos: {}
  };
  for (const key in inputs.despesasAnual) { numeric.despesasAnual[key] = parseNumber(inputs.despesasAnual[key]); }
  for (const trim in inputs.despesasTrimestrais) {
    for (const key in inputs.despesasTrimestrais[trim]) {
      numeric.despesasTrimestrais[trim][key] = parseNumber(inputs.despesasTrimestrais[trim][key]);
    }
  }
  for (const key in inputs.encargos) { numeric.encargos[key] = parseNumber(inputs.encargos[key]); }
  return numeric;
}

function handleCalculation() {
  simularImpostos(getNumericInputs(), periodo.value);
}

const simulationName = ref('');
const history = ref([]);
onMounted(() => { const savedHistory = localStorage.getItem('simulationHistory'); if (savedHistory) { history.value = JSON.parse(savedHistory); } });
function saveSimulation() { if (!simulationName.value.trim() || !resultados.value) { triggerToast('Dê um nome para a simulação antes de salvar.'); return; } const snapshot = { name: simulationName.value, timestamp: Date.now(), inputs: JSON.parse(JSON.stringify(inputs)), results: JSON.parse(JSON.stringify(resultados.value)), }; history.value.unshift(snapshot); localStorage.setItem('simulationHistory', JSON.stringify(history.value)); simulationName.value = ''; triggerToast('Simulação salva com sucesso!'); }
function loadSimulation(index) { const snapshot = history.value[index]; Object.assign(inputs, snapshot.inputs); resultados.value = snapshot.results; triggerToast(`Simulação "${snapshot.name}" carregada.`); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function deleteSimulation(index) { const deletedName = history.value[index].name; if (confirm(`Tem certeza que deseja excluir a simulação "${deletedName}"?`)) { history.value.splice(index, 1); localStorage.setItem('simulationHistory', JSON.stringify(history.value)); triggerToast(`Simulação "${deletedName}" excluída.`); } }

const despesasConfig = [ { key: 'proLabore', label: 'Pró-labore' }, { key: 'salarios', label: 'Salários' }, { key: 'comprasInternas', label: 'Compras Internas' }, { key: 'comprasInterestaduais', label: 'Compras Interestaduais' }, { key: 'comprasImportadas', label: 'Compras Importadas' }, { key: 'insumoServicos', label: 'Insumo para Prest. Serviços' }, { key: 'energiaAluguelFretes', label: 'Energia/Aluguel/Fretes' }, { key: 'depreciacao', label: 'Depreciação' }, { key: 'demaisDespesas', label: 'Demais Despesas' }, ];
const encargosConfig = [ { key: 'ipi', label: 'IPI' }, { key: 'iss', label: 'ISS' }, { key: 'icms', label: 'ICMS' }, { key: 'rat', label: 'RAT' }, { key: 'inss', label: 'INSS' }, { key: 'inssTerceiros', label: 'INSS Terceiros' }, { key: 'fgts', label: 'FGTS' }, { key: 'icmsInterno', label: 'ICMS Interno' }, { key: 'icmsInterestadual', label: 'ICMS Interestadual' }, { key: 'icmsImportacao', label: 'ICMS Importação' }, { key: 'ipiEntrada', label: 'IPI Entrada' }, ];
const tributosDetalhados = [ { key: 'pis_pasep', nome: 'PIS/PASEP' }, { key: 'cofins', nome: 'COFINS' }, { key: 'irpj', nome: 'IRPJ' }, { key: 'adicionalIRPJ', nome: 'ADICIONAL DE IRPJ' }, { key: 'csll', nome: 'CSLL' }, { key: 'ipi', nome: 'IPI' }, { key: 'iss', nome: 'ISS' }, { key: 'icms', nome: 'ICMS' }, { key: 'simples nacional (DAS)', nome: 'SIMPLES NACIONAL (DAS)' }, { key: 'inss', nome: 'INSS' }, { key: 'inssTerceiros', nome: 'INSS TERCEIROS' }, { key: 'rat', nome: 'RAT' }, { key: 'fgts', nome: 'FGTS' }, ];
const { resultados, resultadosTrimestrais, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
#app-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}
</style>