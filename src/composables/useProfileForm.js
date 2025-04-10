// src/composables/useProfileForm.js
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { userService } from '../services/user/userService'

/**
 * Composable for user profile form handling
 * Manages form state, validation, and submission
 * 
 * @returns {Object} - Form methods and state
 */
export function useProfileForm() {
  const toast = useToast()
  const router = useRouter()
  
  // Profile form data
  const profileForm = ref({
    id: '',
    first_name: '',
    last_name: '',
    email: '',
    username: ''
  })
  
  // Password form data
  const passwordForm = ref({
    oldPassword: '',
    password: '',
    passwordConfirm: ''
  })
  
  // Loading state
  const loading = ref(false)
  
  // Define validation rules for profile
  const profileRules = {
    first_name: { required: helpers.withMessage('First name is required', required) },
    last_name: { required: helpers.withMessage('Last name is required', required) },
    email: { 
      required: helpers.withMessage('Email is required', required),
      email: helpers.withMessage('Please enter a valid email address', email)
    }
  }
  
  // Define validation rules for password
  const passwordRules = {
    oldPassword: { required: helpers.withMessage('Current password is required', required) },
    password: { 
      required: helpers.withMessage('New password is required', required),
      minLength: helpers.withMessage('Password must be at least 8 characters', minLength(8))
    },
    passwordConfirm: { 
      required: helpers.withMessage('Please confirm your password', required),
      sameAs: helpers.withMessage('Passwords do not match', sameAs(() => passwordForm.value.password))
    }
  }
  
  // Initialize Vuelidate
  const v$ = useVuelidate(profileRules, profileForm)
  const p$ = useVuelidate(passwordRules, passwordForm)
  
  /**
   * Load user data for editing
   * @param {Object} userData - User data to load
   */
  const loadProfile = (userData) => {
    if (!userData) return
    
    profileForm.value = {
      id: userData.id || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      email: userData.email || '',
      username: userData.username || userData.email || ''
    }
  }
  
  /**
   * Handle profile form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitProfileForm = async () => {
    // Validate form
    const isValid = await v$.value.$validate()
    if (!isValid) return false
    
    loading.value = true
    
    try {
      // Prepare data for API
      const profileData = {
        first_name: profileForm.value.first_name,
        last_name: profileForm.value.last_name,
        email: profileForm.value.email
      }
      
      // Update profile
      await userService.updateProfile(profileForm.value.id, profileData)
      
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
        detail: 'Failed to update profile. Please try again.',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Handle password form submission
   * @returns {Promise<boolean>} - Success status
   */
  const submitPasswordForm = async () => {
    // Validate form
    const isValid = await p$.value.$validate()
    if (!isValid) return false
    
    loading.value = true
    
    try {
      // Update password
      await userService.changePassword(profileForm.value.id, passwordForm.value)
      
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Password has been changed',
        life: 3000
      })
      
      // Reset password form
      passwordForm.value = {
        oldPassword: '',
        password: '',
        passwordConfirm: ''
      }
      p$.value.$reset()
      
      return true
    } catch (error) {
      console.error('Error changing password:', error)
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to change password. Please try again.',
        life: 3000
      })
      return false
    } finally {
      loading.value = false
    }
  }
  
  /**
   * Reset forms to initial state
   */
  const resetForms = () => {
    profileForm.value = {
      id: '',
      first_name: '',
      last_name: '',
      email: '',
      username: ''
    }
    
    passwordForm.value = {
      oldPassword: '',
      password: '',
      passwordConfirm: ''
    }
    
    v$.value.$reset()
    p$.value.$reset()
  }
  
  return {
    profileForm,
    passwordForm,
    v$,
    p$,
    loading,
    loadProfile,
    submitProfileForm,
    submitPasswordForm,
    resetForms
  }
}
