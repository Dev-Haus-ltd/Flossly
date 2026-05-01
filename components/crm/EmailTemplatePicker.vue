<template>
  <v-dialog v-model="show" max-width="820px" scrollable>
    <v-card class="rounded-lg">
      <!-- Header -->
      <div class="d-flex justify-space-between align-center px-5 py-4">
        <div>
          <h5 class="modal-title mb-1">Email Template Library</h5>
          <div class="text-caption text-medium-emphasis">Choose a saved template or create a new one</div>
        </div>
        <v-btn icon variant="text" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>
      <v-divider />

      <!-- Toolbar -->
      <div class="px-5 py-3 d-flex align-center gap-3 flex-wrap">
        <v-text-field
          v-model="search"
          density="compact"
          variant="outlined"
          placeholder="Search templates..."
          prepend-inner-icon="mdi-magnify"
          hide-details
          clearable
          style="max-width: 260px"
        />
        <v-btn-toggle v-model="filterMode" density="compact" variant="outlined" divided>
          <v-btn value="" size="small">All</v-btn>
          <v-btn value="wrapped" size="small">
            <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>Flossly
          </v-btn>
          <v-btn value="raw_html" size="small">
            <v-icon size="14" class="mr-1">mdi-code-tags</v-icon>Custom HTML
          </v-btn>
        </v-btn-toggle>
        <v-spacer />
        <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="emit('create')">
          New Template
        </v-btn>
      </div>
      <v-divider />

      <!-- List -->
      <v-card-text class="pa-0" style="min-height: 340px">
        <div v-if="loading" class="d-flex justify-center align-center pa-8">
          <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="!filtered.length" class="d-flex flex-column align-center justify-center pa-8 text-medium-emphasis">
          <v-icon size="40" class="mb-3">mdi-email-off-outline</v-icon>
          <div class="text-body-2">{{ search ? 'No templates match your search' : 'No templates yet — create your first one' }}</div>
        </div>

        <v-list v-else lines="two" class="py-0">
          <template v-for="(tpl, i) in filtered" :key="tpl.id">
            <v-divider v-if="i > 0" />
            <v-list-item
              :class="['template-row', selectedId === tpl.id ? 'template-row--selected' : '']"
              @click="selectedId = tpl.id"
            >
              <template #prepend>
                <v-avatar color="primary" variant="tonal" size="38" class="mr-3">
                  <v-icon size="18">{{ tpl.renderMode === 'raw_html' ? 'mdi-code-tags' : 'mdi-email-outline' }}</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">{{ tpl.name }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                {{ tpl.subject || 'No subject set' }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex align-center gap-2">
                  <v-chip
                    size="x-small"
                    :color="tpl.renderMode === 'raw_html' ? 'deep-orange' : 'primary'"
                    variant="tonal"
                  >
                    {{ tpl.renderMode === 'raw_html' ? 'Custom HTML' : 'Flossly' }}
                  </v-chip>
                  <v-chip v-if="tpl.category" size="x-small" variant="tonal" color="grey">
                    {{ tpl.category }}
                  </v-chip>
                  <v-btn
                    size="x-small"
                    icon
                    variant="text"
                    :loading="previewingId === tpl.id"
                    @click.stop="previewTemplate(tpl)"
                  >
                    <v-icon size="16">mdi-eye-outline</v-icon>
                  </v-btn>
                  <v-btn
                    size="x-small"
                    icon
                    variant="text"
                    :loading="duplicatingId === tpl.id"
                    @click.stop="duplicateTemplate(tpl)"
                  >
                    <v-icon size="16">mdi-content-copy</v-icon>
                  </v-btn>
                  <v-btn
                    size="x-small"
                    icon
                    variant="text"
                    color="error"
                    @click.stop="confirmArchive(tpl)"
                  >
                    <v-icon size="16">mdi-archive-outline</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-card-text>

      <v-divider />

      <!-- Footer -->
      <div class="px-5 py-3 d-flex justify-end gap-3">
        <v-btn variant="outlined" @click="show = false">Cancel</v-btn>
        <v-btn
          color="primary"
          flat
          :disabled="!selectedId"
          @click="confirmSelect"
        >
          Use this template
        </v-btn>
      </div>
    </v-card>

    <!-- Preview dialog -->
    <v-dialog v-model="showPreview" max-width="680px">
      <v-card class="rounded-lg">
        <div class="d-flex justify-space-between align-center px-4 py-3">
          <h5 class="modal-title">Preview: {{ previewTitle }}</h5>
          <v-btn icon variant="text" @click="showPreview = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <div class="pa-1" style="height: 480px">
          <iframe
            v-if="previewHtml"
            :srcdoc="previewHtml"
            sandbox="allow-same-origin"
            style="width:100%; height:100%; border:none; border-radius:4px"
          />
        </div>
      </v-card>
    </v-dialog>

    <!-- Archive confirm -->
    <CommonConfirmDialog
      v-model="showArchiveConfirm"
      title="Archive template?"
      :message="`Archive '${archiveTarget?.name}'? It will no longer appear in the picker but existing automations referencing it will still send.`"
      :loading="archiving"
      @confirm="doArchive"
      @cancel="showArchiveConfirm = false"
    />
  </v-dialog>
