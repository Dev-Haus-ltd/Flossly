import { defineNuxtPlugin } from '#app'
import { jsPDF } from 'jspdf'

export default defineNuxtPlugin(() => {
  return {
    provide: {
      jsPDF
    }
  }
})