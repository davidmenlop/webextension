<template>
  <div class="progress-bar_up">
    <span class="text-subtitle2 text-blue-grey-8 q-pl-xs">CONECTANDO APLICACION...</span>
    <div class="progress-bar">
      <div class="progress" />
    </div>
  </div>
</template>

<script>
export default {
  setup () {
    return {}
  }
}
</script>

<style lang="scss">
.progress-bar_up{
  width: 80%;
  max-width: 400px;
  height: 20px;
}

.loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
}

.progress-bar {
    width: 100%;
    max-width: 400px;
    height: 20px;
    background-color: #e0e0e0;
    border-radius: 10px;
    overflow: hidden;
}

.progress {
    width: 0;
    height: 100%;
    background-color: #FF5C35;
    animation: fill 6s infinite;
}

@keyframes fill {
    0% {
        width: 0;
    }
    100% {
        width: 100%;
    }
}
</style>
