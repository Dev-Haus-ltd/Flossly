<template>
  <div class="scripts-pool-container">
  <div class="d-flex  align-center mb-3">
  <div class="section-header mr-16">Scripts Pool</div>
  <v-select
    v-model="selectedScript"
    :items="scriptTitles"
    item-title="title"
    item-value="value"
    variant="solo"
    density="compact"
    class="scripts-custom-select"
    flat
    hide-details
  />
</div>

    <div class="script-content">
      <div v-if="isLoading" class="text-center grey--text">
        Loading scripts...
      </div>
      <div v-else-if="selectedScriptContent !== null">
        <v-textarea
          v-model="editableContent"
          variant="solo"
          density="compact"
          rows="15"
          auto-grow
          hide-details
          class="script-textarea"
        />
      </div>
      <div v-else class="text-center grey--text">
        Select a script to view its content.
      </div>
    </div>
    <div class="d-flex justify-end mt-3">
      <v-btn 
        color="primary" 
        variant="flat"
        :loading="isSaving"
        :disabled="!selectedScript || !editableContent"
        @click="saveCurrentScript"
      >
        Save
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useOrgStore } from '~/stores/organisation';
import orgService from '~/services/orgService';
import { useMainStore } from '~/stores';

// Optional prop to use the exact practice name shown in sidebar
const props = defineProps({
  practiceName: { type: String, default: '' },
});

const orgStore = useOrgStore();
const { getOrgDetails } = storeToRefs(orgStore);

// Helper function to get organization data consistently (same as sidebar)
const getOrgData = (orgWrapper) => {
  // Check if org has nested organisation object
  if (orgWrapper?.organisation?.id && orgWrapper?.organisation?.name) {
    return orgWrapper.organisation;
  }
  
  // Check if org is the organisation object itself
  if (orgWrapper?.id && orgWrapper?.name) {
    return orgWrapper;
  }
  
  return null;
};

// Get practice name from user's current organization (same way as sidebar)
const practiceNameFromStore = computed(() => {
  // Access userDataVersion to make this computed reactive to localStorage changes
  userDataVersion.value;
  
  // First check if prop is provided
  if (props.practiceName) {
    return props.practiceName;
  }
  
  // Try to get from localStorage user data (same as sidebar)
  try {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser?.userOrganisations?.length && storedUser?.currentLoggedInOrgId) {
      // Filter to only active organizations first
      const activeOrgs = storedUser.userOrganisations.filter(org => org.status === 'Active');
      // Find the current organization
      const orgWrapper = activeOrgs.find(
        (org) => org.organisationId === storedUser.currentLoggedInOrgId
      ) || activeOrgs.find(
        (org) => getOrgData(org)?.id === storedUser.currentLoggedInOrgId
      );
      
      if (orgWrapper) {
        const orgData = getOrgData(orgWrapper);
        if (orgData?.name) {
          return orgData.name;
        }
      }
    }
  } catch (e) {
    console.warn('Could not get organization name from localStorage:', e);
  }
  
  // Fallback to orgStore
  const details =
    (getOrgDetails && getOrgDetails.value) ||
    orgStore.getOrgDetails ||
    orgStore.organisation ||
    orgStore.organization ||
    orgStore.org ||
    orgStore.orgDetails ||
    {};
  return details?.name || orgStore.name || orgStore.orgName || '[Practice Name]';
});

const resolvedPracticeName = computed(() => practiceNameFromStore.value);

const mainStore = useMainStore();
const scripts = ref([]);
const selectedScript = ref('');
const editableContent = ref('');
const isLoading = ref(false);
const isSaving = ref(false);
// Track localStorage changes to trigger reactivity
const userDataVersion = ref(0);

const scriptTitles = computed(() => scripts.value.map(script => ({ title: script.title, value: script.key })));

// Replace common placeholders with dynamic organisation data
const applyOrgSubstitutions = (text) => {
  if (!text) return text;
  const name = resolvedPracticeName.value || '[Practice Name]';
  // Replace bracket token only to avoid changing normal words.
  return text
    .replace(/\[\s*practice\s*name\s*\]/gi, name);
};

const selectedScriptContent = computed(() => {
  if (!selectedScript.value) return null;
  const script = scripts.value.find(s => s.key === selectedScript.value);
  if (!script) return null;
  return applyOrgSubstitutions(script.content);
});

// Watch for selected script changes to update editable content
watch(selectedScript, (newKey) => {
  if (newKey) {
    const script = scripts.value.find(s => s.key === newKey);
    if (script) {
      editableContent.value = script.content;
    }
  } else {
    editableContent.value = '';
  }
});

// Watch for content changes in scripts array to update editable content
watch(() => scripts.value, () => {
  if (selectedScript.value) {
    const script = scripts.value.find(s => s.key === selectedScript.value);
    if (script) {
      editableContent.value = script.content;
    }
  }
}, { deep: true });

// Track the last known user data to detect changes
let lastUserData = null;
let pollInterval = null;

// Function to check for localStorage changes
const checkUserDataChange = () => {
  try {
    const currentUserData = localStorage.getItem("user");
    if (currentUserData !== lastUserData) {
      lastUserData = currentUserData;
      userDataVersion.value++;
    }
  } catch (e) {
    // Ignore errors
  }
};

