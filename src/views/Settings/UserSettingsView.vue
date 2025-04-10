<!-- src/views/Settings/UserSettingsView.vue -->
<template>
  <div>
    <PageHeader 
      title="User Settings" 
      subtitle="Configure your application preferences"
    />
    
    <div class="card">
      <TabView>
        <!-- Profile Tab -->
        <TabPanel header="Profile">
          <ProfileSettings />
        </TabPanel>
        
        <!-- NATS Tab -->
        <TabPanel header="NATS Connection">
          <NatsSettings />
        </TabPanel>
        
        <!-- Additional settings tabs can be added here -->
      </TabView>
    </div>
    
    <Toast />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import Toast from 'primevue/toast';
import PageHeader from '../../components/common/PageHeader.vue';
import ProfileSettings from './ProfileSettings.vue';
import NatsSettings from './NatsSettings.vue';

onMounted(() => {
  // Any initialization logic
});
</script>
