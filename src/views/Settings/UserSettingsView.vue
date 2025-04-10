<!-- src/views/Settings/UserSettingsView.vue -->
<template>
  <div>
    <PageHeader 
      title="User Settings" 
      subtitle="Configure your application preferences"
    />
    
    <div class="card">
      <!-- Removed the TabView since we now only have one tab -->
      <NatsSettings />
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Toast from 'primevue/toast';
import PageHeader from '../../components/common/PageHeader.vue';
import NatsSettings from './NatsSettings.vue';

onMounted(() => {
  // Any initialization logic
});
</script>
