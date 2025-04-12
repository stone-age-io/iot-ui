// src/composables/useUserProfile.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import { userService } from '../services/user/userService'
import { useApiOperation } from './useApiOperation'

/**
 * Composable for user profile-related functionality
 * Centralizes profile operations, formatting helpers, and navigation
 */
export function useUserProfile() {
  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()
  const { performOperation } = useApiOperation()
  
  // Common state
  const profile = ref({})
  const loading = ref(false)
  const error = ref(null)
  
  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} - Formatted date
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }
  
  /**
   * Fetch current user profile data
   * @returns {Promise<Object>} - User profile data
   */
  const fetchProfile = async () => {
    return performOperation(
      () => userService.getCurrentUser(),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to load profile',
        onSuccess: (response) => {
          profile.value = response.data || {}
          return profile.value
        }
      }
    )
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<boolean>} - Success status
   */
  const updateProfile = async (profileData) => {
    return performOperation(
      () => userService.updateProfile(profile.value.id, profileData),
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to update profile',
        successMessage: 'Profile has been updated',
        onSuccess: () => {
          // Update local state
          Object.assign(profile.value, profileData)
          
          // Update auth store if needed
          if (authStore.user) {
            const name = `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
            authStore.updateUser({
              name: name || authStore.user.name,
              email: profileData.email || authStore.user.email
            })
          }
          
          return true
        }
      }
    )
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<boolean>} - Success status
   */
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    return performOperation(
      async () => {
        // Verify passwords match
        if (newPassword !== confirmPassword) {
          throw new Error('New passwords do not match')
        }
        
        return userService.changePassword(profile.value.id, {
          oldPassword: currentPassword,
          password: newPassword,
          passwordConfirm: confirmPassword
        })
      },
      {
        loadingRef: loading,
        errorRef: error,
        errorMessage: 'Failed to change password',
        successMessage: 'Password has been changed',
        onSuccess: () => true
      }
    )
  }
  
  // Navigation methods
  const navigateToProfile = () => router.push({ name: 'profile' })
  const navigateToHome = () => router.push({ name: 'dashboard' })
  
  return {
    // State
    profile,
    loading,
    error,
    
    // Operations
    fetchProfile,
    updateProfile,
    changePassword,
    formatDate,
    
    // Navigation
    navigateToProfile,
    navigateToHome
  }
}
