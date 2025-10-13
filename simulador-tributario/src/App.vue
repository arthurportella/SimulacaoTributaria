<template>
  <div id="app-container">
    <header class="app-header">
      <h1 class="logo-text">Simulador de Planejamento tributário</h1>
      <p class="subtitle">Planejamento e clareza para suas decisões fiscais anuais</p>
    </header>

    <main class="card">
      <h2 class="card-title">Projeção Anual e Atividade</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="faturamentoAnual">Faturamento Anual Projetado</label>
          <input type="text" id="faturamentoAnual" :value="inputs.faturamentoAnual"
            @input="handleCurrencyInput($event, 'faturamentoAnual')">
        </div>
        <div class="form-group">
          <label for="rbt12">Receita Bruta (Últimos 12 Meses)</label>
          <input type="text" id="rbt12" :value="inputs.rbt12" @input="handleCurrencyInput($event, 'rbt12')">
        </div>
        <div class="form-group span-2">
          <label for="anexoSimples">Atividade Principal (Anexo do Simples Nacional)</label>
          <select id="anexoSimples" v-model="inputs.anexoSimples">
            <option value="anexoI">Anexo I - Comércio</option>
            <option value="anexoII">Anexo II - Indústria</option>
            <option value="anexoIII">Anexo III - Serviços</option>
            <option value="anexoIV">Anexo IV - Serviços (advocacia, etc.)</option>
            <option value="anexoV">Anexo V - Serviços (fator R)</option>
          </select>
        </div>
      </div>
    </main>

    <section class="card">
      <h2 class="card-title">Gastos e Despesas Anuais</h2>
      <div class="form-grid">
        <div class="form-group" v-for="despesa in despesasConfig" :key="despesa.key">
          <label :for="despesa.key">{{ despesa.label }}</label>
          <input type="text" :id="despesa.key" :value="inputs.despesas[despesa.key]"
            @input="handleCurrencyInput($event, despesa.key, 'despesas')">
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Encargos e Impostos Adicionais</h2>
      <div class="form-grid-3-cols">
        <div class="form-group" v-for="encargo in encargosConfig" :key="encargo.key">
          <label :for="encargo.key">{{ encargo.label }} (%)</label>
          <input type="text" :id="encargo.key" :value="inputs.encargos[encargo.key]"
            @input="handlePercentInput($event, encargo.key, 'encargos')">
        </div>
      </div>
    </section>

    <div class="button-container">
      <button class="main-button" @click="simularImpostos(getNumericInputs())">
        📊 Calcular Projeção Anual
      </button>
    </div>

    <section v-if="resultados" class="results-card">
      <h2 class="card-title">RESUMO DA CARGA TRIBUTÁRIA</h2>
      <div class="comparison-table">
        <div class="table-row header">
          <div>Enquadramento</div>
          <div>Valor dos Impostos</div>
          <div>% s/Faturamento</div>
        </div>

        <div class="table-row" :class="`rank-${rankedResults['Lucro Presumido']}`">
          <div><strong>Lucro Presumido</strong></div>
          <div>R$ {{ formatNumber(resultados.presumido.valorImpostos) }}</div>
          <div>{{ formatNumber(resultados.presumido.cargaTributariaPercentual) }}%</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Lucro Real']}`">
          <div><strong>Lucro Real</strong></div>
          <div>R$ {{ formatNumber(resultados.real.valorImpostos) }}</div>
          <div>{{ formatNumber(resultados.real.cargaTributariaPercentual) }}%</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Simples Nacional']}`">
          <div>
            <strong>Simples Nacional</strong>
            <small>Anexo de referência: {{ resultados.simples.anexo }}</small>
          </div>
          <div>R$ {{ formatNumber(resultados.simples.valorImpostos) }}</div>
          <div>{{ formatNumber(resultados.simples.cargaTributariaPercentual) }}%</div>
        </div>
      </div>
      <div class="summary">
        🏆 O regime de menor **carga tributária** projetada é o <strong>{{ melhorRegime }}</strong>.
      </div>

      <div class="save-history-section">
        <input type="text" v-model="simulationName" placeholder="Dê um nome para esta simulação...">
        <button class="save-button" @click="saveSimulation">
          💾 Salvar Simulação
        </button>
      </div>
    </section>

    <section v-if="resultados" class="details-card">
      <div class="details-header" @click="toggleDetailsVisibility">
        <h2 class="card-title">Detalhamento dos Cálculos</h2>
        <span class="toggle-arrow" :class="{ 'open': isDetailsVisible }">▼</span>
      </div>
      <div v-if="isDetailsVisible" class="details-table-container">
        <table class="details-table">
          <thead>
            <tr>
              <th>Tributo</th>
              <th>Lucro Presumido</th>
              <th>Lucro Real</th>
              <th>Simples Nacional</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="tributo in tributosDetalhados" :key="tributo.key">
              <td>{{ tributo.nome }}</td>
              <td>{{ formatValue(resultados.presumido.detalhes[tributo.key]) }}</td>
              <td>{{ formatValue(resultados.real.detalhes[tributo.key]) }}</td>
              <td>{{ formatValue(resultados.simples.detalhes[tributo.key]) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>TOTAL</strong></td>
              <td><strong>R$ {{ formatNumber(resultados.presumido.valorImpostos) }}</strong></td>
              <td><strong>R$ {{ formatNumber(resultados.real.valorImpostos) }}</strong></td>
              <td><strong>R$ {{ formatNumber(resultados.simples.valorImpostos) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <section v-if="history.length > 0" class="history-card">
      <h2 class="card-title">Histórico de Simulações</h2>
      <ul class="history-list">
        <li v-for="(item, index) in history" :key="item.timestamp" class="history-item">
          <div class="history-info">
            <span class="history-name">{{ item.name }}</span>
            <span class="history-date">{{ new Date(item.timestamp).toLocaleString('pt-BR') }}</span>
          </div>
          <div class="history-actions">
            <button @click="loadSimulation(index)" class="action-button load">Carregar</button>
            <button @click="deleteSimulation(index)" class="action-button delete">Excluir</button>
          </div>
        </li>
      </ul>
    </section>

    <footer class="app-footer">
      <p><strong>Importante:</strong> A opção de enquadramento, seja ele lucro real, lucro presumido ou simples
        nacional, depende de uma série de condições que não estão incluídas nos calculos.</p>
      <p>As informações deste simulador servem apenas para orientação geral, e não significam o aconselhamento para a
        tomada de decisão. Seus cálculos são simplificações da dinâmica tributária das empresas, como qualquer
        simplificação estão sujeitas a erros e a imprecisões diversas.</p>
      <p>É necessário sempre consultar um profissional habilitado para que seja discutido os diversos fatores que
        influenciam a definição de enquadramento tributário para cada caso isolado. Não nos responsabilizamos pelo uso
        das informações desta ferramenta.</p>
    </footer>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useTributos } from './composables/useTributos.js';
import './assets/css/styles.css';

const simulationName = ref('');
const history = ref([]);

onMounted(() => {
  const savedHistory = localStorage.getItem('simulationHistory');
  if (savedHistory) {
    history.value = JSON.parse(savedHistory);
  }
});

function saveSimulation() {
  if (!simulationName.value.trim() || !resultados.value) {
    alert('Por favor, dê um nome para a simulação antes de salvar.');
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
}

function loadSimulation(index) {
  const snapshot = history.value[index];
  Object.assign(inputs, snapshot.inputs);
  resultados.value = snapshot.results;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteSimulation(index) {
  if (confirm('Tem certeza que deseja excluir esta simulação?')) {
    history.value.splice(index, 1);
    localStorage.setItem('simulationHistory', JSON.stringify(history.value));
  }
}

const isDetailsVisible = ref(false);

function toggleDetailsVisibility() {
  isDetailsVisible.value = !isDetailsVisible.value;
}

const inputs = reactive({
  faturamentoAnual: '3.923.000,00',
  rbt12: '3.923.000,00',
  anexoSimples: 'anexoIII',
  despesas: {
    proLabore: '0',
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
    ipi: '0,00', iss: '4,00', icms: '0,00', rat: '1,00', inss: '20,00', inssTerceiros: '5,80',
    icmsInterno: '0,00', icmsInterestadual: '0,00', icmsImportacao: '0,00',
    ipiEntrada: '0,00', fgts: '8,00',
  }
});

const despesasConfig = [
  { key: 'proLabore', label: 'Pró-labore' },
  { key: 'salarios', label: 'Salários' },
  { key: 'comprasInternas', label: 'Compras Internas' },
  { key: 'comprasInterestaduais', label: 'Compras Interestaduais' },
  { key: 'comprasImportadas', label: 'Compras Importadas' },
  { key: 'insumoServicos', label: 'Insumo para Prest. Serviços' },
  { key: 'energiaAluguelFretes', label: 'Energia/Aluguel/Fretes' },
  { key: 'depreciacao', label: 'Depreciação' },
  { key: 'demaisDespesas', label: 'Demais Despesas' },
];
const encargosConfig = [
  { key: 'ipi', label: 'IPI' }, { key: 'iss', label: 'ISS' }, { key: 'icms', label: 'ICMS' }, { key: 'rat', label: 'RAT' }, { key: 'inss', label: 'INSS' }, { key: 'inssTerceiros', label: 'INSS Terceiros' }, { key: 'fgts', label: 'FGTS' },
  { key: 'icmsInterno', label: 'ICMS Interno' }, { key: 'icmsInterestadual', label: 'ICMS Interestadual' }, { key: 'icmsImportacao', label: 'ICMS Importação' }, { key: 'ipiEntrada', label: 'IPI Entrada' },
];

const tributosDetalhados = [
  { key: 'pis', nome: 'PIS/PASEP' },
  { key: 'cofins', nome: 'COFINS' },
  { key: 'irpj', nome: 'IRPJ' },
  { key: 'adicionalIRPJ', nome: 'ADICIONAL DE IRPJ' },
  { key: 'csll', nome: 'CSLL' },
  { key: 'ipi', nome: 'IPI' },
  { key: 'iss', nome: 'ISS' },
  { key: 'icms', nome: 'ICMS' },
  { key: 'simplesNacional', nome: 'SIMPLES NACIONAL (DAS)' },
  { key: 'inss', nome: 'INSS' },
  { key: 'inssTerceiros', nome: 'INSS TERCEIROS' },
  { key: 'rat', nome: 'RAT' },
  { key: 'fgts', nome: 'FGTS' },
];

const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
};

const formatValue = (value) => {
  if (value === null || value === undefined || value === 0 || isNaN(value)) return '-';
  return `R$ ${formatNumber(value)}`;
};

const parseNumber = (formattedValue) => {
  if (!formattedValue || typeof formattedValue !== 'string') return 0;
  return parseFloat(formattedValue.replace(/\./g, '').replace(',', '.'));
}
const handleCurrencyInput = (event, key, topCategory = null) => {
  let digits = event.target.value.replace(/\D/g, '');
  if (digits === '') digits = '0';
  const numberValue = Number(digits) / 100;
  const formattedValue = formatNumber(numberValue);
  if (topCategory) { inputs[topCategory][key] = formattedValue; }
  else { inputs[key] = formattedValue; }
};
const handlePercentInput = (event, key, category = null) => {
  let value = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
  if (value.indexOf('.') !== -1) { let parts = value.split('.'); value = parts[0] + '.' + parts[1].slice(0, 2); }
  const formattedValue = value.replace('.', ',');
  if (category) { inputs[category][key] = formattedValue; }
  else { inputs[key] = formattedValue; }
};

const getNumericInputs = () => {
  const numeric = { faturamentoAnual: parseNumber(inputs.faturamentoAnual), rbt12: parseNumber(inputs.rbt12), anexoSimples: inputs.anexoSimples, despesas: {}, encargos: {} };
  for (const key in inputs.despesas) { numeric.despesas[key] = parseNumber(inputs.despesas[key]); }
  for (const key in inputs.encargos) { numeric.encargos[key] = parseNumber(inputs.encargos[key]); }
  return numeric;
};

const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
#app-container {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: var(--cor-fundo);
  border-radius: var(--raio-borda);
  box-shadow: var(--sombra-card);
}

.form-grid-3-cols {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
}

.main-button {
  background-color: var(--cor-primaria);
  color: white;
  font-weight: bold;
  font-size: 1rem;
  border: none;
  border-radius: 8px;
  padding: 0.875rem 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.main-button:hover {
  background-color: var(--cor-primaria-leve);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.main-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

input[type="text"] {
  text-align: right;
}

.app-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-text {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--cor-primaria);
  margin: 0;
}

.subtitle {
  font-size: 1.125rem;
  color: var(--cor-texto-suave);
  margin-top: 0.25rem;
}

.card,
.results-card,
.details-card,
.history-card {
  background-color: var(--cor-card);
  padding: 2rem;
  border-radius: var(--raio-borda);
  box-shadow: var(--sombra-card);
  margin-bottom: 2rem;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--cor-borda);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.span-2 {
  grid-column: 1 / -1;
}

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

input,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--cor-borda);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor-primaria) 20%, transparent);
}

