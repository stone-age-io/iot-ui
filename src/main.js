// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import our unified CSS
import './assets/styles/index.css'

// PrimeVue
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import Tooltip from 'primevue/tooltip'

// Import NATS connection manager
import natsConnectionManager from './services/nats/natsConnectionManager'

// Import stores
import { useTypesStore } from './stores/types'
import { useThemeStore } from './stores/theme'
import { setupPrimeVueTheme } from './utils/primeThemeHandler'
import { watch } from 'vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Initialize theme before mounting
const themeStore = useThemeStore()
setupPrimeVueTheme(themeStore.theme)

// Watch for theme changes to update PrimeVue theme
watch(() => themeStore.theme, (newTheme) => {
  setupPrimeVueTheme(newTheme)
})

// Initialize NATS connection manager
natsConnectionManager.initialize()

// Setup the rest of the app
app.use(router)
app.use(PrimeVue, { ripple: true })
app.use(ConfirmationService)
app.use(ToastService)
app.directive('tooltip', Tooltip)

// Initialize type store after Pinia is installed
const initializeStores = () => {
  const typesStore = useTypesStore()
  // Preload type data that's used across the app
  typesStore.loadAllTypes()
}

// Add navigation guard to check if user is logged in
// and initialize NATS connection
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && localStorage.getItem('token')) {
    // User is logged in, attempt to connect NATS if auto-connect is enabled
    natsConnectionManager.attemptAutoConnect()
    
    // Initialize stores if not already done
    initializeStores()
  }
  next()
})

// Mount the app
app.mount('#app')
