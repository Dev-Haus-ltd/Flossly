<template>
  <div class="address-stack">
    <v-autocomplete
      v-model="selectedSuggestion"
      v-model:search="search"
      :items="suggestions"
      item-title="description"
      item-value="placeId"
      label="Clinic address"
      variant="solo"
      density="comfortable"
      class="input-bordered"
      flat
      hide-no-data
      clearable
      no-filter
      :loading="loading"
      :rules="addressRules"
      :hint="addressHint"
      persistent-hint
      @update:model-value="onSuggestionSelected"
      @blur="syncManualAddress"
    />

    <v-row>
      <v-col cols="12" md="8">
        <v-text-field
          v-model="addressLine"
          label="Address line"
          variant="solo"
          density="comfortable"
          class="input-bordered"
          flat
          :rules="addressRules"
          autocomplete="street-address"
          @update:model-value="onAddressLineChange"
        />
      </v-col>
      <v-col cols="12" md="4">
        <v-text-field
          v-model="postalCode"
          label="Postal code"
          variant="solo"
          density="comfortable"
          class="input-bordered"
          flat
          autocomplete="postal-code"
          @update:model-value="onPostalCodeChange"
        />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
const model = defineModel({
  default: () => ({
    address: "",
    postalCode: "",
  }),
})

const props = defineProps({
  required: { type: Boolean, default: false },
  country: { type: String, default: "gb" },
})

const runtimeConfig = useRuntimeConfig()
const googleApiKey = runtimeConfig.public.GOOGLE_MAPS_API_KEY

const search = ref("")
const selectedSuggestion = ref(null)
const suggestions = ref([])
const loading = ref(false)
const autocompleteService = ref(null)
const placesService = ref(null)

const addressLine = computed({
  get: () => model.value?.address || "",
  set: (value) => {
    model.value = {
      ...model.value,
      address: value,
    }
  },
})

const postalCode = computed({
  get: () => model.value?.postalCode || "",
  set: (value) => {
    model.value = {
      ...model.value,
      postalCode: value,
    }
  },
})

const addressRules = computed(() =>
  props.required ? [(v) => !!String(v || "").trim() || "Required."] : []
)

const addressHint = computed(() =>
  googleApiKey
    ? "Start typing to search for an address."
    : "Google Places key not configured. Enter the address manually."
)

let googleMapsPromise

const loadGoogleMaps = async () => {
  if (!process.client || !googleApiKey) return null
  if (window.google?.maps?.places) return window.google.maps

  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-google-maps="places"]')
      if (existing) {
        existing.addEventListener("load", () => resolve(window.google?.maps || null), { once: true })
        existing.addEventListener("error", reject, { once: true })
        return
      }

      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&libraries=places`
      script.async = true
      script.defer = true
      script.dataset.googleMaps = "places"
      script.onload = () => resolve(window.google?.maps || null)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  return googleMapsPromise
}

const ensurePlacesServices = async () => {
  if (autocompleteService.value && placesService.value) return true
  let maps = null
  try {
    maps = await loadGoogleMaps()
  } catch {
    return false
  }
  if (!maps?.places) return false

  autocompleteService.value = new maps.places.AutocompleteService()
  placesService.value = new maps.places.PlacesService(document.createElement("div"))
  return true
}

const parseAddressComponents = (components = []) => {
  const part = (type) =>
    components.find((component) => component.types?.includes(type))?.long_name || ""

  const streetNumber = part("street_number")
  const route = part("route")
  const postal = part("postal_code")
  const locality = part("locality") || part("postal_town")
  const admin = part("administrative_area_level_1")

  const firstLine = [streetNumber, route].filter(Boolean).join(" ").trim()
  const fallbackLine = [locality, admin].filter(Boolean).join(", ").trim()

  return {
    address: firstLine || fallbackLine || addressLine.value,
    postalCode: postal || postalCode.value,
  }
}

const fetchSuggestions = async (query) => {
  if (!query || query.trim().length < 3) {
    suggestions.value = []
    return
  }

  const ready = await ensurePlacesServices()
  if (!ready || !autocompleteService.value) return

  loading.value = true
  autocompleteService.value.getPlacePredictions(
    {
      input: query,
      componentRestrictions: props.country ? { country: props.country } : undefined,
      types: ["address"],
    },
    (predictions = [], status) => {
      loading.value = false
      if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
        suggestions.value = []
        return
      }

      suggestions.value = predictions.map((prediction) => ({
        description: prediction.description,
        placeId: prediction.place_id,
      }))
    }
  )
}

const applyPlaceDetails = async (placeId) => {
  const ready = await ensurePlacesServices()
  if (!ready || !placesService.value || !placeId) return

  placesService.value.getDetails(
    {
      placeId,
      fields: ["formatted_address", "address_components"],
    },
    (place, status) => {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !place) return

      const parsed = parseAddressComponents(place.address_components)
      addressLine.value = parsed.address || place.formatted_address || ""
      postalCode.value = parsed.postalCode || ""
      search.value = place.formatted_address || addressLine.value
    }
  )
}

const onSuggestionSelected = async (placeId) => {
  if (!placeId) return
  const selected = suggestions.value.find((item) => item.placeId === placeId)
  if (selected?.description) {
    search.value = selected.description
  }
  await applyPlaceDetails(placeId)
}

const onAddressLineChange = (value) => {
  if (!value) {
    selectedSuggestion.value = null
  }
}

const onPostalCodeChange = () => {
  model.value = {
    ...model.value,
    postalCode: postalCode.value,
  }
}

const syncManualAddress = () => {
  if (search.value && !addressLine.value) {
    addressLine.value = search.value
  }
}

watch(search, async (value) => {
  if (!googleApiKey) return
  try {
    await fetchSuggestions(value)
  } catch {
    suggestions.value = []
    loading.value = false
  }
})

watch(
  () => model.value,
  (value) => {
    if (!value) return
    if (value.address && !search.value) {
      search.value = value.address
    }
  },
  { immediate: true, deep: true }
)
</script>

<style scoped>
.address-stack {
  width: 100%;
}

.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 12px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>
