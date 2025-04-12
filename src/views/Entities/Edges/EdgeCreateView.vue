<template>
  <div>
    <PageHeader 
      title="Create Edge" 
      subtitle="Add a new edge installation to your infrastructure"
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
        submit-label="Create Edge"
        @submit="submitForm"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Type -->
          <FormField
            id="type"
            label="Type"
            :required="true"
            :error-message="v$.type.$errors[0]?.$message"
          >
            <Dropdown
              id="type"
              v-model="edge.type"
              :options="edgeTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Edge Type"
              class="w-full"
              :class="{ 'p-invalid': v$.type.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Region -->
          <FormField
            id="region"
            label="Region"
            :required="true"
            :error-message="v$.region.$errors[0]?.$message"
          >
            <Dropdown
              id="region"
              v-model="edge.region"
              :options="edgeRegions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Region"
              class="w-full"
              :class="{ 'p-invalid': v$.region.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Number -->
          <FormField
            id="number"
            label="Number"
            :required="true"
            :error-message="v$.number.$errors[0]?.$message"
            help-text="3-digit sequence number for this edge"
          >
            <InputNumber
              id="number"
              v-model="edge.number"
              placeholder="001"
              :min="1"
              :max="999"
              class="w-full"
              :class="{ 'p-invalid': v$.number.$error }"
              @update:model-value="updateCode"
            />
          </FormField>
          
          <!-- Code (calculated field) -->
          <FormField
            id="code"
            label="Code"
            :required="true"
            :error-message="v$.code.$errors[0]?.$message"
            hint="Auto-generated from type, region, and number"
          >
            <InputText
              id="code"
              v-model="edge.code"
              placeholder="bld-na-001"
              class="w-full font-mono"
              :class="{ 'p-invalid': v$.code.$error }"
              readonly
            />
          </FormField>
          
          <!-- Name -->
          <FormField
            id="name"
            label="Name"
            :required="true"
            :error-message="v$.name.$errors[0]?.$message"
            class="md:col-span-2"
          >
            <InputText
              id="name"
              v-model="edge.name"
              placeholder="Main Office Building"
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
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
      </EntityForm>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useEdgeForm } from '../../../composables/useEdgeForm'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputSwitch from 'primevue/inputswitch'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const route = useRoute()

// Use the edge form composable in create mode
const {
  edge,
  v$,
  loading,
  edgeTypes,
  edgeRegions,
  updateCode,
  submitForm,
  resetForm
} = useEdgeForm('create')

// Handle any query parameters (for pre-filling the form)
onMounted(() => {
  // Check if we need to reset the form to handle initial state properly
  resetForm()
  
  // Pre-fill based on query parameters if present
  if (route.query.type) {
    edge.value.type = route.query.type
  }
  
  if (route.query.region) {
    edge.value.region = route.query.region
  }
  
  // Update code if both type and region are set
  if (edge.value.type && edge.value.region && edge.value.number) {
    updateCode()
  }
})
</script>
