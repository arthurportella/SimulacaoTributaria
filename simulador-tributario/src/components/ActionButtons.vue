<template>
  <div class="button-container">
    <button class="secondary-button" @click="$emit('reset')">
      ✨ Nova Simulação
    </button>
    <button class="main-button" @click="$emit('calculate')">
      📊 Calcular Projeção Anual
    </button>
    <button class="secondary-button pdf-button" @click="$emit('export-pdf')" :disabled="!isResultsVisible">
      📄 Gerar Relatório
    </button>
  </div>
</template>

<script setup>
defineProps({
  isResultsVisible: Boolean // Recebe a informação se há resultados para habilitar o botão
});
defineEmits(['reset', 'calculate', 'export-pdf']);
</script>

<style scoped>
.button-container { display: flex; justify-content: center; margin-bottom: 2rem; gap: 1rem; flex-wrap: wrap; }
.main-button { background-color: var(--cor-primaria); color: white; font-weight: bold; font-size: 1rem; border: none; border-radius: 8px; padding: 0.875rem 2rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); display: inline-flex; align-items: center; gap: 0.5rem; }
.main-button:hover { background-color: var(--cor-primaria-leve); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }

.secondary-button { background-color: transparent; color: var(--cor-primaria); border: 2px solid var(--cor-primaria); font-weight: bold; font-size: 1rem; border-radius: 8px; padding: calc(0.875rem - 2px) calc(2rem - 2px); cursor: pointer; transition: all 0.3s ease; }
.secondary-button:hover { background-color: var(--cor-primaria); color: var(--cor-card); }
.secondary-button:disabled { border-color: #9e9e9e; color: #9e9e9e; cursor: not-allowed; }
.secondary-button:disabled:hover { background-color: transparent; }
</style>