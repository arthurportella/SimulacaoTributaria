<template>
  <section class="results-card">
    <h2 class="card-title">{{ summaryTitle }}</h2>
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
      <input type="text" :value="simulationName" @input="$emit('update:simulationName', $event.target.value)" placeholder="Dê um nome para esta simulação...">
      <button class="save-button" @click="$emit('save')">
        💾 Salvar Simulação
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';
import { formatNumber } from '../utils/formatters.js';

const props = defineProps({
  resultados: Object,
  rankedResults: Object,
  melhorRegime: String,
  simulationName: String,
  periodo: String
});

defineEmits(['update:simulationName', 'save']);

const summaryTitle = computed(() => {
  return props.periodo === 'anual' ? 'RESUMO DA CARGA TRIBUTÁRIA ANUAL' : 'RESUMO DA CARGA TRIBUTÁRIA TRIMESTRAL';
});
</script>

<style scoped>
.results-card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.card-title { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }
.comparison-table { display: flex; flex-direction: column; }
.table-row { display: grid; grid-template-columns: 2fr 1fr 1fr; padding: 1rem; border-bottom: 1px solid var(--cor-borda); align-items: center; text-align: right; transition: background-color 0.3s; }
.table-row:last-child { border-bottom: none; }
.table-row.header { font-weight: 600; color: var(--cor-texto-suave); font-size: 0.875rem; }
.table-row>div:first-child { text-align: left; }
.table-row small { display: block; color: var(--cor-texto-suave); font-size: 0.75rem; margin-top: 0.25rem; }
.table-row.rank-1 { background-color: var(--cor-bom-fundo); border-left: 4px solid var(--cor-bom-borda); }
.table-row.rank-2 { background-color: var(--cor-medio-fundo); border-left: 4px solid var(--cor-medio-borda); }
.table-row.rank-3 { background-color: var(--cor-ruim-fundo); border-left: 4px solid var(--cor-ruim-borda); }
.summary { margin-top: 1.5rem; padding: 1rem; background-color: var(--cor-bom-fundo); border: 1px solid var(--cor-bom-borda); border-radius: 0.5rem; text-align: center; font-size: 1.125rem; }

.save-history-section { display: flex; gap: 1rem; margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--cor-borda); }
.save-history-section input {
  flex-grow: 1;
  background-color: var(--cor-fundo);
  color: var(--cor-texto);
  border: 1px solid var(--cor-borda);
  border-radius: 0.5rem;
  padding: 0.75rem;
}
.save-button { background-color: #007bff; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; cursor: pointer; font-weight: bold; transition: background-color 0.3s ease; }
.save-button:hover { background-color: #0056b3; }
</style>