import { listSchedules, getSchedule, createSchedule, updateSchedule, updateScheduleDay, addBreak, updateBreak, deleteBreak, deleteSchedule, toggleSchedule } from '~/server/controllers/schedule'
import { success } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'name')
  
  switch (path) {
    case 'list':
      return await listSchedules(event)
    
    case 'get':
      return await getSchedule(event)
    
    case 'create':
      return await createSchedule(event)
    
    case 'update':
      return await updateSchedule(event)
    
    case 'updateDay':
      return await updateScheduleDay(event)
    
    case 'addBreak':
      return await addBreak(event)
    
    case 'updateBreak':
      return await updateBreak(event)
    
    case 'deleteBreak':
      return await deleteBreak(event)
    
    case 'delete':
      return await deleteSchedule(event)
    
    case 'toggle':
      return await toggleSchedule(event)
    
    default:
      return error(404, `Unknown endpoint: ${path}`)
  }
})
