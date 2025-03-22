// Updated src/stores/auth.js
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { ref, computed } from 'vue'
import apiService from '../services/api'
import router from '../router'

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Initialize user from stored token
  if (token.value) {
    try {
      const decoded = jwtDecode(token.value)
      user.value = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name
      }
    } catch (err) {
      // Invalid token
      token.value = ''
      localStorage.removeItem('token')
    }
  }

  // Getters
  const isAuthenticated = computed(() => !!token.value)
  const userFullName = computed(() => user.value?.name || 'User')
  const userInitials = computed(() => {
    if (!user.value?.name) return 'U'
    return user.value.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  })

  // Actions
  async function login(credentials) {
    loading.value = true
    error.value = null
    
    try {
      // Call the login endpoint - now using /api/auth/login
      const response = await apiService.post('/pb/api/collections/_superusers/auth-with-password', credentials)
      
      // Store the token and user info
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      
      // Decode the JWT token to get user information
      try {
        const decoded = jwtDecode(token.value)
        user.value = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name || decoded.email
        }
      } catch (err) {
        console.warn('Error decoding token, using response data instead', err)
        // Fallback to response data if token cannot be decoded
        user.value = {
          id: response.data.user?.id,
          email: response.data.user?.email,
          name: response.data.user?.name || response.data.user?.email
        }
      }
      
      // Set the authorization header for future requests
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // Redirect to dashboard or the original requested page
      const redirectPath = router.currentRoute.value.query.redirect || '/'
      router.push(redirectPath)
      
      return true
    } catch (err) {
      console.error('Login error:', err)
      error.value = err.response?.data?.message || 'Login failed. Please check your credentials.'
      return false
    } finally {
      loading.value = false
    }
  }

  function logout() {
    // Clear token and user
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    
    // Remove authorization header
    delete apiService.defaults.headers.common['Authorization']
    
    // Redirect to login
    router.push({ name: 'login' })
  }

  // Check if token is expired
  function isTokenExpired() {
    if (!token.value) return true
    
    try {
      const decoded = jwtDecode(token.value)
      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch {
      return true
    }
  }

  // Check and refresh token if needed
  async function checkToken() {
    if (isTokenExpired()) {
      // For this simple implementation, just log out if token is expired
      // In a more complex system, you might implement token refresh here
      logout()
      return false
    }
    return true
  }

  return {
    // State
    token,
    user,
    loading,
    error,
    
    // Getters
    isAuthenticated,
    userFullName,
    userInitials,
    
    // Actions
    login,
    logout,
    checkToken
  }
})
