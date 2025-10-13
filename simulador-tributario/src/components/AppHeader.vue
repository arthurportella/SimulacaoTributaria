<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="logo-text">Simulador de Planejamento tributário</h1>
      <p class="subtitle">Planejamento e clareza para suas decisões fiscais anuais</p>
    </div>
    <div class="theme-switcher">
      <span>☀️</span>
      <label class="switch">
        <input type="checkbox" :checked="theme === 'dark'" @change="toggleTheme">
        <span class="slider round"></span>
      </label>
      <span>🌙</span>
    </div>
  </header>
</template>

<script setup>
import { useTheme } from '../composables/useTheme.js';
const { theme, toggleTheme } = useTheme();
</script>

<style scoped>
.app-header {
  text-align: center;
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}
.header-content {
  text-align: left;
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
.theme-switcher {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-left: auto;
}
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 26px;
}
.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}
.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
}
.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}
input:checked+.slider {
  background-color: var(--cor-primaria);
}
input:checked+.slider:before {
  transform: translateX(24px);
}
.slider.round {
  border-radius: 26px;
}
.slider.round:before {
  border-radius: 50%;
}
</style>