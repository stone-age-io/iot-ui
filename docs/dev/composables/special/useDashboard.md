# useDashboard

## Overview

The `useDashboard` composable aggregates and manages dashboard data including entity counts, recent activities, system metrics, and summary information. It provides a centralized interface for gathering dashboard-specific data with automatic refresh capabilities and performance optimizations.

## Location

```
src/composables/useDashboard.js
```

## Purpose

- **Data Aggregation**: Collects data from multiple sources for dashboard display
- **Entity Counts**: Provides real-time counts of edges, locations, things, and other entities
- **Activity Monitoring**: Recent activities and audit logs
- **Performance Metrics**: System health and usage statistics
- **Auto-refresh**: Automatic data updates for real-time monitoring
- **Error Handling**: Graceful handling of data loading failures
- **Caching Integration**: Optimal performance with cache management

## Dependencies

```javascript
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  edgeService, 
  locationService, 
  thingService, 
  auditLogService 
} from '@/services'
import { useApiOperation } from '@/composables/useApiOperation'
```

## Returns

```javascript
{
  // Entity counts
  edgesCount: Ref<number>,
  locationsCount: Ref<number>,
  thingsCount: Ref<number>,
  clientsCount: Ref<number>,
  
  // Activity data
  recentActivities: Ref<Array>,
  
  // System metrics
  systemMetrics: Ref<Object>,
  
  // State
  loading: Ref<boolean>,
  error: Ref<string|null>,
  lastRefresh: Ref<Date|null>,
  
  // Operations
  fetchDashboardData: Function,
  fetchEntityCounts: Function,
  fetchRecentActivities: Function,
  fetchSystemMetrics: Function,
  refreshDashboard: Function,
  
  // Helpers
  getTotalEntities: Function,
  formatCount: Function,
  getActivityIcon: Function
}
```

---

## State Properties

### Entity Counts

#### edgesCount

Reactive reference to the total number of edges.

**Type:** `Ref<number>`

**Default:** `0`

#### locationsCount

Reactive reference to the total number of locations.

**Type:** `Ref<number>`

**Default:** `0`

#### thingsCount

Reactive reference to the total number of things/devices.

**Type:** `Ref<number>`

**Default:** `0`

#### clientsCount

Reactive reference to the total number of MQTT clients.

**Type:** `Ref<number>`

**Default:** `0`

### Activity Data

#### recentActivities

Reactive reference to recent system activities.

**Type:** `Ref<Array>`

**Example Data:**

```javascript
[
  {
    id: "activity-1",
    type: "create",
    title: "Edge BLD-NA-001 created",
    description: "New building edge server created",
    user: "john.doe@example.com",
    timestamp: "2024-01-15T10:30:00Z",
    entity_type: "edge",
    entity_id: "edge-123"
  },
  {
    id: "activity-2", 
    type: "update",
    title: "Location Room-101 updated",
    description: "Location metadata updated",
    user: "jane.smith@example.com",
    timestamp: "2024-01-15T09:15:00Z",
    entity_type: "location",
    entity_id: "location-456"
  }
]
```

### System Metrics

#### systemMetrics

Reactive reference to system performance metrics.

**Type:** `Ref<Object>`

**Example Data:**

```javascript
{
  online_devices: 245,
  offline_devices: 12,
  active_alerts: 3,
  data_points_today: 15420,
  storage_used_gb: 125.6,
  storage_total_gb: 500,
  uptime_hours: 168.5,
  cpu_usage_percent: 45,
  memory_usage_percent: 62
}
```

### State Management

#### loading

Overall loading state for dashboard operations.

**Type:** `Ref<boolean>`

#### error

Error state for dashboard data loading.

**Type:** `Ref<string|null>`

#### lastRefresh

Timestamp of the last successful data refresh.

**Type:** `Ref<Date|null>`

---

## Operation Methods

### fetchDashboardData(skipCache)

Fetches all dashboard data in parallel for optimal performance.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skipCache` | `boolean` | No | `false` | Whether to skip cache for fresh data |

**Returns:** `Promise<void>`

**Usage:**

```javascript
const { fetchDashboardData } = useDashboard()

// Initial load
await fetchDashboardData()

// Force refresh
await fetchDashboardData(true)
```

### fetchEntityCounts(skipCache)

Fetches counts for all entity types.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skipCache` | `boolean` | No | `false` | Whether to skip cache |

**Returns:** `Promise<void>`

**Usage:**

```javascript
const { fetchEntityCounts } = useDashboard()

await fetchEntityCounts(true) // Fresh counts
```

### fetchRecentActivities(limit)

Fetches recent system activities.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | `number` | No | `10` | Number of activities to fetch |

**Returns:** `Promise<void>`

**Usage:**

```javascript
const { fetchRecentActivities } = useDashboard()

// Fetch last 20 activities
await fetchRecentActivities(20)
```

