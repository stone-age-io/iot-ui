// src/composables/useUserProfile.js
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '../stores/auth'
import { userService } from '../services/user/userService'

/**
 * Composable for user profile-related functionality
 * Centralizes profile operations, formatting helpers, and navigation
 */
export function useUserProfile() {
  const router = useRouter()
  const toast = useToast()
  const authStore = useAuthStore()
  
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
    loading.value = true
    error.value = null
    
    try {
      const response = await userService.getCurrentUser()
      profile.value = response.data || {}
      return profile.value
    } catch (err) {
      console.error('Error fetching profile:', err)
      error.value = 'Failed to load profile. Please try again.'
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load profile',
        life: 3000
      })
      return null
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise<boolean>} - Success status
   */
  const updateProfile = async (profileData) => {
    loading.value = true
    
    try {
      await userService.updateProfile(profile.value.id, profileData)
      
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
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Profile has been updated',
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update profile',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Change user password
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @param {string} confirmPassword - Confirm new password
   * @returns {Promise<boolean>} - Success status
   */
  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    loading.value = true
    
    try {
      // Verify passwords match
      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match')
      }
      
      await userService.changePassword(profile.value.id, {
        oldPassword: currentPassword,
        password: newPassword,
        passwordConfirm: confirmPassword
      })
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password has been changed',
        life: 3000
      })
      
      return true
    } catch (error) {
      console.error('Error changing password:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Failed to change password',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
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
