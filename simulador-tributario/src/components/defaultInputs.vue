<template>
  <div id="app-container">
    <AppHeader />

    <FormInputs
      v-model="inputs"
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

// --- LÓGICA DE EXPORTAÇÃO PARA PDF (SEM ALTERAÇÕES) ---
function generateNativePDF() {
  triggerToast('Gerando relatório profissional em PDF...');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 0;
  const addHeader = () => {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Relatório de Simulação Tributária', margin, 20);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Gerado por: Simulador de Planejamento Tributário', margin, 26);
    const generationDate = new Date().toLocaleString('pt-BR');
    pdf.text(`Data de Geração: ${generationDate}`, pageWidth - margin, 20, { align: 'right' });
    pdf.setDrawColor(200);
    pdf.line(margin, 32, pageWidth - margin, 32);
    yPos = 40;
  };
  const addFooter = () => {
    const pageCount = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.line(margin, pageHeight - 35, pageWidth - margin, pageHeight - 35);
      pdf.setFontSize(7);
      const disclaimer = 'Importante: As informações deste simulador servem apenas para orientação geral e não significam o aconselhamento para a tomada de decisão. Consulte sempre um profissional habilitado.';
      const splitDisclaimer = pdf.splitTextToSize(disclaimer, pageWidth - margin * 2);
      pdf.text(splitDisclaimer, margin, pageHeight - 30);
      pdf.setFontSize(8);
      pdf.text(`Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
  };
  addHeader();
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Dados da Simulação:', margin, yPos);
  
  const faturamentoTotalAnual = periodo.value === 'anual'
    ? parseNumber(inputs.faturamentoAnual)
    : Object.values(inputs.faturamentosTrimestrais).reduce((acc, val) => acc + parseNumber(val), 0);

  const inputData = [
    ['Faturamento Anual Projetado:', `R$ ${formatNumber(faturamentoTotalAnual)}`],
    ['Receita Bruta (12 Meses):', `R$ ${inputs.rbt12}`],
    ['Total de Despesas com Salários:', `R$ ${inputs.despesas.salarios}`],
    ['Total Outras Despesas:', `R$ ${formatNumber(parseNumber(inputs.despesas.energiaAluguelFretes) + parseNumber(inputs.despesas.depreciacao) + parseNumber(inputs.despesas.demaisDespesas))}`],
    ['Período de Cálculo:', periodo.value === 'anual' ? 'Anual' : 'Trimestral'],
  ];
  
  autoTable(pdf, { startY: yPos + 2, body: inputData, theme: 'plain', styles: { fontSize: 10, cellPadding: 2 }, columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } }, });
  yPos = pdf.lastAutoTable.finalY + 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Resumo da Carga Tributária Anual:`, margin, yPos);
  
  autoTable(pdf, { startY: yPos + 2, head: [['Enquadramento', 'Valor dos Impostos', '% s/ Faturamento']], body: [ ['Lucro Presumido', `R$ ${formatNumber(resultados.value.presumido.valorImpostos)}`, `${formatNumber(resultados.value.presumido.cargaTributariaPercentual)}%`], ['Lucro Real', `R$ ${formatNumber(resultados.value.real.valorImpostos)}`, `${formatNumber(resultados.value.real.cargaTributariaPercentual)}%`], ['Simples Nacional', `R$ ${formatNumber(resultados.value.simples.valorImpostos)}`, `${formatNumber(resultados.value.simples.cargaTributariaPercentual)}%`], ], theme: 'striped', headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' }, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left' } }, });
  yPos = pdf.lastAutoTable.finalY + 8;
  pdf.setFillColor(236, 240, 241);
  pdf.setDrawColor(189, 195, 199);
  pdf.rect(margin, yPos, pageWidth - margin * 2, 10, 'FD');
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Melhor Regime Projetado: ${melhorRegime.value}`, margin + 2, yPos + 6.5);
  yPos += 20;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Detalhamento dos Cálculos:', margin, yPos);

  const bodyData = tributosDetalhados.map(t => [ t.nome, resultados.value.presumido.detalhes[t.key] ? formatNumber(resultados.value.presumido.detalhes[t.key].valor) : '-', resultados.value.real.detalhes[t.key] ? formatNumber(resultados.value.real.detalhes[t.key].valor) : '-', resultados.value.simples.detalhes[t.key] ? formatNumber(resultados.value.simples.detalhes[t.key].valor) : '-', ]);

  autoTable(pdf, { startY: yPos + 2, head: [['Tributo', 'Lucro Presumido (R$)', 'Lucro Real (R$)', 'Simples Nacional (R$)']], body: bodyData, theme: 'grid', headStyles: { fillColor: [52, 73, 94] }, foot: [ [ { content: 'TOTAL', styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.presumido.valorImpostos)}`, styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.real.valorImpostos)}`, styles: { fontStyle: 'bold' } }, { content: `R$ ${formatNumber(resultados.value.simples.valorImpostos)}`, styles: { fontStyle: 'bold' } }, ] ], footStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' }, styles: { halign: 'right' }, columnStyles: { 0: { halign: 'left' } }, });

  addFooter();
  pdf.save(`relatorio-tributario-${Date.now()}.pdf`);
}

// --- ESTRUTURA DE DADOS INICIAL ATUALIZADA ---
const showToast = ref(false);
const toastMessage = ref('');
function triggerToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
}

const defaultInputs = {
  faturamentoAnual: '3.923.000,00',
  faturamentosTrimestrais: { t1: '980.750,00', t2: '980.750,00', t3: '980.750,00', t4: '980.750,00', },
  rbt12: '3.923.000,00',
  anexoSimples: 'anexoIII',
  despesas: { proLabore: '0,00', salarios: '1.580.000,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '54.000,00', depreciacao: '126.000,00', demaisDespesas: '1.288.000,00', },
  encargos: { ipi: '0,00', iss: '4,00', icms: '0,00', rat: '1,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00', }
};
const inputs = reactive(JSON.parse(JSON.stringify(defaultInputs)));

function resetForm() {
    const emptyInputs = {
      faturamentoAnual: '0,00',
      faturamentosTrimestrais: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00', },
      rbt12: '0,00', anexoSimples: 'anexoIII',
      despesas: { proLabore: '0,00', salarios: '0,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '0,00', depreciacao: '0,00', demaisDespesas: '0,00', },
      encargos: { ipi: '0,00', iss: '0,00', icms: '0,00', rat: '0,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00', }
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
    despesas: {},
    encargos: {}
  };
  for (const key in inputs.despesas) { numeric.despesas[key] = parseNumber(inputs.despesas[key]); }
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
const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
#app-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}
</style>