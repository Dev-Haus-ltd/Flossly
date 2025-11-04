<template>
  <div>
    <!-- Header Toolbar -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-3">
      <div class="d-flex align-center gap-2">
        <v-text-field
          v-model="search"
          placeholder="Search automations..."
          append-inner-icon="mdi-magnify"
          variant="solo"
          :elevation="0"
          density="compact"
          hide-details
          bg-color="#FFFFFF"
          flat
          class="custom-search"
          style="width: 280px"
        />
        
        <v-menu :close-on-content-click="false">
          <template #activator="{ props }">
            <v-btn
              v-bind="props"
              variant="flat"
              density="compact"
              class="filter-btn"
            >
              <v-icon class="mr-2" size="18">mdi-filter-variant</v-icon>
              Filter
              <v-badge
                v-if="activeFilters > 0"
                :content="activeFilters"
                color="primary"
                inline
                class="ml-2"
              />
            </v-btn>
          </template>
          <v-card class="pa-4" min-width="280">
            <p class="text-subtitle-2 font-weight-bold mb-3">Filter by Status</p>
            <v-checkbox
              v-model="filterEnabled"
              label="Enabled only"
              density="compact"
              hide-details
              class="mb-2"
            />
            <v-checkbox
              v-model="filterDisabled"
              label="Disabled only"
              density="compact"
              hide-details
            />
            <v-divider class="my-3" />
            <v-btn
              size="small"
              variant="text"
              color="primary"
              @click="clearFilters"
            >
              Clear filters
            </v-btn>
          </v-card>
        </v-menu>
      </div>
    </div>

    <!-- Main Card -->
    <v-card class="with-border rounded-lg elevation-0">
      
      
      <v-divider />

      <v-data-table
        :items="filteredRows"
        :headers="tableHeaders"
        :search="search"
        item-value="key"
        class="automation-data-table full-width-table"
        density="comfortable"
        hover
        :items-per-page="15"
      >
        <!-- Type Column -->
        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal" color="primary" class="font-weight-medium">
            <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
            {{ item.type }}
          </v-chip>
        </template>

        <!-- Name Column (Editable) -->
        <template #item.name="{ item }">
          <v-text-field
            v-model="item.name"
            variant="plain"
            density="compact"
            hide-details
            class="name-field"
            @blur="onNameUpdate(item)"
          />
        </template>

        <!-- Sending/Trigger Column -->
        <template #item.sending="{ item }">
          <div class="d-flex align-center">
            <v-icon size="16" color="grey-darken-1" class="mr-2">mdi-clock-outline</v-icon>
            <span class="text-body-2 text-medium-emphasis">{{ item.sending }}</span>
          </div>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <v-btn
            variant="outlined"
            size="small"
            color="primary"
            @click="openPreview(item)"
          >
            <v-icon size="16" class="mr-1">mdi-pencil</v-icon>
            Edit
          </v-btn>
        </template>

        <!-- Status/Toggle Column -->
        <template #item.enabled="{ item }">
          <div class="d-flex align-center justify-center">
            <v-switch
              v-model="item.enabled"
              inset
              hide-details
              color="success"
              density="compact"
              :class="{ 'switch-active': item.enabled }"
              @update:model-value="onToggleEnabled(item, $event)"
            />
          </div>
        </template>

        <!-- Empty State -->
        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="64" color="grey-lighten-1">mdi-email-off-outline</v-icon>
            <p class="text-h6 mt-4 mb-2">No automations found</p>
            <p class="text-body-2 text-medium-emphasis">
              Try adjusting your search or filters
            </p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Preview / Edit Modal -->
    <v-dialog v-model="show" max-width="1100px" scrollable>
      <v-card class="rounded-lg elevation-8">
        <div class="modal-header">
          <div>
            <h5 class="modal-title">{{ active?.name }}</h5>
            <div class="d-flex align-center gap-2 mt-2">
              <v-chip size="x-small" variant="tonal" color="primary">
                <v-icon size="12" class="mr-1">mdi-email-outline</v-icon>
                {{ active?.type }}
              </v-chip>
              <v-chip size="x-small" variant="tonal" color="grey">
                <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                {{ active?.sending }}
              </v-chip>
            </div>
          </div>
          <v-btn icon variant="text" @click="show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        
        <v-divider />

        <div class="modal-body">
          <!-- Recipient Preview -->
          <div class="recipient-section">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                <v-icon size="18" class="mr-2">mdi-account-outline</v-icon>
                Preview Recipient
              </div>
              <v-chip size="small" variant="outlined" class="font-mono">
                {{ sampleRecipient.name }} &lt;{{ sampleRecipient.email }}&gt;
              </v-chip>
            </div>
          </div>

          <!-- Editor Section -->
          <div class="editor-section">
            <div class="d-flex align-center justify-space-between mb-3">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-2">
                <v-icon size="18" class="mr-2">mdi-email-edit-outline</v-icon>
                Email Content
              </div>
              <v-chip size="x-small" variant="tonal" color="info">
                Use [First Name] for personalization
              </v-chip>
            </div>
            <div ref="editorEl" class="editor"></div>
          </div>
        </div>

        <v-divider />
        
        <div class="modal-footer">
          <v-btn variant="text" @click="show = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="saveContent"
            :loading="saving"
          >
            <v-icon size="18" class="mr-2">mdi-content-save</v-icon>
            Save Changes
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { htmlToBlocks, blocksToHtml } from '@/lib/editorFormatter'
const crmStore = useCrmStore()
const emit = defineEmits(['update:rows','save'])

