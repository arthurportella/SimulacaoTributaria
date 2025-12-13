<template>
  <header class="app-header">
    <div class="header-content">
      <h1 class="logo-text">Simulador Tributário</h1>
      <p class="subtitle">Planejamento fiscal inteligente</p>
    </div>
    
    <div class="header-actions">
        <div v-if="user" class="user-profile-badge">
            <div class="user-avatar">
                {{ userInitials }}
            </div>
            <div class="user-details">
                <span class="user-name">{{ userName }}</span>
                <span class="user-role">Conta Gratuita</span>
            </div>
            <button @click="handleLogout" class="logout-icon-btn" title="Sair da conta">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </button>
        </div>
        
        <button v-else @click="$emit('open-login')" class="login-btn">
            Entrar / Criar Conta
        </button>

        <div class="theme-switcher">
          <span>☀️</span>
          <label class="switch">
            <input type="checkbox" :checked="theme === 'dark'" @change="toggleTheme">
            <span class="slider round"></span>
          </label>
          <span>🌙</span>
        </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import { useTheme } from '../composables/useTheme.js';
import { useAuth } from '../composables/useAuth.js';

const { theme, toggleTheme } = useTheme();
const { user, logout } = useAuth();

defineEmits(['open-login']);

const userName = computed(() => {
    if (!user.value) return '';
    if (user.value.displayName) return user.value.displayName.split(' ')[0];
    return user.value.email.split('@')[0];
});

const userInitials = computed(() => {
    if (!user.value) return '';
    const name = user.value.displayName || user.value.email;
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
});

async function handleLogout() {
    await logout();
}
</script>

<style scoped>
.app-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; margin-bottom: 2rem; padding-bottom: 1.5rem; border-bottom: 1px solid var(--cor-borda); }
.header-content { text-align: left; }
.logo-text { font-size: 1.8rem; font-weight: 700; color: var(--cor-primaria); margin: 0; line-height: 1.2; letter-spacing: -0.5px; }
.subtitle { font-size: 0.95rem; color: var(--cor-texto-suave); margin-top: 0.25rem; font-weight: 400; }
.header-actions { display: flex; align-items: center; gap: 1.5rem; margin-left: auto; flex-wrap: wrap; }
.user-profile-badge { display: flex; align-items: center; gap: 0.75rem; background-color: var(--cor-card); padding: 0.5rem 0.75rem 0.5rem 0.5rem; border-radius: 50px; border: 1px solid var(--cor-borda); box-shadow: 0 2px 8px rgba(0,0,0,0.04); transition: all 0.2s ease; }
.user-profile-badge:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); border-color: var(--cor-primaria-leve); }
.user-avatar { width: 38px; height: 38px; background-color: var(--cor-primaria); color: white; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 600; font-size: 0.9rem; letter-spacing: 0.5px; }
.user-details { display: flex; flex-direction: column; line-height: 1.2; margin-right: 0.5rem; }
.user-name { font-size: 0.9rem; font-weight: 600; color: var(--cor-texto); }
.user-role { font-size: 0.7rem; color: var(--cor-texto-suave); font-weight: 500; }
.logout-icon-btn { background: transparent; border: none; color: var(--cor-texto-suave); cursor: pointer; display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 50%; transition: all 0.2s; }
.logout-icon-btn:hover { background-color: #ffebee; color: #d32f2f; }
.login-btn { background: transparent; border: 2px solid var(--cor-primaria); color: var(--cor-primaria); padding: 0.5rem 1.2rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; transition: all 0.2s; }
.login-btn:hover { background: var(--cor-primaria); color: white; }
.theme-switcher { display: flex; align-items: center; gap: 0.5rem; margin-left: 0.5rem; }
.switch { position: relative; display: inline-block; width: 46px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #e0e0e0; transition: .4s; border-radius: 34px; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
input:checked+.slider { background-color: var(--cor-primaria); }
input:checked+.slider:before { transform: translateX(22px); }
@media (max-width: 600px) {
    .app-header { flex-direction: column; text-align: center; gap: 1.5rem; }
    .header-content { text-align: center; }
    .header-actions { justify-content: center; margin-left: 0; width: 100%; }
    .user-details { display: none; } 
    .user-profile-badge { padding-right: 0.5rem; }
}
</style>