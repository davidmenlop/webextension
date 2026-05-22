<template>
  <q-page class="flex flex-center">
    <q-card
      flat
      bordered
      class="my-card text-center"
    >
      <q-card-section>
        <span class="text-h5 text-blue-grey-8 q-pl-xs text-uppercase">
          Iniciar sesión
        </span>
      </q-card-section>

      <q-separator inset />

      <q-form
        @submit="onSubmit"
        @reset="() =>({})"
      >
        <q-card-section>
          <q-input
            v-model="formData.username"
            outlined
            label="Usuario"
            :rules="[ val => val && val.length > 0 || 'Porfavor ingrese su usuario' ]"
          />
          <q-input
            v-model="formData.password"
            label="Contraseña"
            outlined
            :type="isPwd ? 'password' : 'text'"
            :rules="[ val => val && val.length > 0 || 'Porfavor ingrese su contraseña' ]"
          >
            <template #append>
              <q-icon
                :name="isPwd ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="isPwd = !isPwd"
              />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions>
          <q-btn
            unelevated
            type="submit"
            color="primary"
            label="Iniciar sesión"
            class="full-width"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-page>
</template>

<script>
import { defineComponent, ref } from 'vue'
import { api } from 'boot/axios'
import { useQuasar } from 'quasar'

export default defineComponent({
  name: 'IndexPage',
  components: {
  },

  setup () {
    const $q = useQuasar()

    const formData = ref({
      username: '',
      password: ''
    })

    const onSubmit = async () => {
      try {
        await api.post('/auth/login_queues', formData.value)
        window.location.href = `${process.env.HTTP_API}/queues`
      } catch (error) {
        $q.notify({
          color: 'red',
          textColor: 'white',
          icon: 'do_not_disturb_on',
          message: 'Error al iniciar sesión!'
        })
      }
    }

    return {
      formData,
      isPwd: ref(true),

      onSubmit
    }
  }
})
</script>