// Table state
const rows = reactive([])
const search = ref('')
const filterEnabled = ref(false)
const filterDisabled = ref(false)
const saving = ref(false)

const tableHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Automation Name', key: 'name', sortable: false },
  { title: 'Trigger', key: 'sending', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
  { title: 'Status', key: 'enabled', sortable: false, align: 'center' },
]

const activeFilters = computed(() => {
  let count = 0
  if (filterEnabled.value) count++
  if (filterDisabled.value) count++
  return count
})

const filteredRows = computed(() => {
  let result = [...rows]
  
  if (filterEnabled.value && !filterDisabled.value) {
    result = result.filter(r => r.enabled === true)
  }
  if (filterDisabled.value && !filterEnabled.value) {
    result = result.filter(r => r.enabled === false)
  }
  
  return result
})

const clearFilters = () => {
  filterEnabled.value = false
  filterDisabled.value = false
}

// Default automation templates
const defaults = [
  {
    key: 'new_patient_enquiry_immediate',
    type: 'Email',
    name: 'New Enquiry – Welcome (Immediate)',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>Thank you for reaching out! We're thrilled you're considering us for your dental care. At [Practice Name], we believe every smile tells a story, and we can't wait to be part of yours.</p><p>Our team is carefully reviewing your enquiry and will contact you within 24 hours to discuss your needs and find the perfect appointment time that fits your schedule.</p><p>In the meantime, meet our award-winning team and explore our state-of-the-art facility [link to virtual tour].</p><p>Welcome to the family!</p>`
  },
  {
    key: 'new_patient_enquiry_1_day',
    type: 'Email',
    name: 'New Enquiry – Why Us (Day 1)',
    sending: '1 day afterward',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>Choosing a dental practice is a big decision, and we want you to feel completely confident about joining our family.</p><p>Here's what our patients love most about us:</p><ul><li>Anxiety-free appointments with our gentle care approach</li><li>Same-day emergency availability</li><li>Advanced technology for pain-free treatments</li><li>A team that actually listens to your concerns</li></ul><p>Over 2,500 patients trust us with their smiles. Read their stories [link to testimonials] and discover why they've made us their dental home.</p><p>Ready to book? Simply reply to this email or call us at [phone number].</p>`
  },
  {
    key: 'new_patient_enquiry_3_days',
    type: 'Email',
    name: 'New Enquiry – Final Nudge (Day 3)',
    sending: '3 days after enquiry',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>We noticed you haven't scheduled your appointment yet, and we wanted to reach out one more time.</p><p>Did you know? 94% of our new patients wish they'd booked sooner! Don't let dental anxiety or a busy schedule hold you back from the smile you deserve.</p><p>This month, we're offering extended evening hours to accommodate your lifestyle. Limited slots available!</p><p>Watch this 60-second video of patient transformations that will inspire you [link].</p><p>Your future smile is waiting - let's make it happen together.</p>`
  },
  {
    key: 'black_friday_7_days_before',
    type: 'Email',
    name: 'Black Friday – Teaser (7 Days Before)',
    sending: '7 days before Black Friday',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>We've been working on something extraordinary, and we can't keep it a secret any longer.</p><p>This Black Friday, we're launching our biggest promotion of the year - and it's going to transform the way you think about dental care.</p><p>Mark your calendar for November 29th. You won't want to miss this.</p><p>Set your reminder now, because when this drops, it's going to be incredible.</p><p>The countdown begins...</p>`
  },
  {
    key: 'black_friday_launch',
    type: 'Email',
    name: 'Black Friday – Launch (Morning)',
    sending: 'Black Friday morning',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>BLACK FRIDAY IS LIVE!</p><p>For the next 24 hours only, unlock exclusive access to premium dental treatments that will revolutionize your smile.</p><ul><li>✨ Composite Bonding Transformation</li><li>✨ Professional Teeth Whitening</li><li>✨ Complete Smile Makeovers</li><li>✨ Advanced Dental Examinations</li></ul><p>This is our ONE annual promotion where we make premium dental care more accessible than ever. Hundreds of appointments available, but they're filling FAST.</p><p>Secure your spot before midnight: [booking link]</p><p>Over 150 patients have already claimed their appointments in the first hour. Don't miss your chance!</p>`
  },
  {
    key: 'black_friday_last_chance',
    type: 'Email',
    name: 'Black Friday – Last Chance (Evening)',
    sending: 'Black Friday evening (6 hours before deadline)',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>This is it - your last chance.</p><p>In just 6 hours, our Black Friday promotion disappears forever. We've already helped 300+ patients secure their dream smile today.</p><p>Only 25 appointment slots remaining.</p><p>Don't wake up tomorrow with regret. Your future self will thank you for taking action today.</p><p>Book now before midnight: [booking link]</p><p>Time is running out. Your smile transformation awaits.</p>`
  },
  {
    key: 'birthday_day',
    type: 'Email',
    name: 'Birthday – Gift Email (Day 0)',
    sending: 'On birthday',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>HAPPY BIRTHDAY! 🎂</p><p>Today is all about celebrating YOU, and we wanted to make your day even brighter with a special birthday gift from our team.</p><p>As our valued patient, we're giving you exclusive birthday access to treatments that will make you smile even wider this year:</p><ul><li>🎁 Complimentary smile enhancement consultation</li><li>🎁 Professional teeth whitening session</li><li>🎁 Priority booking privileges</li></ul><p>Your birthday gift is valid for 30 days - because your celebration shouldn't end today!</p><p>Book your birthday appointment here: [link]</p><p>Here's to another year of confident, radiant smiles. You deserve to shine!</p>`
  },
  {
    key: 'birthday_reminder_20_days',
    type: 'Email',
    name: 'Birthday – Gift Reminder (Day 20)',
    sending: '20 days after birthday',
    enabled: false,
    template: `<p>Hi [First Name],</p><p>We hope you had an amazing birthday! Just a friendly reminder that your exclusive birthday gift is still waiting for you - but not for long.</p><p>You have just 10 days left to claim your complimentary treatments. Don't let this special opportunity slip away!</p><p>Hundreds of our patients tell us that using their birthday gift was the best decision they made all year.</p><p>Claim your gift now: [booking link]</p><p>Make this birthday month truly unforgettable!</p>`
  },
]

