<template>
  <div>
    <!-- Loading Spinner -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <ProgressSpinner strokeWidth="4" />
    </div>
    
    <!-- Error Message -->
    <div v-else-if="error" class="card p-6 text-center">
      <div class="text-red-500 text-xl mb-4">
        <i class="pi pi-exclamation-circle mr-2"></i>
        Failed to load permission details
      </div>
      <p class="text-gray-600 mb-4">{{ error }}</p>
      <Button label="Go Back" icon="pi pi-arrow-left" @click="$router.back()" />
    </div>
    
    <!-- Permission Details -->
    <div v-else-if="permission">
      <div class="flex justify-between items-start mb-6">
        <div>
          <div class="text-sm text-gray-500 mb-1">Topic Permission</div>
          <h1 class="text-2xl font-bold text-gray-800 mb-1">{{ permission.name }}</h1>
          <div class="text-gray-600">
            <span class="font-mono">{{ permission.topic_pattern }}</span>
          </div>
        </div>
        
        <div class="flex space-x-2">
          <Button
            icon="pi pi-pencil"
            label="Edit"
            class="p-button-outlined"
            @click="navigateToEdit"
          />
          <Button
            icon="pi pi-trash"
            label="Delete"
            class="p-button-outlined p-button-danger"
            @click="confirmDelete"
          />
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Details Card -->
        <div class="card lg:col-span-2">
          <h2 class="text-xl font-semibold mb-4">Permission Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6">
            <!-- Name -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Name</div>
              <div class="text-lg">{{ permission.name }}</div>
            </div>
            
            <!-- Client Reference -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Client</div>
              <router-link 
                v-if="permission.client && permission.client.id"
                :to="{ name: 'client-detail', params: { id: permission.client.id } }"
                class="text-primary-600 hover:underline flex items-center"
              >
                {{ permission.client.username }}
                <span class="text-gray-500 ml-2 text-sm">{{ permission.client.name }}</span>
              </router-link>
              <span v-else class="text-gray-500">{{ permission.client_id }}</span>
            </div>
            
            <!-- Topic Pattern -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Topic Pattern</div>
              <div class="bg-gray-50 p-3 rounded border border-gray-200 font-mono text-gray-800">
                {{ permission.topic_pattern }}
              </div>
            </div>
            
            <!-- Pattern Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Pattern Type</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getPatternTypeClass(permission.pattern_type)"
                >
                  {{ formatPatternType(permission.pattern_type) }}
                </span>
              </div>
            </div>
            
            <!-- Permission Type -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Permission</div>
              <div class="flex items-center">
                <span 
                  class="px-2 py-1 text-xs rounded-full font-medium inline-block"
                  :class="getPermissionTypeClass(permission.permission_type)"
                >
                  {{ formatPermissionType(permission.permission_type) }}
                </span>
              </div>
            </div>
            
            <!-- Description -->
            <div class="md:col-span-2">
              <div class="text-sm text-gray-500 mb-1">Description</div>
              <div class="text-gray-700">{{ permission.description || 'No description provided' }}</div>
            </div>
          </div>
        </div>
        
        <!-- Information Card -->
        <div class="card">
          <h2 class="text-xl font-semibold mb-4">Information</h2>
          
          <div class="space-y-6">
            <!-- Pattern Type explanation -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Pattern Type Explanation</div>
              <div class="text-gray-700">
                <p v-if="permission.pattern_type === 'exact'">
                  Matches only the exact topic string. 
                  No wildcards are interpreted.
                </p>
                <p v-else-if="permission.pattern_type === 'prefix'">
                  Matches all topics that start with this prefix.
                  Equivalent to adding "/#" at the end.
                </p>
                <p v-else-if="permission.pattern_type === 'pattern'">
                  Wildcards are interpreted:
                  <ul class="list-disc ml-5 mt-1">
                    <li class="mb-1">'+' matches exactly one topic level</li>
                    <li>'#' matches zero or more topic levels (must be last character)</li>
                  </ul>
                </p>
              </div>
            </div>
            
            <!-- Example Topics -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Example Matching Topics</div>
              <div class="text-gray-700">
                <div v-for="(example, index) in matchingExamples" :key="index" class="mb-1">
                  <code class="bg-gray-100 px-2 py-0.5 rounded font-mono">{{ example }}</code>
                </div>
                <p v-if="matchingExamples.length === 0" class="text-gray-500 italic">
                  No examples available
                </p>
              </div>
            </div>
            
            <!-- Created Date -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Created</div>
              <div class="text-gray-700">{{ formatDate(permission.created) }}</div>
            </div>
            
            <!-- Last Updated -->
            <div>
              <div class="text-sm text-gray-500 mb-1">Last Updated</div>
              <div class="text-gray-700">{{ formatDate(permission.updated) }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Dialog -->
    <ConfirmationDialog
      v-model:visible="deleteDialog.visible"
      title="Delete Permission"
      type="danger"
      confirm-label="Delete"
      confirm-icon="pi pi-trash"
      :loading="deleteDialog.loading"
      :message="`Are you sure you want to delete permission '${permission?.name || ''}'?`"
      details="This action cannot be undone."
      @confirm="deletePermission"
    />
    
    <!-- Toast for success/error messages -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import { topicPermissionService, formatPermissionType, formatPatternType } from '../../../services/topicPermission'
import ConfirmationDialog from '../../../components/common/ConfirmationDialog.vue'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import ProgressSpinner from 'primevue/progressspinner'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Data
const permission = ref(null)
const loading = ref(true)
const error = ref(null)
const deleteDialog = ref({
  visible: false,
  loading: false
})

// Generate example matching topics based on the pattern
const matchingExamples = computed(() => {
  if (!permission.value) return []
  
  const examples = []
  const topic = permission.value.topic_pattern
  
  switch (permission.value.pattern_type) {
    case 'exact':
      examples.push(topic)
      break
    case 'prefix':
      examples.push(topic)
      examples.push(`${topic}/subtopic`)
      examples.push(`${topic}/subtopic/detail`)
      break
    case 'pattern':
      if (topic.includes('+')) {
        // Replace + with example values
        const base = topic.replace(/\+/g, 'example')
        examples.push(base)
        
        // If there are multiple + wildcards, show variants
        if ((topic.match(/\+/g) || []).length > 1) {
          examples.push(topic.replace(/\+/g, 'value'))
        }
      }
      
      if (topic.includes('#')) {
        // Show examples for # wildcard
        const basePath = topic.substring(0, topic.indexOf('#'))
        examples.push(basePath)
        examples.push(`${basePath}subtopic`)
        examples.push(`${basePath}subtopic/detail`)
      }
      break
  }
  
  return examples
})

// Fetch permission data on component mount
onMounted(async () => {
  await fetchPermission()
})

// Methods
const fetchPermission = async () => {
  const id = route.params.id
  if (!id) {
    error.value = 'Invalid permission ID'
    loading.value = false
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await topicPermissionService.getTopicPermission(id)
    permission.value = response.data
  } catch (err) {
    console.error('Error fetching permission:', err)
    error.value = 'Failed to load permission details. Please try again.'
  } finally {
    loading.value = false
  }
}

const navigateToEdit = () => {
  router.push({ name: 'edit-topic-permission', params: { id: permission.value.id } })
}

const confirmDelete = () => {
  deleteDialog.value.visible = true
}

const deletePermission = async () => {
  deleteDialog.value.loading = true
  try {
    await topicPermissionService.deleteTopicPermission(permission.value.id)
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Permission ${permission.value.name} has been deleted`,
      life: 3000
    })
    
    deleteDialog.value.visible = false
    router.push({ name: 'topic-permissions' })
  } catch (error) {
    console.error('Error deleting permission:', error)
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to delete permission',
      life: 3000
    })
  } finally {
    deleteDialog.value.loading = false
  }
}

// Helper methods
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return dayjs(dateString).format('MMM D, YYYY HH:mm')
}

const getPermissionTypeClass = (permissionType) => {
  switch (permissionType) {
    case 'read': return 'bg-green-100 text-green-800'
    case 'write': return 'bg-blue-100 text-blue-800'
    case 'readwrite': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getPatternTypeClass = (patternType) => {
  switch (patternType) {
    case 'exact': return 'bg-blue-100 text-blue-800'
    case 'prefix': return 'bg-yellow-100 text-yellow-800'
    case 'pattern': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}
</script>
