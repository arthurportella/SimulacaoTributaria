<template>
  <div class="charts-card">
    <h2 class="card-title">Visualização Gráfica</h2>

    <div class="chart-container">
      <h3>Comparativo de Carga Tributária Anual</h3>
      <Bar v-if="barChartData.datasets[0].data.length" :data="barChartData" :options="chartOptions" />
    </div>

    <div class="pie-chart-section">
      <h3>Composição dos Impostos por Regime</h3>
      <div class="regime-buttons">
        <button @click="selectRegime('presumido')" :class="{ active: selectedRegime === 'presumido' }">Lucro Presumido</button>
        <button @click="selectRegime('real')" :class="{ active: selectedRegime === 'real' }">Lucro Real</button>
        <button @click="selectRegime('simples')" :class="{ active: selectedRegime === 'simples' }">Simples Nacional</button>
      </div>
      <div class="chart-container pie-container">
        <Pie v-if="pieChartData.datasets[0].data.length" :data="pieChartData" :options="chartOptions" />
        <p v-if="!pieChartData.datasets[0].data.length && selectedRegime">Nenhum dado detalhado para exibir neste regime.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar, Pie } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement);

const props = defineProps({
  resultados: Object
});

const selectedRegime = ref('presumido'); // Inicia com um regime selecionado

function selectRegime(regime) {
  selectedRegime.value = regime;
}

// --- DADOS PARA O GRÁFICO DE BARRAS ---
const barChartData = computed(() => ({
  labels: ['Lucro Presumido', 'Lucro Real', 'Simples Nacional'],
  datasets: [
    {
      label: 'Valor Total dos Impostos (R$)',
      backgroundColor: ['#f87979', '#36a2eb', '#4bc0c0'],
      data: [
        props.resultados.presumido.valorImpostos,
        props.resultados.real.valorImpostos,
        props.resultados.simples.valorImpostos
      ]
    }
  ]
}));

// --- DADOS PARA O GRÁFICO DE PIZZA ---
const pieChartData = computed(() => {
  const regimeData = props.resultados[selectedRegime.value]?.detalhes;
  if (!regimeData) return { labels: [], datasets: [{ data: [] }] };

  const labels = [];
  const data = [];
  
  // Filtra apenas os tributos com valor maior que zero para não poluir o gráfico
  for (const key in regimeData) {
    if (regimeData[key] > 0) {
      labels.push(key.toUpperCase());
      data.push(regimeData[key]);
    }
  }

  return {
    labels,
    datasets: [
      {
        backgroundColor: ['#41B883', '#E46651', '#00D8FF', '#DD1B16', '#FFC107', '#607D8B', '#9C27B0', '#3F51B5'],
        data
      }
    ]
  };
});

// Opções comuns para ambos os gráficos
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: false,
    }
  }
};
</script>

<style scoped>
.charts-card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.card-title { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }
.chart-container { position: relative; height: 350px; margin-top: 1rem; }
h3 { text-align: center; color: var(--cor-texto-suave); font-weight: 500; }

.pie-chart-section { margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--cor-borda); }
.regime-buttons { display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
.regime-buttons button { background-color: transparent; border: 1px solid var(--cor-borda); color: var(--cor-texto-suave); padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; transition: all 0.3s ease; }
.regime-buttons button:hover { background-color: var(--cor-fundo); border-color: var(--cor-primaria); }
.regime-buttons button.active { background-color: var(--cor-primaria); color: white; border-color: var(--cor-primaria); }

.pie-container p { text-align: center; margin-top: 2rem; color: var(--cor-texto-suave); }
</style>