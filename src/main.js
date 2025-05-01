// src/main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// Import CSS - simplified to just one main import
import './assets/styles/index.css' 
import './assets/styles/primevue-theme.css'

// PrimeVue core
import PrimeVue from 'primevue/config'
// Import services individually for better tree-shaking
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import DialogService from 'primevue/dialogservice'

// PrimeVue styles
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
// Import PrimeVue theme CSS directly
import 'primevue/resources/themes/lara-light-blue/theme.css'

// Individual component import
import Tooltip from 'primevue/tooltip'

// Import NATS connection manager
import natsConnectionManager from './services/nats/natsConnectionManager'

// Import stores
import { useAuthStore } from './stores/auth'
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
// Use PrimeVue with minimal configuration
app.use(PrimeVue, { 
  ripple: true
})
// Add services individually
app.use(ConfirmationService)
app.use(ToastService)
app.use(DialogService)

// Track if stores have been initialized
let storesInitialized = false

// Function to preload essential application data
const preloadAppData = async () => {
  if (storesInitialized) {
    console.log('Stores already initialized, skipping preload')
    return
  }
  
  try {
    console.log('Preloading application data...')
    
    // Initialize stores
    const typesStore = useTypesStore()
    
    // Load all type collections for form dropdowns
    await typesStore.loadAllTypes()
    
    console.log('Application data preloaded successfully')
    storesInitialized = true
  } catch (error) {
    console.warn('Error during data preloading:', error)
    // Continue even if preloading fails to avoid blocking the user
  }
}

// Add navigation guard to check auth, initialize stores, and manage NATS
router.beforeEach(async (to, from, next) => {
  // Initialize the auth store
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  // For auth routes when user is authenticated
  if (requiresAuth && authStore.isAuthenticated) {
    // Check token validity
    const isValid = await authStore.checkToken()
    
    if (!isValid) {
      // Token is invalid, redirect to login
      next({ name: 'login', query: { redirect: to.fullPath } })
      return
    }
    
    // Token is valid, preload if needed
    await preloadAppData()
    
    // Only attempt NATS auto-connect once per session - on initial login navigation
    if (from.name === 'login' && to.name === 'dashboard') {
      console.log('Initial login navigation detected, attempting NATS auto-connect')
      // This is the initial login navigation, attempt to connect NATS
      natsConnectionManager.attemptAutoConnect()
    }
    
    // Continue navigation
    next()
    return
  }
  
  // If route requires auth but user isn't authenticated
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }
  
  // For all other routes, just proceed
  next()
})

// Set document title based on route meta
router.afterEach((to) => {
  // Update document title
  document.title = to.meta.title 
    ? `${to.meta.title} | Stone-Age.io` 
    : 'IoT Platform'
})

// Mount the app
app.mount('#app')
