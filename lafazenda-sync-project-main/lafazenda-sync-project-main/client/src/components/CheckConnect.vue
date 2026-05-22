<template>
  <q-card
    flat
    class="my-card text-center"
  >
    <q-card-section class="q-pt-none">
      <svg
        class="ft-green-tick"
        xmlns="http://www.w3.org/2000/svg"
        height="100"
        width="100"
        viewBox="0 0 48 48"
        aria-hidden="true"
      >
        <circle
          class="circle"
          fill="#5bb543"
          cx="24"
          cy="24"
          r="22"
        />
        <path
          class="tick"
          fill="none"
          stroke="#FFF"
          stroke-width="6"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-miterlimit="10"
          d="M14 27l5.917 4.917L34 17"
        />
      </svg>
    </q-card-section>

    <q-card-section>
      <span class="text-h5 text-blue-grey-8 q-pl-xs">
        ¡GENIAL!
      </span>
      <br>
      <span class="text-subtitle1 text-blue-grey-8 q-pl-xs">
        APLICACIÓN CONECTADA SATISFACTORIAMENTE
      </span>
      <br>
      <span class="text-subtitle1 text-blue-grey-8 q-pl-xs">
        Redirigiendo a Hubspot...
      </span>
    </q-card-section>
  </q-card>
</template>

<script>
export default {
  setup () {
    return {}
  }
}
</script>

<style lang="scss" scoped>

@supports (animation: grow .5s cubic-bezier(.25, .25, .25, 1) forwards) {
     .tick {
        stroke-opacity: 0;
        stroke-dasharray: 29px;
        stroke-dashoffset: 29px;
        animation: draw .5s cubic-bezier(.25, .25, .25, 1) forwards;
        animation-delay: .6s
    }

    .circle {
        fill-opacity: 0;
        stroke: #219a00;
        stroke-width: 16px;
        transform-origin: center;
        transform: scale(0);
        animation: grow 1s cubic-bezier(.25, .25, .25, 1.25) forwards;
    }
}

@keyframes grow {
    60% {
        transform: scale(.8);
        stroke-width: 4px;
        fill-opacity: 0;
    }
    100% {
        transform: scale(.9);
        stroke-width: 8px;
        fill-opacity: 1;
        fill: #219a00;
    }
}

@keyframes draw {
    0%, 100% { stroke-opacity: 1; }
    100% { stroke-dashoffset: 0; }
}

</style>