### fetchSystemMetrics(skipCache)

Fetches system performance metrics.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `skipCache` | `boolean` | No | `false` | Whether to skip cache |

**Returns:** `Promise<void>`

### refreshDashboard()

Refreshes all dashboard data by skipping cache.

**Returns:** `Promise<void>`

**Usage:**

```javascript
const { refreshDashboard } = useDashboard()

// Full dashboard refresh
await refreshDashboard()
```

---

## Helper Methods

### getTotalEntities()

Calculates total count of all entities.

**Returns:** `number` - Sum of all entity counts

**Usage:**

```javascript
const { getTotalEntities } = useDashboard()

const totalCount = getTotalEntities()
console.log(`Total entities: ${totalCount}`)
```

### formatCount(count)

Formats count numbers for display (e.g., 1,234 or 1.2K).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `count` | `number` | Yes | Count to format |

**Returns:** `string` - Formatted count string

**Usage:**

```javascript
const { formatCount } = useDashboard()

console.log(formatCount(1234))    // "1,234"
console.log(formatCount(12345))   // "12.3K"
console.log(formatCount(1234567)) // "1.2M"
```

### getActivityIcon(activityType)

Gets appropriate icon for activity type.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `activityType` | `string` | Yes | Activity type |

**Returns:** `string` - Icon class name

**Activity Type Icons:**
- `create` → `pi pi-plus-circle`
- `update` → `pi pi-pencil`
- `delete` → `pi pi-trash`
- `login` → `pi pi-sign-in`
- `error` → `pi pi-exclamation-triangle`

---

## Usage Examples

### Basic Dashboard Component

```vue
<template>
  <div class="dashboard">
    <!-- Loading state -->
    <div v-if="loading" class="flex justify-center p-8">
      <ProgressSpinner />
    </div>
    
    <!-- Dashboard content -->
    <div v-else class="space-y-6">
      <!-- Header with refresh -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Dashboard</h1>
        <div class="flex items-center gap-2">
          <span v-if="lastRefresh" class="text-sm text-gray-500">
            Last updated: {{ formatTime(lastRefresh) }}
          </span>
          <Button 
            icon="pi pi-refresh"
            class="p-button-sm"
            @click="refreshDashboard"
            :loading="loading"
          />
        </div>
      </div>
      
      <!-- Entity count cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Edges"
          :count="edgesCount"
          icon="pi pi-server"
          color="blue"
          @click="navigateToEdges"
        />
        <DashboardCard
          title="Locations"
          :count="locationsCount"
          icon="pi pi-map-marker"
          color="green"
          @click="navigateToLocations"
        />
        <DashboardCard
          title="Devices"
          :count="thingsCount"
          icon="pi pi-mobile"
          color="purple"
          @click="navigateToThings"
        />
        <DashboardCard
          title="Clients"
          :count="clientsCount"
          icon="pi pi-users"
          color="orange"
          @click="navigateToClients"
        />
      </div>
      
      <!-- System metrics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Device status chart -->
        <Card>
          <template #title>Device Status</template>
          <template #content>
            <DeviceStatusChart :metrics="systemMetrics" />
          </template>
        </Card>
        
        <!-- System health -->
        <Card>
          <template #title>System Health</template>
          <template #content>
            <SystemHealthMetrics :metrics="systemMetrics" />
          </template>
        </Card>
      </div>
      
      <!-- Recent activities -->
      <Card>
        <template #title>
          <div class="flex justify-between items-center">
            <span>Recent Activities</span>
            <Button 
              label="View All"
              class="p-button-text p-button-sm"
              @click="navigateToActivities"
            />
          </div>
        </template>
        <template #content>
          <div class="space-y-3">
            <div 
              v-for="activity in recentActivities" 
              :key="activity.id"
              class="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50"
            >
              <div class="flex-shrink-0">
                <i 
                  :class="getActivityIcon(activity.type)"
                  class="text-lg"
                  :style="{ color: getActivityColor(activity.type) }"
                ></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="font-medium">{{ activity.title }}</p>
                <p class="text-sm text-gray-600">{{ activity.description }}</p>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span>{{ activity.user }}</span>
                  <span>•</span>
                  <span>{{ formatTime(activity.timestamp) }}</span>
                </div>
              </div>
            </div>
            
            <div v-if="recentActivities.length === 0" class="text-center py-8 text-gray-500">
              No recent activities
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '@/composables/useDashboard'
import dayjs from 'dayjs'

const router = useRouter()
const { 
  edgesCount,
  locationsCount,
  thingsCount,
  clientsCount,
  recentActivities,
  systemMetrics,
  loading,
  lastRefresh,
  fetchDashboardData,
  refreshDashboard,
  getActivityIcon
} = useDashboard()

// Auto-refresh interval
let refreshInterval

const formatTime = (date) => {
  return dayjs(date).format('MMM D, HH:mm')
}

const getActivityColor = (type) => {
  const colors = {
    create: '#10b981',
    update: '#3b82f6',
    delete: '#ef4444',
    login: '#8b5cf6',
    error: '#f59e0b'
  }
  return colors[type] || '#6b7280'
}

// Navigation methods
const navigateToEdges = () => router.push({ name: 'edges' })
const navigateToLocations = () => router.push({ name: 'locations' })
const navigateToThings = () => router.push({ name: 'things' })
const navigateToClients = () => router.push({ name: 'clients' })
const navigateToActivities = () => router.push({ name: 'audit-logs' })

onMounted(async () => {
  // Initial data load
  await fetchDashboardData()
  
  // Set up auto-refresh every 5 minutes
  refreshInterval = setInterval(() => {
    refreshDashboard()
  }, 5 * 60 * 1000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
```

