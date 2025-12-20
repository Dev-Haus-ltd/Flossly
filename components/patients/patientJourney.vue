<template>
  <div class="journey-wrapper mt-5">
    <v-card class="journey-card rounded-lg" :elevation="0">
      <v-card-title class="d-flex justify-space-between align-center px-5 py-4">
        <div>
          <div class="text-h6 font-weight-600">Patient Journey</div>
          <div class="text-body-2 text-medium-emphasis">
            Configure comfort, survey questions, and automations to keep every visit personal.
          </div>
        </div>
        <div class="d-flex align-center">
          <v-btn color="primary" variant="flat" @click="handleSave">Save</v-btn>
        </div>
      </v-card-title>
      <v-divider />

      <div class="journey-body">
        <CommonSideBar
          :items="journeyItems"
          :selected="selectedSection"
          @select="selectedSection = $event"
          class="mr-4 sidebar sidebar-enhanced"
        />

        <div class="journey-content">
          <section v-if="selectedSection === 'uniqueComfort'">
            <div class="section-title">Unique Patient Comfort</div>
            <v-card class="content-card" :elevation="0">
              <v-row>
                <v-col cols="12" md="6">
                  <label class="fld-lbl">Beverage preferences</label>
                  <v-select
                    v-model="comfortForm.beveragePreference"
                    :items="beverageOptions"
                    variant="solo"
                    density="compact"
                    class="input-bordered mb-6"
                    bg-color="white"
                    flat
                    hide-details
                    clearable
                  />
                </v-col>
                <v-col cols="12" md="6">
                  <label class="fld-lbl">Blanket preferences during treatment</label>
                  <v-select
                    v-model="comfortForm.blanketPreference"
                    :items="blanketOptions"
                    variant="solo"
                    density="compact"
                    class="input-bordered mb-6"
                    bg-color="white"
                    flat
                    hide-details
                    clearable
                  />
                </v-col>

                <v-col cols="12">
                  <div class="field-label">Entertainment options</div>
                  <v-radio-group
                    v-model="comfortForm.entertainment"
                    inline
                    color="primary"
                    class="mb-4"
                  >
                    <v-radio label="Television" value="television" />
                    <v-radio label="Movies" value="movies" />
                    <v-radio label="Music Genres" value="music" />
                  </v-radio-group>
                </v-col>

                <v-col cols="12" md="6">
                  <label class="fld-lbl">Lighting and room temperature preferences</label>
                  <v-select
                    v-model="comfortForm.lightingPreference"
                    :items="lightingOptions"
                    variant="solo"
                    density="compact"
                    class="input-bordered mb-6"
                    bg-color="white"
                    flat
                    hide-details
                    clearable
                  />
                </v-col>

                <v-col cols="12" md="6">
                  <label class="fld-lbl">Aromatherapy preferences</label>
                  <v-select
                    v-model="comfortForm.aromatherapyPreference"
                    :items="aromatherapyOptions"
                    variant="solo"
                    density="compact"
                    class="input-bordered mb-6"
                    bg-color="white"
                    flat
                    hide-details
                    clearable
                  />
                </v-col>

                <v-col cols="12">
                  <div class="field-label">Communication style preferences</div>
                  <v-radio-group
                    v-model="comfortForm.communicationStyle"
                    inline
                    color="primary"
                    class="mb-6"
                  >
                    <v-radio label="Detailed" value="detailed" />
                    <v-radio label="Minimal" value="minimal" />
                    <v-radio label="Visual" value="visual" />
                  </v-radio-group>
                </v-col>

                <v-col cols="12" md="8">
                  <div class="field-label">Anxiety level tracking</div>
                  <v-slider
                    v-model="comfortForm.anxietyLevel"
                    :step="5"
                    :min="0"
                    :max="100"
                    color="primary"
                    thumb-label
                  />
                </v-col>
              </v-row>

              <div class="d-flex justify-start mt-6">
                <v-btn variant="flat" color="primary" prepend-icon="mdi-plus">
                  Add More Questions
                </v-btn>
              </div>
            </v-card>
          </section>

          <section v-else-if="selectedSection === 'smileSurvey'">

            <v-card class="content-card soft-border mb-5" :elevation="0">
              <div class="pill-heading">About your Smile: Introduction</div>
              <p class="intro-copy">
                We want to help you achieve the smile you’ve always wanted. Please take a few minutes to tell us about your smile concerns.
                This information will help us recommend the best treatment options for you.
              </p>

              <div class="question-block mt-6">
                <div class="question-label">Question 1: Do you currently experience any of the following? (Select all that apply)</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="item in concernOptions"
                    :key="item"
                    v-model="smileSurvey.concerns"
                    :label="item"
                    :value="item"
                    color="primary"
                    hide-details
                  />
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="sub-heading mb-2">Smile Aesthetic Concerns</div>
                <div class="question-label">Question 2: What would you most like to change about your smile? (Select all that apply)</div>

                <div class="option-group">
                  <div class="group-title">Color & Brightness:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in aestheticOptions.color"
                      :key="item"
                      v-model="smileSurvey.aesthetic"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Alignment & Spacing:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in aestheticOptions.alignment"
                      :key="item"
                      v-model="smileSurvey.aesthetic"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Tooth Appearance:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in aestheticOptions.appearance"
                      :key="item"
                      v-model="smileSurvey.aesthetic"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Missing Teeth:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in aestheticOptions.missing"
                      :key="item"
                      v-model="smileSurvey.aesthetic"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Overall:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in aestheticOptions.overall"
                      :key="item"
                      v-model="smileSurvey.aesthetic"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="sub-heading mb-2">Smile Confidence Assessment</div>
                <div class="question-label">Question 3: How important is your smile to you?</div>
                <v-slider
                  v-model="smileSurvey.smileImportance"
                  :step="5"
                  :min="0"
                  :max="100"
                  color="primary"
                  thumb-label
                  class="mb-2 mt-3"
                />
                <div class="range-labels">
                  <span>Not at all important</span>
                  <span>Extremely important</span>
                </div>

                <div class="question-label mt-6">Question 4: How confident do you feel about your smile?</div>
                <v-slider
                  v-model="smileSurvey.confidence"
                  :step="5"
                  :min="0"
                  :max="100"
                  color="primary"
                  thumb-label
                  class="mb-2 mt-3"
                />
                <div class="range-labels">
                  <span>Not confident at all</span>
                  <span>Very confident</span>
                </div>

                <div class="question-label mt-6">Question 5: Do you ever feel self-conscious about your smile in social situations?</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="opt in selfConsciousOptions"
                    :key="opt.value"
                    v-model="smileSurvey.selfConsciousness"
                    :label="opt.label"
                    :value="opt.value"
                    color="primary"
                    hide-details
                  />
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="sub-heading mb-2">Treatment Interest & Priorities</div>
                <div class="question-label">Question 6: Which treatments are you most interested in learning more about? (Select all that apply)</div>

                <div class="option-group">
                  <div class="group-title">Teeth Whitening:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in treatmentOptions.whitening"
                      :key="item"
                      v-model="smileSurvey.treatmentInterests"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Orthodontics:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in treatmentOptions.orthodontics"
                      :key="item"
                      v-model="smileSurvey.treatmentInterests"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Cosmetic Treatments:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in treatmentOptions.cosmetic"
                      :key="item"
                      v-model="smileSurvey.treatmentInterests"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Restorative:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in treatmentOptions.restorative"
                      :key="item"
                      v-model="smileSurvey.treatmentInterests"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>

                <div class="option-group">
                  <div class="group-title">Other:</div>
                  <div class="checkbox-stack dense">
                    <v-checkbox
                      v-for="item in treatmentOptions.other"
                      :key="item"
                      v-model="smileSurvey.treatmentInterests"
                      :label="item"
                      :value="item"
                      color="primary"
                      hide-details
                    />
                  </div>
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="question-label">Question 7: What is your main priority for improving your smile?</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="opt in priorityOptions"
                    :key="opt"
                    v-model="smileSurvey.priority"
                    :label="opt"
                    :value="opt"
                    color="primary"
                    hide-details
                  />
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="sub-heading mb-2">Timeline & Budget (Conditional)</div>
                <div class="question-label">Question 9: When are you hoping to start treatment?</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="opt in timelineOptions"
                    :key="opt"
                    v-model="smileSurvey.timeline"
                    :label="opt"
                    :value="opt"
                    color="primary"
                    hide-details
                  />
                </div>

                <div class="question-label mt-6">Question 10: Do you have a budget in mind for your smile improvement?</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="opt in budgetOptions"
                    :key="opt"
                    v-model="smileSurvey.budget"
                    :label="opt"
                    :value="opt"
                    color="primary"
                    hide-details
                  />
                </div>
              </div>

              <div class="question-block mt-8">
                <div class="sub-heading mb-2">Additional Information</div>
                <div class="question-label">Question 11: Is there anything else you’d like us to know about your smile concerns or goals?</div>
                <v-textarea
                  v-model="smileSurvey.additionalInfo"
                  variant="solo"
                  density="comfortable"
                  bg-color="white"
                  class="input-bordered textarea mt-3"
                  flat
                  rows="4"
                  auto-grow
                  hide-details
                  placeholder="Write here..."
                />

                <div class="question-label mt-6">Question 12: How would you like us to follow up with you?</div>
                <div class="checkbox-stack dense">
                  <v-checkbox
                    v-for="opt in followUpOptions"
                    :key="opt"
                    v-model="smileSurvey.followUp"
                    :label="opt"
                    :value="opt"
                    color="primary"
                    hide-details
                  />
                </div>
              </div>
            </v-card>
          </section>
          <section v-else>
            <v-card class="content-card" :elevation="0">
              <template v-if="!activeAutomation">
                <div class="d-flex justify-end mb-3">
                  <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-refresh" @click="fetchAutomationGroups">
                    Refresh
                  </v-btn>
                </div>
                <v-row dense>
                  <v-col v-for="card in automationGroups" :key="card.key" cols="12" sm="6" md="3">
                    <AutomationCard
                      :title="card.title"
                      :description="card.description"
                      :count="card.itemCount || card.templates?.length || 0"
                      :enabled="card.enabled"
                      :selected="activeAutomation?.key === card.key"
                      @select="selectAutomation(card)"
                      @toggle="(val) => { card.enabled = val; toggleAutomationGroup(card) }"
                    />
                  </v-col>
                </v-row>
              </template>
              <template v-else>
                <div class="d-flex align-center mb-4">
                  <v-btn icon variant="text" @click="clearAutomationSelection">
                    <v-icon>mdi-arrow-left</v-icon>
                  </v-btn>
                  <div class="field-label mb-0 ml-2">{{ activeAutomation.title }}</div>
                </div>
                <div v-if="activeAutomation" class="mb-4 d-flex justify-space-between align-center">
                  <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    placeholder="Search automations..."
                    density="compact"
                    variant="solo"
                    class="input-bordered"
                    hide-details
                    style="max-width: 320px"
                  />
                </div>
                <v-card class="with-border rounded-lg" variant="text">
                  <v-data-table-server
                    :items="pagedAutomationRows"
                    :items-length="filteredAutomationRows.length"
                    :headers="automationHeaders"
                    :loading="automationLoading"
                    :items-per-page="tableOptions.itemsPerPage"
                    :page="tableOptions.page"
                    class="automation-data-table full-width-table"
                    density="comfortable"
                    @update:options="onTableOptions"
                  >
                    <template #item.type="{ item }">
                      <v-chip size="small" variant="tonal" color="primary">
                        <v-icon size="14" class="mr-1">mdi-email-outline</v-icon>
                        {{ item.type }}
                      </v-chip>
                    </template>
                    <template #item.sending="{ item }">
                      <div class="text-body-2 text-medium-emphasis">{{ item.sending }}</div>
                    </template>
                    <template #item.preview="{ item }">
                      <v-btn size="small" variant="text" color="primary" @click="openPreview(item)">View</v-btn>
                    </template>
                    <template #item.enabled="{ item }">
                      <v-switch
                        v-model="item.enabled"
                        inset
                        density="compact"
                        hide-details
                        color="primary"
                        @update:model-value="toggleAutomation(item)"
                      />
                    </template>
                    <template #no-data>
                      <div class="text-center py-6">No automations found for this type.</div>
                    </template>
                  </v-data-table-server>
                </v-card>
              </template>
            </v-card>
            <v-dialog v-model="previewDialog" max-width="900px" scrollable>
              <v-card class="rounded-lg elevation-8">
                <div class="modal-header">
                  <div>
                    <h5 class="modal-title">{{ previewItem?.name }}</h5>
                    <div class="d-flex align-center gap-2 mt-2">
                      <v-chip size="x-small" variant="tonal" color="primary">
                        <v-icon size="12" class="mr-1">mdi-email-outline</v-icon>
                        {{ previewItem?.type }}
                      </v-chip>
                      <v-chip size="x-small" variant="tonal" color="grey">
                        <v-icon size="12" class="mr-1">mdi-clock-outline</v-icon>
                        {{ previewItem?.sending }}
                      </v-chip>
                    </div>
                  </div>
                  <v-btn icon variant="text" @click="previewDialog = false">
                    <v-icon>mdi-close</v-icon>
                  </v-btn>
                </div>
                <v-divider />
                <div class="modal-body">
                  <div class="editor-section">
                    <div class="text-subtitle-2 font-weight-bold text-grey-darken-2 mb-3">
                      Automation Content
                    </div>
                    <div class="preview-html" v-html="previewItem?.template || '<p>No template yet.</p>'"></div>
                  </div>
                </div>
                <v-divider />
                <div class="modal-footer">
                  <v-btn variant="text" @click="previewDialog = false">Close</v-btn>
                </div>
              </v-card>
            </v-dialog>
          </section>
        </div>
      </div>
    </v-card>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import CommonSideBar from '@/components/Common/sideBar.vue'