</template>

<script setup>
import emailTemplateService from '@/services/emailTemplateService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'select', 'create'])

const show = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const mainStore = useMainStore?.() || null

const templates = ref([])
const loading = ref(false)
const search = ref('')
const filterMode = ref('')
const selectedId = ref(null)

const previewingId = ref(null)
const showPreview = ref(false)
const previewHtml = ref('')
const previewTitle = ref('')

const duplicatingId = ref(null)
const showArchiveConfirm = ref(false)
const archiveTarget = ref(null)
const archiving = ref(false)

const filtered = computed(() => {
  let list = templates.value
  if (filterMode.value) list = list.filter((t) => t.renderMode === filterMode.value)
  const q = (search.value || '').toLowerCase().trim()
  if (q) list = list.filter((t) => (t.name + ' ' + (t.subject || '') + ' ' + (t.category || '')).toLowerCase().includes(q))
  return list
})

const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await emailTemplateService.listEmailTemplates()
    if (res?.code === 0) templates.value = Array.isArray(res.data) ? res.data : []
  } catch {}
  finally { loading.value = false }
}

watch(show, (v) => {
  if (v) {
    selectedId.value = null
    search.value = ''
    filterMode.value = ''
    loadTemplates()
  }
})

const confirmSelect = () => {
  const tpl = templates.value.find((t) => t.id === selectedId.value)
  if (tpl) {
    emit('select', tpl)
    show.value = false
  }
}

const previewTemplate = async (tpl) => {
  previewingId.value = tpl.id
  try {
    const res = await emailTemplateService.previewEmailTemplate({ templateId: tpl.id })
    if (res?.code === 0) {
      previewHtml.value = res.data?.html || ''
      previewTitle.value = tpl.name
      showPreview.value = true
    }
  } catch {}
  finally { previewingId.value = null }
}

const duplicateTemplate = async (tpl) => {
  duplicatingId.value = tpl.id
  try {
    const res = await emailTemplateService.duplicateEmailTemplate(tpl.id)
    if (res?.code === 0) {
      mainStore?.setSnackbar?.({ title: 'Template duplicated', type: 'success' })
      await loadTemplates()
    }
  } catch {}
  finally { duplicatingId.value = null }
}

const confirmArchive = (tpl) => {
  archiveTarget.value = tpl
  showArchiveConfirm.value = true
}

const doArchive = async () => {
  if (!archiveTarget.value) return
  archiving.value = true
  try {
    const res = await emailTemplateService.archiveEmailTemplate(archiveTarget.value.id)
    if (res?.code === 0) {
      showArchiveConfirm.value = false
      archiveTarget.value = null
      mainStore?.setSnackbar?.({ title: 'Template archived', type: 'success' })
      await loadTemplates()
    }
  } catch {}
  finally { archiving.value = false }
}
</script>

<style scoped>
.template-row {
  cursor: pointer;
  transition: background 0.15s;
}
.template-row:hover {
  background: #f5f7ff;
}
.template-row--selected {
  background: #eef2ff;
}
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
