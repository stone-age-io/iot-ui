<template>
  <div>
    <PageHeader 
      title="Create Edge Type" 
      subtitle="Add a new edge type definition"
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
        <h2 :class="['text-xl font-semibold', textColor.primary]">Edge Type Information</h2>
      </template>
      <template #content>
        <EntityForm
          :loading="loading"
          submit-label="Create Edge Type"
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
                placeholder="Building"
                class="w-full"
                :class="{ 'p-invalid': v$.type.$error }"
                @blur="generateCode"
              />
            </FormField>
            
            <!-- Code -->
            <FormField
              id="code"
              label="Code"
              :required="true"
              :error-message="v$.code.$errors[0]?.$message"
              help-text="Short code used in edge identifiers (e.g., 'bld' for Building)"
            >
              <InputText
                id="code"
                v-model="type.code"
                placeholder="bld"
                class="w-full font-mono"
                :class="{ 'p-invalid': v$.code.$error }"
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
                v-model="type.description"
                rows="3"
                placeholder="Enter a description for this edge type"
                class="w-full"
                :class="{ 'p-invalid': v$.description.$error }"
              />
            </FormField>
          </div>
          
          <!-- Form guidance -->
          <div :class="[
            'mt-6 p-4 rounded-md text-sm',
            backgroundColor.secondary,
            borderColor.light,
            textColor.secondary
          ]">
            <div class="flex items-start">
              <i :class="['pi pi-info-circle mt-0.5 mr-2', themeValue.class('text-blue-500', 'text-blue-400')]"></i>
              <div>
                <p><strong>Note:</strong> The code should be a short (2-4 letter) lowercase identifier that will be used in edge codes.</p>
                <p class="mt-1">Example: 'bld' for Building, 'dc' for Data Center, etc.</p>
              </div>
            </div>
          </div>
        </EntityForm>
      </template>
    </Card>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useEdgeType } from '../../../composables/useEdgeType'
import { useTypeForm } from '../../../composables/useTypeForm'
import { useTheme } from '../../../composables/useTheme'
import { edgeTypeService } from '../../../services'
import PageHeader from '../../../components/common/PageHeader.vue'
import EntityForm from '../../../components/common/EntityForm.vue'
import FormField from '../../../components/common/FormField.vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

// Theme composable for theme-aware styling
const { themeValue, backgroundColor, textColor, borderColor } = useTheme()

// Get edge type validation function
const { validateCode } = useEdgeType()

// Route names for navigation
const routeNames = {
  list: 'edge-types',
  detail: 'edge-type-detail',
  create: 'create-edge-type', 
  edit: 'edit-edge-type'
}

// Use the type form composable
const { 
  type, 
  v$, 
  loading, 
  generateCode,
  submitForm 
} = useTypeForm(edgeTypeService, {
  mode: 'create',
  entityName: 'Edge Type',
  routeNames,
  validateCode
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
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-textarea) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.p-inputtext:enabled:focus),
:deep(.p-dropdown:enabled:focus),
:deep(.p-textarea:enabled:focus) {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 0.2rem var(--primary-color-transparent);
}

/* Fix PrimeVue components styling in dark mode */
:deep(.dark .p-card),
:deep(.dark .p-card .p-card-content) {
  background-color: var(--surface-card);
  color: var(--text-color);
}

:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-textarea) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-dropdown-panel),
:deep(.dark .p-dropdown-items-wrapper) {
  background-color: var(--surface-hover);
  color: var(--text-color);
}
</style>
