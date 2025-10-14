<template>
    <main class="card">
      <div class="card-header">
        <h2 class="card-title">Projeção</h2>
        <div class="period-switcher">
          <span>Anual</span>
          <label class="switch">
            <input type="checkbox" :checked="periodo === 'trimestral'" @change="togglePeriodo">
            <span class="slider round"></span>
          </label>
          <span>Trimestral</span>
        </div>
      </div>

      <div class="form-grid">
        <template v-if="periodo === 'trimestral'">
          <div class="form-group">
            <label for="faturamentoT1">1º Trimestre</label>
            <input type="text" id="faturamentoT1" :value="modelValue.faturamentosTrimestrais.t1" @input="handleCurrencyInput($event, 't1', 'faturamentosTrimestrais')">
          </div>
          <div class="form-group">
            <label for="faturamentoT2">2º Trimestre</label>
            <input type="text" id="faturamentoT2" :value="modelValue.faturamentosTrimestrais.t2" @input="handleCurrencyInput($event, 't2', 'faturamentosTrimestrais')">
          </div>
          <div class="form-group">
            <label for="faturamentoT3">3º Trimestre</label>
            <input type="text" id="faturamentoT3" :value="modelValue.faturamentosTrimestrais.t3" @input="handleCurrencyInput($event, 't3', 'faturamentosTrimestrais')">
          </div>
          <div class="form-group">
            <label for="faturamentoT4">4º Trimestre</label>
            <input type="text" id="faturamentoT4" :value="modelValue.faturamentosTrimestrais.t4" @input="handleCurrencyInput($event, 't4', 'faturamentosTrimestrais')">
          </div>
        </template>
        
        <template v-else>
          <div class="form-group">
            <label for="faturamentoAnual">Faturamento Anual Projetado</label>
            <input type="text" id="faturamentoAnual" :value="modelValue.faturamentoAnual" @input="handleCurrencyInput($event, 'faturamentoAnual')">
          </div>
        </template>

        <div class="form-group" :class="{ 'span-2': periodo === 'anual' }">
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
      <h2 class="card-title">{{ despesasTitle }}</h2>
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
import { computed } from 'vue';
import { formatNumber } from '../utils/formatters.js';

const props = defineProps({
  modelValue: Object,
  periodo: String,
  despesasConfig: Array,
  encargosConfig: Array
});

const emit = defineEmits(['update:modelValue', 'update:periodo']);

const despesasTitle = computed(() => {
  return 'Gastos e Despesas Anuais';
});

function togglePeriodo() {
  const newPeriodo = props.periodo === 'anual' ? 'trimestral' : 'anual';
  emit('update:periodo', newPeriodo);
}

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
/* ESTILOS (sem alterações) */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--cor-borda);
}
.card-title { margin: 0; padding: 0; border: none; }
.period-switcher { display: flex; align-items: center; gap: 0.75rem; font-size: 0.9rem; font-weight: 500; color: var(--cor-texto-suave); }
.switch { position: relative; display: inline-block; width: 50px; height: 26px; }
.switch input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; }
.slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 4px; bottom: 4px; background-color: white; transition: .4s; }
input:checked + .slider { background-color: var(--cor-primaria); }
input:checked + .slider:before { transform: translateX(24px); }
.slider.round { border-radius: 26px; }
.slider.round:before { border-radius: 50%; }
.card { background-color: var(--cor-card); padding: 2rem; border-radius: var(--raio-borda); box-shadow: var(--sombra-card); margin-bottom: 2rem; }
.form-grid, .form-grid-3-cols { display: grid; gap: 1.5rem; }
.form-grid { grid-template-columns: 1fr 1fr; }
.form-grid-3-cols { grid-template-columns: repeat(3, 1fr); }
.form-group { display: flex; flex-direction: column; }
.form-group.span-2 { grid-column: 1 / -1; }
label { font-weight: 600; margin-bottom: 0.5rem; font-size: 0.875rem; }
input, select { width: 100%; padding: 0.75rem; border: 1px solid var(--cor-borda); border-radius: 0.5rem; font-size: 1rem; font-family: 'Poppins', sans-serif; transition: border-color 0.2s, box-shadow 0.2s; background-color: var(--cor-fundo); color: var(--cor-texto); }
input[type="text"] { text-align: right; }
input:focus, select:focus { outline: none; border-color: var(--cor-primaria); box-shadow: 0 0 0 3px color-mix(in srgb, var(--cor-primaria) 20%, transparent); }

@media (max-width: 768px) {
  .form-grid, .form-grid-3-cols { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>