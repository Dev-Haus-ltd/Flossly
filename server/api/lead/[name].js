import { createLead, deleteLeads, listLeads, updateLead, getLeadTreatment, saveLeadTreatment, deleteLeadTreatment, listLeadNotes, addLeadNote, deleteLeadNote, listOptions, addOption, deleteOption, getLeadCommunication, saveLeadCommunication, listAutomation, saveAutomation } from '~/server/controllers/lead'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  switch (path) {
    case 'list':
      return await listLeads(event)
    case 'create':
      return await createLead(event)
    case 'update':
      return await updateLead(event)
    case 'delete':
      return await deleteLeads(event)
    case 'treatmentGet':
      return await getLeadTreatment(event)
    case 'treatmentSave':
      return await saveLeadTreatment(event)
    case 'treatmentDelete':
      return await deleteLeadTreatment(event)
    case 'notesList':
      return await listLeadNotes(event)
    case 'notesAdd':
      return await addLeadNote(event)
    case 'notesDelete':
      return await deleteLeadNote(event)
    case 'optionsList':
      return await listOptions(event)
    case 'optionsAdd':
      return await addOption(event)
    case 'optionsDelete':
      return await deleteOption(event)
    case 'commGet':
      return await getLeadCommunication(event)
    case 'commSave':
      return await saveLeadCommunication(event)
    case 'automationList':
      return await listAutomation(event)
    case 'automationSave':
      return await saveAutomation(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
