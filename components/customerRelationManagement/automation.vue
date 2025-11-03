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
        <div class="text-subtitle-2 text-grey-darken-1 mt-4 mb-1">Content preview</div>
        <div class="preview-box" v-html="renderedHtml"></div>
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
const crmStore = useCrmStore()
const emit = defineEmits(['update:rows','save'])

// Table rows
const rows = reactive([])
// Default automation templates
const defaults = [
  // New patient enquiry
  {
    key: 'new_patient_enquiry_immediate',
    type: 'Email',
    name: 'New Enquiry – Welcome (Immediate)',
    sending: 'Immediately when lead comes into CRM',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Thank you for reaching out! We're thrilled you're considering us for your dental care. At [Practice Name], we believe every smile tells a story, and we can't wait to be part of yours.</p>
      <p>Our team is carefully reviewing your enquiry and will contact you within 24 hours to discuss your needs and find the perfect appointment time that fits your schedule.</p>
      <p>In the meantime, meet our award-winning team and explore our state-of-the-art facility [link to virtual tour].</p>
      <p>Welcome to the family!</p>
    `
  },
  {
    key: 'new_patient_enquiry_1_day',
    type: 'Email',
    name: 'New Enquiry – Why Us (Day 1)',
    sending: '1 day afterward',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Choosing a dental practice is a big decision, and we want you to feel completely confident about joining our family.</p>
      <p>Here's what our patients love most about us:</p>
      <ul>
        <li>Anxiety-free appointments with our gentle care approach</li>
        <li>Same-day emergency availability</li>
        <li>Advanced technology for pain-free treatments</li>
        <li>A team that actually listens to your concerns</li>
      </ul>
      <p>Over 2,500 patients trust us with their smiles. Read their stories [link to testimonials] and discover why they've made us their dental home.</p>
      <p>Ready to book? Simply reply to this email or call us at [phone number].</p>
    `
  },
  {
    key: 'new_patient_enquiry_3_days',
    type: 'Email',
    name: 'New Enquiry – Final Nudge (Day 3)',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>We noticed you haven't scheduled your appointment yet, and we wanted to reach out one more time.</p>
      <p>Did you know? 94% of our new patients wish they'd booked sooner! Don't let dental anxiety or a busy schedule hold you back from the smile you deserve.</p>
      <p>This month, we're offering extended evening hours to accommodate your lifestyle. Limited slots available!</p>
      <p>Watch this 60-second video of patient transformations that will inspire you [link].</p>
      <p>Your future smile is waiting - let's make it happen together.</p>
    `
  },

  // Black Friday Promotion
  {
    key: 'black_friday_7_days_before',
    type: 'Email',
    name: 'Black Friday – Teaser (7 Days Before)',
    sending: '7 days before Black Friday',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>We've been working on something extraordinary, and we can't keep it a secret any longer.</p>
      <p>This Black Friday, we're launching our biggest promotion of the year - and it's going to transform the way you think about dental care.</p>
      <p>Mark your calendar for November 29th. You won't want to miss this.</p>
      <p>Set your reminder now, because when this drops, it's going to be incredible.</p>
      <p>The countdown begins...</p>
    `
  },
  {
    key: 'black_friday_launch',
    type: 'Email',
    name: 'Black Friday – Launch (Morning)',
    sending: 'Black Friday morning',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>BLACK FRIDAY IS LIVE!</p>
      <p>For the next 24 hours only, unlock exclusive access to premium dental treatments that will revolutionize your smile.</p>
      <ul>
        <li>✨ Composite Bonding Transformation</li>
        <li>✨ Professional Teeth Whitening</li>
        <li>✨ Complete Smile Makeovers</li>
        <li>✨ Advanced Dental Examinations</li>
      </ul>
      <p>This is our ONE annual promotion where we make premium dental care more accessible than ever. Hundreds of appointments available, but they're filling FAST.</p>
      <p>Secure your spot before midnight: [booking link]</p>
      <p>Over 150 patients have already claimed their appointments in the first hour. Don't miss your chance!</p>
    `
  },
  {
    key: 'black_friday_last_chance',
    type: 'Email',
    name: 'Black Friday – Last Chance (Evening)',
    sending: 'Black Friday evening (6 hours before deadline)',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>This is it - your last chance.</p>
      <p>In just 6 hours, our Black Friday promotion disappears forever. We've already helped 300+ patients secure their dream smile today.</p>
      <p>Only 25 appointment slots remaining.</p>
      <p>Don't wake up tomorrow with regret. Your future self will thank you for taking action today.</p>
      <p>Book now before midnight: [booking link]</p>
      <p>Time is running out. Your smile transformation awaits.</p>
    `
  },

  // Birthday Email Automation
  {
    key: 'birthday_day',
    type: 'Email',
    name: 'Birthday – Gift Email (Day 0)',
    sending: 'On birthday',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>HAPPY BIRTHDAY! 🎂</p>
      <p>Today is all about celebrating YOU, and we wanted to make your day even brighter with a special birthday gift from our team.</p>
      <p>As our valued patient, we're giving you exclusive birthday access to treatments that will make you smile even wider this year:</p>
      <ul>
        <li>🎁 Complimentary smile enhancement consultation</li>
        <li>🎁 Professional teeth whitening session</li>
        <li>🎁 Priority booking privileges</li>
      </ul>
      <p>Your birthday gift is valid for 30 days - because your celebration shouldn't end today!</p>
      <p>Book your birthday appointment here: [link]</p>
      <p>Here's to another year of confident, radiant smiles. You deserve to shine!</p>
    `
  },
  {
    key: 'birthday_reminder_20_days',
    type: 'Email',
    name: 'Birthday – Gift Reminder (Day 20)',
    sending: '20 days after birthday',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>We hope you had an amazing birthday! Just a friendly reminder that your exclusive birthday gift is still waiting for you - but not for long.</p>
      <p>You have just 10 days left to claim your complimentary treatments. Don't let this special opportunity slip away!</p>
      <p>Hundreds of our patients tell us that using their birthday gift was the best decision they made all year.</p>
      <p>Claim your gift now: [booking link]</p>
      <p>Make this birthday month truly unforgettable!</p>
    `
  },

  // Composite Bonding Enquiry Automation
  {
    key: 'bonding_immediate',
    type: 'Email',
    name: 'Composite Bonding – Intro (Immediate)',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Thank you for your interest in composite bonding! You're one step closer to the smile transformation you've been dreaming about.</p>
      <p>Composite bonding is our most popular cosmetic treatment because it delivers dramatic results in just one appointment. Imagine walking in with insecurities and walking out with unstoppable confidence.</p>
      <p>Here's what makes it magical:</p>
      <ul>
        <li>Fixes chips, gaps, and discoloration instantly</li>
        <li>Pain-free procedure with no drilling</li>
        <li>Natural-looking results that last for years</li>
        <li>Transform your smile in under 2 hours</li>
      </ul>
      <p>Watch real patient transformations: [video link]</p>
      <p>Our expert cosmetic dentist has completed over 500 bonding procedures with stunning results. Let's create your masterpiece.</p>
    `
  },
  {
    key: 'bonding_3_days',
    type: 'Email',
    name: 'Composite Bonding – Transformations (Day 3)',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Seeing is believing, and these before-and-after transformations speak louder than any words we could write.</p>
      <p>[Patient A] was self-conscious about her smile for 15 years. After one bonding appointment, she couldn't stop smiling. "I wish I'd done this sooner," she told us.</p>
      <p>[Patient B] fixed years of chipped teeth in just 90 minutes. "Life-changing" is how he describes it.</p>
      <p>Your transformation could be next. Browse our portfolio of stunning results: [gallery link]</p>
      <p>What's holding you back from the smile you deserve? Let's discuss your unique vision.</p>
    `
  },
  {
    key: 'bonding_7_days',
    type: 'Email',
    name: 'Composite Bonding – Consultation Invite (Day 7)',
    sending: '7 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>A week ago, you took the first step toward a confidence-boosting smile. Now it's time for step two.</p>
      <p>We're reserving complimentary consultation slots for serious candidates who are ready to invest in themselves. During your consultation, you'll:</p>
      <ul>
        <li>See digital previews of your potential results</li>
        <li>Discuss your unique smile goals</li>
        <li>Get a personalized treatment plan</li>
        <li>Have all your questions answered by our specialist</li>
      </ul>
      <p>Limited consultation spots available this month. Your dream smile is just one appointment away.</p>
      <p>Book your consultation: [link]</p>
      <p>The only thing you'll regret is not doing it sooner.</p>
    `
  },

  // Teeth Whitening Enquiry Automation
  {
    key: 'whitening_immediate',
    type: 'Email',
    name: 'Whitening – Intro (Immediate)',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>A dazzling white smile is closer than you think! Thank you for asking about our professional teeth whitening treatments.</p>
      <p>Forget drugstore strips and messy trays - our advanced whitening system delivers professional results that last:</p>
      <ul>
        <li>Whiten up to 8 shades in one session</li>
        <li>Zero sensitivity with our unique formula</li>
        <li>Safe, effective, and dentist-supervised</li>
        <li>Results visible immediately</li>
      </ul>
      <p>Perfect for weddings, job interviews, special events, or simply feeling amazing every day.</p>
      <p>See the dramatic difference: [before/after photos]</p>
      <p>Your radiant smile awaits!</p>
    `
  },
  {
    key: 'whitening_2_days',
    type: 'Email',
    name: 'Whitening – Pro vs DIY (Day 2)',
    sending: '2 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Thinking about drugstore whitening kits to save time? Here's what you should know first.</p>
      <p><strong>DIY whitening kits:</strong></p>
      <ul>
        <li>Take weeks or months for minimal results</li>
        <li>Can cause severe tooth sensitivity</li>
        <li>Often damage enamel with harsh chemicals</li>
        <li>Inconsistent, patchy results</li>
      </ul>
      <p><strong>Professional whitening at [Practice Name]:</strong></p>
      <ul>
        <li>Dramatic results in just one appointment</li>
        <li>Safe, pain-free procedure</li>
        <li>Customized to your unique needs</li>
        <li>Long-lasting results worth celebrating</li>
      </ul>
      <p>Don't gamble with your smile. Over 800 patients have chosen professional whitening with us - and they've never looked back.</p>
      <p>Read their stories: [testimonials link]</p>
    `
  },
  {
    key: 'whitening_5_days',
    type: 'Email',
    name: 'Whitening – Event Urgency (Day 5)',
    sending: '5 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Whether you have a wedding, reunion, photo shoot, or important meeting on the horizon - or you simply want to look your absolute best every day - professional teeth whitening is your secret weapon.</p>
      <p>The confidence that comes with a brilliant white smile is priceless. You'll light up every room you enter.</p>
      <p>But here's the thing: our calendar fills up fast, especially during peak seasons. Don't risk missing out on looking your best when it matters most.</p>
      <p>Book your whitening session today: [booking link]</p>
      <p>Your most photogenic, confident self is just one appointment away. Let's make it happen!</p>
    `
  },

  // Dental Examination Enquiry Automation
  {
    key: 'exam_immediate',
    type: 'Email',
    name: 'Dental Exam – What to Expect (Immediate)',
    sending: 'Immediately after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Thank you for prioritizing your oral health! Scheduling a comprehensive dental examination is one of the smartest decisions you can make for your overall wellbeing.</p>
      <p>Here's what makes our examinations different:</p>
      <ul>
        <li>Full mouth digital scanning for early detection</li>
        <li>Oral cancer screening included</li>
        <li>Personalized prevention plan</li>
        <li>No judgment, just compassionate care</li>
        <li>Complete breakdown of findings in plain English</li>
      </ul>
      <p>We don't just check your teeth - we partner with you to create a lifetime of optimal oral health.</p>
      <p>Learn more about our thorough approach: [link]</p>
    `
  },
  {
    key: 'exam_3_days',
    type: 'Email',
    name: 'Dental Exam – Prevention Focus (Day 3)',
    sending: '3 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>Did you know? 90% of dental problems are completely preventable with regular examinations and proper care.</p>
      <p>A comprehensive exam today could save you from:</p>
      <ul>
        <li>Painful emergency procedures later</li>
        <li>Extensive treatment needs</li>
        <li>Days of discomfort</li>
        <li>Damage to your overall health</li>
      </ul>
      <p>Think of it as insurance for your smile. Our patients who maintain regular exams rarely face unexpected dental issues.</p>
      <p>Early detection is everything. One patient told us, "My exam caught a problem I had no idea existed. It saved me from a dental nightmare."</p>
      <p>Don't wait for pain to be your warning sign.</p>
    `
  },
  {
    key: 'exam_7_days',
    type: 'Email',
    name: 'Dental Exam – Appointment Nudge (Day 7)',
    sending: '7 days after enquiry',
    enabled: false,
    template: `
      <p>Hi [First Name],</p>
      <p>We understand - life gets busy, and it's easy to put off dental appointments when everything feels fine.</p>
      <p>But here's the reality: By the time you feel dental pain, the problem has usually been developing for months. Regular examinations catch issues when they're small, simple, and easy to manage.</p>
      <p>Over 95% of our examination patients tell us they feel relieved and empowered after their appointment - not anxious or regretful.</p>
      <p>You deserve peace of mind about your oral health. Our gentle, thorough team makes examinations stress-free.</p>
      <p>Schedule your appointment today: [booking link]</p>
      <p>Your future self will thank you for taking action now.</p>
    `
  }
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
        // Prefer defaults when saved fields are missing/empty
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
const renderedHtml = computed(() => {
  const html = active.value?.template || ''
  const full = sampleRecipient.name || 'John Doe'
  const first = (full.split(' ')[0]) || 'there'
  return html
    .replaceAll('[First Name]', first)
    .replaceAll('[Patient Name]', full)
})

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
  // Ensure DB record is fully populated on first create
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
.preview-box { border: 1px dashed #d6d6d6; border-radius: 8px; padding: 12px; background: #fff; margin-top: 6px; }
.editor { min-height: 220px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 10px; background: #fff; }
</style>
