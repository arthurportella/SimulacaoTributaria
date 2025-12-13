<template>
  <div id="app-container">
    <AppHeader @open-login="openLogin" />

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
      @export-pdf="handlePDF"
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
      <ResultsDetails :resultados="resultados" :tributos-detalhados="tributosDetalhados" />
    </template>

    <SimulationHistory
      v-if="history.length > 0"
      :history="history"
      @load="loadSimulation"
      @delete="deleteSimulation"
    />
    <AppFooter />
    <ToastNotification :show="showToast" :message="toastMessage" />
    
    <AuthModal :is-open="isLoginOpen" @close="isLoginOpen = false" />
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import { useTributos } from './composables/useTributos.js';
import { usePDFGenerator } from './composables/usePDFGenerator.js';
import { parseNumber } from './utils/formatters.js';

import AuthModal from './components/AuthModal.vue';
import { useAuth } from './composables/useAuth.js';
import { db } from './firebase/config';
// REMOVIDO: 'orderBy' da importação para evitar erro de índice
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Componentes UI
import AppHeader from './components/AppHeader.vue';
import FormInputs from './components/FormInputs.vue';
import ActionButtons from './components/ActionButtons.vue';
import ResultsSummary from './components/ResultsSummary.vue';
import ResultsCharts from './components/ResultsCharts.vue';
import ResultsDetails from './components/ResultsDetails.vue';
import SimulationHistory from './components/SimulationHistory.vue';
import AppFooter from './components/AppFooter.vue';
import ToastNotification from './components/ToastNotification.vue';

// Auth
const { user } = useAuth();
const isLoginOpen = ref(false);
function openLogin() { isLoginOpen.value = true; }

// Dados
const periodo = ref('anual');
const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
const { generatePDF } = usePDFGenerator();