import patientJourneyService from '@/services/patientJourneyService'
import AutomationCard from '@/components/patients/automationCard.vue'

const props = defineProps({ patient: { type: Object, default: null } })
const emit = defineEmits(['save'])

const selectedSection = ref('uniqueComfort')
const journeyItems = [
  { key: 'uniqueComfort', label: 'Unique Patient Comfort' },
  { key: 'smileSurvey', label: 'Smile Concern Survey'},
  { key: 'automations', label: 'Automations' },
]

const defaultComfort = () => ({
  beveragePreference: '',
  blanketPreference: '',
  entertainment: 'television',
  lightingPreference: '',
  aromatherapyPreference: '',
  communicationStyle: 'detailed',
  anxietyLevel: 35,
})

const comfortForm = reactive(defaultComfort())

const defaultSmileSurvey = () => ({
  concerns: [],
  aesthetic: [],
  confidence: 50,
  selfConsciousness: [],
  treatmentInterests: [],
  budget: [],
  priority: [],
  timeline: [],
  additionalInfo: '',
  followUp: [],
  smileImportance: 50,
})
const smileSurvey = reactive(defaultSmileSurvey())

watch(
  () => props.patient,
  (p) => {
    // placeholder for future data hydration
    Object.assign(comfortForm, defaultComfort(), p?.journeyComfort || {})
    Object.assign(smileSurvey, defaultSmileSurvey(), p?.journeySurvey || {})
  },
  { immediate: true }
)

