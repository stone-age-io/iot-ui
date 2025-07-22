# useConfirmation

## Overview

The `useConfirmation` composable provides standardized confirmation dialog functionality for user actions that require verification, such as deletions or destructive operations. It manages dialog state and provides consistent user interaction patterns.

## Location

```
src/composables/useConfirmation.js
```

## Purpose

- **Confirmation Dialog Management**: Standardized confirmation dialogs for destructive actions
- **Dialog State Management**: Reactive state for dialog visibility and content
- **User Action Verification**: Prevent accidental destructive operations
- **Consistent UX**: Uniform confirmation experience across the application
- **Entity Context**: Context-aware confirmation messages

## Dependencies

```javascript
import { ref } from 'vue'
```

## Returns

```javascript
{
  confirmDelete: Function,
  deleteDialog: Ref<Object>,
  showDeleteDialog: Ref<boolean>
}
```

---

## Properties

### deleteDialog

Reactive object containing the current dialog state and context.

**Type:** `Ref<Object>`

**Structure:**

```javascript
{
  item: Object|null,        // The item to be deleted
  entityName: string,       // Entity type name (e.g., 'Edge', 'Location')
  identifier: string        // Item identifier for display (e.g., code, name)
}
```

**Default Value:**

```javascript
{
  item: null,
  entityName: '',
  identifier: ''
}
```

### showDeleteDialog

Boolean controlling the visibility of the delete confirmation dialog.

**Type:** `Ref<boolean>`

**Default Value:** `false`

---

## Methods

### confirmDelete(item, entityName, identifierField)

Initiates a delete confirmation dialog for the specified item.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `item` | `Object` | Yes | The item to be deleted |
| `entityName` | `string` | Yes | Human-readable entity type name |
| `identifierField` | `string` | Yes | Field name to use as identifier |

**Returns:** `void`

**Usage:**

```javascript
const { confirmDelete } = useConfirmation()

// Confirm deletion of an edge
const handleDeleteEdge = (edge) => {
  confirmDelete(edge, 'Edge', 'code')
}

// Confirm deletion of a location
const handleDeleteLocation = (location) => {
  confirmDelete(location, 'Location', 'name')
}
```

---

## Usage Examples

### Basic Delete Confirmation

```vue
<template>
  <div>
    <!-- Data table with delete buttons -->
    <DataTable :value="edges">
      <Column field="code" header="Code" />
      <Column field="name" header="Name" />
      <Column header="Actions">
        <template #body="{ data }">
          <Button
            icon="pi pi-trash"
            class="p-button-danger p-button-sm"
            @click="handleDelete(data)"
          />
        </template>
      </Column>
    </DataTable>
    
    <!-- Delete confirmation dialog -->
    <ConfirmDialog 
      v-model:visible="showDeleteDialog"
      :message="deleteMessage"
      header="Confirm Deletion"
      icon="pi pi-exclamation-triangle"
      accept-class="p-button-danger"
      @accept="confirmDeleteAction"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfirmation } from '@/composables/useConfirmation'
import { useEdge } from '@/composables/useEdge'

const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()
const { edges, deleteEdge } = useEdge()

// Generate confirmation message
const deleteMessage = computed(() => {
  if (!deleteDialog.value.item) return ''
  
  return `Are you sure you want to delete ${deleteDialog.value.entityName} "${deleteDialog.value.identifier}"? This action cannot be undone.`
})

// Handle delete button click
const handleDelete = (edge) => {
  confirmDelete(edge, 'Edge', 'code')
}

// Handle confirmation dialog accept
const confirmDeleteAction = async () => {
  if (deleteDialog.value.item) {
    await deleteEdge(deleteDialog.value.item.id, deleteDialog.value.item.code)
    // Dialog automatically closes after successful deletion
  }
}
</script>
```

### Advanced Confirmation with Validation

