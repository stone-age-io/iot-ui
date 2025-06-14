// src/stores/auth.js
import { defineStore } from 'pinia'
import { jwtDecode } from 'jwt-decode'
import { ref, computed } from 'vue'
import apiService from '../services/api'
import router from '../router'
import configService from '../services/config/configService'
import { useTypesStore } from './types'
import { useOrganizationStore } from './organization'
import { clearUserCache } from '../utils/cacheUtils'
import { userService } from '../services/user/userService'
import { organizationService } from '../services/organization/organizationService'

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
        name: decoded.name,
        org_roles: decoded.org_roles || {},
        current_organization_id: decoded.current_organization_id || ''
      }
      
      // Store user data in localStorage for cache segmentation
      localStorage.setItem('auth', JSON.stringify({ 
        user: user.value,
        currentOrgId: user.value.current_organization_id || ''
      }))
      
      // Initialize organization data if we have a current_organization_id
      if (user.value.current_organization_id) {
        // Dispatch an async function to load the organization
        // We use setTimeout to avoid blocking and potential circular dependencies
        setTimeout(async () => {
          try {
            const organizationStore = useOrganizationStore()
            const orgResponse = await organizationService.getById(user.value.current_organization_id)
            if (orgResponse && orgResponse.data) {
              organizationStore.setCurrentOrganization(orgResponse.data)
              console.log('Loaded organization on init:', orgResponse.data.code)
            }
          } catch (err) {
            console.error('Error loading organization on init:', err)
          }
        }, 0)
      }
    } catch (err) {
      // Invalid token
      token.value = ''
      localStorage.removeItem('token')
      localStorage.removeItem('auth')
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
      // Use ConfigService to build the login endpoint with expand parameters
      const loginEndpoint = configService.getAuthEndpoint(configService.endpoints.AUTH.LOGIN)
      const queryParams = new URLSearchParams({
        expand: 'organizations,current_organization_id'
      }).toString()
      
      // Login with expand parameters using ConfigService
      const response = await apiService.post(`${loginEndpoint}?${queryParams}`, credentials)
      
      // Store the token and user info
      token.value = response.data.token
      localStorage.setItem('token', token.value)
      
      // Decode the JWT token to get user information
      try {
        const decoded = jwtDecode(token.value)
        user.value = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name || decoded.email,
          org_roles: decoded.org_roles || {},
          current_organization_id: decoded.current_organization_id || ''
        }
        
        // Initialize organization store
        const organizationStore = useOrganizationStore()
        
        // Get organization data from the expanded response
        let currentOrg = null
        if (response.data.record?.expand?.current_organization_id) {
          // Direct from response's expanded data
          currentOrg = response.data.record.expand.current_organization_id
          console.log('Found expanded organization:', currentOrg);
        } else if (response.data.record?.current_organization_id) {
          // Try to fetch organization separately if it wasn't expanded
          try {
            const orgResponse = await organizationService.getById(response.data.record.current_organization_id)
            if (orgResponse && orgResponse.data) {
              currentOrg = orgResponse.data
              console.log('Fetched organization by ID:', currentOrg);
            }
          } catch (orgErr) {
            console.warn('Error fetching current organization:', orgErr)
          }
        }
        
        // Set current organization if available
        if (currentOrg) {
          organizationStore.setCurrentOrganization(currentOrg)
          console.log('Set current organization in store:', currentOrg.code);
        } else {
          console.warn('No current organization found for user');
        }
        
        // Set user organizations if available
        if (response.data.record?.expand?.organizations) {
          organizationStore.setUserOrganizations(response.data.record.expand.organizations)
          console.log('Set user organizations from expand:', response.data.record.expand.organizations.length);
        } else if (response.data.record?.organizations) {
          // Try to fetch organizations if they weren't expanded
          try {
            const userResponse = await userService.getCurrentUser()
            if (userResponse?.data?.organizations) {
              organizationStore.setUserOrganizations(userResponse.data.organizations)
              console.log('Set user organizations from getCurrentUser:', userResponse.data.organizations.length);
            }
          } catch (userErr) {
            console.warn('Error fetching user organizations:', userErr)
          }
        }
        
        // Store user data in localStorage for cache segmentation
        localStorage.setItem('auth', JSON.stringify({ 
          user: user.value,
          currentOrgId: user.value.current_organization_id
        }))
      } catch (err) {
        console.warn('Error decoding token or processing user data:', err)
        // Fallback to response data if token cannot be decoded
        user.value = {
          id: response.data.record?.id,
          email: response.data.record?.email,
          name: response.data.record?.name || response.data.record?.email,
          org_roles: response.data.record?.org_roles || {},
          current_organization_id: response.data.record?.current_organization_id || ''
        }
        
        // Still try to initialize organization data
        const organizationStore = useOrganizationStore()
        
        // Attempt to set organization data
        if (response.data.record?.expand?.current_organization_id) {
          organizationStore.setCurrentOrganization(response.data.record.expand.current_organization_id)
        }
        
        if (response.data.record?.expand?.organizations) {
          organizationStore.setUserOrganizations(response.data.record.expand.organizations)
        }
        
        // Store user data in localStorage even in fallback case
        localStorage.setItem('auth', JSON.stringify({ 
          user: user.value,
          currentOrgId: user.value.current_organization_id
        }))
      }
      
      // Set the authorization header for future requests
      apiService.defaults.headers.common['Authorization'] = `Bearer ${token.value}`
      
      // Preload essential data for better user experience
      await preloadEssentialData()
      
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
    // Clear user-scoped cache before removing user data
    if (user.value?.id) {
      clearUserCache(user.value.id)
    }
    
    // Clear token and user
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('auth')
    localStorage.removeItem('currentOrganization')
    localStorage.removeItem('userOrganizations')
    
    // Reset organization store
    const organizationStore = useOrganizationStore()
    organizationStore.setCurrentOrganization(null)
    organizationStore.setUserOrganizations([])
    
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
    
    // Ensure we still have the user data and auth info properly synchronized
    try {
      // If user data is missing but token exists, try to decode token again
      if (!user.value && token.value) {
        const decoded = jwtDecode(token.value);
        user.value = {
          id: decoded.id || decoded.sub,
          email: decoded.email,
          name: decoded.name || decoded.email,
          org_roles: decoded.org_roles || {},
          current_organization_id: decoded.current_organization_id || ''
        };
        
        // Re-store auth data to ensure it's consistent
        localStorage.setItem('auth', JSON.stringify({ 
          user: user.value,
          currentOrgId: user.value.current_organization_id
        }));
      }
    } catch (err) {
      console.warn('Error during token check:', err);
    }
    
    return true
  }

  // Update user information
  function updateUser(userData) {
    if (!userData) return
    
    // Track if current_organization_id changed
    const orgIdChanged = userData.current_organization_id && 
                         userData.current_organization_id !== user.value?.current_organization_id;
    
    user.value = {
      ...user.value,
      ...userData
    }
    
    // Update stored user data for cache segmentation
    localStorage.setItem('auth', JSON.stringify({ 
      user: user.value,
      currentOrgId: user.value.current_organization_id
    }))
    
    // If the organization ID changed, update the organization store
    if (orgIdChanged) {
      setTimeout(async () => {
        try {
          const organizationStore = useOrganizationStore()
          const orgResponse = await organizationService.getById(user.value.current_organization_id)
          if (orgResponse && orgResponse.data) {
            organizationStore.setCurrentOrganization(orgResponse.data)
            console.log('Updated organization after user update:', orgResponse.data.code)
          }
        } catch (err) {
          console.error('Error updating organization after user update:', err)
        }
      }, 0)
    }
  }
  
  // Refresh user data from server
  async function refreshUserData() {
    try {
      const response = await userService.getCurrentUser()
      
      if (response && response.data) {
        // Capture old organization ID for comparison
        const oldOrgId = user.value?.current_organization_id;
        
        // Update user data
        user.value = {
          ...user.value,
          ...response.data,
          org_roles: response.data.org_roles || {}
        }
        
        // Initialize organization store
        const organizationStore = useOrganizationStore()
        
        // Set current organization if available from expanded data
        if (response.data.organization) {
          organizationStore.setCurrentOrganization(response.data.organization)
          console.log('Set organization from refreshUserData expanded data:', response.data.organization.code)
        } else if (response.data.current_organization_id && 
                  (response.data.current_organization_id !== oldOrgId || !organizationStore.currentOrganization)) {
          // If organization object not included, try to fetch it
          try {
            // First check if it's in the user's organizations
            let org = organizationStore.findOrganizationById(response.data.current_organization_id)
            
            // If not found locally, try to fetch it
            if (!org) {
              const orgResponse = await organizationService.getById(response.data.current_organization_id)
              if (orgResponse && orgResponse.data) {
                org = orgResponse.data
              }
            }
            
            // Set the organization if found
            if (org) {
              organizationStore.setCurrentOrganization(org)
              console.log('Set organization from refreshUserData fetch:', org.code)
            }
          } catch (orgErr) {
            console.warn('Error fetching current organization:', orgErr)
          }
        }
        
        // Set user organizations if available
        if (response.data.organizations) {
          organizationStore.setUserOrganizations(response.data.organizations)
        }
        
        // Update stored user data
        localStorage.setItem('auth', JSON.stringify({ 
          user: user.value,
          currentOrgId: user.value.current_organization_id
        }))
        
        return true
      }
      return false
    } catch (error) {
      console.error('Error refreshing user data:', error)
      return false
    }
  }
  
  /**
   * Initialize organization data from current user
   * This is referenced in main.js but was missing in the implementation
   */
  async function initOrganization() {
    if (!user.value?.current_organization_id) {
      console.warn('No current_organization_id in user data');
      return false;
    }
    
    try {
      const organizationStore = useOrganizationStore();
      
      // If the organization is already set, return success
      if (organizationStore.currentOrganization?.id === user.value.current_organization_id) {
        console.debug('Organization already set correctly');
        return true;
      }
      
      const orgResponse = await organizationService.getById(user.value.current_organization_id);
      if (orgResponse && orgResponse.data) {
        organizationStore.setCurrentOrganization(orgResponse.data);
        console.log('Initialized organization from auth store:', orgResponse.data.code);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error initializing organization:', error);
      return false;
    }
  }
  
  // Preload essential data after login for better UX
  async function preloadEssentialData() {
    try {
      console.log('Preloading essential data...')
      // Get the types store
      const typesStore = useTypesStore()
      
      // Preload all type data for better user experience
      await typesStore.loadAllTypes()
      
      // Additional preloading could be added here 
      // such as dashboard data, user profile, settings, etc.
      
      console.log('Essential data preloaded successfully')
    } catch (error) {
      console.warn('Error preloading essential data:', error)
      // Continue even if preloading fails - don't block user experience
    }
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
    checkToken,
    updateUser,
    refreshUserData,
    preloadEssentialData,
    initOrganization // Added missing method
  }
})
