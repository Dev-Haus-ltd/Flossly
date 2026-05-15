import { readBody } from 'h3'
import { DiaryPatient } from '../models'
import { success, error } from '../utils/response'
import { initializeAnthropicClient } from '../utils/aiWrapper'

const VALID_SURFACES = ['mesial', 'distal', 'buccal', 'lingual', 'occlusal']
const VALID_TOOTH_CONDITIONS = [
  'crown', 'crown-gold', 'crown-zirconia', 'veneer',
  'bridge', 'rct', 'post-core', 'implant', 'implant-crown',
]
const VALID_SURFACE_CONDITIONS = ['caries', 'composite', 'amalgam', 'gic', 'gold', 'inlay-onlay']
const PERMANENT_FDI_SET = new Set([
  11, 12, 13, 14, 15, 16, 17, 18,
  21, 22, 23, 24, 25, 26, 27, 28,
  31, 32, 33, 34, 35, 36, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48,
])
const DECIDUOUS_FDI_SET = new Set([
  51, 52, 53, 54, 55,
  61, 62, 63, 64, 65,
  71, 72, 73, 74, 75,
  81, 82, 83, 84, 85,
])

const tools = [
  {
    name: 'apply_surface_condition',
    description:
      'Apply a condition to one or more surfaces of a specific tooth. ' +
      'Use for: caries, composite, amalgam, gic, gold, inlay_onlay.',
    input_schema: {
      type: 'object',
      properties: {
        fdi: {
          type: 'integer',
          description: 'FDI tooth number (e.g. 16, 21, 47)',
        },
        surfaces: {
          type: 'array',
          items: { type: 'string', enum: VALID_SURFACES },
          description: 'Surfaces affected',
        },
        condition: {
          type: 'string',
          enum: VALID_SURFACE_CONDITIONS,
          description: 'Condition to apply',
        },
      },
      required: ['fdi', 'surfaces', 'condition'],
    },
  },
  {
    name: 'apply_tooth_condition',
    description:
      'Apply a full-tooth condition. ' +
      'Use for: crown, gold crown, zirconia crown, veneer, bridge, RCT, post & core, implant, implant crown.',
    input_schema: {
      type: 'object',
      properties: {
        fdi: { type: 'integer', description: 'FDI tooth number' },
        condition: {
          type: 'string',
          enum: VALID_TOOTH_CONDITIONS,
        },
      },
      required: ['fdi', 'condition'],
    },
  },
  {
    name: 'mark_tooth_missing',
    description: 'Mark a tooth as missing (extracted or congenitally absent).',
    input_schema: {
      type: 'object',
      properties: {
        fdi: { type: 'integer', description: 'FDI tooth number' },
      },
      required: ['fdi'],
    },
  },
  {
    name: 'mark_tooth_unerupted',
    description: 'Mark a tooth as unerupted.',
    input_schema: {
      type: 'object',
      properties: {
        fdi: { type: 'integer', description: 'FDI tooth number' },
      },
      required: ['fdi'],
    },
  },
]

const systemPrompt = `You are an expert dental charting assistant. The dentist will give you a spoken
transcript of their clinical findings. Your job is to call the provided tools to
chart each finding onto the correct tooth.

Rules:
- Always use FDI notation (e.g., 16, 21, 47). Never use Palmer or UNS.
- For surface conditions (caries, composites, etc.) identify which surfaces are
  affected. If the dentist does not specify surfaces, use your clinical judgement
  (e.g., "caries on 16" → occlusal surface for a molar is a safe default).
- Do not invent findings not mentioned by the dentist.
- A "filling" means a composite by default unless material is specified.
- Call all applicable tools before stopping.
- Do not emit any plain-text response — only tool calls.`

const MAX_TRANSCRIPT_LENGTH = 5000
const MAX_TOOL_ITERATIONS = 50

function getValidFdiSet(teethType) {
  if (teethType === 'deciduous') return DECIDUOUS_FDI_SET
  return PERMANENT_FDI_SET
}

