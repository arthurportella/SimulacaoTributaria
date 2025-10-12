<template>
  <div id="app-container">
    <header class="app-header">
      <h1 class="logo-text">Simulador Tributário</h1>
      <p class="subtitle">Planejamento e clareza para suas decisões fiscais</p>
    </header>

    <main class="card">
      <h2 class="card-title">Dados para Simulação</h2>
      <div class="form-grid">
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

        <div class="form-group">
          <label for="faturamentoMes">Faturamento do Mês (R$)</label>
          <input type="number" id="faturamentoMes" v-model.number="inputs.faturamentoMes" placeholder="30000">
        </div>
        <div class="form-group">
          <label for="rbt12">Receita Bruta (Últimos 12 Meses)</label>
          <input type="number" id="rbt12" v-model.number="inputs.rbt12" placeholder="350000">
        </div>
        <div class="form-group">
          <label for="folhaPagamento12m">Folha de Pagamento (Últimos 12 Meses)</label>
          <input type="number" id="folhaPagamento12m" v-model.number="inputs.folhaPagamento12m" placeholder="98000">
        </div>
        <div class="form-group">
          <label for="custoServico">Custo do Serviço / Mercadoria (R$)</label>
          <input type="number" id="custoServico" v-model.number="inputs.custoServico" placeholder="5000">
        </div>
        <div class="form-group">
          <label for="proLabore">Pró-labore (R$)</label>
          <input type="number" id="proLabore" v-model.number="inputs.proLabore" placeholder="4000">
        </div>
        <div class="form-group">
          <label for="aluguel">Outras Despesas Operacionais (R$)</label>
          <input type="number" id="aluguel" v-model.number="inputs.aluguel" placeholder="2500">
        </div>
      </div>
      <button class="main-button" @click="simularImpostos(inputs)">
        📊 Simular Impostos
      </button>
    </main>

    <section v-if="resultados" class="results-card">
      <h2 class="card-title">Comparativo dos Regimes</h2>
      <div class="comparison-table">
        <div class="table-row header">
          <div>Regime Tributário</div>
          <div>Alíquota Efetiva</div>
          <div>Valor Total (R$)</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Simples Nacional']}`">
          <div>
            <strong>Simples Nacional</strong>
            <small>Anexo de referência: {{ resultados.simples.anexo }}</small>
          </div>
          <div>{{ (resultados.simples.aliquotaEfetiva * 100).toFixed(2) }}%</div>
          <div>{{ resultados.simples.total.toFixed(2) }}</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Lucro Presumido']}`">
          <div><strong>Lucro Presumido</strong></div>
          <div>{{ (resultados.presumido.aliquotaEfetiva * 100).toFixed(2) }}%</div>
          <div>{{ resultados.presumido.total.toFixed(2) }}</div>
        </div>
        <div class="table-row" :class="`rank-${rankedResults['Lucro Real']}`">
          <div><strong>Lucro Real</strong></div>
          <div>{{ (resultados.real.aliquotaEfetiva * 100).toFixed(2) }}%</div>
          <div>{{ resultados.real.total.toFixed(2) }}</div>
        </div>
      </div>
      <div class="summary">
        🏆 O regime mais vantajoso é o <strong>{{ melhorRegime }}</strong>.
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
// Importando nossa lógica de cálculo externa
import { useTributos } from './composables/useTributos.js';

// Importando nossos estilos globais
import './assets/css/styles.css';

const inputs = reactive({
  anexoSimples: 'anexoIII', // Novo campo para o anexo
  faturamentoMes: 30000,
  rbt12: 350000,
  folhaPagamento12m: 98000,
  custoServico: 5000,
  proLabore: 4000,
  aluguel: 2500
});

// Usando o nosso "composable"
const { resultados, simularImpostos, rankedResults, melhorRegime } = useTributos();
</script>

<style scoped>
/* ESTILOS ESPECÍFICOS PARA ESTE COMPONENTE, INSPIRADOS NO NOVO DESIGN */
#app-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1rem;
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

.card, .results-card {
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

input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--cor-borda);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--cor-primaria);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor-primaria) 20%, transparent);
}

.main-button {
  width: 100%;
  padding: 1rem;
  margin-top: 2rem;
  font-size: 1rem;
  font-weight: 600;
  color: white;
  background-color: var(--cor-primaria);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.main-button:hover {
  background-color: var(--cor-primaria-leve);
}

/* Tabela de Resultados */
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
.table-row > div:first-child {
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
  margin-top: 1.5rem; padding: 1rem; background-color: var(--cor-bom-fundo);
  border: 1px solid var(--cor-bom-borda);
  border-radius: 0.5rem; text-align: center; font-size: 1.125rem;
}
@media (max-width: 600px) {
  .form-grid { grid-template-columns: 1fr; }
}
</style>