### Dashboard Card Component

```vue
<template>
  <Card 
    class="cursor-pointer hover:shadow-lg transition-shadow"
    @click="$emit('click')"
  >
    <template #content>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">{{ title }}</p>
          <p class="text-2xl font-bold mt-1">{{ formatCount(count) }}</p>
          <p v-if="subtitle" class="text-xs text-gray-500 mt-1">{{ subtitle }}</p>
        </div>
        <div 
          class="p-3 rounded-full"
          :class="iconBackgroundClass"
        >
          <i :class="icon" class="text-xl text-white"></i>
        </div>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
  subtitle: { type: String, default: '' },
  icon: { type: String, required: true },
  color: { type: String, default: 'blue' }
})

const emit = defineEmits(['click'])

const iconBackgroundClass = computed(() => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  }
  return colorClasses[props.color] || colorClasses.blue
})

const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M'
  } else if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'K'
  } else {
    return count.toLocaleString()
  }
}
</script>
```

### System Metrics Components

```vue
<!-- DeviceStatusChart.vue -->
<template>
  <div class="device-status-chart">
    <div v-if="metrics" class="space-y-4">
      <!-- Status summary -->
      <div class="grid grid-cols-2 gap-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">
            {{ metrics.online_devices || 0 }}
          </div>
          <div class="text-sm text-gray-600">Online</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-red-600">
            {{ metrics.offline_devices || 0 }}
          </div>
          <div class="text-sm text-gray-600">Offline</div>
        </div>
      </div>
      
      <!-- Progress bar -->
      <div class="w-full bg-gray-200 rounded-full h-3">
        <div 
          class="bg-green-500 h-3 rounded-full transition-all duration-300"
          :style="{ width: onlinePercentage + '%' }"
        ></div>
      </div>
      
      <div class="text-center text-sm text-gray-600">
        {{ onlinePercentage.toFixed(1) }}% devices online
      </div>
    </div>
    
    <div v-else class="text-center text-gray-500 py-8">
      No device data available
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metrics: { type: Object, default: () => ({}) }
})

const totalDevices = computed(() => {
  return (props.metrics.online_devices || 0) + (props.metrics.offline_devices || 0)
})

const onlinePercentage = computed(() => {
  if (totalDevices.value === 0) return 0
  return ((props.metrics.online_devices || 0) / totalDevices.value) * 100
})
</script>
```

