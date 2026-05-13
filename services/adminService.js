import { Get, Post, Patch } from './apiWrapper'

export default {
  listClinicalNoteTemplates(params = {}) {
    const search = new URLSearchParams()
    if (params.type) search.set('type', params.type)
    if (params.status) search.set('status', params.status)
    const suffix = search.toString() ? `?${search.toString()}` : ''
    return Get(`/admin/diary/clinical-notes${suffix}`)
  },

  createClinicalNoteTemplate(payload) {
    return Post('/admin/diary/clinical-notes', payload)
  },

  updateClinicalNoteTemplate(payload) {
    const { id, ...rest } = payload
    return Patch(`/admin/diary/clinical-notes/${encodeURIComponent(id)}`, { ...rest, id })
  },

  getClinicalNoteTemplateVersions(id) {
    return Get(`/admin/diary/clinical-notes/${encodeURIComponent(id)}/versions`)
  },
}
