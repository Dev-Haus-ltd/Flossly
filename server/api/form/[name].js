import {
  listForms,
  createForm,
  updateForm,
  deleteForm,
  getAvailableFields,
  getFormMeta,
  submitFormLead,
} from '../../controllers/webForm'

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  switch (name) {
    case 'list':           return await listForms(event)
    case 'create':         return await createForm(event)
    case 'update':         return await updateForm(event)
    case 'delete':         return await deleteForm(event)
    case 'availableFields': return await getAvailableFields(event)
    case 'meta':           return await getFormMeta(event)
    case 'submit':         return await submitFormLead(event)
    default:               return { code: 1, message: 'Not found' }
  }
})
