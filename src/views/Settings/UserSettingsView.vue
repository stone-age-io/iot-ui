<!-- src/views/Settings/UserSettingsView.vue -->
<template>
  <div class="settings-container">
    <PageHeader 
      title="User Settings" 
      subtitle="Configure your application preferences"
    />
    
    <!-- Settings Grid Layout -->
    <div class="grid grid-cols-1 gap-6">
      <!-- Theme Settings -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
            <i class="pi pi-palette mr-2"></i>
            Appearance
          </h2>
        </div>
        <div class="p-6">
          <ThemeSettings />
        </div>
      </div>
      
      <!-- NATS Settings -->
      <div class="bg-surface-primary dark:bg-surface-primary-dark rounded-lg border border-border-primary dark:border-border-primary-dark shadow-theme-md theme-transition">
        <div class="p-6 border-b border-border-primary dark:border-border-primary-dark">
          <h2 class="text-xl font-semibold text-content-primary dark:text-content-primary-dark">
            <i class="pi pi-server mr-2"></i>
            NATS Messaging
          </h2>
        </div>
        <div class="p-6">
          <NatsSettings />
        </div>
      </div>
    </div>
    
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import PageHeader from '../../components/common/PageHeader.vue';
import NatsSettings from './NatsSettings.vue';
import ThemeSettings from './ThemeSettings.vue';

onMounted(() => {
  // Initialize any components or load user settings
  document.title = 'User Settings | IoT Platform';
});
</script>

<style scoped>
.settings-container {
  margin-bottom: 2rem;
}

/* Fix for dark mode styling */
:deep(.p-inputtext),
:deep(.p-dropdown),
:deep(.p-inputnumber) {
  background-color: var(--surface-card);
  color: var(--text-color);
  border-color: var(--surface-border);
}

:deep(.dark .p-inputtext),
:deep(.dark .p-dropdown),
:deep(.dark .p-inputnumber) {
  background-color: var(--surface-hover);
  color: var(--text-color);
  border-color: var(--surface-border);
}
</style>
