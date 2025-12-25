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
      <!-- PDF Viewer -->
      <div class="pa-5" style="height: 700px">
        <iframe
          v-if="pdfurl"
          :src="pdfurl"
          width="100%"
          height="100%"
          style="border: none"
        ></iframe>
      </div>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          v-if="doc.type === 'editable'"
          text
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn color="primary" @click="close" flat>
          {{ doc.type === "editable" ? "Save" : "Close" }}
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


const pdfurl = ref(null)
const isLoading = ref(false)

const props = defineProps({
  modelValue: Boolean,
  doc: Object,
})
const emit = defineEmits(["update:modelValue", "onUpdate"])

const isOpen = ref(props.modelValue)

// Sync prop with local state
watch(
  () => props.modelValue,
  async (val) => {
    isOpen.value = val
    if (!val) return
    isLoading.value = true
    const config = useRuntimeConfig()
      pdfurl.value = `${config.public.BASE_URL}${props.doc.link}`
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
