<template>
    <div class="toast" :class="{ 'show': show }">
      {{ message }}
    </div>
</template>

<script setup>
defineProps({
    show: Boolean,
    message: String
});
</script>

<style scoped>
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translate(-50%, 100px); /* Começa fora da tela */
  background-color: #333;
  color: white;
  padding: 12px 24px;
  border-radius: 25px;
  z-index: 1000;
  opacity: 0;
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}

.toast.show {
  transform: translate(-50%, 0); /* Entra na tela */
  opacity: 1;
}
</style>