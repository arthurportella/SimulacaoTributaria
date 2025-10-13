// .eslintrc.js
module.exports = {
  root: true,
  env: {
    node: true,
    'vue/setup-compiler-macros': true // Linha essencial para habilitar os macros
  },
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended'
  ],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/multi-word-component-names': 'off' // Desabilita regra de nomes de componentes
  },
  // Seção extra para garantir o reconhecimento (opcional se a linha 'env' funcionar)
  globals: {
    defineProps: 'readonly',
    defineEmits: 'readonly',
    defineExpose: 'readonly',
    withDefaults: 'readonly'
  }
};