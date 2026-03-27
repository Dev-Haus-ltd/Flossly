import { Get, Post } from './apiWrapper'

export default {
  listForms(params = {}) {
    const q = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') return
      q.append(k, v)
    })
    const qs = q.toString()
    return new Promise((resolve, reject) => {
      Get(`/form/list${qs ? `?${qs}` : ''}`).then(resolve).catch(reject)
    })
  },
  createForm(payload) {
    return new Promise((resolve, reject) => {
      Post('/form/create', payload).then(resolve).catch(reject)
    })
  },
  updateForm(payload) {
    return new Promise((resolve, reject) => {
      Post('/form/update', payload).then(resolve).catch(reject)
    })
  },
  deleteForm(payload) {
    return new Promise((resolve, reject) => {
      Post('/form/delete', payload).then(resolve).catch(reject)
    })
  },
  getAvailableFields() {
    return new Promise((resolve, reject) => {
      Get('/form/availableFields').then(resolve).catch(reject)
    })
  },
}
