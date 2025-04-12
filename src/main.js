// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import './assets/responsive-utilities.css' // Import responsive utilities

// PrimeVue
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import 'primevue/resources/themes/lara-light-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'
import Tooltip from 'primevue/tooltip';

// Import NATS connection manager
import natsConnectionManager from './services/nats/natsConnectionManager'

// Import type store
import { useTypesStore } from './stores/types'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(PrimeVue, { ripple: true })
app.use(ConfirmationService)
app.use(ToastService)

app.directive('tooltip', Tooltip);

// Initialize NATS connection manager
natsConnectionManager.initialize()

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

app.mount('#app')
