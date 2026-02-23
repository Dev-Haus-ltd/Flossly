<template>
  <v-dialog v-model="isOpen" max-width="90%" class="rounded-lg">
    <v-card>
      <!-- Header -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style=" font-weight: 600; font-size: 16px; border-bottom: 1px solid #dbdbdb;"
      >
        {{ doc?.name }}
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <!-- Viewer -->
      <div class="pa-5" style="height: 700px">
        <!-- Iframe for file viewing -->
        <iframe
          v-if="viewerUrl"
          :src="viewerUrl"
          width="100%"
          height="100%"
          style="border: none"
        ></iframe>
      </div>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="close" flat>
          Close
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Loader -->
    <v-overlay
      v-model="isLoading"
      contained
      class="justify-center align-center full-page"
    >
      <div class="loader">
        <lottie-player
          src="/FlossslyLogoBlue.json"
          background="transparent"
          speed="1"
          style="width: 200px; height: 200px"
          loop
          autoplay
        />
      </div>
    </v-overlay>
  </v-dialog>
</template>

<script setup>
import { buildAbsoluteLink } from '~/lib/misc'

const viewerUrl = ref(null)
const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
  doc: Object,
  isSystem: {
    type: Boolean,
    default: false,
  },
})
const emit = defineEmits(["update:modelValue", "onUpdate"])

const isOpen = ref(props.modelValue)

// Sync prop with local state
watch(
  () => props.modelValue,
  async (val) => {
    isOpen.value = val
    if (!val) {
      viewerUrl.value = null
      return
    }
    isLoading.value = true
    const config = useRuntimeConfig()
    const baseUrl = typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : config.public?.BASE_URL
    const path = props.isSystem
      ? `/api/docs/viewSystemDoc?id=${props.doc?.id}`
      : `/api/docs/view?id=${props.doc?.id}`
    // For non-DOCX files, use iframe viewer via same-origin endpoint
    viewerUrl.value = buildAbsoluteLink(path, baseUrl)
    isLoading.value = false
  }
)

watch(isOpen, (val) => emit("update:modelValue", val))

const close = () => {
  isOpen.value = false
}

</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}

</style>