function validateAction(action, validFdiSet) {
  if (!action || typeof action !== 'object') return false
  const fdi = Number(action.fdi || 0)
  if (!fdi || !validFdiSet.has(fdi)) return false
  switch (action.type) {
    case 'surface':
      if (!Array.isArray(action.surfaces) || !action.surfaces.length) return false
      if (!VALID_SURFACE_CONDITIONS.includes(action.condition)) return false
      return true
    case 'tooth':
      if (!VALID_TOOTH_CONDITIONS.includes(action.condition)) return false
      return true
    case 'missing':
    case 'unerupted':
      return true
    default:
      return false
  }
}

function buildActionFromToolCall(toolName, toolInput, validFdiSet) {
  const fdi = Number(toolInput?.fdi || 0)
  if (!fdi || !validFdiSet.has(fdi)) return null

  switch (toolName) {
    case 'apply_surface_condition': {
      const surfaces = Array.isArray(toolInput?.surfaces)
        ? toolInput.surfaces.filter((s) => VALID_SURFACES.includes(s))
        : []
      if (!surfaces.length) return null
      const condition = toolInput?.condition || null
      if (!VALID_SURFACE_CONDITIONS.includes(condition)) return null
      return {
        type: 'surface',
        fdi,
        surfaces,
        condition,
        status: 'existing',
      }
    }
    case 'apply_tooth_condition': {
      const condition = toolInput?.condition || null
      if (!VALID_TOOTH_CONDITIONS.includes(condition)) return null
      return {
        type: 'tooth',
        fdi,
        condition,
        status: 'existing',
      }
    }
    case 'mark_tooth_missing':
      return { type: 'missing', fdi }
    case 'mark_tooth_unerupted':
      return { type: 'unerupted', fdi }
    default:
      return null
  }
}

export async function aiChartFromTranscript(event, body) {
  try {
    const { orgId } = event.context.user || {}
    if (!orgId) return error(401, 'Unauthenticated')

    const { transcript, patientId, teethType = 'permanent' } = body || {}

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return error(400, 'Transcript is required')
    }

    const trimmedTranscript = transcript.trim()
    if (trimmedTranscript.length > MAX_TRANSCRIPT_LENGTH) {
      return error(400, `Transcript too long (max ${MAX_TRANSCRIPT_LENGTH} characters)`)
    }

    if (!patientId) return error(400, 'patientId is required')

    const patient = await DiaryPatient.findOne({
      where: { id: Number(patientId), organisationId: Number(orgId) },
      attributes: ['id'],
    })
    if (!patient) return error(404, 'Patient not found')

    const validFdiSet = getValidFdiSet(teethType)

    const client = await initializeAnthropicClient()
    console.log('[charting] client ready, sending transcript to Claude')

    const messages = [{ role: 'user', content: trimmedTranscript }]
    const actions = []
    let tokensUsed = { input: 0, output: 0 }
    let iterations = 0

    while (iterations < MAX_TOOL_ITERATIONS) {
      iterations += 1
      console.log(`[charting] iteration ${iterations} — calling Claude`)

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
        tools,
      })

      tokensUsed.input += response.usage?.input_tokens || 0
      tokensUsed.output += response.usage?.output_tokens || 0
      console.log(`[charting] stop_reason=${response.stop_reason} tools_called=${response.content.filter(b => b.type === 'tool_use').length}`)

      if (response.stop_reason === 'end_turn') break

      if (response.stop_reason === 'tool_use') {
        messages.push({ role: 'assistant', content: response.content })
        const toolResults = []
        for (const block of response.content) {
          if (block.type !== 'tool_use') continue
          const action = buildActionFromToolCall(block.name, block.input, validFdiSet)
          if (action) actions.push(action)
          console.log(`[charting] tool=${block.name} fdi=${block.input?.fdi} → ${action ? 'ok' : 'skipped'}`)
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: action ? 'ok' : 'skipped: invalid input',
          })
        }
        messages.push({ role: 'user', content: toolResults })
      } else {
        break
      }
    }

    const warning = iterations >= MAX_TOOL_ITERATIONS ? 'partial' : undefined
    console.log(`[charting] done — ${actions.length} actions, ${iterations} iterations`)

    return success({ actions, tokensUsed, warning })
  } catch (err) {
    console.error('[charting] aiChartFromTranscript error:', err)
    return error(500, 'AI charting failed')
  }
}