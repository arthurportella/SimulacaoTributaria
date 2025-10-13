<template>
  <section class="details-card">
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
</template>

<script setup>
import { ref } from 'vue';
import { formatNumber, formatValue } from '../utils/formatters.js';

const isDetailsVisible = ref(false);
function toggleDetailsVisibility() {
  isDetailsVisible.value = !isDetailsVisible.value;
}

defineProps({
  resultados: Object,
  tributosDetalhados: Array
});
</script>

<style scoped>
.details-card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.card-title { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }

.details-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; border-bottom: 1px solid transparent; padding-bottom: 0; margin-bottom: -1.5rem; }
.details-header .card-title { margin-bottom: 0; border-bottom: none; }
.toggle-arrow { font-size: 1.2rem; color: var(--cor-texto-suave); transition: transform 0.3s ease; }
.toggle-arrow.open { transform: rotate(180deg); }

.details-table-container { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--cor-borda); overflow-x: auto; }
.details-table { width: 100%; border-collapse: collapse; }
.details-table th, .details-table td { padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--cor-borda); }
.details-table th { background-color: var(--cor-fundo); font-weight: 600; font-size: 0.875rem; }
.details-table td:first-child, .details-table th:first-child { text-align: left; font-weight: 500; }
.details-table tbody tr:nth-child(even) { background-color: var(--cor-fundo); }
.details-table tfoot { border-top: 2px solid var(--cor-texto-suave); font-size: 1.1rem; }
</style>