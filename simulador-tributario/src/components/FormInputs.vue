<template>
    <main class="card">
      <div class="card-header">
        <h2 class="card-title">{{ cardTitle }}</h2>
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
          <div class="form-group span-2">
            <label for="faturamentoAnual">Faturamento Anual Projetado</label>
            <input type="text" id="faturamentoAnual" :value="modelValue.faturamentoAnual" @input="handleCurrencyInput($event, 'faturamentoAnual')">
          </div>
        </template>

        <div class="form-group span-2">
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
        
        <template v-if="modelValue.anexoSimples === 'anexoI'">
            <div class="form-group span-2">
                <hr>
                <h3 class="subsection-title">Detalhamento do Faturamento (Anexo I)</h3>
            </div>
            <div class="form-group">
                <label for="faturamentoComercio">Faturamento Comércio (com ICMS)</label>
                <input
                    type="text"
                    id="faturamentoComercio"
                    :value="periodo === 'anual' ? modelValue.faturamentoComercio.anual : modelValue.faturamentoComercio.trimestral[activeTab]"
                    @input="handleAnexoIInput($event, 'faturamentoComercio')"
                >
            </div>
            <div class="form-group">
                <label for="faturamentoComercioST">Faturamento Comércio ST (sem ICMS)</label>
                <input
                    type="text"
                    id="faturamentoComercioST"
                    :value="periodo === 'anual' ? modelValue.faturamentoComercioST.anual : modelValue.faturamentoComercioST.trimestral[activeTab]"
                    @input="handleAnexoIInput($event, 'faturamentoComercioST')"
                >
            </div>
        </template>
      </div>
    </main>

    <section class="card">
      <h2 class="card-title">{{ despesasTitle }}</h2>

      <div v-if="periodo === 'trimestral'">
        <div class="tabs">
          <button v-for="i in 4" :key="i" @click="activeTab = `t${i}`" :class="{ 'active': activeTab === `t${i}` }">
            {{ i }}º Trimestre
          </button>
        </div>
        <div class="tab-content">
          <template v-for="trimestre in ['t1', 't2', 't3', 't4']" :key="trimestre">
            <div v-if="activeTab === trimestre" class="form-grid">
              <div class="form-group" v-for="despesa in despesasConfig" :key="despesa.key">
                <label :for="`${despesa.key}-${trimestre}`">{{ despesa.label }}</label>
                <input :id="`${despesa.key}-${trimestre}`" type="text" :value="modelValue.despesasTrimestrais[trimestre][despesa.key]" @input="handleCurrencyInput($event, despesa.key, 'despesasTrimestrais', trimestre)">
              </div>
            </div>
          </template>
        </div>
      </div>

      <div v-else class="form-grid">
        <div class="form-group" v-for="despesa in despesasConfig" :key="despesa.key">
          <label :for="despesa.key">{{ despesa.label }}</label>
          <input type="text" :id="despesa.key" :value="modelValue.despesasAnual[despesa.key]" @input="handleCurrencyInput($event, despesa.key, 'despesasAnual')">
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
import { ref, computed } from 'vue';
import { formatNumber, parseNumber } from '../utils/formatters.js';

const props = defineProps({
  modelValue: Object,
  periodo: String,
  despesasConfig: Array,
  encargosConfig: Array
});

const emit = defineEmits(['update:modelValue', 'update:periodo']);

const activeTab = ref('t1');

const cardTitle = computed(() => {
  return props.periodo === 'anual' ? 'Projeção Anual e Atividade' : 'Projeção Trimestral';
});

const despesasTitle = computed(() => {
  return props.periodo === 'anual' ? 'Gastos e Despesas Anuais' : 'Gastos e Despesas Trimestrais';
});

function togglePeriodo() {
  const newPeriodo = props.periodo === 'anual' ? 'trimestral' : 'anual';
  emit('update:periodo', newPeriodo);
}

function updateField(key, value, category = null, subCategory = null) {
  const newInputs = { ...props.modelValue };
  if (subCategory && newInputs[category]) {
    newInputs[category][subCategory][key] = value;
  } else if (category) {
    newInputs[category][key] = value;
  } else {
    newInputs[key] = value;
  }
  emit('update:modelValue', newInputs);
}

function handleCurrencyInput(event, key, category = null, subCategory = null) {
  let digits = event.target.value.replace(/\D/g, '');
  if (digits === '') digits = '0';
  const numberValue = Number(digits) / 100;
  updateField(key, formatNumber(numberValue), category, subCategory);
}

function handlePercentInput(event, key, category = null) {
  let value = event.target.value.replace(/[^0-9,]/g, '').replace(',', '.');
  if (value.indexOf('.') !== -1) {
    let parts = value.split('.');
    value = parts[0] + '.' + parts[1].slice(0, 2);
  }
  updateField(key, value.replace('.', ','), category);
}

function handleAnexoIInput(event, field) {
  const newInputs = { ...props.modelValue };
  let digits = event.target.value.replace(/\D/g, '');
  if (digits === '') digits = '0';
  const numberValue = Number(digits) / 100;
  const formattedValue = formatNumber(numberValue);

  if (props.periodo === 'anual') {
    newInputs[field].anual = formattedValue;
  } else {
    newInputs[field].trimestral[activeTab.value] = formattedValue;
  }

  // Atualiza o faturamento total automaticamente
  const comercioValue = props.periodo === 'anual' ? newInputs.faturamentoComercio.anual : newInputs.faturamentoComercio.trimestral[activeTab.value];
  const comercioSTValue = props.periodo === 'anual' ? newInputs.faturamentoComercioST.anual : newInputs.faturamentoComercioST.trimestral[activeTab.value];

  const total = parseNumber(comercioValue) + parseNumber(comercioSTValue);

  if (props.periodo === 'anual') {
      newInputs.faturamentoAnual = formatNumber(total);
  } else {
      newInputs.faturamentosTrimestrais[activeTab.value] = formatNumber(total);
  }


  emit('update:modelValue', newInputs);
}
</script>

<style scoped>
/* ESTILOS PARA ABAS (TABS) */
.tabs { display: flex; border-bottom: 1px solid var(--cor-borda); margin-bottom: 1.5rem; }
.tabs button { padding: 0.75rem 1.5rem; border: none; background-color: transparent; cursor: pointer; color: var(--cor-texto-suave); font-weight: 500; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s ease-in-out; }
.tabs button.active { color: var(--cor-primaria); border-bottom-color: var(--cor-primaria); }
.tabs button:hover { color: var(--cor-texto); }
.tab-content { padding-top: 1rem; }

/* --- ESTILOS ANTERIORES --- */
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--cor-borda); }
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

.subsection-title {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
    font-size: 1rem;
    color: var(--cor-primaria);
    font-weight: 600;
}
hr {
    border: none;
    border-top: 1px solid var(--cor-borda);
    margin: 1rem 0;
}

@media (max-width: 768px) {
  .form-grid, .form-grid-3-cols { grid-template-columns: 1fr; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
}
</style>