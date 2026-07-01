<template>
  <v-card class="setup-wizard" max-width="700" width="100%" rounded="xl" elevation="4">
    <v-card-text class="pa-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <img src="/logo.png" height="36" alt="Flossy" class="mb-4" @error="$event.target.style.display='none'" />
        <h2 class="text-h5 font-weight-bold">Welcome to Flossy</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Let's get you set up in just a few steps</p>
      </div>

      <!-- Step progress chips -->
      <div class="d-flex align-center justify-center gap-2 mb-8">
        <template v-for="(label, i) in stepLabels" :key="i">
          <div class="step-chip" :class="{ 'step-chip--active': currentStep === i + 1, 'step-chip--done': currentStep > i + 1 }">
            <v-icon v-if="currentStep > i + 1" size="14">mdi-check</v-icon>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div v-if="i < stepLabels.length - 1" class="step-connector" :class="{ 'step-connector--done': currentStep > i + 1 }" />
        </template>
      </div>

      <!-- Step 1: Practice Info -->
      <div v-show="currentStep === 1">
        <h3 class="text-subtitle-1 font-weight-semibold mb-4">Tell us about your practice</h3>
        <v-text-field v-model="practiceForm.name" label="Practice name" variant="outlined" density="comfortable" class="mb-3" />
        <v-text-field
          v-model="practiceForm.replyToEmail"
          label="Email"
          type="email"
          variant="outlined"
          density="comfortable"
          class="mb-3"
          :error-messages="replyToEmailError"
        />
        <CommonPhoneNumberField
          v-model="practiceForm.contact"
          class="mb-3"
          :error-message="phoneError"
          @update:phone-object="onPhoneObjectUpdate"
        />
        <v-text-field
        <CommonAddressAutocompleteField v-model="practiceAddress" class="mb-3" :required="false" />
      </div>

      <!-- Step 2: Invite Team -->
      <div v-show="currentStep === 2">
        <h3 class="text-subtitle-1 font-weight-semibold mb-2">Invite your team</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Add colleagues who'll use Flossy alongside you. You can always do this later.</p>
        <div v-for="(email, i) in inviteEmails" :key="i" class="d-flex align-center gap-2 mb-2">
          <v-text-field v-model="inviteEmails[i]" :label="`Team member ${i + 1} email`" variant="outlined" density="comfortable" type="email" hide-details />
          <v-btn v-if="i > 0" icon="mdi-close" variant="text" size="small" @click="inviteEmails.splice(i, 1)" />
        </div>
        <div v-if="inviteEmails.length < LITE_MEMBER_INVITE_LIMIT">
          <v-btn variant="text" prepend-icon="mdi-plus" size="small" class="mt-1" @click="inviteEmails.push('')">Add another</v-btn>
        </div>
        <v-alert v-else type="info" variant="tonal" density="compact" class="mt-3" rounded="lg">
          Flossy Lite includes up to {{ LITE_MEMBER_INVITE_LIMIT + 1 }} team members (including you). <span class="font-weight-medium">Upgrade to CRM to add more.</span>
        </v-alert>
      </div>

      <!-- Step 3: Connect Meta -->
      <div v-show="currentStep === 3">
        <div class="text-center py-4">
          <v-icon size="56" color="#0061FB" class="mb-4">mdi-facebook</v-icon>
          <h3 class="text-subtitle-1 font-weight-semibold mb-2">Connect Meta to capture leads</h3>
          <p class="text-body-2 text-medium-emphasis mb-6">Connect your Facebook page to automatically pull leads from your Meta ad campaigns into Flossy.</p>
          <v-btn color="#0061FB" variant="flat" rounded="lg" @click="connectMeta">Connect Meta →</v-btn>
        </div>
      </div>

      <!-- Step 4: Done -->
      <div v-show="currentStep === 4">
        <div class="text-center py-6">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">You're all set!</h3>
          <p class="text-body-2 text-medium-emphasis mb-6">Flossy is ready to help you grow. Explore your dashboard to see what's possible.</p>
          <v-btn color="#0061FB" variant="flat" rounded="lg" size="large" @click="finish">Take me to dashboard</v-btn>
        </div>
      </div>

      <!-- Navigation -->
      <div v-if="currentStep < 4" class="d-flex justify-space-between align-center mt-8">
        <v-btn v-if="currentStep > 1" variant="text" @click="currentStep--">Back</v-btn>
        <v-spacer v-else />
        <div class="d-flex gap-3 align-center">
          <v-btn v-if="currentStep < 3" variant="text" color="medium-emphasis" @click="skipStep">Skip</v-btn>
          <v-btn color="#0061FB" variant="flat" rounded="lg" :loading="saving" @click="nextStep">Next</v-btn>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { Post } from '~/services/apiWrapper'
import orgService from '~/services/orgService'
import authService from '~/services/authService'
import { SETUP_TOTAL_STEPS } from '@shared/defaults/setup.js'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mainStore = useMainStore()
const { track } = usePostHog()

