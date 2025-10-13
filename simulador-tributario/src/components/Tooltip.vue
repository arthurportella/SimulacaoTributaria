<template>
  <div class="tooltip-container">
    <slot></slot> <span class="tooltip-text">{{ text }}</span>
  </div>
</template>

<script setup>
defineProps({
  text: String, // O texto da dica será passado como uma propriedade
});
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin-left: 8px; /* Espaço entre o label e o ícone */
  cursor: help;
}

/* O texto da dica (escondido por padrão) */
.tooltip-text {
  visibility: hidden;
  width: 250px;
  background-color: #333;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 10px;
  position: absolute;
  z-index: 1;
  bottom: 150%; /* Posição acima do ícone */
  left: 50%;
  margin-left: -125px; /* Centraliza o tooltip */
  opacity: 0;
  transition: opacity 0.3s;
  font-size: 0.8rem;
  font-weight: normal;
  line-height: 1.4;
}

/* Seta abaixo do tooltip */
.tooltip-text::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: #333 transparent transparent transparent;
}

/* Mostra o tooltip ao passar o mouse */
.tooltip-container:hover .tooltip-text {
  visibility: visible;
  opacity: 1;
}
</style>