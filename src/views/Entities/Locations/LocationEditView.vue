<template>
  <div>
    <PageHeader 
      title="Edit Location" 
      :subtitle="`Updating location details`"
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
      <h2 class="text-xl font-semibold mb-4">Location Form</h2>
      <p class="text-gray-500 mb-6">This is a placeholder for the location edit form.</p>
      
      <div class="flex justify-end gap-3">
        <Button 
          label="Cancel" 
          icon="pi pi-times" 
          class="p-button-outlined p-button-secondary"
          @click="$router.back()" 
        />
        <Button 
          label="Save Changes" 
          icon="pi pi-check" 
          @click="updateLocation" 
        />
      </div>
    </div>
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import PageHeader from '../../../components/common/PageHeader.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'

const router = useRouter()
const toast = useToast()

const updateLocation = () => {
  toast.add({
    severity: 'info',
    summary: 'Info',
    detail: 'This is a placeholder. Location edit form will be implemented soon.',
    life: 3000
  })
}
</script>
