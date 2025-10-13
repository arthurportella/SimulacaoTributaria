<template>
  <div id="app-container">
    <AppHeader />

    <FormInputs 
      v-model="inputs" 
      :despesas-config="despesasConfig" 
      :encargos-config="encargosConfig" 
    />

    <ActionButtons 
      @reset="resetForm" 
      @calculate="handleCalculation" 
    />
    
    <ResultsSummary
      v-if="resultados"
      :resultados="resultados"
      :ranked-results="rankedResults"
      :melhor-regime="melhorRegime"
      v-model:simulationName="simulationName"
      @save="saveSimulation"
    />

    <ResultsDetails
      v-if="resultados"
      :resultados="resultados"
      :tributos-detalhados="tributosDetalhados"
    />

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
import { useTributos } from './composables/useTributos.js';
import { parseNumber } from './utils/formatters.js';

import AppHeader from './components/AppHeader.vue';
import FormInputs from './components/FormInputs.vue';
import ActionButtons from './components/ActionButtons.vue';
import ResultsSummary from './components/ResultsSummary.vue';
import ResultsDetails from './components/ResultsDetails.vue';
import SimulationHistory from './components/SimulationHistory.vue';
import AppFooter from './components/AppFooter.vue';
import ToastNotification from './components/ToastNotification.vue';

// --- TOAST NOTIFICATION ---
const showToast = ref(false);
const toastMessage = ref('');
function triggerToast(message) {
  toastMessage.value = message;
  showToast.value = true;
  setTimeout(() => { showToast.value = false; }, 3000);
}

// --- FORM STATE & LOGIC ---

// 👇 ALTERAÇÃO APLICADA AQUI, COM OS SEUS VALORES PADRÃO 👇
const defaultInputs = {
  faturamentoAnual: '3.923.000,00',
  rbt12: '3.923.000,00',
  anexoSimples: 'anexoIII',
  despesas: {
    proLabore: '0,00', // Ajustado para o formato de moeda
    salarios: '1.580.000,00',
    comprasInternas: '0,00',
    comprasInterestaduais: '0,00',
    comprasImportadas: '0,00',
    insumoServicos: '0,00',
    energiaAluguelFretes: '54.000,00',
    depreciacao: '126.000,00',
    demaisDespesas: '1.288.000,00',
  },
  encargos: {
    ipi: '0,00', iss: '4,00', icms: '0,00', rat: '1,00', 
    inss: '20,00', // Ajustado para o formato de porcentagem
    inssTerceiros: '5,80',
    icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00',
    ipiEntrada: '0,00', fgts: '8,00',
  }
};
// 👆 FIM DA ALTERAÇÃO 👆

const inputs = reactive(JSON.parse(JSON.stringify(defaultInputs)));

function resetForm() {
  // Cria um objeto "limpo" para o reset
  const emptyInputs = {
      faturamentoAnual: '0,00', rbt12: '0,00', anexoSimples: 'anexoIII',
      despesas: { proLabore: '0,00', salarios: '0,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '0,00', depreciacao: '0,00', demaisDespesas: '0,00', },
      encargos: { ipi: '0,00', iss: '0,00', icms: '0,00', rat: '0,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00', }
  };
  Object.assign(inputs, emptyInputs);
  resultados.value = null;
  triggerToast('Formulário limpo!');
}

function getNumericInputs() {
  const numeric = { faturamentoAnual: parseNumber(inputs.faturamentoAnual), rbt12: parseNumber(inputs.rbt12), anexoSimples: inputs.anexoSimples, despesas: {}, encargos: {} };
  for (const key in inputs.despesas) { numeric.despesas[key] = parseNumber(inputs.despesas[key]); }
  for (const key in inputs.encargos) { numeric.encargos[key] = parseNumber(inputs.encargos[key]); }
  return numeric;
}

function handleCalculation() {
  simularImpostos(getNumericInputs());
}

// --- HISTORY LOGIC ---
const simulationName = ref('');
const history = ref([]);

onMounted(() => {
  const savedHistory = localStorage.getItem('simulationHistory');
  if (savedHistory) { history.value = JSON.parse(savedHistory); }
});

function saveSimulation() {
  if (!simulationName.value.trim() || !resultados.value) {
    triggerToast('Dê um nome para a simulação antes de salvar.');
    return;
  }
  const snapshot = {
    name: simulationName.value,
    timestamp: Date.now(),
    inputs: JSON.parse(JSON.stringify(inputs)),
    results: JSON.parse(JSON.stringify(resultados.value)),
  };
  history.value.unshift(snapshot);
  localStorage.setItem('simulationHistory', JSON.stringify(history.value));
  simulationName.value = '';
  triggerToast('Simulação salva com sucesso!');
}

function loadSimulation(index) {
  const snapshot = history.value[index];
  Object.assign(inputs, snapshot.inputs);
  resultados.value = snapshot.results;
  triggerToast(`Simulação "${snapshot.name}" carregada.`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteSimulation(index) {
  const deletedName = history.value[index].name;
  if (confirm(`Tem certeza que deseja excluir a simulação "${deletedName}"?`)) {
    history.value.splice(index, 1);
    localStorage.setItem('simulationHistory', JSON.stringify(history.value));
    triggerToast(`Simulação "${deletedName}" excluída.`);
  }
}

// --- CONFIGURATION DATA ---
const despesasConfig = [ { key: 'proLabore', label: 'Pró-labore' }, { key: 'salarios', label: 'Salários' }, { key: 'comprasInternas', label: 'Compras Internas' }, { key: 'comprasInterestaduais', label: 'Compras Interestaduais' }, { key: 'comprasImportadas', label: 'Compras Importadas' }, { key: 'insumoServicos', label: 'Insumo para Prest. Serviços' }, { key: 'energiaAluguelFretes', label: 'Energia/Aluguel/Fretes' }, { key: 'depreciacao', label: 'Depreciação' }, { key: 'demaisDespesas', label: 'Demais Despesas' }, ];
const encargosConfig = [ { key: 'ipi', label: 'IPI' }, { key: 'iss', label: 'ISS' }, { key: 'icms', label: 'ICMS' }, { key: 'rat', label: 'RAT' }, { key: 'inss', label: 'INSS' }, { key: 'inssTerceiros', label: 'INSS Terceiros' }, { key: 'fgts', label: 'FGTS' }, { key: 'icmsInterno', label: 'ICMS Interno' }, { key: 'icmsInterestadual', label: 'ICMS Interestadual' }, { key: 'icmsImportacao', label: 'ICMS Importação' }, { key: 'ipiEntrada', label: 'IPI Entrada' }, ];
const tributosDetalhados = [ { key: 'pis', nome: 'PIS/PASEP' }, { key: 'cofins', nome: 'COFINS' }, { key: 'irpj', nome: 'IRPJ' }, { key: 'adicionalIRPJ', nome: 'ADICIONAL DE IRPJ' }, { key: 'csll', nome: 'CSLL' }, { key: 'ipi', nome: 'IPI' }, { key: 'iss', nome: 'ISS' }, { key: 'icms', nome: 'ICMS' }, { key: 'simplesNacional', nome: 'SIMPLES NACIONAL (DAS)' }, { key: 'inss', nome: 'INSS' }, { key: 'inssTerceiros', nome: 'INSS TERCEIROS' }, { key: 'rat', nome: 'RAT' }, { key: 'fgts', nome: 'FGTS' }, ];

// --- MAIN CALCULATION COMPOSABLE ---
const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
#app-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
}
</style>