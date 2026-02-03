import { webhook } from "../../controllers/whatsapp";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, 'name')
  switch (name) {
    case 'webhook':
      return await webhook(event)
    default:
      return { code: 0, error: 'Not found' }
  }
})