const beverageOptions = ['Water', 'Tea', 'Coffee', 'Juice', 'No preference']
const blanketOptions = ['Yes, heated blanket', 'Light blanket', 'No blanket']
const lightingOptions = ['Dim lighting', 'Normal lighting', 'Bright lighting', 'Cool room', 'Warm room']
const aromatherapyOptions = ['Lavender', 'Peppermint', 'Eucalyptus', 'Unscented', 'Other']
const concernOptions = [
  'Tooth sensitivity (hot/cold/sweet)',
  'Tooth pain or discomfort when chewing',
  'Bleeding or swollen gums',
  'Bad breath that doesn’t go away',
  'Loose or shifting teeth',
  'Jaw joint pain or clicking',
  'Grinding or clenching teeth (especially at night)',
  'Teeth or fillings breaking/chipping',
  'None of the above',
]
const aestheticOptions = {
  color: ['Make my teeth whiter/brighter', 'Remove stains or discoloration'],
  alignment: ['Make my teeth straighter', 'Close gaps between my teeth', 'Fix crowded or overlapping teeth'],
  appearance: [
    'Repair chipped or cracked teeth',
    'Replace old/dark fillings with natural-looking ones',
    'Replace old crowns that don’t match my teeth',
    'Fix uneven or worn teeth',
    'Make my teeth look more even in size',
  ],
  missing: ['Replace missing teeth', 'Replace my removable denture with a permanent solution'],
  overall: ['Complete smile makeover', "I’m happy with my smile as it is"],
}
const treatmentOptions = {
  whitening: ['Professional teeth whitening (in-office)', 'Take-home whitening kits'],
  orthodontics: ['Invisalign (clear aligners)', 'Traditional braces', 'Quick cosmetic alignment (6-month braces)'],
  cosmetic: ['Porcelain veneers', 'Composite bonding', 'Tooth contouring/reshaping', 'Gum recontouring'],
  restorative: ['Dental implants', 'Crowns or bridges', 'White fillings (replacing silver/amalgam)'],
  other: ['Smile makeover consultation', "Not sure - I’d like professional advice"],
}
const timelineOptions = [
  'As soon as possible',
  'Within the next 3 months',
  'Within the next 6 months',
  'Within the next year',
  'Just exploring options for now',
]
const budgetOptions = [
  'Under £500',
  '£500 - £1,000',
  '£1,000 - £2,500',
  '£2,500 - £5,000',
  'Over £5,000',
  'I’d like to discuss financing options',
  'Not sure yet',
]
const priorityOptions = [
  'Appearance and aesthetics',
  'Function and comfort',
  'Both equally important',
  'Health concerns (pain, decay, gum disease)',
]
const selfConsciousOptions = [
  { value: 'frequent', label: 'Yes, frequently' },
  { value: 'sometimes', label: 'Yes, sometimes' },
  { value: 'rarely', label: 'Rarely' },
  { value: 'never', label: 'Never' },
]
const followUpOptions = ['Phone call', 'Email', 'Text message', 'Via patient portal message']

