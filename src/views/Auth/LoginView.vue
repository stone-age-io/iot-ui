<!-- src/views/Auth/LoginView.vue -->
<template>
  <div class="p-4 sm:p-6">
    <h2 class="text-xl font-semibold text-center mb-6">Login to your account</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Email Input -->
      <div class="space-y-2">
        <label for="identity" class="block text-sm font-medium text-gray-700">Email</label>
        <InputText
          id="identity"
          v-model="identity"
          type="email"
          autocomplete="email"
          class="w-full"
          :class="{ 'p-invalid': v$.identity.$error }"
          aria-describedby="identity-error"
        />
        <small
          id="identity-error"
          class="p-error block"
          v-if="v$.identity.$error"
        >
          {{ v$.identity.$errors[0].$message }}
        </small>
      </div>
      
      <!-- Password Input -->
      <div class="space-y-2">
        <div class="flex items-center justify-between flex-wrap">
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <a href="#" class="text-sm text-primary-600 hover:text-primary-500">Forgot password?</a>
        </div>
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggleMask
          inputClass="w-full"
          class="w-full"
          :class="{ 'p-invalid': v$.password.$error }"
          aria-describedby="password-error"
        />
        <small
          id="password-error"
          class="p-error block"
          v-if="v$.password.$error"
        >
          {{ v$.password.$errors[0].$message }}
        </small>
      </div>
      
      <!-- Error Message -->
      <div v-if="authStore.error" class="bg-red-50 text-red-700 p-3 rounded-md text-sm">
        {{ authStore.error }}
      </div>
      
      <!-- Submit Button -->
      <div>
        <Button
          type="submit"
          label="Sign in"
          class="w-full"
          :loading="authStore.loading"
        />
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email as emailValidator, minLength } from '@vuelidate/validators'
import { useAuthStore } from '../../stores/auth'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'

// Form state
const identity = ref('')
const password = ref('')

// Validation rules
const rules = {
  identity: { required, email: emailValidator },
  password: { required, minLength: minLength(6) }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, { identity, password })

// Auth store
const authStore = useAuthStore()

// Submit handler
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Attempt login
  await authStore.login({
    identity: identity.value,
    password: password.value
  })
}
</script>
