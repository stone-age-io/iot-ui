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
        Failed to load permission
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Topic Permission" 
        :subtitle="`Updating ${permission.name}`"
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
          title="Topic Permission Information"
          :loading="saving"
          submit-label="Save Changes"
          @submit="handleSubmit"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Client (readonly after creation) -->
            <FormField
              id="client_id"
              label="Client"
              hint="Not editable after creation"
              class="md:col-span-2"
            >
              <Dropdown
                id="client_id"
                v-model="permission.client_id"
                :options="clients"
                optionLabel="username"
                optionValue="id"
                placeholder="Select Client"
                class="w-full"
                disabled
              >
                <template #value="slotProps">
                  <div v-if="slotProps.value" class="flex flex-col">
                    <div>
                      {{ getClientUsername(slotProps.value) }}
                      <span class="text-xs text-gray-500 ml-2">{{ getClientName(slotProps.value) }}</span>
                    </div>
                  </div>
                  <span v-else>Select Client</span>
                </template>
              </Dropdown>
            </FormField>
            
            <!-- Name -->
            <FormField
              id="name"
              label="Name"
              :required="true"
              :error-message="v$.name.$errors[0]?.$message"
              help-text="Descriptive name for this permission"
              class="md:col-span-2"
            >
              <InputText
                id="name"
                v-model="permission.name"
                placeholder="Production Device Access"
                class="w-full"
                :class="{ 'p-invalid': v$.name.$error }"
              />
            </FormField>
            
            <!-- Topic Pattern -->
            <FormField
              id="topic_pattern"
              label="Topic Pattern"
              :required="true"
              :error-message="v$.topic_pattern.$errors[0]?.$message"
              help-text="MQTT topic pattern to control access to"
              class="md:col-span-2"
            >
              <InputText
                id="topic_pattern"
                v-model="permission.topic_pattern"
                placeholder="acme/bld-na-001/reader/+/event"
                class="w-full font-mono"
                :class="{ 'p-invalid': v$.topic_pattern.$error }"
              />
            </FormField>
            
            <!-- Pattern Type -->
            <FormField
              id="pattern_type"
              label="Pattern Type"
              :required="true"
              :error-message="v$.pattern_type.$errors[0]?.$message"
              help-text="How the topic pattern should be interpreted"
            >
              <Dropdown
                id="pattern_type"
                v-model="permission.pattern_type"
                :options="patternTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Pattern Type"
                class="w-full"
                :class="{ 'p-invalid': v$.pattern_type.$error }"
              />
            </FormField>
            
            <!-- Permission Type -->
            <FormField
              id="permission_type"
              label="Permission"
              :required="true"
              :error-message="v$.permission_type.$errors[0]?.$message"
              help-text="Access level for this topic pattern"
            >
              <Dropdown
                id="permission_type"
                v-model="permission.permission_type"
                :options="permissionTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Permission Type"
                class="w-full"
                :class="{ 'p-invalid': v$.permission_type.$error }"
              />
            </FormField>
            
            <!-- Description -->
            <FormField
              id="description"
              label="Description"
              :error-message="v$.description.$errors[0]?.$message"
              class="md:col-span-2"
            >
              <Textarea
                id="description"
                v-model="permission.description"
                rows="3"
                placeholder="Enter a description for this permission"
                class="w-full"
                :class="{ 'p-invalid': v$.description.$error }"
              />
            </FormField>
          </div>
          
          <!-- Pattern Help Section -->
          <div class="mt-8 bg-gray-50 p-4 rounded-md border border-gray-200">
            <h3 class="text-lg font-semibold mb-2">Topic Pattern Help</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 class="font-medium text-sm mb-1">Exact Match</h4>
                <p class="text-sm text-gray-600">
                  Matches only the exact topic string. No wildcards are interpreted.
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/bld-na-001/reader/rdr-main-001/event
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1">Prefix Match</h4>
                <p class="text-sm text-gray-600">
                  Matches all topics that start with this prefix. Equivalent to adding "/#" at the end.
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/bld-na-001/reader/rdr-main-001
                </div>
              </div>
              
              <div>
                <h4 class="font-medium text-sm mb-1">Pattern Match</h4>
                <p class="text-sm text-gray-600">
                  Uses MQTT wildcards: '+' for single level, '#' for multiple levels (must be last).
                </p>
                <div class="mt-2 bg-gray-100 p-2 rounded text-xs font-mono">
                  acme/+/reader/+/event
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
import { 
  topicPermissionService, 
  patternTypes, 
  permissionTypes,
  validateTopic
} from '../../../services/topicPermission'
import { clientService } from '../../../services/client'

import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Clients for dropdown
const clients = ref([])

// Permission form data
const permission = ref({
  id: '',
  client_id: '',
  name: '',
  topic_pattern: '',
  pattern_type: 'exact',
  permission_type: 'read',
  description: ''
})

// Loading states
const initialLoading = ref(true)
const saving = ref(false)
const error = ref(null)

// Form validation rules
const rules = {
  name: { required: helpers.withMessage('Name is required', required) },
  topic_pattern: { 
    required: helpers.withMessage('Topic pattern is required', required),
    validTopic: helpers.withMessage(
      'Invalid topic pattern format', 
      (value) => validateTopic(value)
    )
  },
  pattern_type: { required: helpers.withMessage('Pattern type is required', required) },
  permission_type: { required: helpers.withMessage('Permission type is required', required) },
  description: {}
}

// Initialize Vuelidate
const v$ = useVuelidate(rules, permission)

// Fetch permission data on component mount
onMounted(async () => {
  await Promise.all([
    fetchPermission(),
    fetchClients()
  ])
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
    
    // Set form data
    permission.value = {
      id: response.data.id,
      client_id: response.data.client_id,
      name: response.data.name,
      topic_pattern: response.data.topic_pattern,
      pattern_type: response.data.pattern_type,
      permission_type: response.data.permission_type,
      description: response.data.description,
    }
  } catch (err) {
    console.error('Error fetching permission:', err)
    error.value = 'Failed to load permission details. Please try again.'
  } finally {
    initialLoading.value = false
  }
}

// Fetch clients for the dropdown
const fetchClients = async () => {
  try {
    const response = await clientService.getClients()
    clients.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching clients:', error)
  }
}

// Helper for displaying client username in dropdown
const getClientUsername = (clientId) => {
  const client = clients.value.find(client => client.id === clientId)
  return client ? client.username : clientId
}

// Helper for displaying client name in dropdown
const getClientName = (clientId) => {
  const client = clients.value.find(client => client.id === clientId)
  return client ? client.name : ''
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
      topic_pattern: permission.value.topic_pattern,
      pattern_type: permission.value.pattern_type,
      permission_type: permission.value.permission_type,
      description: permission.value.description
    }
    
    // Submit to API
    await topicPermissionService.updateTopicPermission(permission.value.id, permissionData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission ${permission.value.name} has been updated`,
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
