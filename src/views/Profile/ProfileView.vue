<template>
  <div class="profile-container">
    <PageHeader 
      title="Profile" 
      subtitle="Manage your account information"
    />
    
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" class="text-primary-500 dark:text-primary-400" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center rounded-lg bg-surface-primary dark:bg-surface-primary-dark border border-border-primary dark:border-border-primary-dark">
      <div class="text-red-600 dark:text-red-400 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load profile
      </div>
      <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">{{ error }}</p>
      <Button label="Try Again" icon="pi pi-refresh" @click="fetchProfile" />
    </div>
    
    <div v-else class="grid grid-cols-1 gap-6">
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
                <div v-if="currentOrganization.logo" class="w-8 h-8 mr-3">
                  <img :src="currentOrganization.logo" alt="Logo" class="w-full h-full object-contain rounded" />
                </div>
                <div v-else class="w-8 h-8 bg-primary-700 rounded-md flex items-center justify-center text-white mr-3">
                  {{ currentOrganization.name ? currentOrganization.name.charAt(0).toUpperCase() : '?' }}
                </div>
                <div>
                  <div class="font-medium text-content-primary dark:text-content-primary-dark">{{ currentOrganization.name }}</div>
                  <div class="text-sm text-content-secondary dark:text-content-secondary-dark">{{ currentOrganization.code }}</div>
                </div>
              </div>
            </div>
          </div>
          
          <h3 class="font-medium mb-2 text-content-primary dark:text-content-primary-dark">Your Organizations</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div
              v-for="org in userOrganizations"
              :key="org.id"
              class="p-3 rounded-lg border cursor-pointer hover:shadow-md"
              :class="org.id === currentOrganization.id ? 
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
                <div v-if="org.id === currentOrganization.id" class="ml-auto">
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
      
      <!-- Profile Information Card -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
            <i class="pi pi-user mr-2"></i>
            Profile Information
          </h2>
        </div>
        <div class="p-6">
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="submitProfileForm"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- First Name -->
              <FormField
                id="first_name"
                label="First Name"
                :required="true"
                :error-message="v$.first_name.$errors[0]?.$message"
              >
                <InputText
                  id="first_name"
                  v-model="profileForm.first_name"
                  placeholder="Enter your first name"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.first_name.$error }"
                />
              </FormField>
              
              <!-- Last Name -->
              <FormField
                id="last_name"
                label="Last Name"
                :required="true"
                :error-message="v$.last_name.$errors[0]?.$message"
              >
                <InputText
                  id="last_name"
                  v-model="profileForm.last_name"
                  placeholder="Enter your last name"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.last_name.$error }"
                />
              </FormField>
              
              <!-- Email -->
              <FormField
                id="email"
                label="Email"
                :required="true"
                :error-message="v$.email.$errors[0]?.$message"
                class="md:col-span-2"
              >
                <InputText
                  id="email"
                  v-model="profileForm.email"
                  placeholder="Enter your email address"
                  class="w-full form-input"
                  :class="{ 'p-invalid': v$.email.$error }"
                  type="email"
                />
              </FormField>
              
              <!-- Username (readonly) -->
              <FormField
                id="username"
                label="Username"
                hint="Not editable"
                class="md:col-span-2"
              >
                <InputText
                  id="username"
                  v-model="profileForm.username"
                  placeholder="Username"
                  class="w-full form-input bg-surface-secondary dark:bg-surface-secondary-dark"
                  readonly
                  disabled
                />
              </FormField>
            </div>
          </EntityForm>
        </div>
      </div>
      
      <!-- Password Change Card -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
            <i class="pi pi-lock mr-2"></i>
            Change Password
          </h2>
        </div>
        <div class="p-6">
          <EntityForm
            :loading="loading"
            submit-label="Update Password"
            @submit="submitPasswordForm"
          >
            <div class="space-y-4">
              <!-- Current Password -->
              <FormField
                id="oldPassword"
                label="Current Password"
                :required="true"
                :error-message="p$.oldPassword.$errors[0]?.$message"
              >
                <Password
                  id="oldPassword"
                  v-model="passwordForm.oldPassword"
                  placeholder="Enter current password"
                  class="w-full"
                  toggleMask
                  :feedback="false"
                  :inputClass="['form-input', { 'p-invalid': p$.oldPassword.$error }]"
                />
              </FormField>
              
              <!-- New Password -->
              <FormField
                id="password"
                label="New Password"
                :required="true"
                help-text="Password must be at least 8 characters"
                :error-message="p$.password.$errors[0]?.$message"
              >
                <Password
                  id="password"
                  v-model="passwordForm.password"
                  placeholder="Enter new password"
                  class="w-full"
                  toggleMask
                  :inputClass="['form-input', { 'p-invalid': p$.password.$error }]"
                />
              </FormField>
              
              <!-- Confirm Password -->
              <FormField
                id="passwordConfirm"
                label="Confirm Password"
                :required="true"
                :error-message="p$.passwordConfirm.$errors[0]?.$message"
              >
                <Password
                  id="passwordConfirm"
                  v-model="passwordForm.passwordConfirm"
                  placeholder="Confirm new password"
                  class="w-full"
                  toggleMask
                  :feedback="false"
                  :inputClass="['form-input', { 'p-invalid': p$.passwordConfirm.$error }]"
                />
              </FormField>
            </div>
          </EntityForm>
        </div>
      </div>
      
      <!-- Account Information Card -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
            <i class="pi pi-info-circle mr-2"></i>
            Account Information
          </h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Created Date -->
            <div class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark">
              <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Account Created</div>
              <div class="font-medium text-content-primary dark:text-content-primary-dark">
                <i class="pi pi-calendar mr-2 text-blue-500 dark:text-blue-400"></i>
                {{ formatDate(profile.created) }}
              </div>
            </div>
            
            <!-- Last Updated -->
            <div class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark">
              <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Last Updated</div>
              <div class="font-medium text-content-primary dark:text-content-primary-dark">
                <i class="pi pi-clock mr-2 text-blue-500 dark:text-blue-400"></i>
                {{ formatDate(profile.updated) }}
              </div>
            </div>
            
            <!-- Verified Status -->
            <div class="p-3 rounded-lg bg-surface-secondary dark:bg-surface-secondary-dark border border-border-light dark:border-border-light-dark">
              <div class="text-sm mb-1 text-content-secondary dark:text-content-secondary-dark">Email Verified</div>
              <div class="font-medium flex items-center text-content-primary dark:text-content-primary-dark">
                <i 
                  :class="[
                    profile.verified ? 'pi pi-check-circle text-green-500 dark:text-green-400' : 'pi pi-times-circle text-red-500 dark:text-red-400', 
                    'mr-2'
                  ]"
                ></i>
                {{ profile.verified ? 'Verified' : 'Not Verified' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserProfile } from '../../composables/useUserProfile'
import { useProfileForm } from '../../composables/useProfileForm'
import { useOrganization } from '../../composables/useOrganization'
import PageHeader from '../../components/common/PageHeader.vue'
import EntityForm from '../../components/common/EntityForm.vue'
import FormField from '../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

// Get user profile functionality
const { profile, error, loading: profileLoading, fetchProfile, formatDate } = useUserProfile()

// Get form functionality
const { 
  profileForm, 
  passwordForm, 
  v$, 
  p$, 
  loading: formLoading, 
  loadProfile,
  submitProfileForm,
  submitPasswordForm
} = useProfileForm()

// Get organization functionality
const {
  userOrganizations,
  currentOrganization,
  canManageOrganizations,
  switchOrganization,
  fetchUserOrganizations,
  navigateToCreateOrganization,
  navigateToOrganizations
} = useOrganization()

// Combined loading state
const loading = ref(false)
const initialLoading = ref(true)

// Watch loading states
watch([profileLoading, formLoading], () => {
  loading.value = profileLoading.value || formLoading.value
})

// Load profile data on mount
onMounted(async () => {
  try {
    document.title = 'My Profile | IoT Platform'
    const userData = await fetchProfile()
    if (userData) {
      loadProfile(userData)
    }
    
    // Fetch organizations
    await fetchUserOrganizations()
  } finally {
    initialLoading.value = false
  }
})

// Switch to another organization
const switchToOrganization = async (org) => {
  if (org.id !== currentOrganization.value?.id) {
    await switchOrganization(org.id)
  }
}
</script>

<style scoped>
.profile-container {
  margin-bottom: 2rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

/* Form input styling for consistency */
.form-input {
  transition: all 0.2s ease;
}

/* Fix for Password component that doesn't properly inherit theme */
:deep(.p-password) {
  width: 100%;
}

:deep(.p-password-input) {
  width: 100%;
}

/* Fix password panel styling */
:deep(.p-password-panel) {
  background-color: var(--surface-overlay);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-password .p-password-toggle) {
  background: transparent !important;
  border: none !important;
  color: var(--text-color-secondary) !important;
}

:deep(.p-password .p-password-toggle:hover) {
  color: var(--text-color) !important;
}

:deep(.dark .p-password .p-password-toggle) {
  background: transparent !important;
  color: var(--text-color-secondary) !important;
}

:deep(.dark .p-password .p-password-toggle:hover) {
  color: var(--text-color) !important;
}

/* Fix for dark mode styling */
:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-inputnumber) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext:enabled:focus) {
  box-shadow: 0 0 0 1px var(--primary-400);
  border-color: var(--primary-400);
}

:deep(.p-invalid.p-inputtext:enabled:focus) {
  box-shadow: 0 0 0 1px var(--red-400);
  border-color: var(--red-400);
}

/* Empty state styling for consistency */
:deep(.empty-state) {
  opacity: 0.7;
}
</style>
