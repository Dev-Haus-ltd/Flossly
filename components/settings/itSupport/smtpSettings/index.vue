<template>
  <v-card elevation="0" class="pa-7 mt-5" style="border: 1px solid #dbdbdb; border-radius: 12px">
    <v-overlay :model-value="loading" class="align-center justify-center" contained persistent>
      <v-progress-circular indeterminate size="40" color="primary"></v-progress-circular>
    </v-overlay>
    
    <v-row>
      <v-col cols="12" md="6">
        <label class="input-label">SMTP Host</label>
        <v-text-field
          v-model="smtpConfig.host"
          placeholder="e.g., smtp.gmail.com"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
        />
      </v-col>

      <v-col cols="12" md="6">
        <label class="input-label">SMTP Port</label>
        <v-text-field
          v-model="smtpConfig.port"
          placeholder="e.g., 587"
          type="number"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
          @update:model-value="handlePortChange"
        />
        
      </v-col>


      <v-col cols="12" md="6">
        <label class="input-label">Username</label>
        <v-text-field
          v-model="smtpConfig.username"
          placeholder="your-email@example.com"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
        />
      </v-col>

      <v-col cols="12" md="6">
        <label class="input-label">Password</label>
        <v-text-field
          v-model="smtpConfig.password"
          type="password"
          placeholder="Enter your password"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
        />
      </v-col>

      <v-col cols="12" md="6">
        <label class="input-label">From Email</label>
        <v-text-field
          v-model="smtpConfig.fromEmail"
          placeholder="e.g., noreply@yourdomain.com"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
        />
      </v-col>

      <v-col cols="12" md="6">
        <label class="input-label">From Name</label>
        <v-text-field
          v-model="smtpConfig.fromName"
          placeholder="e.g., Your Practice Name"
          density="comfortable"
          variant="solo"
          single-line
          flat
          class="mb-2 custom-input"
        />
      </v-col>
    </v-row>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import smtpService from '~/services/smtpService';
import { useMainStore } from '~/stores';

const mainStore = useMainStore();

const saving = ref(false);
const testing = ref(false);
const loading = ref(false);

const smtpConfig = ref({
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
  fromName: ''
});

const isFormValid = computed(() => {
  return smtpConfig.value.host && 
         smtpConfig.value.port && 
         smtpConfig.value.username && 
         smtpConfig.value.password;
});

const handlePortChange = (port) => {
  // Auto-set secure based on common port conventions
  const portNum = parseInt(port);
  if (portNum === 465) {
    smtpConfig.value.secure = true;
  } else if (portNum === 587 || portNum === 25) {
    smtpConfig.value.secure = false;
  }
};

const initData = async () => {
  loading.value = true;
  try {
    const res = await smtpService.getSmtpSettings();
    if (res?.code === 0 && res.data) {
      smtpConfig.value = {
        host: res.data.host || '',
        port: res.data.port || 587,
        secure: res.data.secure || false,
        username: res.data.username || '',
        password: '',
        fromEmail: res.data.fromEmail || '',
        fromName: res.data.fromName || ''
      };
    }
  } catch (err) {
    console.error('Error loading SMTP settings:', err);
    mainStore.setSnackbar({ message: 'Failed to load SMTP settings', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const saveSettings = async () => {
  if (!isFormValid.value) {
    mainStore.setSnackbar({ message: 'Please fill in all required fields', color: 'error' });
    return;
  }

  saving.value = true;
  try {
    const res = await smtpService.saveSmtpSettings(smtpConfig.value);
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'SMTP settings saved successfully ✓', type: 'success' });
    } else {
      mainStore.setSnackbar({ title: res?.error || 'Failed to save settings', type: 'error' });
    }
  } catch (err) {
    console.error('Error saving settings:', err);
    mainStore.setSnackbar({ message: 'Failed to save settings', color: 'error' });
  } finally {
    saving.value = false;
  }
};

const testConnection = async () => {
  if (!isFormValid.value) {
    mainStore.setSnackbar({ message: 'Please fill in all required fields', color: 'error' });
    return;
  }

  testing.value = true;
  try {
    const res = await smtpService.testSmtpConnection(smtpConfig.value);
    if (res?.code === 0) {
      mainStore.setSnackbar({ title: 'SMTP connection successful ✓', type: 'success' });
    } else {
      mainStore.setSnackbar({ title: res?.error || 'Connection failed', type: 'error' });
    }
  } catch (err) {
    console.error('Error testing connection:', err);
    mainStore.setSnackbar({ message: 'Connection failed', color: 'error' });
  } finally {
    testing.value = false;
  }
};

onMounted(() => {
  initData();
});

// Expose methods and computed for parent component
defineExpose({
  testConnection,
  saveSettings,
  isFormValid: () => isFormValid.value,
  get isFormValid() { return isFormValid.value; }
});
</script>

<style scoped>
.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e1e1e;
}

.input-label {
  display: block;
  font-weight: 400;
  font-size: 14px;
  margin-bottom: 4px;
  color: #737373;
}

.custom-input :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

.custom-input :deep(.v-field:hover) {
  border-color: #bbb !important;
}

.custom-input :deep(.v-field--focused) {
  border-color: rgb(var(--v-theme-primary)) !important;
  box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)) !important;
}

.gap-3 {
  gap: 12px;
}

.helper-text {
  font-size: 12px;
  color: #999;
  margin-top: -4px;
  margin-bottom: 8px;
}

.helper-inline {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.checkbox-label {
  font-size: 14px;
  color: #1e1e1e;
}
</style>
