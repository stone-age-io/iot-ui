<template>
  <div>
    <PageHeader 
      title="Create Location" 
      subtitle="Add a new physical location to your infrastructure"
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
        title="Location Information"
        :loading="loading"
        submit-label="Create Location"
        @submit="submitForm"
        @cancel="$router.back()"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Edge (required) -->
          <FormField
            id="edge_id"
            label="Edge"
            :required="true"
            :error-message="v$.edge_id.$errors[0]?.$message"
          >
            <Dropdown
              id="edge_id"
              v-model="location.edge_id"
              :options="edges"
              optionLabel="name"
              optionValue="id"
              placeholder="Select Edge"
              class="w-full"
              :class="{ 'p-invalid': v$.edge_id.$error }"
              :loading="edgesLoading"
              :filter="true"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <div>
                    <div>{{ slotProps.option.name }}</div>
                    <div class="text-xs text-gray-500">{{ slotProps.option.code }}</div>
                  </div>
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value" class="flex align-items-center">
                  <div>
                    {{ getEdgeName(slotProps.value) }}
                    <span class="text-xs text-gray-500 ml-2">{{ getEdgeCode(slotProps.value) }}</span>
                  </div>
                </div>
                <span v-else>Select Edge</span>
              </template>
            </Dropdown>
          </FormField>
          
          <!-- Level -->
          <FormField
            id="level"
            label="Level"
            :required="true"
            :error-message="v$.level.$errors[0]?.$message"
          >
            <Dropdown
              id="level"
              v-model="location.level"
              :options="locationLevels"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Level"
              class="w-full"
              :class="{ 'p-invalid': v$.level.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Zone -->
          <FormField
            id="zone"
            label="Zone"
            :required="true"
            :error-message="v$.zone.$errors[0]?.$message"
          >
            <Dropdown
              id="zone"
              v-model="location.zone"
              :options="locationZones"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Zone"
              class="w-full"
              :class="{ 'p-invalid': v$.zone.$error }"
              @change="updateCode"
            />
          </FormField>
          
          <!-- Identifier -->
          <FormField
            id="identifier"
            label="Identifier"
            :required="true"
            :error-message="v$.identifier.$errors[0]?.$message"
            help-text="Unique identifier within this level and zone"
          >
            <InputText
              id="identifier"
              v-model="location.identifier"
              placeholder="reception"
              class="w-full"
              :class="{ 'p-invalid': v$.identifier.$error }"
              @input="updateCode"
            />
          </FormField>
          
          <!-- Code (calculated field) -->
          <FormField
            id="code"
            label="Code"
            :required="true"
            :error-message="v$.code.$errors[0]?.$message"
            hint="Auto-generated"
          >
            <InputText
              id="code"
              v-model="location.code"
              placeholder="floor-1-north-reception"
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
          >
            <InputText
              id="name"
              v-model="location.name"
              placeholder="North Reception Area"
              class="w-full"
              :class="{ 'p-invalid': v$.name.$error }"
            />
          </FormField>
          
          <!-- Type -->
          <FormField
            id="type"
            label="Type"
            :required="true"
            :error-message="v$.type.$errors[0]?.$message"
          >
            <Dropdown
              id="type"
              v-model="location.type"
              :options="locationTypes"
              optionLabel="label"
              optionValue="value"
              placeholder="Select Type"
              class="w-full"
              :class="{ 'p-invalid': v$.type.$error }"
            />
          </FormField>
          
          <!-- Path -->
          <FormField
            id="path"
            label="Path"
            :required="true"
            :error-message="v$.path.$errors[0]?.$message"
            class="md:col-span-2"
          >
            <InputText
              id="path"
              v-model="location.path"
              placeholder="floor-1/north-wing/reception"
              class="w-full"
              :class="{ 'p-invalid': v$.path.$error }"
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
              v-model="location.description"
              rows="3"
              placeholder="Enter a description for this location"
              class="w-full"
              :class="{ 'p-invalid': v$.description.$error }"
            />
          </FormField>
        </div>
      </EntityForm>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLocationForm } from '../../../composables/useLocationForm'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const route = useRoute()

// Use the location form composable in create mode
const { 
  location, 
  v$, 
  loading, 
  edges,
  edgesLoading,
  locationTypes,
  locationLevels,
  locationZones,
  fetchEdges,
  updateCode,
  updatePathFromLevelZone,
  getEdgeName,
  getEdgeCode,
  submitForm
} = useLocationForm('create')

// If edge_id is provided as a query param, set it
onMounted(async () => {
  await fetchEdges()
  
  if (route.query.edge_id) {
    location.value.edge_id = route.query.edge_id
    
    // Update the path when edge_id is set
    updatePathFromLevelZone()
  }
})
</script>
