<template>
  <section class="history-card">
    <h2 class="card-title">Histórico de Simulações</h2>
    <ul class="history-list">
      <li v-for="(item, index) in history" :key="item.timestamp" class="history-item">
        <div class="history-info">
          <span class="history-name">{{ item.name }}</span>
          <span class="history-date">{{ new Date(item.timestamp).toLocaleString('pt-BR') }}</span>
        </div>
        <div class="history-actions">
          <button @click="$emit('load', index)" class="action-button load">Carregar</button>
          <button @click="$emit('delete', index)" class="action-button delete">Excluir</button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
defineProps({
  history: Array
});
defineEmits(['load', 'delete']);
</script>

<style scoped>
.history-card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.card-title { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }
.history-list { list-style: none; padding: 0; margin: 0; }
.history-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--cor-borda); }
.history-item:last-child { border-bottom: none; }
.history-info { display: flex; flex-direction: column; }
.history-name { font-weight: 600; }
.history-date { font-size: 0.8rem; color: var(--cor-texto-suave); }
.history-actions { display: flex; gap: 0.5rem; }
.action-button { padding: 0.5rem 1rem; border: none; border-radius: 6px; cursor: pointer; color: white; font-weight: 500; }
.action-button.load { background-color: var(--cor-primaria); }
.action-button.load:hover { background-color: var(--cor-primaria-leve); }
.action-button.delete { background-color: #dc3545; }
.action-button.delete:hover { background-color: #c82333; }
</style>