import { aiChartFromTranscript } from '../../controllers/charting.js'

export default defineEventHandler(async (event) => {
  const { name } = event.context.params

  if (name === 'aiChart') {
    const body = await readBody(event)
    return await aiChartFromTranscript(event, body)
  }

  return { code: 1, message: 'Not found' }
})