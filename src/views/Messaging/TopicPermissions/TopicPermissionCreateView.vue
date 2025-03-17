<template>
  <div>
    <PageHeader 
      title="Create Topic Permission" 
      subtitle="Add a new topic permission rule"
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
        :loading="loading"
        submit-label="Create Permission"
        @submit="handleSubmit"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Client (required) -->
          <FormField
            id="client_id"
            label="Client"
            :required="true"
            :error-message="v$.client_id.$errors[0]?.$message"
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
              :class="{ 'p-invalid': v$.client_id.$error }"
              :loading="clientsLoading"
              :filter="true"
            >
              <template #option="slotProps">
                <div class="flex flex-col">
                  <div>{{ slotProps.option.username }}</div>
                  <div class="text-xs text-gray-500">{{ slotProps.option.name }}</div>
                </div>
              </template>
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
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
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

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Load clients for the dropdown
const clients = ref([])
const clientsLoading = ref(false)

// Permission form data
const permission = ref({
  client_id: route.query.client_id || '',
  name: '',
  topic_pattern: '',
  pattern_type: 'exact',
  permission_type: 'read',
  description: ''
})

// Loading state
const loading = ref(false)

// Form validation rules
const rules = {
  client_id: { required: helpers.withMessage('Client is required', required) },
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

// Load clients on component mount
onMounted(async () => {
  await fetchClients()
})

// Fetch clients for dropdown
const fetchClients = async () => {
  clientsLoading.value = true
  try {
    const response = await clientService.getClients()
    clients.value = response.data.items || []
  } catch (error) {
    console.error('Error fetching clients:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to load clients',
      life: 3000
    })
  } finally {
    clientsLoading.value = false
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
  
  loading.value = true
  
  try {
    // Prepare data for API
    const permissionData = {
      client_id: permission.value.client_id,
      name: permission.value.name,
      topic_pattern: permission.value.topic_pattern,
      pattern_type: permission.value.pattern_type,
      permission_type: permission.value.permission_type,
      description: permission.value.description
    }
    
    // Submit to API
    const response = await topicPermissionService.createTopicPermission(permissionData)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission ${permissionData.name} has been created`,
      life: 3000
    })
    
    // Navigate to permission detail view
    router.push({ 
      name: 'topic-permission-detail', 
      params: { id: response.data.id } 
    })
  } catch (error) {
    console.error('Error creating permission:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to create permission. Please try again.',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}
</script>
