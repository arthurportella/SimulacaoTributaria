<template>
  <div id="app-container">
    <header class="app-header">
      <h1 class="logo-text">Simulador Tributário Avançado</h1>
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
      <h2 class="card-title">Comparativo de Custo Total Anual</h2>
      <div class="comparison-table">
        <div class="table-row header">
          <div>Regime Tributário</div>
          <div>Custo Efetivo Anual</div>
          <div>Custo Total Anual (R$)</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Simples Nacional']}`">
          <div>
            <strong>Simples Nacional</strong>
            <small>Anexo de referência: {{ resultados.simples.anexo }}</small>
          </div>
          <div>{{ formatNumber(resultados.simples.custoEfetivo) }}%</div>
          <div>R$ {{ formatNumber(resultados.simples.total) }}</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Lucro Presumido']}`">
          <div><strong>Lucro Presumido</strong></div>
          <div>{{ formatNumber(resultados.presumido.custoEfetivo) }}%</div>
          <div>R$ {{ formatNumber(resultados.presumido.total) }}</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Lucro Real']}`">
          <div><strong>Lucro Real</strong></div>
          <div>{{ formatNumber(resultados.real.custoEfetivo) }}%</div>
          <div>R$ {{ formatNumber(resultados.real.total) }}</div>
        </div>
      </div>
      <div class="summary">
        🏆 O regime de menor custo anual projetado é o <strong>{{ melhorRegime }}</strong>.
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useTributos } from './composables/useTributos.js';
import './assets/css/styles.css';

// MUDANÇA: A estrutura de 'despesas' agora é um objeto simples com os campos anuais
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

// Configuração para gerar a nova seção de despesas
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

// FUNÇÕES DE FORMATAÇÃO E PARSE
const formatNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
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
  if (value.indexOf('.') !== -1) {
    let parts = value.split('.');
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  const formattedValue = value.replace('.', ',');
  if (category) { inputs[category][key] = formattedValue; }
  else { inputs[key] = formattedValue; }
};

// Converte os inputs formatados para os cálculos
const getNumericInputs = () => {
  const numeric = {
    faturamentoAnual: parseNumber(inputs.faturamentoAnual),
    rbt12: parseNumber(inputs.rbt12),
    anexoSimples: inputs.anexoSimples,
    despesas: {},
    encargos: {}
  };
  for (const key in inputs.despesas) {
    numeric.despesas[key] = parseNumber(inputs.despesas[key]);
  }
  for (const key in inputs.encargos) {
    numeric.encargos[key] = parseNumber(inputs.encargos[key]);
  }
  return numeric;
};

const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
/* O CSS permanece o mesmo, pois o layout de grid se adapta bem */
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
  width: auto;
  padding: 1rem 2.5rem;
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
.results-card {
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

.main-button:hover {
  background-color: var(--cor-primaria-leve);
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

@media (max-width: 768px) {

  .form-grid,
  .form-grid-3-cols {
    grid-template-columns: 1fr;
  }
}
</style>