<template>
  <section class="details-card">
    <div class="details-header" @click="toggleDetailsVisibility">
      <h2 class="card-title">Detalhamento dos Cálculos</h2>
      <span class="toggle-arrow" :class="{ 'open': isDetailsVisible }">▼</span>
    </div>
    <div v-if="isDetailsVisible" class="details-table-container">
      <table class="details-table">
        <colgroup>
            <col style="width: 25%;"> <col style="width: 12.5%;"> <col style="width: 12.5%;"> <col style="width: 12.5%;"> <col style="width: 12.5%;"> <col style="width: 12.5%;"> <col style="width: 12.5%;"> </colgroup>
        <thead>
          <tr>
            <th rowspan="2">Tributo</th>
            <th colspan="2">Lucro Presumido</th>
            <th colspan="2">Lucro Real</th>
            <th colspan="2">Simples Nacional</th>
          </tr>
          <tr>
            <th>Alíquota</th>
            <th>Valor</th>
            <th>Alíquota</th>
            <th>Valor</th>
            <th>Alíquota</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tributo in tributosDetalhados" :key="tributo.key">
            <td>{{ tributo.nome }}</td>
            
            <td>{{ formatTaxRate(resultados.presumido.detalhes[tributo.key]) }}</td>
            <td>{{ formatValue(resultados.presumido.detalhes[tributo.key]) }}</td>

            <td>{{ formatTaxRate(resultados.real.detalhes[tributo.key]) }}</td>
            <td>{{ formatValue(resultados.real.detalhes[tributo.key]) }}</td>
            
            <td>{{ formatTaxRate(resultados.simples.detalhes[tributo.key]) }}</td>
            <td>{{ formatValue(resultados.simples.detalhes[tributo.key]) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="subtotal-row">
            <td><strong>Total s/ FGTS</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.presumido.valorImpostos - (resultados.presumido.detalhes.fgts?.valor || 0)) }}</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.real.valorImpostos - (resultados.real.detalhes.fgts?.valor || 0)) }}</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.simples.valorImpostos - (resultados.simples.detalhes.fgts?.valor || 0)) }}</strong></td>
          </tr>
          <tr class="total-row">
            <td><strong>TOTAL GERAL</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.presumido.valorImpostos) }}</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.real.valorImpostos) }}</strong></td>
            <td colspan="2"><strong>R$ {{ formatNumber(resultados.simples.valorImpostos) }}</strong></td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import { formatNumber, formatValue, formatTaxRate } from '../utils/formatters.js';

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
.details-table { width: 100%; border-collapse: collapse; table-layout: fixed; }

.details-table th, .details-table td { padding: 0.75rem 0.5rem; border-bottom: 1px solid var(--cor-borda); font-size: 0.875rem; text-align: center; }
.details-table td:first-child, .details-table th:first-child { text-align: left; font-weight: 500; }

.details-table th { background-color: var(--cor-fundo); font-weight: 600; }
.details-table tbody tr:nth-child(even) { background-color: var(--cor-fundo); }
.details-table tfoot { border-top: 2px solid var(--cor-texto-suave); font-size: 1.1rem; }

/* CORREÇÃO: Usando a variável em vez da cor fixa */
.subtotal-row td { background-color: var(--cor-tabela-subtotal); color: var(--cor-texto-suave); font-size: 0.95rem; }

.total-row td { font-weight: bold; color: var(--cor-texto); }

.details-table tfoot td { padding-right: 1.5rem; text-align: center !important; }
.details-table tfoot td:first-child { text-align: left !important; }
</style>