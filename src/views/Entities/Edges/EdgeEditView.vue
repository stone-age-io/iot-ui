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
        Failed to load edge
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Edge Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Edge" 
        :subtitle="`Updating ${edge.code}`"
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
          title="Edge Information"
          :loading="loading"
          submit-label="Save Changes"
          @submit="submitForm"
          @cancel="$router.back()"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Code (readonly) -->
            <FormField
              id="code"
              label="Code"
              :required="true"
              hint="Not editable"
            >
              <InputText
                id="code"
                v-model="edge.code"
                class="w-full font-mono"
                readonly
                disabled
              />
            </FormField>
            
            <!-- Name -->
            <FormField
              id="name"
              label="Name"
              :required="true"
              :error-message="v$.name.$errors[0]?.$message"
            >
              <InputText
                id="name"
                v-model="edge.name"
                placeholder="Main Office Building"
                class="w-full"
                :class="{ 'p-invalid': v$.name.$error }"
              />
            </FormField>
            
            <!-- Type -->
            <FormField
              id="type"
              label="Type"
              hint="Read-only after creation"
            >
              <Dropdown
                id="type"
                v-model="edge.type"
                :options="edgeTypes"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Edge Type"
                class="w-full"
                disabled
              />
            </FormField>
            
            <!-- Region -->
            <FormField
              id="region"
              label="Region"
              hint="Read-only after creation"
            >
              <Dropdown
                id="region"
                v-model="edge.region"
                :options="edgeRegions"
                optionLabel="label"
                optionValue="value"
                placeholder="Select Region"
                class="w-full"
                disabled
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
                v-model="edge.description"
                rows="3"
                placeholder="Enter a description for this edge installation"
                class="w-full"
                :class="{ 'p-invalid': v$.description.$error }"
              />
            </FormField>
            
            <!-- Active Status -->
            <FormField
              id="active"
              label="Status"
            >
              <div class="flex items-center mt-2">
                <InputSwitch
                  id="active"
                  v-model="edge.active"
                  class="mr-2"
                />
                <label for="active" class="cursor-pointer">
                  {{ edge.active ? 'Active' : 'Inactive' }}
                </label>
              </div>
            </FormField>
          </div>
          
          <!-- Edit notes -->
          <div class="mt-6 bg-gray-50 p-4 rounded-md text-gray-600 text-sm">
            <div class="flex items-start">
              <i class="pi pi-info-circle mt-0.5 mr-2 text-blue-500"></i>
              <div>
                <p><strong>Note:</strong> The edge code, type, and region cannot be changed after creation.</p>
                <p class="mt-1">If you need to change these values, please create a new edge and delete this one.</p>
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
import { useRoute } from 'vue-router'
import { useEdge } from '../../../composables/useEdge'
import { useEdgeForm } from '../../../composables/useEdgeForm'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Get edge type and region options
const { edgeTypes, edgeRegions, fetchEdge, error } = useEdge()

// Use the edge form composable in edit mode
const { edge, v$, loading, loadEdge, submitForm } = useEdgeForm('edit')

// Initial loading state
const initialLoading = ref(true)

// Fetch edge data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch edge data
    const edgeData = await fetchEdge(id)
    
    // Load data into form
    if (edgeData) {
      loadEdge(edgeData)
    }
  } finally {
    initialLoading.value = false
  }
})
</script>
