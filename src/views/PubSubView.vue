<!-- src/views/PubSubView.vue -->
<template>
  <div class="pubsub-view">
    <PageHeader title="Pub/Sub" subtitle="Create and manage NATS message publishers and subscribers">
      <template #actions>
        <div class="flex gap-2">
          <Button 
            v-if="!editMode"
            label="Edit Mode" 
            icon="pi pi-pencil" 
            @click="toggleEditMode"
            class="mr-2"
          />
          <Button 
            v-else
            label="Exit Edit" 
            icon="pi pi-check" 
            @click="toggleEditMode"
            class="p-button-success mr-2"
          />
          <Button 
            label="Import" 
            icon="pi pi-upload" 
            class="p-button-outlined mr-2"
            @click="importConfig"
          />
          <Button 
            label="Export" 
            icon="pi pi-download" 
            class="p-button-outlined"
            @click="exportConfig"
          />
        </div>
      </template>
    </PageHeader>

    <!-- Main layout area with buttons -->
    <div class="card">
      <div v-if="!isConnected" class="flex flex-col justify-center items-center py-8">
        <i class="pi pi-wifi text-red-500 text-4xl mb-2"></i>
        <p class="text-content-secondary dark:text-content-secondary-dark mb-4">
          Not connected to NATS server. Please connect before using Pub/Sub.
        </p>
        <Button 
          label="Go to NATS Settings" 
          icon="pi pi-cog" 
          @click="navigateToSettings"
        />
      </div>
      
      <div v-else-if="!buttons.length && !editMode" class="flex flex-col justify-center items-center py-8">
        <i class="pi pi-info-circle text-blue-500 text-4xl mb-2"></i>
        <p class="text-content-secondary dark:text-content-secondary-dark mb-4">
          No buttons configured yet. Switch to Edit Mode to add buttons.
        </p>
        <Button 
          label="Enter Edit Mode" 
          icon="pi pi-pencil" 
          @click="toggleEditMode"
        />
      </div>
      
      <div v-else>
        <!-- Layout controls shown only in edit mode - COMPLETELY REDESIGNED -->
        <div v-if="editMode" class="layout-controls mb-4 p-4 bg-surface-secondary dark:bg-gray-800 rounded-lg">
          <!-- Use grid layout for better control -->
          <div class="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <!-- Heading - spans full width on mobile, 3 columns on desktop -->
            <div class="md:col-span-3">
              <h3 class="text-lg font-medium">Layout Configuration</h3>
            </div>
            
            <!-- Controls container - spans full width on mobile, 9 columns on desktop -->
            <div class="md:col-span-9 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
              <!-- Columns Control - spans full width on mobile, 4 columns on sm+ -->
              <div class="sm:col-span-4 flex items-center">
                <label for="grid-columns" class="whitespace-nowrap mr-3 w-20">Columns:</label>
                <div class="flex-grow">
                  <InputNumber 
                    id="grid-columns" 
                    v-model="layout.columns" 
                    :min="1" 
                    :max="12" 
                    showButtons 
                    buttonLayout="horizontal"
                    class="w-full"
                    :inputStyle="{ width: '100%' }"
                  />
                </div>
              </div>
              
              <!-- Gap Control - spans full width on mobile, 4 columns on sm+ -->
              <div class="sm:col-span-4 flex items-center">
                <label for="gap-size" class="whitespace-nowrap mr-3 w-20">Gap:</label>
                <div class="flex-grow">
                  <InputNumber 
                    id="gap-size" 
                    v-model="layout.gap" 
                    :min="0" 
                    :max="8" 
                    showButtons 
                    buttonLayout="horizontal"
                    class="w-full"
                    :inputStyle="{ width: '100%' }"
                  />
                </div>
              </div>

              <!-- Add Button - spans full width on mobile, 4 columns on sm+ -->
              <div class="sm:col-span-4">
                <Button 
                  label="Add Button" 
                  icon="pi pi-plus" 
                  @click="openAddButtonDialog"
                  class="w-full"
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Button grid -->
        <div :class="[
          'button-grid transition-all duration-300',
          `gap-${layout.gap}`,
          editMode ? 'edit-mode' : ''
        ]"
        :style="{
          display: 'grid',
          gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`
        }">
          <PubSubButton
            v-for="button in buttons"
            :key="button.id"
            :button="button"
            :edit-mode="editMode"
            @click="publishMessage(button)"
            @edit="editButton(button)"
            @delete="confirmDeleteButton(button)"
          />
          
          <!-- Placeholder shown in edit mode when no buttons configured -->
          <div 
            v-if="editMode && !buttons.length" 
            class="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            @click="openAddButtonDialog"
          >
            <i class="pi pi-plus text-gray-400 dark:text-gray-600 mr-2"></i>
            <span class="text-gray-500 dark:text-gray-400">Add Button</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Subscriber Data Panel -->
    <div v-if="hasSubscriptions" class="card mt-4">
      <TabView>
        <TabPanel 
          v-for="sub in subscriptions" 
          :key="sub.id" 
          :header="sub.label || sub.topic"
        >
          <PubSubSubscriptionPanel :subscription="sub" />
        </TabPanel>
      </TabView>
    </div>

    <!-- Button configuration dialog - IMPROVED LAYOUT -->
    <Dialog 
      v-model:visible="buttonDialogVisible" 
      :header="dialogMode === 'add' ? 'Add Button' : 'Edit Button'" 
      modal 
      :style="{ width: '90%', maxWidth: '650px' }"
      class="pubsub-dialog"
    >
      <div class="p-fluid">
        <!-- Basic Settings -->
        <h3 class="text-lg font-medium mb-3">Button Settings</h3>
        <div class="field mb-4">
          <label for="button-label" class="font-medium">Button Label</label>
          <InputText id="button-label" v-model="currentButton.label" />
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="button-color" class="font-medium">Button Color</label>
            <Dropdown
              id="button-color"
              v-model="currentButton.style.color"
              :options="buttonColorOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
          
          <div class="field">
            <label for="button-size" class="font-medium">Button Size</label>
            <Dropdown
              id="button-size"
              v-model="currentButton.style.size"
              :options="buttonSizeOptions"
              optionLabel="label"
              optionValue="value"
            />
          </div>
        </div>
        
        <!-- Topic Selection -->
        <h3 class="text-lg font-medium mb-3 mt-5">Topic Configuration</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="field">
            <label for="button-edge" class="font-medium">Edge</label>
            <Dropdown
              id="button-edge"
              v-model="selectedEdge"
              :options="edges"
              optionLabel="name"
              placeholder="Select Edge"
              @change="onEdgeChange"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <div><b>{{ slotProps.option.code }}</b> - {{ slotProps.option.name }}</div>
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value">
                  <b>{{ slotProps.value.code }}</b> - {{ slotProps.value.name }}
                </div>
                <div v-else>
                  Select Edge
                </div>
              </template>
            </Dropdown>
          </div>
          
          <div class="field">
            <label for="button-thing" class="font-medium">Thing</label>
            <Dropdown
              id="button-thing"
              v-model="selectedThing"
              :options="filteredThings"
              optionLabel="name"
              placeholder="Select Thing"
              @change="onThingChange"
              :disabled="!selectedEdge"
            >
              <template #option="slotProps">
                <div class="flex align-items-center">
                  <div><b>{{ slotProps.option.code }}</b> - {{ slotProps.option.name }}</div>
                </div>
              </template>
              <template #value="slotProps">
                <div v-if="slotProps.value">
                  <b>{{ slotProps.value.code }}</b> - {{ slotProps.value.name }}
                </div>
                <div v-else>
                  Select Thing
                </div>
              </template>
            </Dropdown>
          </div>
        </div>
        
        <div class="field mb-4">
          <label for="message-category" class="font-medium">Message Category</label>
          <Dropdown
            id="message-category"
            v-model="currentButton.messageCategory"
            :options="messageCategoryOptions"
            optionLabel="label"
            optionValue="value"
            @change="updateTopicFromComponents"
          />
        </div>
        
        <div class="field mb-4">
          <label for="button-topic" class="font-medium">Topic</label>
          <InputText id="button-topic" v-model="currentButton.topic" />
          <small class="text-content-secondary dark:text-content-secondary-dark">
            Standard format: {org_id}.{edge_code}.{thing_type}.{thing_code}.{message_type}
          </small>
        </div>
        
        <!-- Message Template Selection -->
        <h3 class="text-lg font-medium mb-3 mt-5">Message Content</h3>
        <div class="field mb-4">
          <label for="message-template" class="font-medium">Message Template</label>
          <Dropdown
            id="message-template"
            v-model="selectedTemplate"
            :options="messageTemplates"
            optionLabel="name"
            placeholder="Select a template or create custom"
            @change="onTemplateChange"
          />
        </div>
        
        <div class="field mb-4">
          <label for="message-type" class="font-medium">Message Type</label>
          <InputText 
            id="message-type" 
            v-model="currentButton.messageType" 
            placeholder="e.g., sensor.temperature.reading"
          />
          <small class="text-content-secondary dark:text-content-secondary-dark">
            Format: {domain}.{entity}.{action} (e.g., sensor.temperature.reading)
          </small>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Payload Editor -->
          <div class="field">
            <label for="payload-editor" class="font-medium">Payload</label>
            <Textarea
              id="payload-editor"
              v-model="payloadJSON"
              rows="10"
              class="font-mono text-sm"
              :class="{ 'p-invalid': payloadError }"
            />
            <small v-if="payloadError" class="p-error block mt-1">{{ payloadError }}</small>
            <small v-else class="text-content-secondary dark:text-content-secondary-dark">
              Event-specific data in JSON format
            </small>
          </div>
          
          <!-- Metadata Editor -->
          <div class="field">
            <label for="metadata-editor" class="font-medium">Metadata</label>
            <Textarea
              id="metadata-editor"
              v-model="metadataJSON"
              rows="10"
              class="font-mono text-sm"
              :class="{ 'p-invalid': metadataError }"
            />
            <small v-if="metadataError" class="p-error block mt-1">{{ metadataError }}</small>
            <small v-else class="text-content-secondary dark:text-content-secondary-dark">
              Thing state/health data in JSON format
            </small>
          </div>
        </div>
        
        <div class="field mb-4 mt-4">
          <label for="context-editor" class="font-medium">Context</label>
          <Textarea
            id="context-editor"
            v-model="contextJSON"
            rows="6"
            class="font-mono text-sm"
            :class="{ 'p-invalid': contextError }"
          />
          <small v-if="contextError" class="p-error block mt-1">{{ contextError }}</small>
          <small v-else class="text-content-secondary dark:text-content-secondary-dark">
            Operational context (leave empty for auto-generated context from Thing and Edge)
          </small>
        </div>
        
        <div class="field-checkbox my-4">
          <Checkbox
            id="add-subscription"
            v-model="currentButton.createSubscription"
            :binary="true"
          />
          <label for="add-subscription" class="ml-2">
            Create subscription for this topic
          </label>
        </div>
      </div>
      
      <template #footer>
        <div class="flex flex-col sm:flex-row justify-end gap-2">
          <Button 
            label="Cancel" 
            icon="pi pi-times" 
            class="p-button-text w-full sm:w-auto" 
            @click="buttonDialogVisible = false"
          />
          <Button 
            label="Save" 
            icon="pi pi-check" 
            class="w-full sm:w-auto"
            @click="saveButton"
            :disabled="hasErrors"
          />
        </div>
      </template>
    </Dialog>

    <!-- Confirmation dialog -->
    <ConfirmDialog></ConfirmDialog>
    
    <!-- File input for import (hidden) -->
    <input 
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import PageHeader from '../components/common/PageHeader.vue'
import PubSubButton from '../components/pubsub/PubSubButton.vue'
import PubSubSubscriptionPanel from '../components/pubsub/PubSubSubscriptionPanel.vue'
import { usePubSub } from '../composables/usePubSub'
import { useNatsSettings } from '../composables/useNatsSettings'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Checkbox from 'primevue/checkbox'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ConfirmDialog from 'primevue/confirmdialog'

// Initialize services and composables
const router = useRouter()
const confirm = useConfirm()
const toast = useToast()
const fileInput = ref(null)

// Get NATS connection status
const { isConnected } = useNatsSettings()

// Use the PubSub composable
const {
  buttons,
  subscriptions,
  layout,
  edges,
  things,
  organizationCode,
  saveConfig,
  loadConfig,
  addButton,
  updateButton,
  deleteButton,
  publishMessage,
  importConfiguration,
  exportConfiguration,
  generateTopicFromButton,
  getMessageTemplates
} = usePubSub()

// Component state
const editMode = ref(false)
const buttonDialogVisible = ref(false)
const dialogMode = ref('add') // 'add' or 'edit'

// For edge/thing selection
const selectedEdge = ref(null)
const selectedThing = ref(null)
const filteredThings = computed(() => {
  if (!selectedEdge.value) return []
  
  return things.value.filter(thing => 
    thing.edge_id === selectedEdge.value.id
  )
})

// Message content editing
const selectedTemplate = ref(null)
const messageTemplates = ref(getMessageTemplates())
const payloadJSON = ref('{}')
const metadataJSON = ref('{}')
const contextJSON = ref('{}')
const payloadError = ref(null)
const metadataError = ref(null)
const contextError = ref(null)

// Current button being edited
const currentButton = ref({
  id: '',
  label: '',
  topic: '',
  edgeId: '',
  edgeCode: '',
  thingId: '',
  thingCode: '',
  thingType: '',
  messageType: 'custom.message.type',
  messageCategory: 'event',
  message: {
    payload: {},
    metadata: {},
    context: {},
    version: 1
  },
  style: {
    color: 'primary',
    size: 'medium'
  },
  createSubscription: false
})

// Computed properties
const hasSubscriptions = computed(() => subscriptions.value.length > 0)
const hasErrors = computed(() => payloadError.value || metadataError.value || contextError.value)

// Button style options
const buttonColorOptions = [
  { label: 'Primary', value: 'primary' },
  { label: 'Secondary', value: 'secondary' },
  { label: 'Success', value: 'success' },
  { label: 'Info', value: 'info' },
  { label: 'Warning', value: 'warning' },
  { label: 'Danger', value: 'danger' }
]

const buttonSizeOptions = [
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' }
]

const messageCategoryOptions = [
  { label: 'Event', value: 'event' },
  { label: 'Telemetry', value: 'telemetry' },
  { label: 'Command', value: 'command' },
  { label: 'Response', value: 'response' },
  { label: 'Status', value: 'status' }
]

// Load configuration on mount
onMounted(() => {
  loadConfig()
})

// Watch for changes to the JSON fields and validate
watch(payloadJSON, (newValue) => {
  try {
    if (!newValue.trim()) {
      payloadJSON.value = '{}'
      payloadError.value = null
      return
    }
    
    JSON.parse(newValue)
    payloadError.value = null
    
    // Update current button payload
    currentButton.value.message.payload = JSON.parse(newValue)
  } catch (err) {
    payloadError.value = 'Invalid JSON: ' + err.message
  }
})

watch(metadataJSON, (newValue) => {
  try {
    if (!newValue.trim()) {
      metadataJSON.value = '{}'
      metadataError.value = null
      return
    }
    
    JSON.parse(newValue)
    metadataError.value = null
    
    // Update current button metadata
    currentButton.value.message.metadata = JSON.parse(newValue)
  } catch (err) {
    metadataError.value = 'Invalid JSON: ' + err.message
  }
})

watch(contextJSON, (newValue) => {
  try {
    if (!newValue.trim()) {
      contextJSON.value = '{}'
      contextError.value = null
      return
    }
    
    JSON.parse(newValue)
    contextError.value = null
    
    // Update current button context
    currentButton.value.message.context = JSON.parse(newValue)
  } catch (err) {
    contextError.value = 'Invalid JSON: ' + err.message
  }
})

// Toggle edit mode
function toggleEditMode() {
  editMode.value = !editMode.value
  
  // Save configuration when exiting edit mode
  if (!editMode.value) {
    saveConfig()
    toast.add({
      severity: 'success',
      summary: 'Configuration Saved',
      detail: 'Your Pub/Sub configuration has been saved.',
      life: 3000
    })
  }
}

// Open the dialog to add a new button
function openAddButtonDialog() {
  dialogMode.value = 'add'
  selectedEdge.value = null
  selectedThing.value = null
  selectedTemplate.value = null
  
  currentButton.value = {
    id: Date.now().toString(),
    label: 'New Button',
    topic: '',
    edgeId: '',
    edgeCode: '',
    thingId: '',
    thingCode: '',
    thingType: '',
    messageType: 'custom.message.type',
    messageCategory: 'event',
    message: {
      payload: {},
      metadata: {},
      context: {},
      version: 1
    },
    style: {
      color: 'primary',
      size: 'medium'
    },
    createSubscription: false
  }
  
  payloadJSON.value = JSON.stringify({}, null, 2)
  metadataJSON.value = JSON.stringify({}, null, 2)
  contextJSON.value = JSON.stringify({}, null, 2)
  
  buttonDialogVisible.value = true
}

// Edit an existing button
function editButton(button) {
  dialogMode.value = 'edit'
  
  // Deep copy the button configuration
  currentButton.value = JSON.parse(JSON.stringify(button))
  
  // Find the selected edge and thing
  if (button.edgeId) {
    selectedEdge.value = edges.value.find(e => e.id === button.edgeId) || null
  } else {
    selectedEdge.value = null
  }
  
  if (button.thingId) {
    selectedThing.value = things.value.find(t => t.id === button.thingId) || null
  } else {
    selectedThing.value = null
  }
  
  // Find template that matches message type if any
  selectedTemplate.value = messageTemplates.value.find(t => t.type === button.messageType) || null
  
  // Set JSON editor values
  payloadJSON.value = JSON.stringify(button.message?.payload || {}, null, 2)
  metadataJSON.value = JSON.stringify(button.message?.metadata || {}, null, 2)
  contextJSON.value = JSON.stringify(button.message?.context || {}, null, 2)
  
  // Update the topic
  updateTopicFromComponents()
  
  buttonDialogVisible.value = true
}

// Save the current button (either add or update)
function saveButton() {
  try {
    // Parse JSON fields
    currentButton.value.message.payload = JSON.parse(payloadJSON.value || '{}')
    currentButton.value.message.metadata = JSON.parse(metadataJSON.value || '{}')
    currentButton.value.message.context = JSON.parse(contextJSON.value || '{}')
    
    // Always update the topic from components
    updateTopicFromComponents()
    
    if (dialogMode.value === 'add') {
      addButton(currentButton.value)
      toast.add({
        severity: 'success',
        summary: 'Button Added',
        detail: `Button "${currentButton.value.label}" has been added.`,
        life: 3000
      })
    } else {
      updateButton(currentButton.value)
      toast.add({
        severity: 'success',
        summary: 'Button Updated',
        detail: `Button "${currentButton.value.label}" has been updated.`,
        life: 3000
      })
    }
    
    // Save configuration
    saveConfig()
    
    // Close the dialog
    buttonDialogVisible.value = false
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Save Failed',
      detail: 'Failed to save: ' + err.message,
      life: 3000
    })
  }
}

// Update topic based on edge/thing selection
function updateTopicFromComponents() {
  // Update topic based on selected components
  if (selectedEdge.value) {
    currentButton.value.edgeId = selectedEdge.value.id
    currentButton.value.edgeCode = selectedEdge.value.code
  }
  
  if (selectedThing.value) {
    currentButton.value.thingId = selectedThing.value.id
    currentButton.value.thingCode = selectedThing.value.code
    currentButton.value.thingType = selectedThing.value.type
  }
  
  // Always regenerate the topic based on components
  currentButton.value.topic = generateTopicFromButton(currentButton.value)
}

// Handle edge selection change
function onEdgeChange() {
  if (selectedEdge.value) {
    currentButton.value.edgeId = selectedEdge.value.id
    currentButton.value.edgeCode = selectedEdge.value.code
    
    // Clear thing selection if edge changes
    if (selectedThing.value && selectedThing.value.edge_id !== selectedEdge.value.id) {
      selectedThing.value = null
      currentButton.value.thingId = ''
      currentButton.value.thingCode = ''
      currentButton.value.thingType = ''
    }
    
    updateTopicFromComponents()
  }
}

// Handle thing selection change
function onThingChange() {
  if (selectedThing.value) {
    currentButton.value.thingId = selectedThing.value.id
    currentButton.value.thingCode = selectedThing.value.code
    currentButton.value.thingType = selectedThing.value.type
    
    updateTopicFromComponents()
  }
}

// Handle template selection change
function onTemplateChange() {
  if (!selectedTemplate.value) return;
  
  // Update message type
  currentButton.value.messageType = selectedTemplate.value.type;
  
  // Update JSON editors
  payloadJSON.value = JSON.stringify(selectedTemplate.value.payload, null, 2);
  metadataJSON.value = JSON.stringify(selectedTemplate.value.metadata, null, 2);
  
  // Update the message in the current button
  currentButton.value.message.payload = selectedTemplate.value.payload;
  currentButton.value.message.metadata = selectedTemplate.value.metadata;
  
  // Update the topic when template changes
  updateTopicFromComponents();
}

// Confirm and delete a button
function confirmDeleteButton(button) {
  confirm.require({
    message: `Are you sure you want to delete the button "${button.label}"?`,
    header: 'Confirm Delete',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    accept: () => {
      deleteButton(button.id)
      saveConfig()
      toast.add({
        severity: 'success',
        summary: 'Button Deleted',
        detail: `Button "${button.label}" has been deleted.`,
        life: 3000
      })
    }
  })
}

// Navigate to NATS settings
function navigateToSettings() {
  router.push('/settings')
}

// Import configuration
function importConfig() {
  // Trigger file input click to open file dialog
  fileInput.value.click()
}

// Handle file import after selection
function handleFileImport(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const config = importConfiguration(e.target.result)
      toast.add({
        severity: 'success',
        summary: 'Configuration Imported',
        detail: `Successfully imported configuration with ${config.buttons.length} buttons.`,
        life: 3000
      })
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: 'Import Failed',
        detail: err.message,
        life: 5000
      })
    }
    
    // Reset file input
    event.target.value = ''
  }
  
  reader.readAsText(file)
}

// Export configuration
function exportConfig() {
  exportConfiguration()
  toast.add({
    severity: 'success',
    summary: 'Configuration Exported',
    detail: 'Configuration exported successfully.',
    life: 3000
  })
}
</script>

<style scoped>
.button-grid {
  min-height: 100px;
  transition: all 0.3s ease;
}

.button-grid.edit-mode {
  background-color: rgba(0, 0, 0, 0.02);
  border-radius: 0.375rem;
  border: 1px dashed var(--surface-border, #e5e7eb);
  padding: 1rem;
}

/* Dark mode support */
:deep(.dark) .button-grid.edit-mode {
  background-color: rgba(255, 255, 255, 0.02);
  border-color: var(--surface-border, #4b5563);
}

/* Enhanced dialog styling */
:deep(.pubsub-dialog .p-dialog-content) {
  max-height: 70vh;
  overflow-y: auto;
}

/* Improve textarea responsiveness */
:deep(.pubsub-dialog textarea.p-inputtextarea) {
  resize: vertical;
  min-height: 100px;
}

/* Better dropdown display on small screens */
@media (max-width: 640px) {
  :deep(.p-dropdown-panel) {
    width: 100%;
    max-width: 100vw;
  }
  
  :deep(.pubsub-dialog .p-dialog-content) {
    padding: 0.75rem;
  }
}

/* Enhanced styles for PrimeVue integration */
:deep(.layout-controls .p-inputnumber) {
  width: 100%;
}

:deep(.layout-controls .p-inputnumber-buttons-horizontal .p-inputnumber-input) {
  width: 100%;
  text-align: center;
}

/* Control overlapping UI elements on smaller screens */
@media (max-width: 768px) {
  :deep(.p-inputnumber-button-up),
  :deep(.p-inputnumber-button-down) {
    width: 2rem !important;
  }
}

/* Fix PrimeVue InputNumber width issues across screen sizes */
:deep(.p-inputnumber.p-component) {
  display: flex;
}

/* Gap utilities based on layout settings */
.gap-0 { gap: 0; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-5 { gap: 1.25rem; }
.gap-6 { gap: 1.5rem; }
.gap-7 { gap: 1.75rem; }
.gap-8 { gap: 2rem; }
</style>
