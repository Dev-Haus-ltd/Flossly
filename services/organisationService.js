import { Get } from './apiWrapper'

export default {
  // Centralised organisation dictionary: treatments
  listTreatments() { return Get('/diary/treatments') },
}

