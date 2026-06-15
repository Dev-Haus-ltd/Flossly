import { readFile } from 'fs/promises'
import { resolve } from 'path'

export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Content-Type', 'application/yaml; charset=utf-8')
  setResponseHeader(event, 'Cache-Control', 'no-cache')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')
  return readFile(resolve('docs/api/openapi.yaml'), 'utf-8')
})
