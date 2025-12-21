import { listTreatments, listPatients, listPatientsPaged, getPatientStats, createPatient, updatePatient, listAppointments, createAppointment, updateAppointment, listDentistsForDate, getStats, getPatient, listNotes, createNote, deleteNote, getPatientComfort, savePatientComfort, updatePatientComfort, getPatientSurvey, savePatientSurvey, uploadSurveyPhotos, downloadPatientSurvey, printPatientSurvey, sharePatientSurvey, getSurveyStructure } from '~/server/controllers/diary'
import { success } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  switch (path) {
    case 'treatments':
      return await listTreatments(event)
    case 'patients':
      return await listPatients(event)
    case 'patientsPaged':
      return await listPatientsPaged(event)
    case 'patientStats':
      return await getPatientStats(event)
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
    case 'patientComfortGet':
      return await getPatientComfort(event)
    case 'patientComfortSave':
      return await savePatientComfort(event)
    case 'patientComfortUpdate':
      return await updatePatientComfort(event)
    case 'surveyGet':
      return await getPatientSurvey(event)
    case 'surveySave':
      return await savePatientSurvey(event)
    case 'surveyUploadPhotos':
      return await uploadSurveyPhotos(event)
    case 'surveyDownload':
      return await downloadPatientSurvey(event)
    case 'surveyPrint':
      return await printPatientSurvey(event)
    case 'surveyShare':
      return await sharePatientSurvey(event)
    case 'surveyStructure':
      return success(getSurveyStructure())
    default:
      return { code: 1, message: 'Not found' }
  }
})
