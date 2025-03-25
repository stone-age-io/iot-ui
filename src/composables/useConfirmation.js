// src/composables/useConfirmation.js
import { ref } from 'vue'

/**
 * Composable for confirmation dialog management
 * Handles common dialog state and actions
 */
export function useConfirmation() {
  // Dialog state
  const dialog = ref({
    visible: false,
    loading: false,
    item: null,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    details: '',
    type: 'warning', // warning, info, danger
    confirmLabel: 'Confirm',
    confirmIcon: 'pi pi-check',
    cancelLabel: 'Cancel'
  })
  
  /**
   * Show confirmation dialog
   * @param {Object} item - Item to operate on (optional)
   * @param {Object} options - Dialog options
   */
  const confirm = (item = null, options = {}) => {
    dialog.value = {
      ...dialog.value,
      visible: true,
      loading: false,
      item,
      ...options
    }
  }
  
  /**
   * Update dialog state
   * @param {Object} state - New state
   */
  const updateDialog = (state) => {
    dialog.value = {
      ...dialog.value,
      ...state
    }
  }
  
  /**
   * Close and reset dialog
   */
  const resetDialog = () => {
    dialog.value.visible = false
    dialog.value.loading = false
    
    // Delay resetting other properties until after transition
    setTimeout(() => {
      dialog.value.item = null
      dialog.value.message = 'Are you sure you want to proceed?'
      dialog.value.details = ''
    }, 300)
  }
  
  return {
    dialog,
    confirm,
    updateDialog,
    resetDialog
  }
}

/**
 * Specialized composable for delete confirmations
 */
export function useDeleteConfirmation() {
  const { dialog, confirm, updateDialog, resetDialog } = useConfirmation()
  
  /**
   * Show delete confirmation for an item
   * @param {Object} item - Item to delete
   * @param {string} entityName - Name of entity type
   * @param {string} identifierField - Field to use as identifier (default: 'code')
   */
  const confirmDelete = (item, entityName = 'item', identifierField = 'code') => {
    const identifier = item[identifierField] || item.id || 'this item'
    
    confirm(item, {
      title: `Delete ${entityName}`,
      message: `Are you sure you want to delete ${entityName} '${identifier}'?`,
      details: "This action cannot be undone.",
      type: 'danger',
      confirmLabel: 'Delete',
      confirmIcon: 'pi pi-trash'
    })
  }
  
  return {
    deleteDialog: dialog,
    confirmDelete,
    updateDeleteDialog: updateDialog,
    resetDeleteDialog: resetDialog
  }
}
