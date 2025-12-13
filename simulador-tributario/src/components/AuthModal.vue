<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-btn" @click="close">&times;</button>
      
      <h2>{{ isLogin ? 'Acessar Conta' : 'Criar Nova Conta' }}</h2>
      <p class="subtitle">{{ isLogin ? 'Bem-vindo de volta!' : 'Preencha seus dados para começar.' }}</p>

      <button class="google-btn" @click="handleGoogleLogin" :disabled="loading">
        <svg class="google-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
        </svg>
        <span>Entrar com Google</span>
      </button>

      <div class="divider">
          <span>ou use seu e-mail</span>
      </div>

      <form @submit.prevent="handleSubmit">
        <template v-if="!isLogin">
            <div class="form-group">
                <label>Nome Completo</label>
                <input type="text" v-model="form.name" required placeholder="Ex: João Silva">
            </div>

            <div class="form-group">
                <label>Celular (com DDD)</label>
                <input type="tel" :value="form.phone" @input="formatPhone" required placeholder="(XX) 99999-9999" maxlength="15">
            </div>

            <div class="row-group">
                <div class="form-group half">
                    <label>Cidade</label>
                    <input type="text" v-model="form.city" required placeholder="Sua cidade">
                </div>
                <div class="form-group half">
                    <label>Estado</label>
                    <input type="text" v-model="form.state" required placeholder="UF" maxlength="2" style="text-transform: uppercase;">
                </div>
            </div>
        </template>

        <div class="form-group">
          <label>E-mail</label>
          <input type="email" v-model="form.email" required placeholder="seu@email.com">
        </div>
        
        <div class="form-group">
          <label>Senha</label>
          <input type="password" v-model="form.password" required placeholder="******">
        </div>

        <div class="form-group" v-if="!isLogin">
          <label>Confirmar Senha</label>
          <input type="password" v-model="form.confirmPassword" required placeholder="Repita a senha">
        </div>

        <div v-if="authError" class="error-msg">{{ authError }}</div>
        <div v-if="passwordError" class="error-msg">{{ passwordError }}</div>

        <button type="submit" class="submit-btn" :disabled="loading">
          {{ loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Cadastrar') }}
        </button>
      </form>

      <div class="switch-mode">
        <span v-if="isLogin">Ainda não tem conta? <a href="#" @click.prevent="toggleMode">Cadastre-se</a></span>
        <span v-else>Já tem conta? <a href="#" @click.prevent="toggleMode">Faça Login</a></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useAuth } from '../composables/useAuth';

defineProps(['isOpen']);
const emit = defineEmits(['close']);

const { login, signup, loginWithGoogle, authError } = useAuth();

const isLogin = ref(true);
const loading = ref(false);
const passwordError = ref(null);

const form = reactive({
    name: '', phone: '', city: '', state: '',
    email: '', password: '', confirmPassword: ''
});

function close() {
    emit('close');
    resetForm();
}

function resetForm() {
    form.name = ''; form.phone = ''; form.city = ''; form.state = '';
    form.email = ''; form.password = ''; form.confirmPassword = '';
    authError.value = null; passwordError.value = null;
}

function toggleMode() {
    isLogin.value = !isLogin.value;
    authError.value = null; passwordError.value = null;
}

function formatPhone(event) {
    let value = event.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 10) value = value.replace(/^(\d{2})(\d{5})(\d{4}).*/, "($1) $2-$3");
    else if (value.length > 5) value = value.replace(/^(\d{2})(\d{4,5}).*/, "($1) $2");
    else if (value.length > 2) value = value.replace(/^(\d{2})/, "($1) ");
    else value = value.replace(/^(\d*)/, "($1");
    form.phone = value;
}

async function handleGoogleLogin() {
    loading.value = true;
    passwordError.value = null;
    await loginWithGoogle();
    loading.value = false;
    if (!authError.value) close();
}

async function handleSubmit() {
    loading.value = true;
    passwordError.value = null;

    if (isLogin.value) {
        await login(form.email, form.password);
    } else {
        if (form.password !== form.confirmPassword) {
            passwordError.value = "As senhas não coincidem.";
            loading.value = false; return;
        }
        await signup(form.email, form.password, {
            name: form.name, phone: form.phone, city: form.city, state: form.state.toUpperCase()
        });
    }
    
    loading.value = false;
    if (!authError.value && !passwordError.value) close();
}
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.modal-content { background: var(--cor-card); padding: 2rem; border-radius: 16px; width: 95%; max-width: 450px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.2); animation: slideUp 0.3s ease; max-height: 90vh; overflow-y: auto; }
@keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.close-btn { position: absolute; top: 15px; right: 20px; background: none; border: none; font-size: 1.8rem; cursor: pointer; color: var(--cor-texto-suave); line-height: 1; transition: color 0.2s; }
.close-btn:hover { color: var(--cor-primaria); }
h2 { margin-top: 0; text-align: center; color: var(--cor-primaria); margin-bottom: 0.5rem; }
.subtitle { text-align: center; color: var(--cor-texto-suave); margin-bottom: 1.5rem; font-size: 0.9rem; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.85rem; color: var(--cor-texto); }
.form-group input { width: 100%; padding: 0.75rem; border: 1px solid var(--cor-borda); border-radius: 8px; background: var(--cor-fundo); color: var(--cor-texto); font-size: 0.95rem; transition: border-color 0.2s; }
.form-group input:focus { outline: none; border-color: var(--cor-primaria); box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1); }
.row-group { display: flex; gap: 1rem; }
.half { flex: 1; }
.submit-btn { width: 100%; padding: 0.875rem; background: var(--cor-primaria); color: white; border: none; border-radius: 8px; font-weight: bold; font-size: 1rem; cursor: pointer; margin-top: 0.5rem; transition: background 0.2s; }
.submit-btn:hover { background: var(--cor-primaria-leve); }
.submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
.switch-mode { text-align: center; margin-top: 1.5rem; font-size: 0.9rem; color: var(--cor-texto-suave); }
.switch-mode a { color: var(--cor-primaria); text-decoration: none; font-weight: 600; margin-left: 5px; }
.switch-mode a:hover { text-decoration: underline; }
.error-msg { background-color: #ffebee; color: #c62828; padding: 0.6rem; border-radius: 6px; font-size: 0.85rem; text-align: center; margin-bottom: 1rem; border: 1px solid #ffcdd2; }
.google-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; background-color: #fff; color: #3c4043; border: 1px solid #dadce0; padding: 0.6rem; border-radius: 8px; font-weight: 500; font-size: 0.95rem; cursor: pointer; transition: all 0.2s; margin-bottom: 1.5rem; }
.google-btn:hover { background-color: #f8f9fa; border-color: #d2e3fc; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
.google-icon { width: 20px; height: 20px; }
.divider { display: flex; align-items: center; text-align: center; margin-bottom: 1.5rem; color: var(--cor-texto-suave); font-size: 0.85rem; }
.divider::before, .divider::after { content: ''; flex: 1; border-bottom: 1px solid var(--cor-borda); }
.divider span { padding: 0 10px; }
</style>