// Automations
const automationGroups = ref([])
const activeAutomation = ref(null)
const automationRows = ref([])
const automationLoading = ref(false)
const tableOptions = ref({ page: 1, itemsPerPage: 10 })
const search = ref('')

const automationHeaders = [
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Name', key: 'name', sortable: false },
  { title: 'Sending', key: 'sending', sortable: false },
  { title: 'Preview', key: 'preview', sortable: false, align: 'center' },
  { title: 'Status', key: 'enabled', sortable: false, align: 'center' },
]

const previewDialog = ref(false)
const previewItem = ref(null)

const fetchAutomationGroups = async () => {
  try {
    const res = await patientJourneyService.listAutomationGroups()
    const data = res?.data || []
    automationGroups.value = data
  } catch (e) {
    console.error('automation groups error', e)
  }
}

const fetchAutomationRows = async (groupKey) => {
  if (!groupKey) return
  automationLoading.value = true
  try {
    const res = await patientJourneyService.listAutomationTemplates(groupKey)
    automationRows.value = res?.data || []
  } catch (e) {
    automationRows.value = []
  } finally {
    automationLoading.value = false
  }
}

const selectAutomation = async (card) => {
  activeAutomation.value = card
  await fetchAutomationRows(card?.key)
}

const toggleAutomationGroup = async (card) => {
  const enabled = !!card.enabled
  try {
    await patientJourneyService.toggleAutomationGroup({ groupKey: card.key, enabled })
    automationRows.value = automationRows.value.map((r) => ({ ...r, enabled }))
  } catch (e) {
    card.enabled = !enabled
  }
}

