<template>
  <q-page class="flex flex-center">
    <q-card
      flat
      class="my-card text-center"
    >
      <q-card-section>
        <span class="text-h5 text-blue-grey-8 q-pl-xs">
          PÁGINA DE PRUEBA
        </span>
      </q-card-section>
      <q-card-section
        class="q-pt-none"
        style="height: 250px;"
      >
        <CebraAnimada />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'boot/axios'
import CebraAnimada from 'components/CebraAnimada.vue'

export default defineComponent({
  name: 'IndexPage',
  components: {
    CebraAnimada
  },

  setup () {
    const $q = useQuasar()

    onMounted(async () => {
      try {
        await api.get('/hubspot/health')
        $q.notify({
          color: 'teal',
          textColor: 'white',
          icon: 'check_circle',
          message: 'Bienvenido!'
        })
      } catch (error) {
        $q.notify({
          color: 'red',
          textColor: 'white',
          icon: 'do_not_disturb_on',
          message: 'Error al conectar con servidor!'
        })
      }
    })

    return {}
  }
})
</script>
