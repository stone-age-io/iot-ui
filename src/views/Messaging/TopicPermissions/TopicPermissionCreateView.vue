<!-- src/views/Messaging/TopicPermissions/TopicPermissionCreateView.vue -->
<template>
  <div>
    <PageHeader 
      title="Create Permission Role" 
      subtitle="Define a new set of NATS topic permissions"
    >
      <template #actions>
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-outlined"
          @click="$router.back()" 
        />
      </template>
    </PageHeader>
    
    <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
      <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
        <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">Role Information</h2>
      </div>
      <div class="p-6">
        <EntityForm
          :loading="loading"
          submit-label="Create Role"
          @submit="handleSubmit"
          @cancel="$router.back()"
        >
          <!-- Role Name -->
          <FormField
            id="name"
            label="Role Name"
            :required="true"
            :error-message="v$.name.$errors[0]?.$message"
            help-text="Descriptive name for this permission role"
            class="mb-6"
          >
            <InputText
              id="name"
              v-model="permission.name"
              placeholder="Device Read-Only Access"
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
            />
          </FormField>
          
          <!-- Topic Permissions Tabs -->
          <TabView>
            <!-- Publish Topics Tab -->
            <TabPanel header="Publish Permissions">
              <div class="p-2">
                <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
                  Define topics this role can publish to. Leave empty for no publish access.
                </p>
                
                <!-- Add Topic Form -->
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                  <div class="flex-grow">
                    <InputText
                      v-model="newPublishTopic"
                      placeholder="Enter a topic pattern (e.g., acme.device.*.status)"
                      class="w-full"
                      :class="{ 'p-invalid': !isValidTopic(newPublishTopic) && newPublishTopic !== '' }"
                    />
                    <small v-if="!isValidTopic(newPublishTopic) && newPublishTopic !== ''" class="p-error block mt-1">
                      Invalid topic format
                    </small>
                  </div>
                  <Button
                    label="Add Topic"
                    icon="pi pi-plus"
                    @click="addPublishTopic"
                    :disabled="!isValidTopic(newPublishTopic) || newPublishTopic === ''"
                  />
                </div>
                
                <!-- Topics List -->
                <div v-if="permission.publish_permissions.length > 0" class="mt-4">
                  <h3 class="text-lg font-medium mb-2 text-content-primary dark:text-content-primary-dark">Publish Topics</h3>
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="(topic, index) in permission.publish_permissions" :key="`pub-${index}`" class="flex items-center">
                      <span class="font-mono flex-grow text-content-primary dark:text-content-primary-dark">{{ topic }}</span>
                      <Button
                        icon="pi pi-trash"
                        class="p-button-text p-button-sm p-button-danger"
                        @click="removePublishTopic(index)"
                        tooltip="Remove"
                      />
                    </li>
                  </ul>
                </div>
                
                <div v-else class="bg-surface-secondary dark:bg-surface-secondary-dark p-4 rounded text-center mt-4 text-content-secondary dark:text-content-secondary-dark">
                  No publish permissions defined
                </div>
              </div>
            </TabPanel>
            
            <!-- Subscribe Topics Tab -->
            <TabPanel header="Subscribe Permissions">
              <div class="p-2">
                <p class="mb-4 text-content-secondary dark:text-content-secondary-dark">
                  Define topics this role can subscribe to. Leave empty for no subscribe access.
                </p>
                
                <!-- Add Topic Form -->
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                  <div class="flex-grow">
                    <InputText
                      v-model="newSubscribeTopic"
                      placeholder="Enter a topic pattern (e.g., acme.events.>)"
                      class="w-full"
                      :class="{ 'p-invalid': !isValidTopic(newSubscribeTopic) && newSubscribeTopic !== '' }"
                    />
                    <small v-if="!isValidTopic(newSubscribeTopic) && newSubscribeTopic !== ''" class="p-error block mt-1">
                      Invalid topic format
                    </small>
                  </div>
                  <Button
                    label="Add Topic"
                    icon="pi pi-plus"
                    @click="addSubscribeTopic"
                    :disabled="!isValidTopic(newSubscribeTopic) || newSubscribeTopic === ''"
                  />
                </div>
                
                <!-- Topics List -->
                <div v-if="permission.subscribe_permissions.length > 0" class="mt-4">
                  <h3 class="text-lg font-medium mb-2 text-content-primary dark:text-content-primary-dark">Subscribe Topics</h3>
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="(topic, index) in permission.subscribe_permissions" :key="`sub-${index}`" class="flex items-center">
                      <span class="font-mono flex-grow text-content-primary dark:text-content-primary-dark">{{ topic }}</span>
                      <Button
                        icon="pi pi-trash"
                        class="p-button-text p-button-sm p-button-danger"
                        @click="removeSubscribeTopic(index)"
                        tooltip="Remove"
                      />
                    </li>
                  </ul>
                </div>
                
                <div v-else class="bg-surface-secondary dark:bg-surface-secondary-dark p-4 rounded text-center mt-4 text-content-secondary dark:text-content-secondary-dark">
                  No subscribe permissions defined
                </div>
              </div>
            </TabPanel>
          </TabView>
          
          <!-- Topic Pattern Help -->
          <div class="mt-8 p-4 rounded-md border bg-surface-secondary dark:bg-surface-secondary-dark border-border-primary dark:border-border-primary-dark theme-transition">
            <h3 class="text-lg font-semibold mb-2 text-content-primary dark:text-content-primary-dark">Topic Pattern Help</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="font-medium text-sm mb-1 text-content-primary dark:text-content-primary-dark">Exact Topics</h4>
                <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
                  Use specific topic paths for exact matching.
                </p>
                <div class="mt-2 p-2 rounded text-xs font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                  acme.bld.na.001.reader.status
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1 text-content-primary dark:text-content-primary-dark">Single-Level Wildcard (*)</h4>
                <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
                  The * wildcard matches exactly one token in the topic path.
                </p>
                <div class="mt-2 p-2 rounded text-xs font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                  acme.*.reader.*.event
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1 text-content-primary dark:text-content-primary-dark">Multi-Level Wildcard (>)</h4>
                <p class="text-sm text-content-secondary dark:text-content-secondary-dark">
                  The > wildcard matches multiple tokens and must be at the end.
                </p>
                <div class="mt-2 p-2 rounded text-xs font-mono bg-surface-tertiary dark:bg-surface-tertiary-dark text-content-primary dark:text-content-primary-dark">
                  acme.bld.na.001.>
                </div>
              </div>
            </div>
          </div>
          
        </EntityForm>
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { useTopicPermission } from '../../../composables/useTopicPermission'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'