const LITE_MEMBER_INVITE_LIMIT = 2
const DEFAULT_SETUP_INVITE_ROLE_ID = 1

const stepLabels = ['Practice', 'Team', 'Meta', 'Done']
const currentStep = ref(Number(route.query.step) || 1)
const saving = ref(false)

const practiceForm = reactive({ name: '', replyToEmail: '', address: '', postalCode: '', contact: '' })
const inviteEmails = ref([''])
const phoneObject = ref(null)
const phoneError = ref('')
const replyToEmailError = ref('')

const practiceAddress = computed({
  get: () => ({ address: practiceForm.address, postalCode: practiceForm.postalCode }),
  set: (value) => {
    practiceForm.address = value?.address || ''
    practiceForm.postalCode = value?.postalCode || ''
  },
})

const hydrateFromProfile = () => {
  const prefs = authStore.loggedUser?.preferences?.[0]
  if (prefs?.setupStepsCompleted > 0) {
    currentStep.value = Math.min((prefs.setupStepsCompleted || 0) + 1, SETUP_TOTAL_STEPS)
  }
  const currentOrgId = Number(authStore.loggedUser?.currentLoggedInOrgId || 0)
  const org = (authStore.loggedUser?.userOrganisations || []).find(
    (entry) => Number(entry?.organisationId || entry?.organisation?.id || 0) === currentOrgId
  )?.organisation
  if (org) {
    practiceForm.name = org.name || ''
    practiceForm.replyToEmail = org.replyToEmail || ''
    practiceForm.address = org.address || ''
    practiceForm.postalCode = org.postalCode || ''
    practiceForm.contact = org.contact || ''
  }
}

watch(() => authStore.loggedUser, () => { hydrateFromProfile() }, { immediate: true })

const normalizeText = (value) => String(value || '').trim()
const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value))

const validatePhone = () => {
  const val = normalizeText(practiceForm.contact)
  if (!val) { phoneError.value = 'Phone number is required'; return false }
  if (!phoneObject.value?.valid) { phoneError.value = 'Enter a valid phone number'; return false }
  phoneError.value = ''
  return true
}

const validateReplyToEmail = () => {
  const val = normalizeText(practiceForm.replyToEmail)
  if (!val) { replyToEmailError.value = 'Reply-to email is required'; return false }
  if (!isValidEmail(val)) { replyToEmailError.value = 'Enter a valid email address'; return false }
  replyToEmailError.value = ''
  return true
}

const onPhoneObjectUpdate = (value) => {
  phoneObject.value = value
  if (phoneError.value) validatePhone()
}

watch(() => practiceForm.contact, (value) => {
  if (!normalizeText(value)) phoneObject.value = null
  if (phoneError.value) validatePhone()
})

watch(() => practiceForm.replyToEmail, () => {
  if (replyToEmailError.value) validateReplyToEmail()
})

const recordStep = async (step) => {
  try {
    await Post('/auth/updateSetupStep', { step })
    track('setup_step_completed', { step })
  } catch {}
}

const nextStep = async () => {
  saving.value = true
  try {
    if (currentStep.value === 1) {
      if (!validatePhone() || !validateReplyToEmail()) return
      const fd = new FormData()
      if (practiceForm.name) fd.append('name', practiceForm.name)
      if (practiceForm.replyToEmail) fd.append('replyToEmail', practiceForm.replyToEmail)
      if (practiceForm.address) fd.append('address', practiceForm.address)
      if (practiceForm.postalCode) fd.append('postalCode', practiceForm.postalCode)
      if (practiceForm.contact) fd.append('contact', practiceForm.contact)
      await orgService.updateOrganisation(fd)
      const profileCompletionCookie = useCookie('profileCompletion')
      profileCompletionCookie.value = 50
    }

    if (currentStep.value === 2) {
      const emails = inviteEmails.value.filter(e => e.trim())
      if (emails.length) {
        await authService.inviteMembers({
          users: emails.map((email) => ({ email, roleId: DEFAULT_SETUP_INVITE_ROLE_ID })),
        })
      }
    }

    await recordStep(currentStep.value)
    currentStep.value++
  } catch (err) {
    const msg = err?.data?.message || err?.statusMessage || err?.message || 'Something went wrong, please try again.'
    mainStore.setSnackbar({ message: msg, color: 'error' })
  } finally {
    saving.value = false
  }
}

const skipStep = async () => {
  await recordStep(currentStep.value)
  currentStep.value++
}

const connectMeta = async () => {
  await recordStep(currentStep.value)
  currentStep.value = 4
}

const finish = async () => {
  await recordStep(4)
  router.push('/')
}
</script>

<style scoped>
.setup-wizard {
  margin: auto;
}

.step-chip {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  background: #e0e0e0;
  color: #757575;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}

.step-chip--active {
  background: #0061FB;
  color: #fff;
}

.step-chip--done {
  background: #4caf50;
  color: #fff;
}

.step-connector {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  max-width: 80px;
  transition: background 0.2s;
}

.step-connector--done {
  background: #4caf50;
}
</style>
