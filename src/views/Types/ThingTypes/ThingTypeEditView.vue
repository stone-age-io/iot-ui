<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="initialLoading" class="flex justify-center items-center py-12">
      <ProgressSpinner 
        strokeWidth="4" 
        :class="themeValue.class('text-primary-500', 'text-primary-400')" 
      />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" :class="['p-6 text-center', backgroundColor.surface, borderColor.default, shadowStyle.md]">
      <div :class="['text-xl mb-4', textColor.error]">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load thing type
      </div>
      <p :class="['mb-4', textColor.secondary]">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Thing Type Edit Form -->
    <div v-else>
      <PageHeader 
        title="Edit Thing Type" 
        :subtitle="`Updating ${type.type}`"
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
      
      <Card>
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">Thing Type Information</h2>
        </template>
        <template #content>
          <EntityForm
            :loading="loading"
            submit-label="Save Changes"
            @submit="submitForm"
            @cancel="$router.back()"
          >
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Type Name -->
              <FormField
                id="type"
                label="Type Name"
                :required="true"
                :error-message="v$.type.$errors[0]?.$message"
                class="md:col-span-2"
              >
                <InputText
                  id="type"
                  v-model="type.type"
                  placeholder="Temperature Sensor"
                  class="w-full"
                  :class="{ 'p-invalid': v$.type.$error }"
                />
              </FormField>
              
              <!-- Code (read-only) -->
              <FormField
                id="code"
                label="Code"
                hint="Not editable after creation"
              >
                <InputText
                  id="code"
                  v-model="type.code"
                  class="w-full font-mono disabled-field"
                  readonly
                  disabled
                />
              </FormField>
              
              <!-- Abbreviation Preview -->
              <FormField
                id="abbreviation"
                label="Abbreviation"
                hint="Used in thing identifiers"
              >
                <div class="flex items-center">
                  <span :class="[
                    'text-sm font-mono px-2 py-1 rounded',
                    themeValue.class('bg-blue-50 text-blue-700', 'bg-blue-900/20 text-blue-300')
                  ]">
                    {{ getTypeAbbreviation(type.code || '') }}
                  </span>
                </div>
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
                  v-model="type.description"
                  rows="3"
                  placeholder="Enter a description for this thing type"
                  class="w-full"
                  :class="{ 'p-invalid': v$.description.$error }"
                />
              </FormField>

              <!-- Style Preview -->
              <FormField
                id="style-preview"
                label="Style Preview"
                class="md:col-span-2"
              >
                <div class="flex items-center mt-2">
                  <span 
                    :class="[getTypeClass(type.code), 'px-3 py-1 rounded-full text-sm']"
                  >
                    {{ type.type }}
                  </span>
                </div>
              </FormField>
            </div>
            
            <!-- Edit notes -->
            <div :class="[
              'mt-6 p-4 rounded-md text-sm',
              backgroundColor.secondary,
              borderColor.light,
              textColor.secondary
            ]">
              <div class="flex items-start">
                <i :class="['pi pi-info-circle mt-0.5 mr-2', themeValue.class('text-blue-500', 'text-blue-400')]"></i>
                <div>
                  <p><strong>Note:</strong> The thing type code cannot be changed after creation as it may be used by existing things.</p>
                  <p class="mt-1">If you need to use a different code, please create a new thing type and update your things accordingly.</p>
                </div>
              </div>
            </div>
          </EntityForm>
        </template>
      </Card>
      
      <!-- Code Example Card -->
      <Card class="mt-6">
        <template #title>
          <h2 :class="['text-xl font-semibold', textColor.primary]">Code Example</h2>
        </template>
        <template #content>
          <p :class="['mb-3', textColor.secondary]">
            This is an example of how this thing type's code is used to generate thing codes:
          </p>
          
          <div :class="[
            'p-4 rounded-md font-mono border',
            backgroundColor.secondary,
            borderColor.default
          ]">
            <div :class="textColor.secondary">// Example thing code structure</div>
            <div class="mt-2">
              <span :class="themeValue.class('text-blue-600', 'text-blue-400')">{{ getTypeAbbreviation(type.code) }}</span>
              <span :class="textColor.secondary">-location_identifier-001</span>
            </div>
            <div :class="['mt-2', textColor.secondary]">// e.g., {{ getTypeAbbreviation(type.code) }}-main-001</div>
          </div>
        </template>
      </Card>
      
      <!-- Toast for success/error messages -->
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useThingType } from '../../../composables/useThingType'
import { useTypeForm } from '../../../composables/useTypeForm'
import { useTheme } from '../../../composables/useTheme'
import { thingTypeService } from '../../../services'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor, shadowStyle } = useTheme()

// Route names for navigation
const routeNames = {
  list: 'thing-types',
  detail: 'thing-type-detail',
  create: 'create-thing-type', 
  edit: 'edit-thing-type'
}

// Get thing type functionality
const { fetchType, error, getTypeAbbreviation, getTypeClass } = useThingType()

// Use the type form composable in edit mode
const { 
  type, 
  v$, 
  loading, 
  loadType,
  submitForm 
} = useTypeForm(thingTypeService, {
  mode: 'edit',
  entityName: 'Thing Type',
  routeNames
})

// Initial loading state
const initialLoading = ref(true)

// Fetch thing type data on component mount
onMounted(async () => {
  const id = route.params.id
  if (!id) return
  
  try {
    // Fetch thing type data
    const typeData = await fetchType(id)
    
    // Load data into form
    if (typeData) {
      loadType(typeData)
    }
  } finally {
    initialLoading.value = false
  }
})
</script>

<style scoped>
/* Theme-aware styling */
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
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-card .p-card-content) {
  padding: 1.5rem;
}

/* Form input styling */
.disabled-field {
  opacity: 0.7;
  cursor: not-allowed;
}

:deep(.p-inputtext),
:deep(.p-textarea) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-textarea:enabled:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem var(--primary-color-transparent);
}

/* Fix PrimeVue Card styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

/* Fix disabled input styling in dark mode */
:deep(.dark .p-inputtext:disabled),
:deep(.dark .p-textarea:disabled) {
  background-color: var(--surface-hover);
  color: var(--text-color-secondary);
  opacity: 0.7;
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext),
:deep(.dark .p-textarea) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}
</style>