// Use the topic permission composable
const { 
  loading,
  error,
  isValidTopic,
  createPermission,
  navigateToPermissionDetail
} = useTopicPermission()

// Permission data with arrays for topics
const permission = ref({
  name: '',
  publish_permissions: [],
  subscribe_permissions: []
})

// New topic inputs
const newPublishTopic = ref('')
const newSubscribeTopic = ref('')

// Form validation rules
const rules = {
  name: { 
    required: helpers.withMessage('Role name is required', required)
  }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, permission)

// Add a publish topic
const addPublishTopic = () => {
  if (!isValidTopic(newPublishTopic.value)) return
  
  // Check for duplicates
  if (!permission.value.publish_permissions.includes(newPublishTopic.value)) {
    permission.value.publish_permissions.push(newPublishTopic.value)
  } else {
    // Toast is handled by the composable
  }
  
  // Clear input
  newPublishTopic.value = ''
}

// Remove a publish topic
const removePublishTopic = (index) => {
  permission.value.publish_permissions.splice(index, 1)
}

// Add a subscribe topic
const addSubscribeTopic = () => {
  if (!isValidTopic(newSubscribeTopic.value)) return
  
  // Check for duplicates
  if (!permission.value.subscribe_permissions.includes(newSubscribeTopic.value)) {
    permission.value.subscribe_permissions.push(newSubscribeTopic.value)
  } else {
    // Toast is handled by the composable
  }
  
  // Clear input
  newSubscribeTopic.value = ''
}

// Remove a subscribe topic
const removeSubscribeTopic = (index) => {
  permission.value.subscribe_permissions.splice(index, 1)
}

// Form submission
const handleSubmit = async () => {
  // Validate form
  const isValid = await v$.value.$validate()
  if (!isValid) return
  
  // Prepare data for API
  const permissionData = {
    name: permission.value.name,
    publish_permissions: permission.value.publish_permissions,
    subscribe_permissions: permission.value.subscribe_permissions
  }
  
  // Submit to API using composable
  const result = await createPermission(permissionData)
  
  if (result) {
    navigateToPermissionDetail(result.id)
  }
}
</script>

<style scoped>
/* Tab panel fixes */
:deep(.p-tabview-panels) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.p-tabview-nav) {
  background-color: var(--surface-section);
  border-color: var(--surface-border);
}

:deep(.p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

:deep(.p-tabview-nav li .p-tabview-nav-link) {
  color: var(--text-color-secondary);
}

/* Form input styling */
:deep(.p-inputtext) {
  background-color: var(--surface-section);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-inputtext:enabled:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}

:deep(.p-inputtext.p-invalid) {
  border-color: var(--red-500);
}

:deep(.dark .p-inputtext) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext:enabled:focus) {
  border-color: var(--primary-400);
  box-shadow: 0 0 0 1px var(--primary-400);
}

/* Button styling fixes */
:deep(.p-button-text) {
  color: var(--primary-color);
}

:deep(.dark .p-button-text) {
  color: var(--primary-400);
}

:deep(.dark .p-button-text:hover) {
  background: rgba(var(--primary-400), 0.16);
}

/* Error message styling */
:deep(.p-error) {
  color: var(--red-500);
}

:deep(.dark .p-error) {
  color: var(--red-400);
}
</style>