onMounted(async () => {
  try {
    const res = await crmStore.listAutomation()
    const map = new Map((res?.data || []).map(r => [r.key, r]))
    const items = defaults.map((d) => {
      const saved = map.get(d.key) || {}
      return {
        ...d,
        ...saved,
        type: saved.type || d.type,
        name: saved.name || d.name,
        sending: saved.sending || d.sending,
        template: saved.template || d.template,
      }
    })
    rows.splice(0, rows.length, ...items)
  } catch {}
})

// Preview dialog state
const show = ref(false)
const active = ref(null)
let ej = null
let EditorCtor = null
let Header = null
let List = null
const editorEl = ref(null)

const sampleRecipient = reactive({ name: 'John Doe', email: 'john@example.com' })

const openPreview = async (row) => {
  active.value = row
  show.value = true
  await nextTick()
  if (typeof window === 'undefined') return
  if (!EditorCtor || !Header || !List) {
    const [{ default: E }, { default: H }, { default: L }] = await Promise.all([
      import('@editorjs/editorjs'),
      import('@editorjs/header'),
      import('@editorjs/list'),
    ])
    EditorCtor = E; Header = H; List = L
  }
  if (ej) { ej.destroy(); ej = null }
  ej = new EditorCtor({
    holder: editorEl.value,
    tools: { header: Header, list: List },
    data: htmlToBlocks(row.template || ''),
    onChange: async (api) => {
      const saved = await api.saver.save()
      active.value.template = blocksToHtml(saved)
    }
  })
}

