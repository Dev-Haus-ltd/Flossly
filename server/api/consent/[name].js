import {
  listConsentTemplates,
  getConsentTemplate,
  createConsentTemplate,
  updateConsentTemplate,
  deleteConsentTemplate,
  listConsentDocuments,
  sendConsentDocument,
  getConsentDocumentForSigning,
  submitSignedConsent,
  getSignedConsentDocument,
  getConsentAuditTrail,
  voidConsentDocument,
  getConsentDocumentById,
  searchPatients,
} from '~/server/controllers/consentForms'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')

  switch (path) {
    // Template routes
    case 'templatesList':
      return await listConsentTemplates(event)
    case 'templateGet':
      return await getConsentTemplate(event)
    case 'templateCreate':
      return await createConsentTemplate(event)
    case 'templateUpdate':
      return await updateConsentTemplate(event)
    case 'templateDelete':
      return await deleteConsentTemplate(event)

    // Document routes
    case 'documentsList':
      return await listConsentDocuments(event)
    case 'documentSend':
      return await sendConsentDocument(event)
    case 'documentGetForSigning':
      return await getConsentDocumentForSigning(event)
    case 'documentSubmitSigned':
      return await submitSignedConsent(event)
    case 'documentGetSigned':
      return await getSignedConsentDocument(event)
    case 'documentGetById':
      return await getConsentDocumentById(event)
    case 'documentVoid':
      return await voidConsentDocument(event)

    // Audit routes
    case 'auditTrail':
      return await getConsentAuditTrail(event)
// search  Route
case 'searchPatients':
  return await searchPatients(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})