<template>
  <v-dialog v-model="previewDialog" max-width="1200px" persistent>
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between" style="font-weight: 600; font-size: 16px; border-bottom: 1px solid #dbdbdb;">
        AI Generated Automations Preview
        <v-btn icon variant="text" size="small" @click="closePreview" style="color: #737373">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div v-if="isGenerating" class="pa-10 text-center">
        <v-progress-circular indeterminate color="primary" size="64" />
        <div class="mt-4" style="font-size: 14px; color: #737373">
          AI is generating your automations...
        </div>
      </div>

      <div v-if="!isGenerating && generatedAutomations.length" class="pa-5">
        <div class="mb-4">
          <v-alert type="info" variant="tonal" density="compact">
            <div style="font-size: 13px">
              <strong>{{ generatedAutomations.length }} automations generated</strong> - Review and create them below
            </div>
          </v-alert>
        </div>

        <!-- Follow-up refinement section -->
        <div class="mb-4">
          <v-card variant="outlined" class="pa-3">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px">
              <v-icon size="18" class="mr-1">mdi-pencil-outline</v-icon>
              Refine Automations
            </div>
            <v-textarea
              v-model="followUpRequest"
              placeholder="e.g., 'Make the emails more friendly', 'Add emojis to WhatsApp messages', 'Change the birthday email subject line'"
              variant="outlined"
              density="compact"
              rows="2"
              hide-details
              :disabled="isRefining"
            />
            <div class="d-flex justify-end mt-2">
              <v-btn
                size="small"
                color="primary"
                variant="flat"
                :loading="isRefining"
                :disabled="!followUpRequest.trim()"
                @click="refineAutomations"
              >
                <v-icon size="16" class="mr-1">mdi-auto-fix</v-icon>
                Apply Changes
              </v-btn>
            </div>
          </v-card>
        </div>

        <div style="max-height: 400px; overflow-y: auto">
          <div v-for="(group, groupKey) in groupedAutomations" :key="groupKey" class="mb-4">
            <div class="group-header">
              <v-icon size="20" class="mr-2">mdi-folder-outline</v-icon>
              <strong>{{ group.title }}</strong>
              <v-chip size="small" class="ml-2" variant="flat" color="primary">
                {{ group.automations.length }}
              </v-chip>
            </div>
            <div class="automation-list">
              <div
                v-for="(automation, idx) in group.automations"
                :key="idx"
                class="automation-card"
              >
                <div class="automation-header">
                  <div class="d-flex align-center" style="flex: 1">
                    <v-icon :color="automation.type === 'Email' ? 'primary' : 'success'" class="mr-2">
                      {{ automation.type === 'Email' ? 'mdi-email' : 'mdi-whatsapp' }}
                    </v-icon>
                    <div>
                      <div style="font-weight: 600; font-size: 14px">{{ automation.name }}</div>
                      <div v-if="automation.subject" style="font-size: 12px; color: #737373">
                        Subject: {{ automation.subject }}
                      </div>
                    </div>
                  </div>
                  <v-chip size="x-small" :color="automation.type === 'Email' ? 'primary' : 'success'" variant="flat">
                    {{ automation.type }}
                  </v-chip>
                </div>
                <div class="automation-content">
                  {{ automation.content }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <v-divider />
      <v-card-actions class="d-flex justify-space-between pa-4">
        <v-btn
          v-if="!isGenerating && generatedAutomations.length"
          variant="text"
          color="primary"
          :loading="isRegenerating"
          @click="retryGeneration"
        >
          <v-icon size="18" class="mr-1">mdi-refresh</v-icon>
          Retry
        </v-btn>
        <div v-else></div>
        <div class="d-flex gap-2">
          <v-btn variant="text" @click="closePreview">Cancel</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="isCreating"
            :disabled="!generatedAutomations.length"
            @click="createAutomations"
          >
            Create All Automations
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'success', 'close'])

const crmStore = useCrmStore()
const mainStore = useMainStore()

const previewDialog = ref(props.modelValue)
const isGenerating = ref(false)
const isCreating = ref(false)
const isRegenerating = ref(false)
const isRefining = ref(false)
const generatedAutomations = ref([])
const currentIdea = ref('')
const followUpRequest = ref('')

