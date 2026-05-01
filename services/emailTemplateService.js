import { Get, Post } from './apiWrapper'

export default {
  listEmailTemplates(includeArchived = false) {
    return new Promise((resolve, reject) => {
      Get(`/crm/emailTemplateList${includeArchived ? '?includeArchived=1' : ''}`)
        .then(resolve)
        .catch(reject)
    })
  },

  saveEmailTemplate(payload) {
    return new Promise((resolve, reject) => {
      Post('/crm/emailTemplateSave', payload)
        .then(resolve)
        .catch(reject)
    })
  },

  archiveEmailTemplate(id) {
    return new Promise((resolve, reject) => {
      Post('/crm/emailTemplateArchive', { id })
        .then(resolve)
        .catch(reject)
    })
  },

  duplicateEmailTemplate(id) {
    return new Promise((resolve, reject) => {
      Post('/crm/emailTemplateDuplicate', { id })
        .then(resolve)
        .catch(reject)
    })
  },

  previewEmailTemplate(payload) {
    return new Promise((resolve, reject) => {
      Post('/crm/emailTemplatePreview', payload)
        .then(resolve)
        .catch(reject)
    })
  },
}