```vue
<!-- SystemHealthMetrics.vue -->
<template>
  <div class="system-health-metrics">
    <div v-if="metrics" class="space-y-4">
      <!-- CPU Usage -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>CPU Usage</span>
          <span>{{ metrics.cpu_usage_percent || 0 }}%</span>
        </div>
        <ProgressBar 
          :value="metrics.cpu_usage_percent || 0"
          :class="getCpuProgressClass"
        />
      </div>
      
      <!-- Memory Usage -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>Memory Usage</span>
          <span>{{ metrics.memory_usage_percent || 0 }}%</span>
        </div>
        <ProgressBar 
          :value="metrics.memory_usage_percent || 0"
          :class="getMemoryProgressClass"
        />
      </div>
      
      <!-- Storage Usage -->
      <div>
        <div class="flex justify-between text-sm mb-1">
          <span>Storage Usage</span>
          <span>{{ storageUsagePercent.toFixed(1) }}%</span>
        </div>
        <ProgressBar 
          :value="storageUsagePercent"
          :class="getStorageProgressClass"
        />
        <div class="text-xs text-gray-500 mt-1">
          {{ metrics.storage_used_gb || 0 }} GB / {{ metrics.storage_total_gb || 0 }} GB
        </div>
      </div>
      
      <!-- Uptime -->
      <div class="flex justify-between text-sm">
        <span>System Uptime</span>
        <span>{{ formatUptime(metrics.uptime_hours || 0) }}</span>
      </div>
      
      <!-- Active Alerts -->
      <div v-if="metrics.active_alerts > 0" class="flex justify-between text-sm">
        <span>Active Alerts</span>
        <Badge 
          :value="metrics.active_alerts"
          severity="warning"
        />
      </div>
    </div>
    
    <div v-else class="text-center text-gray-500 py-8">
      No system metrics available
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  metrics: { type: Object, default: () => ({}) }
})

const storageUsagePercent = computed(() => {
  const used = props.metrics.storage_used_gb || 0
  const total = props.metrics.storage_total_gb || 1
  return (used / total) * 100
})

const getCpuProgressClass = computed(() => {
  const usage = props.metrics.cpu_usage_percent || 0
  if (usage > 80) return 'p-progressbar-danger'
  if (usage > 60) return 'p-progressbar-warning'
  return 'p-progressbar-success'
})

const getMemoryProgressClass = computed(() => {
  const usage = props.metrics.memory_usage_percent || 0
  if (usage > 85) return 'p-progressbar-danger'
  if (usage > 70) return 'p-progressbar-warning'
  return 'p-progressbar-success'
})

const getStorageProgressClass = computed(() => {
  const usage = storageUsagePercent.value
  if (usage > 90) return 'p-progressbar-danger'
  if (usage > 75) return 'p-progressbar-warning'
  return 'p-progressbar-success'
})

const formatUptime = (hours) => {
  const days = Math.floor(hours / 24)
  const remainingHours = Math.floor(hours % 24)
  
  if (days > 0) {
    return `${days}d ${remainingHours}h`
  } else {
    return `${remainingHours}h`
  }
}
</script>
```

---

## Best Practices

### 1. Implement Auto-refresh Strategically

```javascript
// ✅ Good - configurable auto-refresh
const setupAutoRefresh = (intervalMinutes = 5) => {
  let refreshInterval
  
  onMounted(() => {
    fetchDashboardData()
    
    refreshInterval = setInterval(() => {
      refreshDashboard()
    }, intervalMinutes * 60 * 1000)
  })
  
  onUnmounted(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
    }
  })
}

// ❌ Avoid - too frequent refreshes
setInterval(refreshDashboard, 10000) // Every 10 seconds is too frequent
```

### 2. Handle Loading States Gracefully

```javascript
// ✅ Good - granular loading states
const fetchEntityCounts = async (skipCache = false) => {
  const operations = [
    { name: 'edges', fn: () => edgeService.getList({ rows: 1, skipCache }) },
    { name: 'locations', fn: () => locationService.getList({ rows: 1, skipCache }) },
    { name: 'things', fn: () => thingService.getList({ rows: 1, skipCache }) }
  ]
  
  const results = await Promise.allSettled(operations.map(op => op.fn()))
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const countRef = [edgesCount, locationsCount, thingsCount][index]
      countRef.value = result.value.data.totalItems || 0
    } else {
      console.warn(`Failed to load ${operations[index].name} count:`, result.reason)
    }
  })
}
```

### 3. Optimize Performance with Selective Refresh

```javascript
// ✅ Good - selective refresh based on data type
const refreshCounts = async () => {
  await fetchEntityCounts(true)
}

const refreshActivities = async () => {
  await fetchRecentActivities()
}

const refreshMetrics = async () => {
  await fetchSystemMetrics(true)
}

// Allow users to refresh specific sections
<Button label="Refresh Counts" @click="refreshCounts" />
<Button label="Refresh Activities" @click="refreshActivities" />
```

### 4. Format Data for Display

```javascript
// ✅ Good - consistent formatting utilities
const formatters = {
  count: (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  },
  
  percentage: (num) => `${num.toFixed(1)}%`,
  
  storage: (gb) => {
    if (gb >= 1024) return `${(gb / 1024).toFixed(1)} TB`
    return `${gb.toFixed(1)} GB`
  },
  
  uptime: (hours) => {
    const days = Math.floor(hours / 24)
    const hrs = Math.floor(hours % 24)
    return days > 0 ? `${days}d ${hrs}h` : `${hrs}h`
  }
}
```

### 5. Provide Meaningful Error States

```javascript
// ✅ Good - specific error handling
const handleDashboardError = (error, section) => {
  console.error(`Dashboard ${section} error:`, error)
  
  const errorMessages = {
    counts: 'Unable to load entity counts',
    activities: 'Unable to load recent activities', 
    metrics: 'Unable to load system metrics'
  }
  
  toast.add({
    severity: 'warn',
    summary: 'Partial Load',
    detail: errorMessages[section] || 'Unable to load dashboard data',
    life: 5000
  })
}
```

The `useDashboard` composable provides a comprehensive solution for dashboard data management, with optimal performance through parallel loading, intelligent caching, and graceful error handling, making it ideal for real-time IoT platform monitoring.
