<template>
  <v-card class="setup-wizard" max-width="700" width="100%" rounded="xl" elevation="4">
    <v-card-text class="pa-8">
      <!-- Header -->
      <div class="text-center mb-8">
        <img src="/logo.png" height="36" alt="Flossy" class="mb-4" @error="$event.target.style.display='none'" />
        <h2 class="text-h5 font-weight-bold">Welcome to Flossy</h2>
        <p class="text-body-2 text-medium-emphasis mt-1">Let's get you set up in just a few steps</p>
      </div>

      <!-- Stepper -->
      <v-stepper v-model="currentStep" :items="stepLabels" hide-actions flat>
        <!-- Step 1: Practice Info -->
        <v-stepper-window-item :value="1">
          <h3 class="text-subtitle-1 font-weight-semibold mb-4">Tell us about your practice</h3>
          <v-text-field v-model="practiceForm.name" label="Practice name" variant="outlined" density="comfortable" class="mb-3" />
          <CommonAddressAutocompleteField v-model="practiceAddress" class="mb-3" :required="false" />
          <CommonPhoneNumberField
            v-model="practiceForm.contact"
            class="mb-3"
            :error-message="phoneError"
            @update:phone-object="onPhoneObjectUpdate"
          />
        </v-stepper-window-item>

        <!-- Step 2: Invite Team -->
        <v-stepper-window-item :value="2">
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
        </v-stepper-window-item>

        <!-- Step 3: Connect Meta -->
        <v-stepper-window-item :value="3">
          <div class="text-center py-4">
            <v-icon size="56" color="#0061FB" class="mb-4">mdi-facebook</v-icon>
            <h3 class="text-subtitle-1 font-weight-semibold mb-2">Connect Meta to capture leads</h3>
            <p class="text-body-2 text-medium-emphasis mb-6">Connect your Facebook page to automatically pull leads from your Meta ad campaigns into Flossy.</p>
            <v-btn color="#0061FB" variant="flat" rounded="lg" @click="goToCrm">Connect Meta →</v-btn>
          </div>
        </v-stepper-window-item>

        <!-- Step 4: First Lead -->
        <v-stepper-window-item :value="4">
          <div class="text-center py-4">
            <v-icon size="56" color="#0061FB" class="mb-4">mdi-account-plus-outline</v-icon>
            <h3 class="text-subtitle-1 font-weight-semibold mb-2">You're ready to capture leads</h3>
            <p class="text-body-2 text-medium-emphasis mb-6">Your CRM is set up and ready. Head to the CRM dashboard to view your leads or add your first one manually.</p>
            <v-btn color="#0061FB" variant="flat" rounded="lg" @click="goToCrm">Go to CRM →</v-btn>
          </div>
        </v-stepper-window-item>

        <!-- Step 5: Done -->
        <v-stepper-window-item :value="5">
          <div class="text-center py-6">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle-outline</v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">You're all set!</h3>
            <p class="text-body-2 text-medium-emphasis mb-6">Flossy is ready to help you grow. Explore your dashboard to see what's possible.</p>
            <v-btn color="#0061FB" variant="flat" rounded="lg" size="large" @click="finish">Take me to dashboard</v-btn>
          </div>
        </v-stepper-window-item>
      </v-stepper>

      <!-- Navigation -->
      <div v-if="currentStep < 5" class="d-flex justify-space-between align-center mt-8">
        <v-btn v-if="currentStep > 1" variant="text" @click="currentStep--">Back</v-btn>
        <v-spacer v-else />
        <div class="d-flex gap-3 align-center">
          <v-btn v-if="currentStep < 4" variant="text" color="medium-emphasis" @click="skipStep">Skip</v-btn>
          <v-btn color="#0061FB" variant="flat" rounded="lg" :loading="saving" @click="nextStep">
            {{ currentStep === 4 ? 'Continue' : 'Next' }}
          </v-btn>
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

const LITE_MEMBER_INVITE_LIMIT = 2 // Lite allows 3 total; creator = 1, so 2 invites max
const DEFAULT_SETUP_INVITE_ROLE_ID = 1 // Practice Manager until the setup flow collects roles explicitly

const stepLabels = ['Practice', 'Team', 'Meta', 'First Lead', 'Done']
const currentStep = ref(Number(route.query.step) || 1)
const saving = ref(false)

const practiceForm = reactive({ name: '', address: '', postalCode: '', contact: '' })
const inviteEmails = ref([''])
const phoneObject = ref(null)
const phoneError = ref('')

const practiceAddress = computed({
  get: () => ({
    address: practiceForm.address,
    postalCode: practiceForm.postalCode,
  }),
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
    practiceForm.address = org.address || ''
    practiceForm.postalCode = org.postalCode || ''
    practiceForm.contact = org.contact || ''
  }
}

watch(
  () => authStore.loggedUser,
  () => {
    hydrateFromProfile()
  },
  { immediate: true }
)

const normalizeText = (value) => String(value || '').trim()

const validatePhone = () => {
  const val = normalizeText(practiceForm.contact)
  if (!val) {
    phoneError.value = 'Phone number is required'
    return false
  }
  if (!phoneObject.value?.valid) {
    phoneError.value = 'Enter a valid phone number'
    return false
  }
  phoneError.value = ''
  return true
}

const onPhoneObjectUpdate = (value) => {
  phoneObject.value = value
  if (phoneError.value) validatePhone()
}

watch(
  () => practiceForm.contact,
  (value) => {
    if (!normalizeText(value)) phoneObject.value = null
    if (phoneError.value) validatePhone()
  }
)

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
      if (!validatePhone()) return
      const fd = new FormData()
      if (practiceForm.name) fd.append('name', practiceForm.name)
      if (practiceForm.address) fd.append('address', practiceForm.address)
      if (practiceForm.postalCode) fd.append('postalCode', practiceForm.postalCode)
      if (practiceForm.contact) fd.append('contact', practiceForm.contact)
      await orgService.updateOrganisation(fd)
      // Mark profile complete so middleware stops redirecting to /setup
      const profileCompletionCookie = useCookie('profileCompletion')
      profileCompletionCookie.value = 50
    }

    if (currentStep.value === 2) {
      const emails = inviteEmails.value.filter(e => e.trim())
      if (emails.length) {
        await authService.inviteMembers({
          users: emails.map((email) => ({
            email,
            roleId: DEFAULT_SETUP_INVITE_ROLE_ID,
          })),
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

const goToCrm = async () => {
  await recordStep(currentStep.value)
  router.push('/crm')
}

const finish = async () => {
  await recordStep(5)
  router.push('/')
}
</script>

<style scoped>
.setup-wizard {
  margin: auto;
}
</style>
