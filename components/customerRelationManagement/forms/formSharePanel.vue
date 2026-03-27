<template>
  <v-card rounded="xl" class="pa-0" elevation="2">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between px-5 pt-5 pb-3">
      <div class="d-flex align-center" style="gap: 10px;">
        <v-avatar color="blue-lighten-5" size="38" rounded="lg">
          <v-icon color="primary" size="20">mdi-share-variant</v-icon>
        </v-avatar>
        <div>
          <p class="text-subtitle-2 font-weight-semibold mb-0" style="font-size:15px;">Share Form</p>
          <p class="text-caption text-medium-emphasis mb-0">{{ form.name }}</p>
        </div>
      </div>
      <v-btn icon variant="text" size="small" @click="$emit('close')">
        <v-icon size="18">mdi-close</v-icon>
      </v-btn>
    </div>

    <v-divider />

    <div class="px-5 py-4">
      <!-- Share URL section -->
      <div class="section-block mb-4">
        <div class="d-flex align-center mb-2" style="gap: 6px;">
          <v-icon size="16" color="primary">mdi-link-variant</v-icon>
          <span class="fld-lbl">Share Link</span>
        </div>
        <div class="d-flex align-center" style="gap: 8px;">
          <v-text-field
            :model-value="shareUrl"
            variant="outlined"
            density="compact"
            hide-details
            readonly
            bg-color="#f9fafb"
            style="flex: 1; font-size: 13px;"
          />
          <v-tooltip :text="copiedLink ? 'Copied!' : 'Copy link'" location="top">
            <template #activator="{ props: tip }">
              <v-btn
                v-bind="tip"
                :color="copiedLink ? 'success' : 'primary'"
                variant="flat"
                size="small"
                icon
                rounded="lg"
                @click="copyLink"
              >
                <v-icon size="16">{{ copiedLink ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
          <v-tooltip text="Open in new tab" location="top">
            <template #activator="{ props: tip }">
              <v-btn v-bind="tip" variant="outlined" size="small" icon rounded="lg" @click="previewForm">
                <v-icon size="16">mdi-open-in-new</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <!-- Embed code section -->
      <div class="section-block mb-4">
        <div class="d-flex align-center mb-2" style="gap: 6px;">
          <v-icon size="16" color="primary">mdi-code-tags</v-icon>
          <span class="fld-lbl">Embed Code (iframe)</span>
        </div>
        <div class="d-flex align-start" style="gap: 8px;">
          <v-textarea
            :model-value="embedCode"
            variant="outlined"
            density="compact"
            hide-details
            readonly
            rows="3"
            no-resize
            bg-color="#f9fafb"
            style="flex: 1; font-family: monospace; font-size: 12px;"
          />
          <v-tooltip :text="copiedEmbed ? 'Copied!' : 'Copy embed code'" location="top">
            <template #activator="{ props: tip }">
              <v-btn
                v-bind="tip"
                :color="copiedEmbed ? 'success' : 'primary'"
                variant="flat"
                size="small"
                icon
                rounded="lg"
                class="mt-1"
                @click="copyEmbed"
              >
                <v-icon size="16">{{ copiedEmbed ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </div>
      </div>

      <v-alert
        type="info"
        variant="tonal"
        density="compact"
        rounded="lg"
        class="mb-4"
        style="font-size: 12px;"
      >
        Paste the embed code into your website's HTML. Best on HTTPS sites.
      </v-alert>

      <!-- Regenerate section -->
      <v-divider class="mb-4" />
      <div class="d-flex align-center justify-space-between">
        <div>
          <p class="text-body-2 font-weight-medium mb-0">Regenerate link</p>
          <p class="text-caption text-medium-emphasis mb-0">Creates a new URL — existing embeds will break</p>
        </div>
        <v-btn
          color="error"
          variant="outlined"
          size="small"
          rounded="lg"
          :loading="regenerating"
          @click="regenDialog = true"
        >
          <v-icon start size="14">mdi-refresh</v-icon>
          Regenerate
        </v-btn>
      </div>
    </div>

    <!-- Regenerate confirmation -->
    <CommonConfirmDialog
      v-model="regenDialog"
      title="Regenerate link?"
      message="This will create a new unique URL. Any existing embeds on your website will stop working."
      confirm-text="Regenerate"
      confirm-color="error"
      icon="mdi-refresh"
      :loading="regenerating"
      @confirm="doRegenerate"
      @cancel="regenDialog = false"
    />
  </v-card>
</template>

<script setup>
import { useCrmStore } from '@/stores/crm'
import { useMainStore } from '@/stores/index'

const props = defineProps({
  form: { type: Object, required: true },
})
const emit = defineEmits(['close', 'regenerated'])

const crmStore = useCrmStore()
const mainStore = useMainStore()

const currentForm = ref({ ...props.form })
const copiedLink = ref(false)
const copiedEmbed = ref(false)
const regenDialog = ref(false)
const regenerating = ref(false)

// Compute shareUrl as a plain ref so it always resolves client-side
const shareUrl = ref('')
onMounted(() => {
  shareUrl.value = `${window.location.origin}/form/${currentForm.value.token}`
})

// Update shareUrl if token changes after regeneration
watch(() => currentForm.value.token, (token) => {
  if (process.client) shareUrl.value = `${window.location.origin}/form/${token}`
})

const embedCode = computed(() =>
  `<iframe src="${shareUrl.value}" width="100%" height="650" frameborder="0" style="border:none;border-radius:12px;"></iframe>`
)

const copyToClipboard = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
  } else {
    // Fallback for non-HTTPS environments
    const el = document.createElement('textarea')
    el.value = text
    el.style.position = 'fixed'
    el.style.opacity = '0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

const copyLink = async () => {
  try {
    await copyToClipboard(shareUrl.value)
    copiedLink.value = true
    setTimeout(() => { copiedLink.value = false }, 2000)
  } catch {
    mainStore.setSnackbar({ title: 'Could not copy — please copy manually', type: 'error' })
  }
}

const copyEmbed = async () => {
  try {
    await copyToClipboard(embedCode.value)
    copiedEmbed.value = true
    setTimeout(() => { copiedEmbed.value = false }, 2000)
  } catch {
    mainStore.setSnackbar({ title: 'Could not copy — please copy manually', type: 'error' })
  }
}

const previewForm = () => {
  window.open(shareUrl.value, '_blank')
}

const doRegenerate = async () => {
  regenerating.value = true
  try {
    const res = await crmStore.updateForm({ id: currentForm.value.id, regenerateToken: true })
    if (res?.code === 0) {
      currentForm.value = res.data
      mainStore.setSnackbar({ title: 'Link regenerated', type: 'success' })
      emit('regenerated', res.data)
    } else {
      mainStore.setSnackbar({ title: res?.message || 'Failed to regenerate', type: 'error' })
    }
  } catch (e) {
    mainStore.setSnackbar({ title: e?.message || 'Failed to regenerate', type: 'error' })
  } finally {
    regenerating.value = false
    regenDialog.value = false
  }
}
</script>

<style scoped>
.fld-lbl { font-size: 13px; font-weight: 500; color: #374151; }
.section-block {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
}
</style>
