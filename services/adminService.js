import { Get, Post } from './apiWrapper'

export default {
  listClinicalNoteTemplates(params = {}) {
    const search = new URLSearchParams()
    if (params.type) search.set('type', params.type)
    if (params.status) search.set('status', params.status)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    return Get(`/admin/listClinicalNoteTemplates${suffix}`)
  },

  createClinicalNoteTemplate(payload) {
    return Post('/admin/createClinicalNoteTemplate', payload)
  },

  updateClinicalNoteTemplate(payload) {
    return Post('/admin/updateClinicalNoteTemplate', payload)
  },

  getClinicalNoteTemplateVersions(id) {
    return Get(`/admin/getClinicalNoteTemplateVersions?id=${encodeURIComponent(id)}`)
  },
}
