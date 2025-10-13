<template>
    <main class="card">
      <h2 class="card-title">Projeção Anual e Atividade</h2>
      <div class="form-grid">
        <div class="form-group">
          <label for="faturamentoAnual">Faturamento Anual Projetado</label>
          <input type="text" id="faturamentoAnual" :value="modelValue.faturamentoAnual" @input="handleCurrencyInput($event, 'faturamentoAnual')">
        </div>
        <div class="form-group">
          <label for="rbt12">Receita Bruta (Últimos 12 Meses)</label>
          <input type="text" id="rbt12" :value="modelValue.rbt12" @input="handleCurrencyInput($event, 'rbt12')">
        </div>
        <div class="form-group span-2">
          <label for="anexoSimples">Atividade Principal (Anexo do Simples Nacional)</label>
          <select id="anexoSimples" :value="modelValue.anexoSimples" @input="updateField('anexoSimples', $event.target.value)">
            <option value="anexoI">Anexo I - Comércio</option>
            <option value="anexoII">Anexo II - Indústria</option>
            <option value="anexoIII">Anexo III - Serviços</option>
            <option value="anexoIV">Anexo IV - Serviços (advocacia, etc.)</option>
            <option value="anexoV">Anexo V - Serviços (fator R)</option>
          </select>
        </div>
      </div>
    </main>

    <section class="card">
      <h2 class="card-title">Gastos e Despesas Anuais</h2>
      <div class="form-grid">
        <div class="form-group" v-for="despesa in despesasConfig" :key="despesa.key">
          <label :for="despesa.key">{{ despesa.label }}</label>
          <input type="text" :id="despesa.key" :value="modelValue.despesas[despesa.key]" @input="handleCurrencyInput($event, despesa.key, 'despesas')">
        </div>
      </div>
    </section>

    <section class="card">
      <h2 class="card-title">Encargos e Impostos Adicionais</h2>
      <div class="form-grid-3-cols">
        <div class="form-group" v-for="encargo in encargosConfig" :key="encargo.key">
          <label :for="encargo.key">{{ encargo.label }} (%)</label>
          <input type="text" :id="encargo.key" :value="modelValue.encargos[encargo.key]" @input="handlePercentInput($event, encargo.key, 'encargos')">
        </div>
      </div>
    </section>
</template>

<script setup>
import { formatNumber } from '../utils/formatters.js';

const props = defineProps({
  modelValue: Object, // Usando v-model
  despesasConfig: Array,
  encargosConfig: Array
});

const emit = defineEmits(['update:modelValue']);

function updateField(key, value, category = null) {
  const newInputs = { ...props.modelValue };
  if (category) {
    newInputs[category][key] = value;
  } else {
    newInputs[key] = value;
  }
  emit('update:modelValue', newInputs);
}

function handleCurrencyInput(event, key, category = null) {
  let digits = event.target.value.replace(/\D/g, '');
  if (digits === '') digits = '0';
  const numberValue = Number(digits) / 100;
  updateField(key, formatNumber(numberValue), category);
}

function handlePercentInput(event, key, category = null) {
  let value = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
  if (value.indexOf('.') !== -1) {
    let parts = value.split('.');
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  updateField(key, value.replace('.', ','), category);
}
</script>

<style scoped>
/* Estilos específicos dos formulários */
.card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.card-title { font-size: 1.5rem; font-weight: 600; margin-top: 0; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }
.form-grid, .form-grid-3-cols { display: grid; gap: 1.5rem; }
.form-grid { grid-template-columns: 1fr 1fr; }
.form-grid-3-cols { grid-template-columns: repeat(3, 1fr); }
.form-group { display: flex; flex-direction: column; }
.form-group.span-2 { grid-column: 1 / -1; }
label { font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
input, select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--cor-borda);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: 'Poppins', sans-serif;
  transition: border-color 0.2s, box-shadow 0.2s;
  background-color: var(--cor-fundo);
  color: var(--cor-texto);
}
input[type="text"] { text-align: right; }
input:focus, select:focus { outline: none; border-color: var(--cor-primaria); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor-primaria) 20%, transparent); }

@media (max-width: 768px) {
  .form-grid, .form-grid-3-cols { grid-template-columns: 1fr; }
}
</style>