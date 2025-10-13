// src/composables/useTheme.js
import { ref, onMounted, watch } from 'vue';

export function useTheme() {
  const theme = ref(localStorage.getItem('theme') || 'light');

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  function applyTheme(newTheme) {
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  }

  watch(theme, (newTheme) => {
    applyTheme(newTheme);
  });

  onMounted(() => {
    applyTheme(theme.value);
  });

  return {
    theme,
    toggleTheme,
  };
}