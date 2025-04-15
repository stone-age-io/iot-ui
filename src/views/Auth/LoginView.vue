<!-- src/views/Auth/LoginView.vue -->
<template>
  <div class="p-4 sm:p-6">
    <h2 :class="['text-xl font-semibold text-center mb-6', textColor.primary]">Login to your account</h2>
    
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Email Input -->
      <div class="space-y-2">
        <label for="identity" :class="['block text-sm font-medium', textColor.primary]">Email</label>
        <InputText
          id="identity"
          v-model="identity"
          type="email"
          autocomplete="email"
          class="w-full form-input"
          :class="{ 'p-invalid': v$.identity.$error }"
          aria-describedby="identity-error"
        />
        <small
          id="identity-error"
          :class="[
            'block px-2 py-1 rounded text-xs',
            isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          ]"
          v-if="v$.identity.$error"
        >
          {{ v$.identity.$errors[0].$message }}
        </small>
      </div>
      
      <!-- Password Input -->
      <div class="space-y-2">
        <div class="flex items-center justify-between flex-wrap">
          <label for="password" :class="['block text-sm font-medium', textColor.primary]">Password</label>
          <router-link 
            to="/auth/forgot-password" 
            :class="[
              'text-sm hover:underline',
              isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
            ]"
          >
            Forgot password?
          </router-link>
        </div>
        <Password
          id="password"
          v-model="password"
          :feedback="false"
          toggleMask
          inputClass="w-full form-input"
          class="w-full"
          :class="{ 'p-invalid': v$.password.$error }"
          aria-describedby="password-error"
        />
        <small
          id="password-error"
          :class="[
            'block px-2 py-1 rounded text-xs',
            isDarkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'
          ]"
          v-if="v$.password.$error"
        >
          {{ v$.password.$errors[0].$message }}
        </small>
      </div>
      
      <!-- Error Message -->
      <div 
        v-if="authStore.error"
        :class="[
          'p-3 rounded-md text-sm border',
          isDarkMode ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
        ]"
      >
        {{ authStore.error }}
      </div>
      
      <!-- Enhanced Submit Button -->
      <div class="pt-2">
        <button
          type="submit"
          :class="[
            'w-full rounded-md font-medium transition-all duration-200 transform py-3 text-white',
            'flex items-center justify-center',
            'shadow-md hover:shadow-lg active:shadow focus:outline-none focus:ring-2 focus:ring-offset-2',
            isDarkMode 
              ? 'bg-primary-500 hover:bg-primary-600 focus:ring-primary-400 focus:ring-offset-gray-800'
              : 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
            authStore.loading ? 'opacity-80 cursor-wait' : ''
          ]"
          :disabled="authStore.loading"
        >
          <span v-if="authStore.loading" class="flex items-center">
            <span class="mr-2 animate-spin">
              <i class="pi pi-spin pi-spinner"></i>
            </span>
            Signing in...
          </span>
          <span v-else>Sign in</span>
        </button>
      </div>
      
      <!-- Registration Link -->
      <div class="text-center text-sm">
        <span :class="textColor.secondary">Don't have an account?</span>
        <router-link 
          to="/auth/register"
          :class="[
            'ml-1 hover:underline',
            isDarkMode ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'
          ]"
        >
          Create one now
        </router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email as emailValidator, minLength } from '@vuelidate/validators'
import { useAuthStore } from '../../stores/auth'
import { useTheme } from '../../composables/useTheme'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'

// Theme composable for theme-aware styling
const { isDarkMode, textColor, backgroundColor, borderColor } = useTheme()

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

<style scoped>
/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-inputtext),
:deep(.dark .p-password input) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

.form-input {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-password-panel) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-password-panel) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

/* Add hover effect for button */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}
</style>