```vue
<template>
  <div>
    <!-- Custom confirmation dialog with additional validation -->
    <ConfirmDialog 
      v-model:visible="showDeleteDialog"
      :message="deleteMessage"
      header="Confirm Deletion"
      icon="pi pi-exclamation-triangle"
      accept-class="p-button-danger"
      :accept-disabled="!canDelete"
      @accept="confirmDeleteAction"
    >
      <template #message>
        <div class="flex flex-column gap-3">
          <p>{{ deleteMessage }}</p>
          
          <!-- Additional warning for items with dependencies -->
          <div v-if="hasDependencies" class="p-3 bg-yellow-50 border border-yellow-200 rounded">
            <i class="pi pi-exclamation-triangle text-yellow-600 mr-2"></i>
            <span class="text-yellow-800">
              This {{ deleteDialog.entityName.toLowerCase() }} has {{ dependencyCount }} 
              associated {{ dependencyType }}(s). Deleting it will also remove these associations.
            </span>
          </div>
          
          <!-- Type to confirm -->
          <div v-if="requiresTypeConfirmation">
            <label class="block text-sm font-medium mb-2">
              Type <strong>{{ deleteDialog.identifier }}</strong> to confirm:
            </label>
            <InputText 
              v-model="confirmationText" 
              class="w-full"
              :class="{ 'p-invalid': confirmationText && !isConfirmationValid }"
            />
          </div>
        </div>
      </template>
    </ConfirmDialog>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useConfirmation } from '@/composables/useConfirmation'

const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()

// Additional state for advanced confirmation
const confirmationText = ref('')
const requiresTypeConfirmation = ref(false)

// Reset confirmation text when dialog changes
watch(showDeleteDialog, (isVisible) => {
  if (!isVisible) {
    confirmationText.value = ''
  }
})

watch(deleteDialog, (dialog) => {
  // Require typing confirmation for critical items
  requiresTypeConfirmation.value = dialog.item?.critical === true
}, { deep: true })

// Computed properties for validation
const isConfirmationValid = computed(() => {
  return confirmationText.value === deleteDialog.value.identifier
})

const canDelete = computed(() => {
  if (!requiresTypeConfirmation.value) return true
  return isConfirmationValid.value
})

const hasDependencies = computed(() => {
  return deleteDialog.value.item?.dependencies?.length > 0
})

const dependencyCount = computed(() => {
  return deleteDialog.value.item?.dependencies?.length || 0
})

const dependencyType = computed(() => {
  // Determine dependency type based on entity
  switch (deleteDialog.value.entityName) {
    case 'Edge': return 'location'
    case 'Location': return 'device'
    default: return 'item'
  }
})

const deleteMessage = computed(() => {
  if (!deleteDialog.value.item) return ''
  
  const baseMessage = `Are you sure you want to delete ${deleteDialog.value.entityName} "${deleteDialog.value.identifier}"?`
  
  if (requiresTypeConfirmation.value) {
    return `${baseMessage} This is a critical ${deleteDialog.value.entityName.toLowerCase()} and requires confirmation.`
  }
  
  return `${baseMessage} This action cannot be undone.`
})
</script>
```

### Multiple Confirmation Types

```javascript
// Extended confirmation composable for different action types
export function useConfirmation() {
  // Delete confirmation
  const deleteDialog = ref({
    item: null,
    entityName: '',
    identifier: ''
  })
  const showDeleteDialog = ref(false)
  
  // Generic action confirmation
  const actionDialog = ref({
    title: '',
    message: '',
    acceptLabel: 'Confirm',
    rejectLabel: 'Cancel',
    action: null
  })
  const showActionDialog = ref(false)
  
  const confirmDelete = (item, entityName, identifierField) => {
    deleteDialog.value = {
      item,
      entityName,
      identifier: item[identifierField] || 'Unknown'
    }
    showDeleteDialog.value = true
  }
  
  const confirmAction = (title, message, action, options = {}) => {
    actionDialog.value = {
      title,
      message,
      acceptLabel: options.acceptLabel || 'Confirm',
      rejectLabel: options.rejectLabel || 'Cancel',
      action
    }
    showActionDialog.value = true
  }
  
  const executeAction = async () => {
    if (actionDialog.value.action) {
      await actionDialog.value.action()
    }
    showActionDialog.value = false
  }
  
  return {
    // Delete confirmation
    confirmDelete,
    deleteDialog,
    showDeleteDialog,
    
    // Generic action confirmation
    confirmAction,
    actionDialog,
    showActionDialog,
    executeAction
  }
}
```

