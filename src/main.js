// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import CSS in the correct order
import './assets/styles/theme-variables.css'     // Theme variables first
import './assets/styles/index.css'              // Main CSS
import './assets/styles/primevue-components.css' // PrimeVue components styling
import './assets/styles/dark-mode.css'          // Additional dark mode overrides
import './assets/responsive-utilities.css'       // Responsive utilities

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

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Register global directives
app.directive('tooltip', Tooltip)
app.directive('click-outside', {
  mounted(el, binding) {
    el._clickOutside = (event) => {
      if (!(el === event.target || el.contains(event.target))) {
        binding.value(event);
      }
    };
    document.addEventListener('click', el._clickOutside);
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutside);
  }
})

// Initialize theme before mounting
const themeStore = useThemeStore()

// Initialize the theme system
themeStore.init()

// Initialize NATS connection manager once at startup
natsConnectionManager.initialize()

// Setup the rest of the app
app.use(router)
app.use(PrimeVue, { 
  ripple: true,
  // Initialize PrimeVue with custom style for the Menu component
  pt: {
    menu: {
      root: {
        style: 'z-index: 99999'
      }
    }
  }
})
app.use(ConfirmationService)
app.use(ToastService)

// Track if stores have been initialized
let storesInitialized = false

// Initialize type store (only once)
const initializeStores = () => {
  if (storesInitialized) {
    console.log('Stores already initialized, skipping')
    return
  }
  
  console.log('Initializing application stores')
  const typesStore = useTypesStore()
  // Preload type data that's used across the app
  typesStore.loadAllTypes()
  storesInitialized = true
}

// Add navigation guard to check if user is logged in
// and initialize NATS connection
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && localStorage.getItem('token')) {
    // User is logged in
    
    // Initialize stores if not already done
    if (!storesInitialized) {
      initializeStores()
    }
    
    // Only attempt NATS auto-connect once per session
    if (from.name === 'login' && to.name === 'dashboard') {
      console.log('Initial login navigation detected, attempting NATS auto-connect')
      // This is the initial login navigation, attempt to connect NATS
      natsConnectionManager.attemptAutoConnect()
    }
  }
  next()
})

// Mount the app
app.mount('#app')