const toggleAutomation = async (row) => {
  try {
    await patientJourneyService.saveAutomationTemplate({ ...row, groupKey: activeAutomation.value?.key })
  } catch (e) {
    row.enabled = !row.enabled
  }
}

const openPreview = (row) => {
  previewItem.value = row
  previewDialog.value = true
}

const clearAutomationSelection = () => {
  activeAutomation.value = null
  automationRows.value = []
  search.value = ''
  tableOptions.value = { page: 1, itemsPerPage: 10 }
}

const filteredAutomationRows = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return automationRows.value
  return automationRows.value.filter((r) =>
    [r.name, r.type, r.sending].some((v) => (v || '').toString().toLowerCase().includes(term))
  )
})

const pagedAutomationRows = computed(() => {
  const start = (tableOptions.value.page - 1) * tableOptions.value.itemsPerPage
  return filteredAutomationRows.value.slice(start, start + tableOptions.value.itemsPerPage)
})

const onTableOptions = (opts) => {
  tableOptions.value = { ...tableOptions.value, ...opts }
}

watch(selectedSection, (val) => {
  if (val === 'automations' && !automationGroups.value.length) {
    fetchAutomationGroups()
  }
})


const handleSave = () => {
  const payload = {
    patientId: props.patient?.id,
    journeyComfort: { ...comfortForm },
    journeySurvey: { ...smileSurvey },
  }
  emit('save', payload)
}
</script>

