<!-- src/views/Profile/ProfileView.vue -->
<template>
  <div class="profile-container">
    <PageHeader 
      title="Profile" 
      subtitle="Manage your account information"
    />
    
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <div v-else-if="error" class="p-6 text-center rounded-lg" :class="[backgroundColor.surface, borderColor.default]">
      <div class="text-theme-error text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load profile
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Try Again" icon="pi pi-refresh" @click="fetchProfile" />
    </div>
    
    <div v-else class="grid grid-cols-1 gap-6">
      <!-- Profile Information Card -->
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">
            <i class="pi pi-user mr-2"></i>
            Profile Information
          </h2>
        </template>
        <template #content>
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
                  class="w-full form-input bg-theme-surface-alt"
                  readonly
                  disabled
                />
              </FormField>
            </div>
          </EntityForm>
        </template>
      </Card>
      
      <!-- Password Change Card -->
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">
            <i class="pi pi-lock mr-2"></i>
            Change Password
          </h2>
        </template>
        <template #content>
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
        </template>
      </Card>
      
      <!-- Account Information Card -->
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">
            <i class="pi pi-info-circle mr-2"></i>
            Account Information
          </h2>
        </template>
        <template #content>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Created Date -->
            <div :class="['p-3 rounded-lg', backgroundColor.secondary, borderColor.light]">
              <div :class="['text-sm mb-1', textColor.secondary]">Account Created</div>
              <div :class="['font-medium', textColor.primary]">
                <i class="pi pi-calendar mr-2 text-blue-500 dark:text-blue-400"></i>
                {{ formatDate(profile.created) }}
              </div>
            </div>
            
            <!-- Last Updated -->
            <div :class="['p-3 rounded-lg', backgroundColor.secondary, borderColor.light]">
              <div :class="['text-sm mb-1', textColor.secondary]">Last Updated</div>
              <div :class="['font-medium', textColor.primary]">
                <i class="pi pi-clock mr-2 text-blue-500 dark:text-blue-400"></i>
                {{ formatDate(profile.updated) }}
              </div>
            </div>
            
            <!-- Verified Status -->
            <div :class="['p-3 rounded-lg', backgroundColor.secondary, borderColor.light]">
              <div :class="['text-sm mb-1', textColor.secondary]">Email Verified</div>
              <div :class="['font-medium flex items-center', textColor.primary]">
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
        </template>
      </Card>
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserProfile } from '../../composables/useUserProfile'
import { useProfileForm } from '../../composables/useProfileForm'
import { useTheme } from '../../composables/useTheme'
import PageHeader from '../../components/common/PageHeader.vue'
import EntityForm from '../../components/common/EntityForm.vue'
import FormField from '../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'
import Card from 'primevue/card'

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

// Theme composable for theme-aware styling
const { textColor, backgroundColor, borderColor } = useTheme()

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
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
.profile-container {
  margin-bottom: 2rem;
  transition: background-color 0.2s ease, color 0.2s ease;
}

:deep(.p-card) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 0.5rem;
  box-shadow: var(--card-shadow);
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

:deep(.p-card .p-card-title) {
  padding: 1.25rem 1.5rem;
  margin-bottom: 0;
  border-bottom: 1px solid var(--surface-border);
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
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
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

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
