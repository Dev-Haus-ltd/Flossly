import { listTreatments, listPatients, createPatient, updatePatient, listAppointments, createAppointment, updateAppointment, listDentistsForDate, getStats, getPatient, listNotes, createNote, deleteNote } from '~/server/controllers/diary'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  switch (path) {
    case 'treatments':
      return await listTreatments(event)
    case 'patients':
      return await listPatients(event)
    case 'patientCreate':
      return await createPatient(event)
    case 'patientUpdate':
      return await updatePatient(event)
    case 'appointments':
      return await listAppointments(event)
    case 'appointmentCreate':
      return await createAppointment(event)
    case 'appointmentUpdate':
      return await updateAppointment(event)
    case 'dentists':
      return await listDentistsForDate(event)
    case 'stats':
      return await getStats(event)
    case 'patientGet':
      return await getPatient(event)
    case 'notes':
      return await listNotes(event)
    case 'noteCreate':
      return await createNote(event)
    case 'noteDelete':
      return await deleteNote(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
