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

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, { ripple: true })
app.use(ConfirmationService)
app.use(ToastService)

app.directive('tooltip', Tooltip);

// Initialize NATS connection manager
natsConnectionManager.initialize()

// Add navigation guard to check if user is logged in
// and initialize NATS connection
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && localStorage.getItem('token')) {
    // User is logged in, attempt to connect NATS if auto-connect is enabled
    natsConnectionManager.attemptAutoConnect()
  }
  next()
})

app.mount('#app')