<style scoped>
.journey-wrapper {
  width: 100%;
}
.journey-card {
  border: 1px solid #e0e0e0;
}
.journey-body {
  display: flex;
  padding: 24px 20px;
}
.sidebar {
  min-width: 220px;
}
.sidebar-enhanced :deep(.v-list-item) {
  border-radius: 10px;
  margin-bottom: 6px;
}
.sidebar-enhanced :deep(.v-list-item--active) {
  background-color: #eef2ff !important;
  color: #1e1e1e !important;
}

.journey-content {
  flex: 1;
  padding-left: 24px;
  min-width: 0;
}
.section-title {
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 12px;
}
.content-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  background: #fff;
  height: 50vh;
  overflow: auto;
}
.field-label {
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 6px;
}
.sub-heading {
  font-weight: 600;
  font-size: 14px;
}
.intro-copy {
  color: #5f6368;
  font-size: 14px;
  margin-top: 8px;
}
.pill-heading {
  display: inline-block;
  background: #e8e3ff;
  color: #5a3fc0;
  padding: 8px 12px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}
.question-block {
  border-top: 1px solid #f1f1f1;
  padding-top: 18px;
}
.question-label {
  background: #eef4f4;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
  color: #1e1e1e;
  margin-bottom: 12px;
}
.option-group {
  margin-top: 16px;
}
.group-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: #1e1e1e;
}
.range-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6b7280;
}
.automation-row + .automation-row {
  border-top: 1px solid #f1f1f1;
  padding-top: 12px;
}
.checkbox-stack :deep(.v-selection-control) {
  margin-bottom: 4px;
}
.checkbox-stack.dense :deep(.v-selection-control) {
  margin-bottom: 2px;
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background: #fff !important;
  min-height: 44px;
  font-size: 14px;
}
.textarea :deep(textarea) {
  min-height: 140px;
}
.fld-lbl {
  font-weight: 400;
  font-size: 14px;
  color: #737373;
  margin-bottom: 4px;
  display: block;
}
.with-border { border:1px solid #e5e7eb; }
.automation-data-table :deep(thead th) { background:#f8f9fa; font-weight:600 !important; font-size:12px !important; }
.automation-data-table :deep(tbody td) { font-size:14px; }
.full-width-table :deep(.v-table__wrapper) { width: 100%; }
.full-width-table :deep(table) { width: 100% !important; table-layout: auto; }
.modal-header { display:flex; justify-content:space-between; align-items:flex-start; padding:16px 20px; }
.modal-title { font-weight:600; font-size:18px; margin:0; }
.modal-body { padding:20px; max-height:70vh; overflow:auto; background:#fafafa; }
.modal-footer { display:flex; justify-content:flex-end; gap:12px; padding:12px 20px; }
.preview-html { background:#fff; border:1px solid #e0e0e0; border-radius:8px; padding:16px; min-height:200px; }
</style>