watch(
  () => props.modelValue,
  (val) => (previewDialog.value = val)
)
watch(previewDialog, (val) => emit('update:modelValue', val))

const groupedAutomations = computed(() => {
  const groups = {}
  generatedAutomations.value.forEach((automation) => {
    const groupName = automation.groupName || 'General'
    if (!groups[groupName]) {
      groups[groupName] = {
        title: groupName,
        automations: [],
      }
    }
    groups[groupName].automations.push(automation)
  })
  return groups
})

const generateAutomations = async (userIdea) => {
  isGenerating.value = true
  generatedAutomations.value = []
  previewDialog.value = true
  currentIdea.value = userIdea

  try {
    const res = await crmStore.generateAutomationsWithAI({ idea: userIdea })
    if (res?.code === 0 && Array.isArray(res.data?.automations)) {
      generatedAutomations.value = res.data.automations
    } else {
      mainStore.setSnackbar({
        type: 'error',
        title: res?.message || 'Failed to generate automations',
      })
      previewDialog.value = false
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: 'error',
      title: err.message || 'Failed to generate automations',
    })
    previewDialog.value = false
  } finally {
    isGenerating.value = false
  }
}

const retryGeneration = async () => {
  isRegenerating.value = true
  generatedAutomations.value = []
  followUpRequest.value = ''

  try {
    const res = await crmStore.generateAutomationsWithAI({ idea: currentIdea.value })
    if (res?.code === 0 && Array.isArray(res.data?.automations)) {
      generatedAutomations.value = res.data.automations
      mainStore.setSnackbar({
        type: 'success',
        title: 'Automations regenerated successfully',
      })
    } else {
      mainStore.setSnackbar({
        type: 'error',
        title: res?.message || 'Failed to regenerate automations',
      })
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: 'error',
      title: err.message || 'Failed to regenerate automations',
    })
  } finally {
    isRegenerating.value = false
  }
}

const refineAutomations = async () => {
  if (!followUpRequest.value.trim()) return

  isRefining.value = true
  const previousAutomations = [...generatedAutomations.value]

  try {
    const res = await crmStore.generateAutomationsWithAI({ 
      idea: currentIdea.value,
      followUp: followUpRequest.value.trim(),
      existingAutomations: previousAutomations
    })
    
    if (res?.code === 0 && Array.isArray(res.data?.automations)) {
      generatedAutomations.value = res.data.automations
      followUpRequest.value = ''
      mainStore.setSnackbar({
        type: 'success',
        title: 'Automations refined successfully',
      })
    } else {
      mainStore.setSnackbar({
        type: 'error',
        title: res?.message || 'Failed to refine automations',
      })
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: 'error',
      title: err.message || 'Failed to refine automations',
    })
  } finally {
    isRefining.value = false
  }
}

const createAutomations = async () => {
  isCreating.value = true
  try {
    const items = generatedAutomations.value.map((a) => ({
      groupName: a.groupName,
      type: a.type,
      name: a.name,
      subject: a.subject || '',
      content: a.content,
      trigger: a.trigger || undefined,
    }))

    const res = await crmStore.bulkUploadAutomations({ items })

    if (res?.code === 0) {
      emit('success')
      closePreview()
      mainStore.setSnackbar({
        type: 'success',
        title: res.data?.message || res.message || 'Automations created successfully',
      })
    } else {
      mainStore.setSnackbar({
        type: 'error',
        title: res?.data?.message || res?.message || 'Failed to create automations',
      })
    }
  } catch (err) {
    mainStore.setSnackbar({
      type: 'error',
      title: err.message || 'Failed to create automations',
    })
  } finally {
    isCreating.value = false
  }
}

const closePreview = () => {
  generatedAutomations.value = []
  isGenerating.value = false
  isCreating.value = false
  isRegenerating.value = false
  isRefining.value = false
  currentIdea.value = ''
  followUpRequest.value = ''
  previewDialog.value = false
  emit('close')
}

defineExpose({
  generateAutomations,
})
</script>

<style scoped lang="scss">
.group-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: #f5f5f5;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 8px;
}

.automation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-left: 16px;
}

.automation-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #ffffff;
}

.automation-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.automation-content {
  font-size: 13px;
  color: #4b5563;
  line-height: 1.5;
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  white-space: pre-wrap;
}
</style>
