import { listTreatments, listPatients, createPatient, updatePatient, listAppointments, createAppointment, updateAppointment, listDentistsForDate, getStats, getPatient, listNotes, createNote, deleteNote, getPatientComfort, savePatientComfort, updatePatientComfort, getPatientSurvey, savePatientSurvey, uploadSurveyPhotos, downloadPatientSurvey, printPatientSurvey, sharePatientSurvey, getSurveyStructure, listPatientForms, getPatientForm, savePatientForm, updatePatientForm, deletePatientForm, listPatientsPaged, getPatientStats, getPatientChart, savePatientChart, savePatientChartTooth, listTreatmentPlanItems, createTreatmentPlanItem, updateTreatmentPlanItem, deleteTreatmentPlanItem, reorderTreatmentPlanItems, appointmentConflictCheck, bookFromTreatmentPlan } from '~/server/controllers/diary'
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
    case 'formsList':
      return await listPatientForms(event)
    case 'formGet':
      return await getPatientForm(event)
    case 'formSave':
      return await savePatientForm(event)
    case 'formUpdate':
      return await updatePatientForm(event)
    case 'formDelete':
      return await deletePatientForm(event)
    case 'chart':
      return await getPatientChart(event)
    case 'chartSave':
      return await savePatientChart(event)
    case 'chartToothSave':
      return await savePatientChartTooth(event)
    case 'treatmentPlans':
      return await listTreatmentPlanItems(event)
    case 'treatmentPlanCreate':
      return await createTreatmentPlanItem(event)
    case 'treatmentPlanUpdate':
      return await updateTreatmentPlanItem(event)
    case 'treatmentPlanDelete':
      return await deleteTreatmentPlanItem(event)
    case 'treatmentPlanReorder':
      return await reorderTreatmentPlanItems(event)
    case 'appointmentConflictCheck':
      return await appointmentConflictCheck(event)
    case 'bookFromTreatmentPlan':
      return await bookFromTreatmentPlan(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
