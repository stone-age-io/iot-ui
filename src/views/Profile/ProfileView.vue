<template>
  <div>
    <PageHeader title="My Profile" subtitle="Manage your account information and settings" />
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left column - Profile information -->
      <div class="lg:col-span-2">
        <!-- Basic Information -->
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
              <i class="pi pi-user mr-2"></i>
              Profile Information
            </h2>
          </div>
          <div class="p-6">
            <div v-if="loading" class="flex justify-center py-4">
              <ProgressSpinner strokeWidth="4" />
            </div>
            <div v-else>
              <div class="flex flex-col md:flex-row md:items-center mb-6">
                <div class="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                  <div class="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                    {{ userInitials }}
                  </div>
                </div>
                <div>
                  <h3 class="text-lg font-medium text-content-primary dark:text-content-primary-dark">
                    {{ profile.name || profile.email }}
                  </h3>
                  <p class="text-content-secondary dark:text-content-secondary-dark">{{ profile.email }}</p>
                  <p v-if="profile.created" class="text-sm text-content-tertiary dark:text-content-tertiary-dark mt-1">
                    Member since {{ formatDate(profile.created) }}
                  </p>
                </div>
              </div>
              
              <form @submit.prevent="updateProfile">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Form Fields -->
                  <FormField label="First Name" id="first_name">
                    <InputText 
                      v-model="formData.first_name" 
                      id="first_name" 
                      class="w-full" 
                    />
                  </FormField>
                  
                  <FormField label="Last Name" id="last_name">
                    <InputText 
                      v-model="formData.last_name" 
                      id="last_name" 
                      class="w-full" 
                    />
                  </FormField>
                  
                  <FormField label="Email Address" id="email" class="md:col-span-2">
                    <InputText 
                      v-model="formData.email" 
                      id="email" 
                      class="w-full" 
                      disabled
                    />
                    <small class="text-content-tertiary dark:text-content-tertiary-dark">
                      Contact administrator to update your email address.
                    </small>
                  </FormField>
                </div>
                
                <!-- Form Actions -->
                <div class="flex justify-end mt-6">
                  <Button 
                    type="submit" 
                    label="Save Changes" 
                    icon="pi pi-save"
                    :loading="saving"
                  />
                </div>
              </form>
            </div>
          </div>
        </div>
        
        <!-- Password Section -->
        <div class="mt-6 bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
              <i class="pi pi-lock mr-2"></i>
              Change Password
            </h2>
          </div>
          <div class="p-6">
            <form @submit.prevent="changePassword">
              <div class="grid grid-cols-1 gap-4">
                <FormField 
                  label="Current Password" 
                  id="current_password"
                  :error-message="passwordErrors.currentPassword"
                >
                  <Password 
                    v-model="passwordData.currentPassword" 
                    id="current_password" 
                    :feedback="false"
                    toggleMask
                    inputClass="w-full" 
                    class="w-full"
                    :class="{ 'p-invalid': passwordErrors.currentPassword }"
                    placeholder="Enter your current password"
                  />
                </FormField>
                
                <FormField 
                  label="New Password" 
                  id="new_password"
                  :error-message="passwordErrors.newPassword"
                  help-text="Password must be at least 8 characters long"
                >
                  <Password 
                    v-model="passwordData.newPassword" 
                    id="new_password" 
                    :feedback="true"
                    toggleMask
                    inputClass="w-full" 
                    class="w-full"
                    :class="{ 'p-invalid': passwordErrors.newPassword }"
                    placeholder="Enter your new password"
                  />
                </FormField>
                
                <FormField 
                  label="Confirm New Password" 
                  id="confirm_password"
                  :error-message="passwordErrors.confirmPassword"
                >
                  <Password 
                    v-model="passwordData.confirmPassword" 
                    id="confirm_password" 
                    :feedback="false"
                    toggleMask
                    inputClass="w-full" 
                    class="w-full"
                    :class="{ 'p-invalid': passwordErrors.confirmPassword }"
                    placeholder="Confirm your new password"
                  />
                </FormField>
              </div>
              
              <!-- Password Form Actions -->
              <div class="flex justify-end mt-6">
                <Button 
                  type="submit" 
                  label="Update Password" 
                  icon="pi pi-lock"
                  :loading="changingPassword"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Right column - Organization and settings -->
      <div class="lg:col-span-1">
        <!-- Organizations Card -->
        <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
          <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
            <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
              <i class="pi pi-building mr-2"></i>
              Organizations
            </h2>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <h3 class="font-medium mb-2 text-content-primary dark:text-content-primary-dark">Current Organization</h3>
              <div class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark mb-3">
                <div class="flex items-center">
                  <div v-if="currentOrganization?.logo" class="w-8 h-8 mr-3">
                    <img :src="currentOrganization.logo" alt="Logo" class="w-full h-full object-contain rounded" />
                  </div>
                  <div v-else class="w-8 h-8 bg-primary-700 rounded-md flex items-center justify-center text-white mr-3">
                    {{ currentOrganization?.name ? currentOrganization.name.charAt(0).toUpperCase() : '?' }}
                  </div>
                  <div>
                    <div class="font-medium text-content-primary dark:text-content-primary-dark">{{ currentOrganization?.name }}</div>
                    <div class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ currentOrganization?.code }}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 class="font-medium mb-2 text-content-primary dark:text-content-primary-dark">Your Organizations</h3>
            <div class="grid grid-cols-1 gap-3 mb-4">
              <div
                v-for="org in userOrganizations"
                :key="org.id"
                class="p-3 rounded-lg border cursor-pointer hover:shadow-md"
                :class="org.id === currentOrganization?.id ? 
                  'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700' : 
                  'bg-surface-secondary dark:bg-surface-secondary-dark border-border-light dark:border-border-light-dark'"
                @click="switchToOrganization(org)"
              >
                <div class="flex items-center">
                  <div v-if="org.logo" class="w-6 h-6 mr-2">
                    <img :src="org.logo" alt="Logo" class="w-full h-full object-contain rounded" />
                  </div>
                  <div v-else class="w-6 h-6 bg-primary-700 rounded-sm flex items-center justify-center text-white mr-2">
                    {{ org.name.charAt(0).toUpperCase() }}
                  </div>
                  <div>
                    <div class="font-medium text-content-primary dark:text-content-primary-dark">{{ org.name }}</div>
                  </div>
                  <div v-if="org.id === currentOrganization?.id" class="ml-auto">
                    <i class="pi pi-check text-primary-500"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Only users with is_org_admin=true can create new organizations -->
            <Button
              v-if="canManageOrganizations"
              label="Create New Organization"
              icon="pi pi-plus"
              @click="navigateToCreateOrganization"
              class="w-full"
            />
            
            <!-- Add management button for org admins -->
            <Button
              v-if="canManageOrganizations"
              label="Manage Organizations"
              icon="pi pi-cog"
              @click="navigateToOrganizations"
              class="w-full mt-2 p-button-outlined"
            />
          </div>
        </div>
        
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserProfile } from '../../composables/useUserProfile'
import { useTheme } from '../../composables/useTheme'
import { useOrganization } from '../../composables/useOrganization'
import { useAuthStore } from '../../stores/auth'
import PageHeader from '../../components/common/PageHeader.vue'
import FormField from '../../components/common/FormField.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

