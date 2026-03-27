import { createLead, deleteLeads, listLeads, updateLead, getLeadTreatment, saveLeadTreatment, deleteLeadTreatment, listLeadNotes, addLeadNote, deleteLeadNote, listOptions, addOption, deleteOption, getAlertOptions, saveAlertOptions, getLeadCommunication, saveLeadCommunication, listAutomation, saveAutomation, saveAutomationBatch, resetAutomationOverride, deleteAutomation, sendLeadMail, sendLeadWhatsApp, bulkUploadLeads, bulkUploadAutomations, listAutomationGroups, saveAutomationGroup, deleteAutomationGroup, getWhatsAppUsage, listLeadWhatsAppLogs, uploadWhatsAppAttachment, uploadLeadAttachment, getLeadPriceAttachmentRecent, getAutomationSendNowStatus } from '~/server/controllers/crm'

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
    case 'bulkUpload':
      return await bulkUploadLeads(event)
    case 'automationBulkUpload':
      return await bulkUploadAutomations(event)
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
    case 'alertOptions':
      return await getAlertOptions(event)
    case 'alertOptionsSave':
      return await saveAlertOptions(event)
    case 'commGet':
      return await getLeadCommunication(event)
    case 'commSave':
      return await saveLeadCommunication(event)
    case 'automationList':
      return await listAutomation(event)
    case 'automationSave':
      return await saveAutomation(event)
    case 'automationSaveBatch':
      return await saveAutomationBatch(event)
    case 'automationSendNowStatus':
      return await getAutomationSendNowStatus(event)
    case 'automationReset':
      return await resetAutomationOverride(event)
    case 'automationDelete':
      return await deleteAutomation(event)
    case 'automationGroups':
      return await listAutomationGroups(event)
    case 'automationGroupSave':
      return await saveAutomationGroup(event)
    case 'automationGroupDelete':
      return await deleteAutomationGroup(event)
    case 'mailSend':
      return await sendLeadMail(event)
    case 'whatsappSend':
      return await sendLeadWhatsApp(event)
    case 'whatsappUsage':
      return await getWhatsAppUsage(event)
    case 'whatsappLogs':
      return await listLeadWhatsAppLogs(event)
    case 'whatsappUploadAttachment':
      return await uploadWhatsAppAttachment(event)
    case 'uploadAttachment':
      return await uploadLeadAttachment(event)
    case 'priceAttachmentRecent':
      return await getLeadPriceAttachmentRecent(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
