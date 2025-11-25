<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="$emit('update:modelValue', $event)" 
    max-width="900px"
  >
    <v-card class="rounded-xl">
      <!-- Header -->
      <div class="pa-4 d-flex justify-space-between align-center" style="border-bottom: 1px solid #dbdbdb;">
        <h3 class="text-h6 m-0">Login History - {{ userName || 'Staff Member' }}</h3>
        <v-btn 
          icon="mdi-close" 
          variant="text" 
          size="small"
          @click="$emit('update:modelValue', false)" 
        />
      </div>

      <!-- Content -->
      <div class="pa-4" style="max-height: 70vh; overflow-y: auto;">
        <!-- Loading State -->
        <div v-if="loading" class="d-flex justify-center align-center" style="min-height: 200px;">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <!-- Table -->
        <v-table v-else-if="loginHistory.length > 0" class="login-history-table" density="comfortable">
          <thead>
            <tr>
              <th style="width: 50%;">Date/Time</th>
              <th style="width: 50%;">Browser/Device</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in loginHistory" :key="entry.id || index">
              <td>
                <div class="px-4">
                  {{ formatDateTime(entry.createdAt) }}
                </div>
              </td>
              <td>
                <div class="px-4">
                  {{ parseBrowserAgent(entry.browserAgent) }}
                </div>
              </td>
            </tr>
          </tbody>
        </v-table>

        <!-- Empty State -->
        <div v-else class="d-flex flex-column justify-center align-center" style="min-height: 200px;">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-history</v-icon>
          <p class="text-grey">No login history found</p>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useMainStore } from '@/stores/index';
import { parsedDate } from '~/lib/dateFormatter';
import { format, parseISO, isValid } from 'date-fns';
import authService from '@/services/authService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  user: { type: Object, default: null },
  userName: { type: String, default: '' }
});

const emit = defineEmits(['update:modelValue']);

const mainStore = useMainStore();
const loginHistory = ref([]);
const loading = ref(false);

// Format date and time
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return '';
    return parsedDate(date);
  } catch (e) {
    return '';
  }
};

// Parse browser agent string
const parseBrowserAgent = (browserAgent) => {
  if (!browserAgent) return 'Unknown';
  
  try {
    // Browser agent format: "browser info,ipAddress:ip"
    const parts = browserAgent.split(',ipAddress:');
    const browserInfo = parts[0] || browserAgent;
    
    // Try to extract browser name and version
    // Common patterns: Chrome/120.0.0.0, Firefox/121.0, Safari/605.1.15, etc.
    const browserMatch = browserInfo.match(/(Chrome|Firefox|Safari|Edge|Opera|MSIE|Trident)\/?([\d.]+)?/i);
    
    if (browserMatch) {
      let browserName = browserMatch[1];
      const version = browserMatch[2] || '';
      
      // Normalize browser names
      if (browserName.toLowerCase() === 'trident' || browserName.toLowerCase() === 'msie') {
        browserName = 'Internet Explorer';
      }
      
      // Try to detect device type from user agent
      let deviceInfo = '';
      if (browserInfo.match(/Mobile|Android|iPhone|iPad/i)) {
        if (browserInfo.match(/iPad/i)) {
          deviceInfo = ' (iPad)';
        } else if (browserInfo.match(/iPhone/i)) {
          deviceInfo = ' (iPhone)';
        } else if (browserInfo.match(/Android/i)) {
          deviceInfo = ' (Android)';
        } else {
          deviceInfo = ' (Mobile)';
        }
      } else if (browserInfo.match(/Windows/i)) {
        deviceInfo = ' (Windows)';
      } else if (browserInfo.match(/Mac/i)) {
        deviceInfo = ' (Mac)';
      } else if (browserInfo.match(/Linux/i)) {
        deviceInfo = ' (Linux)';
      }
      
      return version ? `${browserName} ${version}${deviceInfo}` : `${browserName}${deviceInfo}`;
    }
    
    // Fallback: return first part of browser agent (truncated if too long)
    return browserInfo.length > 50 ? browserInfo.substring(0, 50) + '...' : browserInfo;
  } catch (e) {
    return browserAgent.length > 50 ? browserAgent.substring(0, 50) + '...' : browserAgent;
  }
};

// Fetch login history when modal opens
watch(() => props.modelValue, async (isOpen) => {
  if (isOpen && props.user?.id) {
    await loadLoginHistory();
  } else if (!isOpen) {
    // Reset when closing
    loginHistory.value = [];
  }
});

const loadLoginHistory = async () => {
  if (!props.user?.id) return;
  
  loading.value = true;
  try {
    const res = await authService.getLoginHistory({ userId: props.user.id });
    if (res?.code === 0) {
      // Sort by createdAt descending (most recent first)
      loginHistory.value = (res.data || []).sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });
    } else {
      mainStore.setSnackbar({
        title: res?.message || res?.data?.message || 'Failed to load login history',
        type: 'error'
      });
      loginHistory.value = [];
    }
  } catch (err) {
    mainStore.setSnackbar({
      title: err?.message || 'An error occurred while loading login history',
      type: 'error'
    });
    loginHistory.value = [];
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-history-table {
  border: 1px solid #e5e5e5;
  border-radius: 6px;
}

.login-history-table th {
  background-color: #f6f6f6;
  font-weight: 500;
  font-size: 14px;
  padding: 12px;
  border-bottom: 1px solid #dbdbdb;
}

.login-history-table td {
  padding: 12px;
  font-size: 14px;
  border-bottom: 1px solid #e5e5e5;
}

.login-history-table tbody tr:last-child td {
  border-bottom: none;
}

.login-history-table tbody tr:hover {
  background-color: #f9f9f9;
}
</style>

