<template>
  <div class="button-container">
    <button class="secondary-button" @click="$emit('reset')">
      ✨ Nova Simulação
    </button>
    <button class="main-button" @click="$emit('calculate')">
      📊 Calcular Projeção Anual
    </button>
  </div>
</template>

<script setup>
defineEmits(['reset', 'calculate']);
</script>

<style scoped>
.button-container {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
}
.main-button { background-color: var(--cor-primaria); color: white; font-weight: bold; font-size: 1rem; border: none; border-radius: 8px; padding: 0.875rem 2rem; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1); display: inline-flex; align-items: center; gap: 0.5rem; }
.main-button:hover { background-color: var(--cor-primaria-leve); transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15); }
.main-button:active { transform: translateY(0); box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1); }

.secondary-button {
  background-color: transparent;
  color: var(--cor-primaria);
  border: 2px solid var(--cor-primaria);
  font-weight: bold;
  font-size: 1rem;
  border-radius: 8px;
  padding: 0.75rem 1.875rem;
  cursor: pointer;
  transition: all 0.3s ease;
}
.secondary-button:hover {
  background-color: var(--cor-primaria);
  color: var(--cor-card);
}
</style>