<template>
  <v-card class="with-border rounded-lg">
    <h4 class="px-4 py-3 table-title">Automation details</h4>
    <v-table class="automation-table" density="comfortable">
      <thead>
        <tr>
          <th class="text-left">Type</th>
          <th class="text-left">Name</th>
          <th class="text-left">Sending</th>
          <th class="text-left">Preview</th>
          <th class="text-left">On/Off</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <td>{{ row.type }}</td>
          <td>
            <v-text-field
              v-model="row.name"
              variant="plain"
              density="compact"
              hide-details
            />
          </td>
          <td class="text-no-wrap">{{ row.sending }}</td>
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
          <div class="text-caption text-medium-emphasis">{{ active?.type }} • {{ active?.sending }}</div>
        </div>
        <v-btn icon @click="show = false"><v-icon>mdi-close</v-icon></v-btn>
      </div>
      <v-divider />

      <!-- Recipient preview -->
      <div class="px-4 pt-4 pb-2">
        <div class="text-subtitle-2 text-grey-darken-1 mb-1">Recipient preview</div>
        <div class="recipient-box">Lead: {{ sampleRecipient.name }} &lt;{{ sampleRecipient.email }}&gt;</div>
      </div>

      <!-- TipTap Toolbar -->
      <div class="px-4 pb-2 d-flex align-center flex-wrap" style="gap: 6px">
        <v-btn size="small" variant="text" :color="isActive('bold') ? 'primary' : ''" icon="mdi-format-bold" @click="cmd('bold')" />
        <v-btn size="small" variant="text" :color="isActive('italic') ? 'primary' : ''" icon="mdi-format-italic" @click="cmd('italic')" />
        <v-btn size="small" variant="text" :color="isActive('underline') ? 'primary' : ''" icon="mdi-format-underline" @click="cmd('underline')" />
        <v-btn size="small" variant="text" :color="isActive('bulletList') ? 'primary' : ''" icon="mdi-format-list-bulleted" @click="cmd('bulletList')" />
        <v-btn size="small" variant="text" :color="isActive('orderedList') ? 'primary' : ''" icon="mdi-format-list-numbered" @click="cmd('orderedList')" />
        <v-btn size="small" variant="text" icon="mdi-link-variant" @click="setLink" />
        <v-spacer />
        <v-btn size="small" color="primary" variant="flat" @click="saveContent">Save</v-btn>
      </div>

      <!-- TipTap Editor -->
      <div class="px-4 pb-4">
        <EditorContent v-if="editor" :editor="editor" class="editor" />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
const crmStore = useCrmStore()
const emit = defineEmits(['update:rows','save'])

// Table rows (local state for now; can be lifted to a store later)
const rows = reactive([])

const defaults = [
  { key: 'welcome_email', type: 'Email', name: 'Welcome Email', sending: 'Immediately', enabled: true, template: '<p>Welcome to our practice! We will contact you shortly.</p>' },
  { key: 'birthday', type: 'Email', name: 'Birthday Greeting', sending: 'On birthday (lead DOB)', enabled: false, template: '<p>Happy Birthday! Wishing you a wonderful year ahead.</p>' },
  { key: 'followup', type: 'Email', name: 'Follow-up Reminder', sending: '1 month later', enabled: false, template: '<p>Just checking in about your inquiry. Let us know if you have any questions.</p>' },
  { key: 'inactive_lead', type: 'Email', name: 'Inactive Lead Nurture', sending: 'After 2–3 weeks inactivity', enabled: false, template: '<p>We noticed it’s been a while. We’re here to help whenever you’re ready.</p>' },
]

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
const editor = ref(null)

const sampleRecipient = reactive({ name: 'John Doe', email: 'john@example.com' })

const openPreview = (row) => {
  active.value = row
  show.value = true
  nextTick(() => {
    // Initialize TipTap editor on open
    editor.value = new Editor({
      content: row.template || '',
      extensions: [
        StarterKit,
        Underline,
        Link.configure({ openOnClick: true, HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' } }),
      ],
    })
  })
}

const cmd = (name) => {
  if (!editor.value) return
  const chain = editor.value.chain().focus()
  switch (name) {
    case 'bold': chain.toggleBold().run(); break
    case 'italic': chain.toggleItalic().run(); break
    case 'underline': chain.toggleUnderline().run(); break
    case 'bulletList': chain.toggleBulletList().run(); break
    case 'orderedList': chain.toggleOrderedList().run(); break
  }
}

const isActive = (name) => {
  if (!editor.value) return false
  switch (name) {
    case 'bold': return editor.value.isActive('bold')
    case 'italic': return editor.value.isActive('italic')
    case 'underline': return editor.value.isActive('underline')
    case 'bulletList': return editor.value.isActive('bulletList')
    case 'orderedList': return editor.value.isActive('orderedList')
    default: return false
  }
}

const setLink = () => {
  if (!editor.value) return
  const url = prompt('Enter URL')
  if (url) editor.value.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
}

const saveContent = () => {
  if (active.value && editor.value) active.value.template = editor.value.getHTML()
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
  try { await crmStore.saveAutomation({ key: row.key, enabled: row.enabled }) } catch (e) { /* noop */ }
}

watch(show, (v) => { if (!v && editor.value) { editor.value.destroy(); editor.value = null } })
</script>

<style scoped>
.with-border { border: 1px solid rgb(var(--v-theme-outline)); }
.table-title {
  font-weight: 600;
  font-size: 14px;
}
.automation-table thead th {
  font-weight: 600;
  font-size: 13px;
}
.automation-table tbody td { font-size: 14px; }
.modal-title { font-weight: 600; font-size: 16px; }
.recipient-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fafafa;
}
.editor {
  min-height: 220px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px;
  background: #fff;
}
</style>