// Configurações
const despesaTemplate = { proLabore: '0,00', salarios: '395.000,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '13.500,00', depreciacao: '31.500,00', demaisDespesas: '322.000,00' };

const defaultInputs = {
  faturamentoAnual: '3.923.000,00',
  faturamentosTrimestrais: { t1: '980.750,00', t2: '980.750,00', t3: '980.750,00', t4: '980.750,00' },
  rbt12: '3.923.000,00',
  anexoSimples: 'anexoIII',
  faturamentoComercio: { anual: '0,00', trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' } },
  faturamentoComercioST: { anual: '0,00', trimestral: { t1: '0,00', t2: '0,00', t3: '0,00', t4: '0,00' } },
  despesasAnual: { proLabore: '0,00', salarios: '1.580.000,00', comprasInternas: '0,00', comprasInterestaduais: '0,00', comprasImportadas: '0,00', insumoServicos: '0,00', energiaAluguelFretes: '54.000,00', depreciacao: '126.000,00', demaisDespesas: '1.288.000,00' },
  despesasTrimestrais: {
    t1: { ...despesaTemplate }, t2: { ...despesaTemplate }, t3: { ...despesaTemplate }, t4: { ...despesaTemplate },
  },
  encargos: { ipi: '0,00', iss: '4,00', icms: '0,00', rat: '1,00', inss: '20,00', inssTerceiros: '5,80', icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00', ipiEntrada: '0,00', fgts: '8,00' }
};

const inputs = reactive(JSON.parse(JSON.stringify(defaultInputs)));

// Configurações de Labels
const tributosDetalhados = [ 
  { key: 'pis_pasep', nome: 'PIS/PASEP' }, { key: 'cofins', nome: 'COFINS' }, { key: 'irpj', nome: 'IRPJ' }, { key: 'adicionalIRPJ', nome: 'ADICIONAL IRPJ' }, { key: 'csll', nome: 'CSLL' }, { key: 'iss', nome: 'ISS' }, { key: 'icms', nome: 'ICMS' }, { key: 'ipi', nome: 'IPI' }, { key: 'inss', nome: 'INSS (Patronal)' }, { key: 'inssTerceiros', nome: 'INSS Terceiros' }, { key: 'rat', nome: 'RAT' }, { key: 'fgts', nome: 'FGTS' }
];

const despesasConfig = [ 
  { key: 'salarios', label: 'Salários' }, { key: 'proLabore', label: 'Pró-Labore' }, { key: 'comprasInternas', label: 'Compras Internas' }, { key: 'comprasInterestaduais', label: 'Compras Interestaduais' }, { key: 'comprasImportadas', label: 'Compras Importadas' }, { key: 'insumoServicos', label: 'Insumo para Prest. Serviços' }, { key: 'energiaAluguelFretes', label: 'Energia/Aluguel/Fretes' }, { key: 'depreciacao', label: 'Depreciação' }, { key: 'demaisDespesas', label: 'Demais Despesas' } 
];

const encargosConfig = [ 
    { key: 'iss', label: 'ISS' }, { key: 'icms', label: 'ICMS' }, { key: 'ipi', label: 'IPI' }, { key: 'inss', label: 'INSS Patronal' }, { key: 'inssTerceiros', label: 'INSS Terceiros' }, { key: 'rat', label: 'RAT' }, { key: 'fgts', label: 'FGTS' }, { key: 'icmsInterno', label: 'ICMS Interno' }, { key: 'icmsInterestadual', label: 'ICMS Interestadual' }, { key: 'icmsImportacao', label: 'ICMS Importação' }, { key: 'ipiEntrada', label: 'IPI Entrada' }
];

// Funções
function updateInputs(newValues) { Object.assign(inputs, newValues); }

function resetForm() {
  Object.assign(inputs, defaultInputs);
  resultados.value = null;
  triggerToast('Formulário limpo!');
}

function getNumericInputs() {
  const numeric = JSON.parse(JSON.stringify(inputs));
  numeric.faturamentoAnual = parseNumber(inputs.faturamentoAnual);
  numeric.rbt12 = parseNumber(inputs.rbt12);
  
  for (const t in numeric.faturamentosTrimestrais) numeric.faturamentosTrimestrais[t] = parseNumber(numeric.faturamentosTrimestrais[t]);
  
  numeric.faturamentoComercio.anual = parseNumber(inputs.faturamentoComercio.anual);
  for (const t in numeric.faturamentoComercio.trimestral) numeric.faturamentoComercio.trimestral[t] = parseNumber(numeric.faturamentoComercio.trimestral[t]);

  numeric.faturamentoComercioST.anual = parseNumber(inputs.faturamentoComercioST.anual);
  for (const t in numeric.faturamentoComercioST.trimestral) numeric.faturamentoComercioST.trimestral[t] = parseNumber(numeric.faturamentoComercioST.trimestral[t]);

  for (const key in numeric.despesasAnual) numeric.despesasAnual[key] = parseNumber(numeric.despesasAnual[key]);
  
  for (const t in numeric.despesasTrimestrais) {
    for (const key in numeric.despesasTrimestrais[t]) {
      numeric.despesasTrimestrais[t][key] = parseNumber(numeric.despesasTrimestrais[t][key]);
    }
  }
  
  for (const key in numeric.encargos) numeric.encargos[key] = parseNumber(numeric.encargos[key]);
  
  return numeric;
}

function handleCalculation() {
  const numericInputs = getNumericInputs();
  simularImpostos(numericInputs, periodo.value);
}

function handlePDF() {
  triggerToast('Gerando PDF...');
  generatePDF(resultados.value, inputs, tributosDetalhados, melhorRegime.value, periodo.value);
}

// Histórico
const simulationName = ref('');
const history = ref([]);

watch(user, async (newUser) => {
    if (newUser) {
        await loadCloudHistory();
    } else {
        loadLocalHistory();
    }
}, { immediate: true });

function loadLocalHistory() {
    const saved = localStorage.getItem('simulationHistory');
    if (saved) history.value = JSON.parse(saved);
    else history.value = [];
}

async function loadCloudHistory() {
    if (!user.value) return;
    try {
        // CORREÇÃO AQUI: Removemos o orderBy da query
        const q = query(
            collection(db, 'simulacoes'), 
            where('userId', '==', user.value.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const docs = querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        
        // CORREÇÃO AQUI: Ordenamos no Javascript
        history.value = docs.sort((a, b) => b.timestamp - a.timestamp);
        
    } catch (e) {
        console.error("Erro ao carregar da nuvem:", e);
        triggerToast("Erro ao carregar histórico.");
    }
}

async function saveSimulation() {
  if (!simulationName.value.trim() || !resultados.value) { 
      triggerToast('Dê um nome para a simulação.'); return; 
  }

  const snapshot = { 
      name: simulationName.value, 
      timestamp: Date.now(), 
      inputs: JSON.parse(JSON.stringify(inputs)), 
      results: JSON.parse(JSON.stringify(resultados.value)),
      periodo: periodo.value
  };

  if (user.value) {
      try {
          const docData = { ...snapshot, userId: user.value.uid };
          const docRef = await addDoc(collection(db, "simulacoes"), docData);
          history.value.unshift({ ...docData, id: docRef.id });
          triggerToast('Simulação salva na nuvem!');
      } catch (e) {
          triggerToast('Erro ao salvar na nuvem.');
      }
  } else {
      history.value.unshift(snapshot);
      localStorage.setItem('simulationHistory', JSON.stringify(history.value));
      triggerToast('Salvo no dispositivo. Entre para salvar na nuvem!');
  }
  
  simulationName.value = '';
}

function loadSimulation(index) {
  const snapshot = history.value[index];
  Object.assign(inputs, snapshot.inputs);
  if (snapshot.periodo) periodo.value = snapshot.periodo;
  resultados.value = snapshot.results;
  triggerToast(`Simulação "${snapshot.name}" carregada.`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function deleteSimulation(index) {
  const item = history.value[index];
  if (!confirm(`Excluir a simulação "${item.name}"?`)) return;

  if (user.value && item.id) {
      try {
          await deleteDoc(doc(db, "simulacoes", item.id));
          history.value.splice(index, 1);
          triggerToast('Excluído da nuvem.');
      } catch (e) {
          triggerToast('Erro ao excluir.');
      }
  } else {
      history.value.splice(index, 1);
      localStorage.setItem('simulationHistory', JSON.stringify(history.value));
      triggerToast('Simulação excluída.');
  }
}

const showToast = ref(false);
const toastMessage = ref('');
function triggerToast(msg) { toastMessage.value = msg; showToast.value = true; setTimeout(() => showToast.value = false, 3000); }
</script>

<style scoped>
#app-container { max-width: 900px; margin: 2rem auto; padding: 2rem; }
</style>