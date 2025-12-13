# 📊 Simulador de Planejamento Tributário

![Badge em Desenvolvimento](http://img.shields.io/static/v1?label=STATUS&message=EM%20DESENVOLVIMENTO&color=GREEN&style=for-the-badge)
![Vue.js](https://img.shields.io/badge/Vue.js-35495E?style=for-the-badge&logo=vuedotjs&logoColor=4FC08D)
![Firebase](https://img.shields.io/badge/Firebase-039BE5?style=for-the-badge&logo=Firebase&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-F5788d?style=for-the-badge&logo=chart.js&logoColor=white)

> Uma ferramenta poderosa e intuitiva para auxiliar contadores e empresários na tomada de decisões fiscais, comparando regimes tributários e projetando cenários reais.

---

## 🚀 Sobre o Projeto

O **Simulador Tributário** é uma aplicação web Full-stack desenvolvida para simplificar a complexidade do sistema tributário brasileiro.

Através de uma interface moderna e responsiva, o usuário insere dados de faturamento e despesas, e o sistema calcula automaticamente as alíquotas efetivas e impostos a pagar em diferentes cenários (Simples Nacional, Lucro Presumido, etc.), permitindo identificar a opção mais econômica.

### ✨ Funcionalidades Principais

* **Autenticação Robusta:**
    * Login social com **Google** (1 clique).
    * Cadastro tradicional via E-mail/Senha com validação.
    * Recuperação de sessão persistente.
* **Simulação de Cenários:**
    * Cálculos automáticos baseados nos Anexos do Simples Nacional.
    * Análise de Fator R (Folha de Pagamento vs Faturamento).
    * Comparativo visual entre regimes.
* **Gestão de Histórico (Cloud & Local):**
    * **Modo Online:** Salva simulações no **Firestore** (Nuvem) vinculadas ao usuário.
    * **Modo Offline:** Salva no LocalStorage do navegador para visitantes não logados.
    * Edição inteligente: Permite carregar, alterar e atualizar simulações existentes.
* **Relatórios Profissionais:**
    * Geração de **PDF** detalhado com tabelas e resumo executivo pronto para impressão.
* **Visualização de Dados:**
    * Gráficos interativos (Pizza e Barras) usando `Chart.js`.
* **UX/UI Moderna:**
    * **Dark Mode** (Tema Escuro) nativo.
    * Máscaras de input automáticas (Moeda, Telefone, CPF/CNPJ).
    * Design responsivo (Mobile-first).

---

📂 Estrutura de Pastas
src/
├── components/        # Componentes Vue reutilizáveis (Header, Modal, Gráficos)
├── composables/       # Lógica reativa (Hooks) - useAuth, useTributos, useTheme
├── firebase/          # Configuração e inicialização do Firebase
├── utils/             # Funções utilitárias (Formatadores de moeda, máscaras)
├── App.vue            # Componente Raiz
└── main.js            # Ponto de entrada

---
## 🛠️ Tecnologias Utilizadas

O projeto foi desenvolvido utilizando as melhores práticas do ecossistema Vue.js:

* **Frontend:** [Vue.js 3](https://vuejs.org/) (Composition API)
* **Estilização:** CSS Variables (Temas Dinâmicos)
* **BaaS (Backend as a Service):** [Firebase](https://firebase.google.com/)
    * *Authentication* (Gestão de usuários)
    * *Firestore Database* (Banco de dados NoSQL em tempo real)
* **Gráficos:** [Chart.js](https://www.chartjs.org/) + `vue-chartjs`
* **PDF:** `jspdf` + `jspdf-autotable`
* **Build Tool:** Vue CLI / Webpack

---

<div align="center">
  <sub>Desenvolvido por <a href="https://github.com/arthurportella" target="_blank">Arthur Portella</a>.</sub>
</div>
