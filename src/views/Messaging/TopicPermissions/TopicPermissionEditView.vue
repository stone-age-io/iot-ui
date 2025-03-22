<!-- src/views/Messaging/TopicPermissions/TopicPermissionEditView.vue -->
<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load permission role
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Permission Role" 
        :subtitle="`Updating '${permission.name}'`"
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
      
      <div class="card">
        <EntityForm
          title="Role Information"
          :loading="saving"
          submit-label="Save Changes"
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
                <p class="text-gray-600 mb-4">
                  Define topics this role can publish to. Leave empty for no publish access.
                </p>
                
                <!-- Add Topic Form -->
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                  <div class="flex-grow">
                    <InputText
                      v-model="newPublishTopic"
                      placeholder="Enter a topic pattern (e.g., device/+/status)"
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
                  <h3 class="text-lg font-medium mb-2">Publish Topics</h3>
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="(topic, index) in permission.publish_permissions" :key="`pub-${index}`" class="flex items-center">
                      <span class="font-mono flex-grow">{{ topic }}</span>
                      <Button
                        icon="pi pi-trash"
                        class="p-button-text p-button-sm p-button-danger"
                        @click="removePublishTopic(index)"
                        tooltip="Remove"
                      />
                    </li>
                  </ul>
                </div>
                
                <div v-else class="bg-gray-50 p-4 rounded text-gray-500 text-center mt-4">
                  No publish permissions defined
                </div>
              </div>
            </TabPanel>
            
            <!-- Subscribe Topics Tab -->
            <TabPanel header="Subscribe Permissions">
              <div class="p-2">
                <p class="text-gray-600 mb-4">
                  Define topics this role can subscribe to. Leave empty for no subscribe access.
                </p>
                
                <!-- Add Topic Form -->
                <div class="flex flex-col sm:flex-row gap-2 mb-4">
                  <div class="flex-grow">
                    <InputText
                      v-model="newSubscribeTopic"
                      placeholder="Enter a topic pattern (e.g., events/#)"
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
                  <h3 class="text-lg font-medium mb-2">Subscribe Topics</h3>
                  <ul class="list-disc pl-5 space-y-1">
                    <li v-for="(topic, index) in permission.subscribe_permissions" :key="`sub-${index}`" class="flex items-center">
                      <span class="font-mono flex-grow">{{ topic }}</span>
                      <Button
                        icon="pi pi-trash"
                        class="p-button-text p-button-sm p-button-danger"
                        @click="removeSubscribeTopic(index)"
                        tooltip="Remove"
                      />
                    </li>
                  </ul>
                </div>
                
                <div v-else class="bg-gray-50 p-4 rounded text-gray-500 text-center mt-4">
                  No subscribe permissions defined
                </div>
              </div>
            </TabPanel>
          </TabView>
          
          <!-- Topic Pattern Help -->
          <div class="mt-8 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 class="text-lg font-semibold mb-2">Topic Pattern Help</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="font-medium text-sm mb-1">Exact Topics</h4>
                <p class="text-sm text-gray-600">
                  Use specific topic paths for exact matching.
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/bld-na-001/reader/rdr-main-001/event
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1">Single-Level Wildcard (+)</h4>
                <p class="text-sm text-gray-600">
                  The + wildcard matches exactly one level in the topic path.
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/+/reader/+/event
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1">Multi-Level Wildcard (#)</h4>
                <p class="text-sm text-gray-600">
                  The # wildcard matches multiple levels and must be at the end.
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/bld-na-001/#
                </div>
              </div>
            </div>
          </div>
          
        </EntityForm>
      </div>
      
      <!-- Toast for success/error messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useVuelidate } from '@vuelidate/core'
import { required, helpers } from '@vuelidate/validators'
import { topicPermissionService, validateTopic } from '../../../services/topicPermission'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Permission data with arrays for topics
const permission = ref({
  id: '',
  name: '',
  publish_permissions: [],
  subscribe_permissions: []
})

// New topic inputs
const newPublishTopic = ref('')
const newSubscribeTopic = ref('')

// Loading states
const initialLoading = ref(true)
const saving = ref(false)
const error = ref(null)

// Form validation rules
const rules = {
  name: { 
    required: helpers.withMessage('Role name is required', required)
  }
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, permission)

// Fetch permission data on component mount
onMounted(async () => {
  await fetchPermission()
})

// Methods
const fetchPermission = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid permission ID'
    initialLoading.value = false
    return
  }
  
  initialLoading.value = true
  error.value = null
  
  try {
    const response = await topicPermissionService.getTopicPermission(id)
    
    // Set form data ensuring arrays
    permission.value = {
      id: response.data.id,
      name: response.data.name,
      publish_permissions: Array.isArray(response.data.publish_permissions) 
        ? [...response.data.publish_permissions] 
        : [],
      subscribe_permissions: Array.isArray(response.data.subscribe_permissions) 
        ? [...response.data.subscribe_permissions] 
        : []
    }
  } catch (err) {
    console.error('Error fetching permission:', err)
    error.value = 'Failed to load permission details. Please try again.'
  } finally {
    initialLoading.value = false
  }
}

// Validate topic format
const isValidTopic = (topic) => {
  return topic && validateTopic(topic)
}

// Add a publish topic
const addPublishTopic = () => {
  if (!isValidTopic(newPublishTopic.value)) return
  
  // Check for duplicates
  if (!permission.value.publish_permissions.includes(newPublishTopic.value)) {
    permission.value.publish_permissions.push(newPublishTopic.value)
  } else {
    toast.add({
      severity: 'warn',
      summary: 'Duplicate Topic',
      detail: 'This topic already exists in the publish permissions',
      life: 3000
    })
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
    toast.add({
      severity: 'warn',
      summary: 'Duplicate Topic',
      detail: 'This topic already exists in the subscribe permissions',
      life: 3000
    })
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
  
  saving.value = true
  
  try {
    // Prepare data for API
    const permissionData = {
      name: permission.value.name,
      publish_permissions: permission.value.publish_permissions,
      subscribe_permissions: permission.value.subscribe_permissions
    }
    
    // Submit to API
    await topicPermissionService.updateTopicPermission(permission.value.id, permissionData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission role '${permissionData.name}' has been updated`,
      life: 3000
    })
    
    // Navigate back to permission detail view
    router.push({ 
      name: 'topic-permission-detail', 
      params: { id: permission.value.id } 
    })
  } catch (error) {
    console.error('Error updating permission:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update permission. Please try again.',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}
</script>
