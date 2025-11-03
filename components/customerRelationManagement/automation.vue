<template>
  <v-card class="with-border rounded-lg">
    <h4 class="px-4 py-3 table-title">Automation details</h4>
    <v-table class="automation-table" density="comfortable">
      <thead>
        <tr>
          <th class="text-left col-type">Type</th>
          <th class="text-left col-name">Name</th>
          <th class="text-left col-sending">Sending</th>
          <th class="text-left col-preview">Preview</th>
          <th class="text-left col-toggle">On/Off</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td class="text-medium-emphasis">{{ row.type }}</td>
          <td>
            <v-text-field
              v-model="row.name"
              variant="plain"
              density="compact"
              hide-details
              class="name-field"
            />
          </td>
          <td class="text-no-wrap text-medium-emphasis">{{ row.sending }}</td>
          <td>
            <v-btn variant="text" color="primary" @click="openPreview(row)">View</v-btn>
          </td>
          <td>
            <v-switch
              v-model="row.enabled"
              inset
              hide-details
              color="primary"
              @update:model-value="onToggleEnabled(row, $event)"
            />
          </td>
        </tr>
      </tbody>
    </v-table>
  </v-card>

  <!-- Preview / Edit Modal -->
  <v-dialog v-model="show" max-width="900px">
    <v-card class="rounded-lg">
      <div class="d-flex justify-space-between align-center px-4 py-3">
        <div>
          <h5 class="mb-1 modal-title">{{ active?.name }}</h5>
          <div class="text-caption text-medium-emphasis">{{ active?.type }} &bull; {{ active?.sending }}</div>
        </div>
        <v-btn icon @click="show = false"><v-icon>mdi-close</v-icon></v-btn>
      </div>
      <v-divider />

      <div class="px-4 pt-4 pb-2">
        <div class="text-subtitle-2 text-grey-darken-1 mb-1">Recipient preview</div>
        <div class="recipient-box">Lead: {{ sampleRecipient.name }} &lt;{{ sampleRecipient.email }}&gt;</div>
      </div>

      <div class="px-4 pb-4">
        <div ref="editorEl" class="editor"></div>
        <div class="d-flex justify-end mt-2">
          <v-btn size="small" color="primary" variant="flat" @click="saveContent">Save</v-btn>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
const crmStore = useCrmStore()
const emit = defineEmits(['update:rows','save'])

// Table rows
const rows = reactive([])


onMounted(async () => {
  try {
    const res = await crmStore.listAutomation()
    const map = new Map((res?.data || []).map(r => [r.key, r]))
    const items = defaults.map(d => ({ ...d, ...(map.get(d.key) || {}) }))
    rows.splice(0, rows.length, ...items)
  } catch {}
})

// Preview dialog state
const show = ref(false)
const active = ref(null)
let ej = null
const editorEl = ref(null)

const sampleRecipient = reactive({ name: 'John Doe', email: 'john@example.com' })

const openPreview = (row) => {
  active.value = row
  show.value = true
  nextTick(() => {
    if (ej) { ej.destroy(); ej = null }
    ej = new EditorJS({
      holder: editorEl.value,
      tools: { header: Header, list: List },
      data: htmlToBlocks(row.template || ''),
      onChange: async (api) => {
        const saved = await api.saver.save()
        active.value.template = blocksToHtml(saved)
      }
    })
  })
}

const saveContent = async () => {
  if (ej && active.value) {
    const saved = await ej.save()
    active.value.template = blocksToHtml(saved)
  }
  emit('update:rows', rows)
  const payload = {
    key: active.value?.key,
    type: active.value?.type,
    name: active.value?.name,
    sending: active.value?.sending,
    enabled: !!active.value?.enabled,
    template: active.value?.template,
  }
  crmStore.saveAutomation(payload)
  emit('save', payload)
  show.value = false
}

const onToggleEnabled = async (row, val) => {
  row.enabled = !!val
  try { await crmStore.saveAutomation({ key: row.key, enabled: row.enabled }) } catch (e) {}
}

watch(show, (v) => { if (!v && ej) { ej.destroy(); ej = null } })

// HTML <-> EditorJS helpers
function htmlToBlocks(html) {
  const container = document.createElement('div')
  container.innerHTML = html || ''
  const blocks = []
  Array.from(container.childNodes).forEach((node) => {
    if (node.nodeType === 3) {
      const text = node.textContent.trim()
      if (text) blocks.push({ type: 'paragraph', data: { text } })
    } else if (node.nodeName === 'P') {
      blocks.push({ type: 'paragraph', data: { text: node.innerHTML } })
    } else if (/^H[1-6]$/.test(node.nodeName)) {
      const level = Number(node.nodeName.substring(1))
      blocks.push({ type: 'header', data: { level, text: node.innerHTML } })
    } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
      const style = node.nodeName === 'UL' ? 'unordered' : 'ordered'
      const items = Array.from(node.querySelectorAll('li')).map(li => li.innerHTML)
      blocks.push({ type: 'list', data: { style, items } })
    }
  })
  if (!blocks.length) blocks.push({ type: 'paragraph', data: { text: '' } })
  return { blocks }
}

function blocksToHtml(data) {
  const blocks = (data && data.blocks) || []
  return blocks.map((b) => {
    if (b.type === 'paragraph') return `<p>${b.data?.text || ''}</p>`
    if (b.type === 'header') return `<h${b.data?.level || 2}>${b.data?.text || ''}</h${b.data?.level || 2}>`
    if (b.type === 'list') {
      const tag = b.data?.style === 'ordered' ? 'ol' : 'ul'
      const items = (b.data?.items || []).map(i => `<li>${i}</li>`).join('')
      return `<${tag}>${items}</${tag}>`
    }
    return ''
  }).join('')
}
</script>

<style scoped>
.with-border { border: 1px solid rgb(var(--v-theme-outline)); }
.table-title { font-weight: 600; font-size: 14px; }
.automation-table thead th { font-weight: 600; font-size: 13px; }
.automation-table thead th,
.automation-table tbody td { padding: 12px 16px; }
.automation-table tbody td { font-size: 14px; vertical-align: middle; }
.automation-table tbody tr + tr td { border-top: 1px solid #eee; }
.automation-table :where(th:nth-child(1), td:nth-child(1)) { width: 110px; }
.automation-table :where(th:nth-child(2), td:nth-child(2)) { width: 320px; }
.automation-table :where(th:nth-child(3), td:nth-child(3)) { width: 240px; }
.automation-table :where(th:nth-child(4), td:nth-child(4)) { width: 120px; }
.automation-table :where(th:nth-child(5), td:nth-child(5)) { width: 120px; }
.name-field { max-width: 320px; }
.name-field :deep(.v-field__input) { padding: 0 !important; }
.name-field :deep(input) { font-weight: 500; }
.modal-title { font-weight: 600; font-size: 16px; }
.recipient-box { border: 1px solid #e0e0e0; border-radius: 8px; padding: 8px 12px; background: #fafafa; }
.editor { min-height: 220px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #fff; }
</style>