// Fetch scripts from API
const fetchScripts = async () => {
  isLoading.value = true;
  try {
    const response = await orgService.getScripts();
    console.log('Scripts API response:', response);
    
    if (response && response.code === 0) {
      if (response.data && Array.isArray(response.data)) {
        scripts.value = response.data;
        // Apply organization name substitution to all scripts
        scripts.value = scripts.value.map(script => ({
          ...script,
          content: applyOrgSubstitutions(script.content)
        }));
        
        // Set initial selection if scripts are available
        if (scripts.value.length > 0 && !selectedScript.value) {
          selectedScript.value = scripts.value[0].key;
        }
      } else {
        // No scripts found - empty array
        scripts.value = [];
      }
    } else {
      // Error response
      const errorMessage = response?.data?.message || response?.message || "Failed to load scripts";
      console.error('Scripts API error:', response);
      mainStore.setSnackbar({
        type: "error",
        title: errorMessage,
      });
      scripts.value = [];
    }
  } catch (err) {
    console.error('Error fetching scripts:', err);
    const errorMessage = err?.data?.message || err?.message || err?.error || "Failed to load scripts";
    mainStore.setSnackbar({
      type: "error",
      title: errorMessage,
    });
    scripts.value = [];
  } finally {
    isLoading.value = false;
  }
};

// Save current script
const saveCurrentScript = async () => {
  if (!selectedScript.value || !editableContent.value) return;
  
  const script = scripts.value.find(s => s.key === selectedScript.value);
  if (!script) return;
  
  isSaving.value = true;
  try {
    const response = await orgService.saveScript({
      scriptKey: script.key,
      title: script.title,
      content: editableContent.value,
    });
    
    console.log('Save script response:', response);
    
    // Check for success response (code: 0 means success in this API)
    if (response && response.code === 0 && response.data) {
      // Update the script in local array
      const index = scripts.value.findIndex(s => s.key === script.key);
      if (index !== -1) {
        scripts.value[index] = {
          ...response.data,
          content: applyOrgSubstitutions(response.data.content)
        };
        editableContent.value = scripts.value[index].content;
      }
      
      mainStore.setSnackbar({
        type: "success",
        title: "Script saved successfully",
      });
    } else {
      // Handle non-success response
      const errorMessage = response?.data?.message || 
                          response?.message || 
                          response?.error || 
                          "Failed to save script";
      console.error('Save script failed:', response);
      mainStore.setSnackbar({
        type: "error",
        title: errorMessage,
      });
    }
  } catch (err) {
    console.error('Error saving script:', err);
    // Extract error message from various possible error structures
    const errorMessage = err?.data?.message || 
                        err?.data?.error || 
                        err?.message || 
                        err?.error || 
                        "Failed to save script";
    mainStore.setSnackbar({
      type: "error",
      title: errorMessage,
    });
  } finally {
    isSaving.value = false;
  }
};

onMounted(async () => {
  // Initialize lastUserData
  try {
    lastUserData = localStorage.getItem("user");
  } catch (e) {
    // Ignore errors
  }
  
  // Poll for localStorage changes (check every 500ms)
  if (typeof window !== 'undefined') {
    pollInterval = setInterval(checkUserDataChange, 500);
  }
  
  // Fetch scripts from API
  await fetchScripts();
});

// Clean up interval on unmount
onUnmounted(() => {
  if (pollInterval) {
    clearInterval(pollInterval);
  }
});

// Also listen to storage events (for cross-tab updates)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'user') {
      lastUserData = e.newValue;
      userDataVersion.value++;
    }
  });
}
</script>

<style scoped>
.section-header {
  font-weight: 600;
  font-size: 14px;
}
.scripts-pool-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.script-content {
  flex-grow: 1;
  overflow-y: auto;
  
  font-weight: 400;
  font-style: normal;
  font-size: 14px;
  line-height: 100%;
  letter-spacing: 0;
}
.script-content p {
  margin: 0 0 8px 0;
  font: inherit;
  line-height: 100%;
  letter-spacing: 0;
}

.script-textarea {
  font-size: 14px;
  line-height: 2;
}



.script-textarea :deep(.v-field__input) {
  font-size: 14px !important;

}

.script-textarea :deep(textarea) {
  font-size: 14px !important;
}

/* Custom styles for the Scripts dropdown to match provided specs */

.scripts-custom-select :deep(.v-field) {
  background: hsla(208, 91%, 92%, 1) !important;
  border-radius: 4px !important;
  min-height: 32px !important;
  height: 32px !important;
  padding: 0 !important;
}

.scripts-custom-select :deep(.v-field__input) {
  font-family: inherit;
  font-weight: 400;
  font-style: normal;
  font-size: 12px;
  letter-spacing: 0;
  padding: 0 8px !important;
  min-height: 32px !important;
  height: 32px !important;
  display: flex !important;
  align-items: center !important;
}

.scripts-custom-select :deep(.v-field__append-inner) {
  padding: 0 4px !important;
  align-self: center !important;
}

</style>
