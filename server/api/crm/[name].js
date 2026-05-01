import {
  listEmailTemplates,
  saveEmailTemplate,
  archiveEmailTemplate,
  duplicateEmailTemplate,
  previewEmailTemplate,
  uploadEmailAsset,
} from '~/server/controllers/crm'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  switch (path) {
    case 'emailTemplateList':
      return await listEmailTemplates(event)
    case 'emailTemplateSave':
      return await saveEmailTemplate(event)
    case 'emailTemplateArchive':
      return await archiveEmailTemplate(event)
    case 'emailTemplateDuplicate':
      return await duplicateEmailTemplate(event)
    case 'emailTemplatePreview':
      return await previewEmailTemplate(event)
    case 'emailAssetUpload':
      return await uploadEmailAsset(event)
    default:
      return { code: 1, message: 'Not found' }
  }
})
