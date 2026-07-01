import { calendarAuthCallback } from '../../controllers/google'

export default defineEventHandler((event) => calendarAuthCallback(event))
