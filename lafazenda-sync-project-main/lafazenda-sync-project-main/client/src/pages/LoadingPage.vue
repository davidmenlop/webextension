<template>
  <q-page class="flex flex-center">
    <LoadingConnect v-if="loading" />
    <CheckConnect v-else />
  </q-page>
</template>

<script>
import { defineComponent, onMounted, ref } from 'vue'
import LoadingConnect from 'components/LoadingConnect.vue'
import CheckConnect from 'components/CheckConnect.vue'

export default defineComponent({
  name: 'LoadingPage',
  components: {
    LoadingConnect,
    CheckConnect
  },

  setup () {
    const loading = ref(true)

    onMounted(() => {
      setTimeout(() => {
        loading.value = false
        setTimeout(() => {
          window.location.href = 'https://app.hubspot.com/login'
        }, 3000)
      }, 6000)
    })

    return {
      loading
    }
  }
})
</script>