.comparison-table {
  display: flex;
  flex-direction: column;
}

.table-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  padding: 1rem;
  border-bottom: 1px solid var(--cor-borda);
  align-items: center;
  text-align: right;
  transition: background-color 0.3s;
}

.table-row:last-child {
  border-bottom: none;
}

.table-row.header {
  font-weight: 600;
  color: var(--cor-texto-suave);
  font-size: 0.875rem;
}

.table-row>div:first-child {
  text-align: left;
}

.table-row small {
  display: block;
  color: var(--cor-texto-suave);
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.table-row.rank-1 {
  background-color: var(--cor-bom-fundo);
  border-left: 4px solid var(--cor-bom-borda);
}

.table-row.rank-2 {
  background-color: var(--cor-medio-fundo);
  border-left: 4px solid var(--cor-medio-borda);
}

.table-row.rank-3 {
  background-color: var(--cor-ruim-fundo);
  border-left: 4px solid var(--cor-ruim-borda);
}

.summary {
  margin-top: 1.5rem;
  padding: 1rem;
  background-color: var(--cor-bom-fundo);
  border: 1px solid var(--cor-bom-borda);
  border-radius: 0.5rem;
  text-align: center;
  font-size: 1.125rem;
}

.app-footer {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--cor-borda);
  text-align: center;
  font-size: 0.8rem;
  color: var(--cor-texto-suave);
}

