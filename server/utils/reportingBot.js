import sequelize from './db.js'
import { QueryTypes } from 'sequelize'
import { initializeAnthropicClient, getLlmModel } from './aiWrapper.js'
import { tasksModule } from './reportingBot/modules/tasks.js'
import { crmModule } from './reportingBot/modules/crm.js'
import { diaryModule } from './reportingBot/modules/diary.js'
import { financeModule } from './reportingBot/modules/finance.js'
import { marketingModule } from './reportingBot/modules/marketing.js'
import { staffModule } from './reportingBot/modules/staff.js'
import { cpdModule } from './reportingBot/modules/cpd.js'
import { organisationModule } from './reportingBot/modules/organisation.js'
import { executiveModule } from './reportingBot/modules/executive.js'
import { notificationsModule } from './reportingBot/modules/notifications.js'

const MODULES = {
  tasks: tasksModule,
  crm: crmModule,
  diary: diaryModule,
  finance: financeModule,
  marketing: marketingModule,
  staff: staffModule,
  cpd: cpdModule,
  organisation: organisationModule,
  executive: executiveModule,
  notifications: notificationsModule,
}

const BLOCKED_KEYWORDS = ['INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'TRUNCATE', 'GRANT', 'REVOKE']
const MAX_ROWS = 500
const MAX_TOOL_ITERATIONS = 10

async function describeTable(tableName) {
  try {
    const schema = useRuntimeConfig().DB_SCHEMA || 'public'

    const columns = await sequelize.query(
      `SELECT column_name, data_type, is_nullable, column_default
       FROM information_schema.columns
       WHERE table_schema = :schema AND table_name = :tableName
       ORDER BY ordinal_position`,
      { type: QueryTypes.SELECT, replacements: { schema, tableName } }
    )

    if (columns.length === 0) {
      return { error: `Table "${tableName}" not found in schema "${schema}".` }
    }

    const foreignKeys = await sequelize.query(
      `SELECT
         kcu.column_name,
         ccu.table_name AS foreign_table,
         ccu.column_name AS foreign_column
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = :schema
         AND tc.table_name = :tableName`,
      { type: QueryTypes.SELECT, replacements: { schema, tableName } }
    )

    return { columns, foreignKeys }
  } catch (err) {
    return { error: `describe_table failed: ${err.message}` }
  }
}

async function safeQuery(sql, orgId) {
  const upper = sql.trim().toUpperCase()

  if (!upper.startsWith('SELECT')) {
    return { error: 'Only SELECT queries are allowed.' }
  }

  for (const kw of BLOCKED_KEYWORDS) {
    if (new RegExp(`\\b${kw}\\b`).test(upper)) {
      return { error: `Query contains disallowed keyword: ${kw}` }
    }
  }

  if (!sql.toLowerCase().includes('organisationid')) {
    return { error: 'Query must include organisationId to ensure data isolation.' }
  }

  try {
    const schema = useRuntimeConfig().DB_SCHEMA || 'public'
    await sequelize.query(`SET search_path TO "${schema}"`, { type: QueryTypes.RAW })
    const rows = await sequelize.query(sql, { type: QueryTypes.SELECT })
    const isAggregation = /\bGROUP\s+BY\b/i.test(sql)
    const result = { rows: rows.slice(0, MAX_ROWS), count: rows.length }
    if (!isAggregation && rows.length > 10) {
      result.warning = `These are raw rows (${rows.length} total). DO NOT count or group these rows yourself — run a separate COUNT(*) GROUP BY query for any numeric breakdown. Counting rows you receive will produce wrong answers.`
    }
    return result
  } catch (err) {
    return { error: `Query failed: ${err.message}` }
  }
}

function buildSystemPrompt(orgId, userId, userName, userEmail) {
  const today = new Date().toLocaleDateString('en-GB', { dateStyle: 'long' })

  const moduleList = Object.values(MODULES)
    .map(m => `- **${m.name}**: ${m.description}`)
    .join('\n')

  return `You are a practice analytics assistant for a dental/aesthetic practice using Flossly.
Today's date: ${today}
Organisation ID: ${orgId}
Current user ID: ${userId}${userName ? `\nCurrent user name: ${userName}` : ''}${userEmail ? `\nCurrent user email: ${userEmail}` : ''}

When the user says "my tasks", "my leads", "I", "me" — use their user ID (${userId}) to filter queries.

## Tools Available
You have three tools:

1. **get_module_schema(module)** — call this FIRST to understand which tables belong to a domain and what they represent. It gives you an overview and the table names to use.

2. **describe_table(tableName)** — call this AFTER get_module_schema to get the EXACT columns (with data types) and FOREIGN KEY relationships for a table, straight from the live database. Always call this before writing SQL — never trust guessed column names. You can call it for multiple tables in parallel.

3. **run_sql_query(query)** — executes a read-only SELECT query. Only call this after you have verified exact column names via describe_table.

## Available Modules
${moduleList}

## Rules
- ALWAYS call get_module_schema first, then describe_table for each table you plan to query — never guess column names.
- ALWAYS include "organisationId" = ${orgId} in every WHERE clause.
- All table and column names are case-sensitive — double-quote them in SQL (e.g. "CrmLeads", "organisationId").
- The search_path is already set — use table names WITHOUT schema prefix (e.g. just "CrmLeads").
- NEVER ask the user for IDs. Look them up yourself with a query if needed.
- NEVER ask "would you like me to...". Just do it. Only ask a clarifying question if the request is genuinely ambiguous.
- NEVER use exact string matching (=) for status or category names — always use ILIKE (e.g. \`COALESCE(os.name, ds.name) ILIKE 'to do'\`). Status names in the DB may differ in casing from what the user types.
- **CRITICAL**: NEVER count, sum, or aggregate data by reading returned rows. The rows returned to you are a SAMPLE (capped at ${MAX_ROWS}) and may be incomplete. For ANY count, total, or category breakdown, you MUST run a separate \`SELECT COUNT(*) GROUP BY ...\` query to get accurate numbers from the database. Counting rows you received will produce wrong answers.
- Be concise. Use markdown tables for data. Currency is GBP (£). Meta spend is in pence ÷ 100.

## Behaviour (from training guidelines)
- **Default time period**: when no time period is specified, default to **last 30 days**.
- **Comparisons**: always return BOTH values side by side with % change — never just one figure.
- **After a summary**: proactively add one key insight or flag — e.g. top source, biggest drop, highest risk item.
- **Revenue estimates**: use these average treatment values — Whitening £350, Composite Bonding £800, Teeth Straightening £2,500, INVISALIGN £3,500, Veneers £9,600, Smile Makeover £8,000, unknown £1,500.
- **KPI summaries**: run multiple queries and present as a structured dashboard with clear sections.
- **Cross-module queries**: call get_module_schema for all relevant modules before writing SQL.
- **Alert emoji mapping**: alert field values → 🔥 hot, 🚨 urgent, 💸 high-value, 📞 call-required.`
}

const GET_MODULE_SCHEMA_TOOL = {
  name: 'get_module_schema',
  description: 'Get the detailed database schema, table structures, column meanings, and example queries for a specific module. Call this before writing any SQL for that domain.',
  input_schema: {
    type: 'object',
    properties: {
      module: {
        type: 'string',
        enum: ['tasks', 'crm', 'diary', 'finance', 'marketing', 'staff', 'cpd', 'organisation', 'executive', 'notifications'],
        description: 'The module to get schema for'
      }
    },
    required: ['module']
  }
}

const DESCRIBE_TABLE_TOOL = {
  name: 'describe_table',
  description: 'Get the exact columns (names, data types, nullability) and foreign key relationships for a database table, queried live from the database. Call this after get_module_schema and before writing SQL to verify the real column names.',
  input_schema: {
    type: 'object',
    properties: {
      tableName: { type: 'string', description: 'The exact table name as it exists in the database (case-sensitive)' }
    },
    required: ['tableName']
  }
}

const RUN_SQL_TOOL = {
  name: 'run_sql_query',
  description: 'Execute a read-only PostgreSQL SELECT query. Always call get_module_schema and describe_table first to know the correct table and column names.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'A valid PostgreSQL SELECT query' },
      description: { type: 'string', description: 'What this query fetches' }
    },
    required: ['query']
  }
}