### Usage with Different Entity Types

```javascript
// Edge deletion
const handleDeleteEdge = (edge) => {
  confirmDelete(edge, 'Edge', 'code')
}

// Location deletion
const handleDeleteLocation = (location) => {
  confirmDelete(location, 'Location', 'name')
}

// Thing deletion
const handleDeleteThing = (thing) => {
  confirmDelete(thing, 'Device', 'serial_number')
}

// User deletion
const handleDeleteUser = (user) => {
  confirmDelete(user, 'User', 'email')
}

// Client deletion
const handleDeleteClient = (client) => {
  confirmDelete(client, 'Client', 'username')
}
```

---

## Integration Patterns

### With Entity Composables

```javascript
export function useEdge() {
  const { confirmDelete, deleteDialog, showDeleteDialog } = useConfirmation()
  const { performDelete } = useApiOperation()
  
  // Standard delete operation
  const deleteEdge = async (id, code) => {
    return performDelete(
      () => edgeService.delete(id),
      {
        loadingRef: loading,
        entityName: 'Edge',
        entityIdentifier: code,
        collection: 'edges'
      }
    )
  }
  
  // Initiate confirmation
  const handleDeleteEdge = (edge) => {
    confirmDelete(edge, 'Edge', 'code')
  }
  
  // Execute confirmed deletion
  const confirmDeleteEdge = async () => {
    if (deleteDialog.value.item) {
      const success = await deleteEdge(
        deleteDialog.value.item.id, 
        deleteDialog.value.item.code
      )
      if (success) {
        showDeleteDialog.value = false
      }
    }
  }
  
  return {
    // Confirmation methods
    handleDeleteEdge,
    confirmDeleteEdge,
    deleteDialog,
    showDeleteDialog,
    
    // Other edge methods...
  }
}
```

### With Data Tables

```vue
<template>
  <DataTable 
    :value="items"
    selection-mode="multiple"
    v-model:selection="selectedItems"
  >
    <!-- Bulk delete button -->
    <template #header>
      <div class="flex justify-between">
        <h3>{{ entityName }}s</h3>
        <Button 
          v-if="selectedItems.length > 0"
          icon="pi pi-trash"
          class="p-button-danger"
          :label="`Delete ${selectedItems.length} items`"
          @click="handleBulkDelete"
        />
      </div>
    </template>
    
    <!-- Individual delete buttons -->
    <Column header="Actions">
      <template #body="{ data }">
        <Button
          icon="pi pi-trash"
          class="p-button-danger p-button-sm"
          @click="handleSingleDelete(data)"
        />
      </template>
    </Column>
  </DataTable>
</template>

<script setup>
const selectedItems = ref([])

const handleSingleDelete = (item) => {
  confirmDelete(item, entityName, identifierField)
}

const handleBulkDelete = () => {
  // Custom bulk delete confirmation
  confirmAction(
    'Bulk Delete Confirmation',
    `Are you sure you want to delete ${selectedItems.value.length} ${entityName.toLowerCase()}(s)? This action cannot be undone.`,
    async () => {
      // Perform bulk delete
      for (const item of selectedItems.value) {
        await deleteEntity(item.id)
      }
      selectedItems.value = []
    }
  )
}
</script>
```

---

## Best Practices

### 1. Use Descriptive Entity Names

```javascript
// ✅ Good - clear entity names
confirmDelete(edge, 'Edge Server', 'code')
confirmDelete(location, 'Meeting Room', 'name')
confirmDelete(device, 'IoT Sensor', 'serial_number')

// ❌ Avoid - generic names
confirmDelete(item, 'Item', 'id')
```