.app-footer p {
  margin-bottom: 1rem;
  line-height: 1.5;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  padding-bottom: 0;
  margin-bottom: -1.5rem;
}

.details-header .card-title {
  margin-bottom: 0;
  border-bottom: none;
}

.details-table-container {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--cor-borda);
}

.toggle-arrow {
  font-size: 1.2rem;
  color: var(--cor-texto-suave);
  transition: transform 0.3s ease;
}

.toggle-arrow.open {
  transform: rotate(180deg);
}

.details-table-container {
  overflow-x: auto;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table th,
.details-table td {
  padding: 0.75rem;
  text-align: right;
  border-bottom: 1px solid var(--cor-borda);
}

.details-table th {
  background-color: var(--cor-fundo);
  font-weight: 600;
  font-size: 0.875rem;
}

.details-table td:first-child,
.details-table th:first-child {
  text-align: left;
  font-weight: 500;
}

.details-table tbody tr:nth-child(even) {
  background-color: var(--cor-fundo);
}

.details-table tfoot {
  border-top: 2px solid var(--cor-texto-suave);
  font-size: 1.1rem;
}

.save-history-section {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--cor-borda);
}

.save-history-section input {
  flex-grow: 1;
}

.save-button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.save-button:hover {
  background-color: #0056b3;
}

.history-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--cor-borda);
}

.history-item:last-child {
  border-bottom: none;
}

.history-info {
  display: flex;
  flex-direction: column;
}

.history-name {
  font-weight: 600;
}

.history-date {
  font-size: 0.8rem;
  color: var(--cor-texto-suave);
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}

.action-button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  color: white;
  font-weight: 500;
}

.action-button.load {
  background-color: var(--cor-primaria);
}

.action-button.load:hover {
  background-color: var(--cor-primaria-leve);
}

.action-button.delete {
  background-color: #dc3545;
}

.action-button.delete:hover {
  background-color: #c82333;
}

@media (max-width: 768px) {

  .form-grid,
  .form-grid-3-cols {
    grid-template-columns: 1fr;
  }
}
</style>