export async function answerReportingQuestion({ question, orgId, userId, userName, userEmail, conversationHistory = [], onChunk }) {
  const client = await initializeAnthropicClient()
  const configuredModel = getLlmModel()
  const model = configuredModel === 'claude-sonnet-4-20250514' ? 'claude-sonnet-4-5' : configuredModel
  const systemPrompt = buildSystemPrompt(orgId, userId, userName, userEmail)

  const messages = [
    ...conversationHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: question }
  ]

  let iterations = 0

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++

    let response
    if (onChunk) {
      // Use streaming — buffer text and only emit if this turns out to be end_turn
      const buffered = []
      const stream = client.messages.stream({
        model, system: systemPrompt, messages,
        tools: [GET_MODULE_SCHEMA_TOOL, DESCRIBE_TABLE_TOOL, RUN_SQL_TOOL],
        tool_choice: { type: 'auto' },
        max_tokens: 4000, temperature: 0.1,
      })
      stream.on('text', t => buffered.push(t))
      response = await stream.finalMessage()

      if (response.stop_reason !== 'tool_use') {
        // Emit buffered text chunks as they were generated
        for (const chunk of buffered) {
          await onChunk(chunk)
        }
        return buffered.join('').trim() || 'I was unable to generate a response.'
      }
      // tool_use: buffered text is typically empty, continue loop
    } else {
      response = await client.messages.create({
        model, system: systemPrompt, messages,
        tools: [GET_MODULE_SCHEMA_TOOL, DESCRIBE_TABLE_TOOL, RUN_SQL_TOOL],
        tool_choice: { type: 'auto' },
        max_tokens: 4000, temperature: 0.1,
      })
    }

    if (!onChunk && response.stop_reason !== 'tool_use') {
      const text = response.content.find(b => b.type === 'text')
      return text?.text?.trim() || 'I was unable to generate a response.'
    }

    messages.push({ role: 'assistant', content: response.content })

    const toolResults = []
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue

      let result

      if (block.name === 'get_module_schema') {
        const mod = MODULES[block.input.module]
        process.stderr.write(`[ReportingBot] Loading schema: ${block.input.module}\n`)
        result = mod
          ? { schema: mod.schema }
          : { error: `Unknown module: ${block.input.module}` }
      } else if (block.name === 'describe_table') {
        process.stderr.write(`[ReportingBot] Describing table: ${block.input.tableName}\n`)
        result = await describeTable(block.input.tableName)
        process.stderr.write(`[ReportingBot] Table has ${result.columns?.length ?? 0} columns, ${result.foreignKeys?.length ?? 0} FKs\n`)
      } else if (block.name === 'run_sql_query') {
        process.stderr.write(`[ReportingBot] Query: ${block.input.description || ''}\n`)
        process.stderr.write(`[ReportingBot] SQL: ${block.input.query}\n`)
        result = await safeQuery(block.input.query, orgId)
        process.stderr.write(`[ReportingBot] Result rows: ${result.count ?? 0}, sample: ${JSON.stringify(result.rows?.slice(0, 3))}\n`)
      } else {
        result = { error: `Unknown tool: ${block.name}` }
      }

      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(result)
      })
    }

    messages.push({ role: 'user', content: toolResults })
  }

  return 'I reached the maximum number of query steps. Please try rephrasing your question.'
}