// Composables
const { profile, loading, error, fetchProfile, updateProfile: saveProfile, changePassword: savePassword, formatDate } = useUserProfile()
const { currentTheme, setLightTheme, setDarkTheme, setSystemTheme } = useTheme()
const { 
  currentOrganization, 
  userOrganizations, 
  isAdmin,
  canManageOrganizations,
  switchOrganization,
  fetchUserOrganizations,
  navigateToCreateOrganization,
  navigateToOrganizations
} = useOrganization()

// Local state
const formData = ref({
  first_name: '',
  last_name: '',
  email: ''
})

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordErrors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const saving = ref(false)
const changingPassword = ref(false)

// Auth store for user initials
const authStore = useAuthStore()
const userInitials = computed(() => authStore.userInitials)

// Load profile data on component mount
onMounted(async () => {
  await fetchProfile()
  
  // Copy profile data to form
  if (profile.value) {
    formData.value = {
      first_name: profile.value.first_name || '',
      last_name: profile.value.last_name || '',
      email: profile.value.email || ''
    }
  }
  
  // Load user organizations
  await fetchUserOrganizations()
})

// Update profile info
const updateProfile = async () => {
  saving.value = true
  
  try {
    await saveProfile({
      first_name: formData.value.first_name,
      last_name: formData.value.last_name
    })
    
    // Success is handled by the composable
  } catch (err) {
    console.error('Error updating profile:', err)
  } finally {
    saving.value = false
  }
}

// Change password
const changePassword = async () => {
  // Reset errors
  passwordErrors.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  
  // Validate
  let hasErrors = false
  
  if (!passwordData.value.currentPassword) {
    passwordErrors.value.currentPassword = 'Current password is required'
    hasErrors = true
  }
  
  if (!passwordData.value.newPassword) {
    passwordErrors.value.newPassword = 'New password is required'
    hasErrors = true
  } else if (passwordData.value.newPassword.length < 8) {
    passwordErrors.value.newPassword = 'Password must be at least 8 characters'
    hasErrors = true
  }
  
  if (!passwordData.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Please confirm your new password'
    hasErrors = true
  } else if (passwordData.value.newPassword !== passwordData.value.confirmPassword) {
    passwordErrors.value.confirmPassword = 'Passwords do not match'
    hasErrors = true
  }
  
  if (hasErrors) {
    return
  }
  
  // Submit password change
  changingPassword.value = true
  
  try {
    await savePassword(
      passwordData.value.currentPassword,
      passwordData.value.newPassword,
      passwordData.value.confirmPassword
    )
    
    // Reset form on success
    passwordData.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    
    // Success is handled by the composable
  } catch (err) {
    console.error('Error changing password:', err)
  } finally {
    changingPassword.value = false
  }
}

// Switch to selected organization
const switchToOrganization = async (org) => {
  if (org.id !== currentOrganization.value?.id) {
    await switchOrganization(org.id)
  }
}
</script>

<style scoped>
.theme-option {
  transition: all 0.2s ease;
}

.theme-option:hover {
  transform: translateY(-2px);
}

/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-password-input) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext:disabled) {
  background-color: var(--surface-hover);
  color: var(--text-color-secondary);
  opacity: 0.7;
  border-color: var(--surface-border);
}
</style>