### 2. Choose Appropriate Identifier Fields

```javascript
// ✅ Good - human-readable identifiers
confirmDelete(user, 'User', 'email')
confirmDelete(edge, 'Edge', 'code')
confirmDelete(location, 'Location', 'name')

// ❌ Avoid - system identifiers
confirmDelete(user, 'User', 'id')
confirmDelete(edge, 'Edge', 'uuid')
```

### 3. Provide Context in Messages

```javascript
// ✅ Good - contextual message
const deleteMessage = computed(() => {
  const item = deleteDialog.value.item
  const dependencies = item?.children?.length || 0
  
  let message = `Are you sure you want to delete ${deleteDialog.value.entityName} "${deleteDialog.value.identifier}"?`
  
  if (dependencies > 0) {
    message += ` This will also delete ${dependencies} child location(s).`
  }
  
  message += ' This action cannot be undone.'
  
  return message
})

// ❌ Generic - no context
const deleteMessage = 'Are you sure you want to delete this item?'
```

### 4. Handle Async Operations Properly

```javascript
// ✅ Good - proper async handling
const confirmDeleteAction = async () => {
  if (deleteDialog.value.item) {
    try {
      await deleteEntity(deleteDialog.value.item.id)
      showDeleteDialog.value = false
    } catch (error) {
      // Error is handled by useApiOperation
      // Dialog stays open for retry
    }
  }
}

// ❌ Avoid - not handling errors
const confirmDeleteAction = () => {
  deleteEntity(deleteDialog.value.item.id)
  showDeleteDialog.value = false // Closes even on error
}
```

### 5. Reset State Properly

```javascript
// ✅ Good - reset state when dialog closes
watch(showDeleteDialog, (isVisible) => {
  if (!isVisible) {
    // Reset dialog state
    deleteDialog.value = {
      item: null,
      entityName: '',
      identifier: ''
    }
    // Reset any additional state
    confirmationText.value = ''
  }
})
```

---

## Testing

### Unit Testing

```javascript
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfirmation } from '@/composables/useConfirmation'

describe('useConfirmation', () => {
  let confirmation
  
  beforeEach(() => {
    confirmation = useConfirmation()
  })
  
  it('should initialize with empty state', () => {
    expect(confirmation.showDeleteDialog.value).toBe(false)
    expect(confirmation.deleteDialog.value.item).toBeNull()
  })
  
  it('should set up delete confirmation correctly', () => {
    const edge = { id: '1', code: 'EDG001', name: 'Test Edge' }
    
    confirmation.confirmDelete(edge, 'Edge', 'code')
    
    expect(confirmation.showDeleteDialog.value).toBe(true)
    expect(confirmation.deleteDialog.value).toEqual({
      item: edge,
      entityName: 'Edge',
      identifier: 'EDG001'
    })
  })
  
  it('should handle missing identifier field gracefully', () => {
    const item = { id: '1', name: 'Test' }
    
    confirmation.confirmDelete(item, 'Test', 'missingField')
    
    expect(confirmation.deleteDialog.value.identifier).toBe('Unknown')
  })
})
```

### Integration Testing

```javascript
describe('Confirmation integration', () => {
  it('should complete delete flow correctly', async () => {
    const { confirmDelete, showDeleteDialog, deleteDialog } = useConfirmation()
    const { deleteEdge } = useEdge()
    
    const edge = { id: '1', code: 'EDG001' }
    
    // Initiate confirmation
    confirmDelete(edge, 'Edge', 'code')
    expect(showDeleteDialog.value).toBe(true)
    
    // Confirm deletion
    await deleteEdge(deleteDialog.value.item.id, deleteDialog.value.item.code)
    
    // Verify completion
    expect(mockEdgeService.delete).toHaveBeenCalledWith('1')
  })
})
```

The `useConfirmation` composable provides a robust foundation for user confirmation workflows, ensuring consistent and safe handling of destructive operations throughout the application.