const saveContent = async () => {
  saving.value = true
  try {
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
    await crmStore.saveAutomation(payload)
    emit('save', payload)
    show.value = false
  } finally {
    saving.value = false
  }
}

const onToggleEnabled = async (row, val) => {
  row.enabled = !!val
  const def = defaults.find(d => d.key === row.key) || {}
  const payload = {
    key: row.key,
    type: row.type || def.type || 'Email',
    name: row.name || def.name || row.key,
    sending: row.sending || def.sending || '',
    enabled: row.enabled,
    template: (row.template && row.template.trim()) ? row.template : (def.template || ''),
  }
  try { await crmStore.saveAutomation(payload) } catch (e) {}
}

const onNameUpdate = async (item) => {
  // Optional: auto-save name changes
}

watch(show, (v) => { if (!v && ej) { ej.destroy(); ej = null } })
</script>

<style scoped>
.gap-2 {
  gap: 8px;
}

.with-border { 
  border: 1px solid rgba(var(--v-theme-outline), 0.12);
}

.table-header-section {
  padding: 20px 24px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.table-title { 
  font-weight: 600; 
  font-size: 16px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.custom-search {
  height: 40px;
  border-radius: 8px;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.filter-btn,
.action-btn {
  height: 40px;
  text-transform: none;
  font-weight: 500;
  font-size: 14px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

/* Data Table Styles */
.automation-data-table {
  background: transparent;
}

.full-width-table :deep(.v-table__wrapper) {
  width: 100%;
}

.full-width-table :deep(table) {
  width: 100% !important;
  table-layout: auto;
}

.full-width-table :deep(th:nth-child(1)) { width: 120px; }
.full-width-table :deep(th:nth-child(2)) { width: auto; min-width: 300px; }
.full-width-table :deep(th:nth-child(3)) { width: 320px; }
.full-width-table :deep(th:nth-child(4)) { width: 130px; }
.full-width-table :deep(th:nth-child(5)) { width: 120px; }

.automation-data-table :deep(thead) {
  background: #f8f9fa;
}

.automation-data-table :deep(thead th) {
  font-weight: 600 !important;
  font-size: 12px !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgb(var(--v-theme-on-surface-variant)) !important;
  padding: 16px 20px !important;
  border-bottom: 2px solid #e8e8e8 !important;
}

.automation-data-table :deep(tbody tr) {
  transition: background-color 0.2s ease;
}

.automation-data-table :deep(tbody tr:hover) {
  background: #fafafa !important;
}

.automation-data-table :deep(tbody td) {
  padding: 14px 20px !important;
  font-size: 14px;
  vertical-align: middle !important;
  border-bottom: 1px solid #f0f0f0 !important;
}

.name-field {
  max-width: 100%;
}

.name-field :deep(.v-field__input) {
  padding: 4px 0 !important;
  min-height: 32px;
}

.name-field :deep(input) {
  font-weight: 500;
  font-size: 14px;
}

.switch-active :deep(.v-selection-control__input) {
  transform: scale(1.05);
}

.font-mono {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

/* Modal Styles */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 28px;
  background: linear-gradient(to bottom, #fafafa, #ffffff);
}

.modal-title {
  font-weight: 600;
  font-size: 18px;
  color: rgb(var(--v-theme-on-surface));
  margin: 0;
}

.modal-body {
  padding: 28px;
  background: #fafafa;
  min-height: 450px;
  max-height: 70vh;
  overflow-y: auto;
}

.recipient-section {
  background: white;
  padding: 18px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e8e8e8;
}

.editor-section {
  background: white;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e8e8e8;
}

.editor {
  min-height: 400px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 18px;
  background: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.editor :deep(.ce-block__content) {
  max-width: 100%;
}

.editor :deep(.ce-paragraph) {
  line-height: 1.7;
  font-size: 14px;
}

.editor :deep(.ce-header) {
  font-weight: 600;
  margin: 10px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 28px;
  background: white;
}
</style>