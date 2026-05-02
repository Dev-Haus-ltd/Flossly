let anthropicClient = null;

function getConfig() {
  return useRuntimeConfig();
}

async function initializeAnthropicClient() {
  if (anthropicClient) return anthropicClient;

  const config = getConfig();
  const apiKey = config.CLAUDE_API_KEY;

  if (!apiKey) {
    throw new Error("CLAUDE_API_KEY not configured");
  }

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

export function getLlmModel() {
  const config = getConfig();
  return config.AI_ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
}

export async function chat({ prompt, systemPrompt, model = null, temperature = 0.3, maxTokens = 2000, history = [] }) {
  if (!systemPrompt) {
    throw new Error("systemPrompt is required");
  }

  const client = await initializeAnthropicClient();
  const llmModel = model || getLlmModel();

  const messages = [];

  if (history.length > 0) {
    console.log(`[AI Wrapper] Including ${history.length} prior messages in conversation history`);
    for (const msg of history) {
      messages.push({ role: msg.role || "user", content: msg.content });
    }
  }

  messages.push({ role: "user", content: systemPrompt + "\n\n" + prompt });

  const response = await client.messages.create({
    model: llmModel,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return response.content[0]?.text?.trim();
}

export async function generateAutoReply({ organisationName, organisationType, message, history = [], autoReplyConfig = {} }) {
  const { services = "", cta = "", outOfScopeMessage = "Thank you so much! Our team will contact you shortly.", ctaScript = "" } = autoReplyConfig;

  const systemPrompt = `You are a warm, friendly, and professional assistant for a practice called "${organisationName}".

Your goal is to respond like a real human team member — not a robot. Your tone should feel natural, reassuring, and conversational, while still being professional and clear.

RESPONSE STYLE:
- Be friendly and conversational, but avoid repeating greetings in every message
- Acknowledge the user's message naturally and directly
- Provide helpful, clear, and relevant information based on their question
- Keep responses concise (typically 2–4 sentences, expand only if needed)
- Use light warmth where appropriate, but avoid overusing emojis
- Only include a call-to-action when it feels natural and relevant to the conversation

IMPORTANT RULES:
1. Do not directly book, schedule, or confirm appointments
   - Instead, guide the user toward the next step (e.g., asking for their details or offering to have a team member assist)

2. Do not provide exact pricing, timelines, or availability unless explicitly given
   - If asked, explain that it depends on individual needs and suggest a consultation

3. If unsure about something
   - Provide a helpful general response first
   - Then offer to have a team member confirm or assist further

4. Avoid sounding repetitive, scripted, or overly generic
   - Vary your phrasing and respond based on the specific user message

5. Use conversation history to stay consistent and personalized

GUIDELINES:
- Focus on helping the user first, not pushing them
- Keep the conversation natural and flowing
- Make the user feel heard and understood
- Adapt your response based on the user's intent (question, concern, interest, etc.)

SERVICES/PRACTICE INFO: ${services}

MAIN CALL-TO-ACTION:
${cta || 'If you\'d like, I can help you get started or have our team reach out 😊'}

SCOPE HANDLING:
- If the question is clearly outside the scope of the practice, respond politely and guide the user back to relevant services or offer further help
- Do not use a fixed or repetitive sentence; keep the response natural and context-aware
${ctaScript ? `
CTA REPLY SCRIPT:
A lead has replied to or engaged with the call-to-action above. Follow the flow and intent of the script below when guiding the conversation — you do not need to use the exact wording, but the overall direction, steps, and goals should be respected:
${ctaScript}

Apply this script progressively across the conversation. Do not dump all steps into a single reply — move naturally through the flow as the lead responds.` : ""}`;

  const replyText = await chat({
    prompt: `A patient/customer sent this message: "${message}"

Write a warm, friendly, and natural reply as a team member from the practice.

GUIDELINES:
- Start with a friendly greeting (use their name if available)
- Acknowledge their message clearly
- Provide a helpful, reassuring response based on their query
- Keep it conversational and human — not robotic
- You may write 3–5 sentences if needed (do not force brevity)
- Use light warmth (e.g., 😊✨) where appropriate

CONSTRAINTS:
- Do NOT confirm bookings or appointments
- Do NOT provide exact pricing or make up details
- If specific info is unavailable, give a general helpful answer and guide them toward a consultation

ENDING:
- Gently guide the user toward the next step (e.g., asking for their name and phone number, or offering to arrange a consultation)
- Keep the ending natural, not pushy

Your response should feel like a real conversation, not a template.`,
    systemPrompt,
    temperature: 0.4,
    maxTokens: 700,
    history,
  });

  return {
    reply: replyText,
    systemPrompt,
    context: {
      organisationName,
      organisationType,
    },
  };
}

export async function summarize({ text }) {
  const config = getConfig();
  const model = getLlmModel();

  const systemPrompt = "You are a helpful assistant that summarizes transcriptions by removing filler words, repetitions, and irrelevant content while preserving all meaningful information.";

  const summary = await chat({
    prompt: `Please summarize the following transcription. Remove any useless text, filler words, repeated phrases, and irrelevant information. Keep only the meaningful and important content. Maintain proper grammar and clarity. If the transcription contains a conversation, preserve the key points and main ideas.

Transcription:
${text}

Summary:`,
    systemPrompt,
    model,
    temperature: 0.3,
    maxTokens: 2000,
  });

  return {
    summary,
    originalLength: text.length,
    summaryLength: summary?.length || 0,
  };
}

import { inferTriggerFromName } from './crmAutomation.js'

export async function generateAutomations({ organisationName, organisationType, userIdea, followUp, existingAutomations }) {
  const systemPrompt = `You are an expert CRM automation assistant specialized in creating professional, empathetic communication templates for healthcare practices, particularly ${organisationType} practices.

CRITICAL REQUIREMENTS:
1. Generate automations based on the user's request - create as many groups as makes sense
2. Group related automations under the SAME groupName (e.g., all follow-up emails in one group)
3. ONLY use type: "Email" or "WhatsApp" (case-sensitive, exactly as shown)
4. Each group should have multiple related automations that work together
5. Use available placeholders in content for personalization

AVAILABLE PLACEHOLDERS (use {{placeholder}} format):
- {{name}} or {{patient name}} - Patient's full name
- {{first name}} - Patient's first name
- {{practice name}} - Practice name
- {{email}} - Contact email
- {{phone number}} - Practice phone
- {{address}} - Practice address
- {{street address}} - Street address
- {{city, state zip code}} - City/state/zip
- {{location}} - Practice location/city
- {{website}} - Practice website link
- {{your name}} - Sender/practitioner name
- {{treatment coordinator name}} - Coordinator name
- {{practice owner / principal dentist}} - Principal dentist name
- {{days and times}} - Office hours
- {{booking link}} - Appointment booking link
- {{date}}, {{time}}, {{date / time}} - For appointments
- {{month}} - Current/birth month
- {{X}}, {{Y}}, {{Z}} - Promo variables

STRUCTURE REQUIREMENTS:
- Return ONLY valid JSON (no markdown, no code blocks)
- Each automation MUST have: groupName, type, name, content
- Email type MUST have subject field
- WhatsApp type should NOT have subject field
- Plain text only (no HTML in content)
- Professional, empathetic, patient-centered language

Example output structure:
{
  "automations": [
    {
      "groupName": "Post Treatment",
      "type": "Email",
      "name": "Follow-up 3 Days",
      "subject": "How are you feeling?",
      "content": "Hi {{name}}, checking in after your treatment at {{practice name}}."
    },
    {
      "groupName": "Post Treatment",
      "type": "WhatsApp",
      "name": "Quick Check-in",
      "content": "Hi {{first name}}! Just checking in after your visit. How are you feeling? 😊"
    },
    {
      "groupName": "Birthdays",
      "type": "Email",
      "name": "Birthday Wish",
      "subject": "Happy Birthday from {{practice name}}!",
      "content": "Happy birthday {{name}}! 🎂 We hope you have a wonderful day!"
    }
  ]
}`;

  let userPrompt = '';
  
  if (followUp && existingAutomations) {
    userPrompt = `Practice Name: "${organisationName}"
Practice Type: ${organisationType}

Original Request: "${userIdea}"

EXISTING AUTOMATIONS (JSON):
${JSON.stringify(existingAutomations, null, 2)}

USER'S FOLLOW-UP REQUEST: "${followUp}"

CRITICAL INSTRUCTIONS:
1. You MUST modify the existing automations based on the user's follow-up request
2. DO NOT create new automations unless explicitly requested
3. Only apply the specific changes mentioned in the follow-up request
4. Keep all other fields unchanged unless they need to change to fulfill the request
5. Maintain the same structure: groupName, type, name, subject (for Email), content
6. Return ALL automations (modified and unmodified) in the response
7. Common follow-up requests:
   - "Make it more friendly" → Adjust tone in content/subject
   - "Add emojis" → Add appropriate emojis to content
   - "Shorter" → Reduce content length while keeping key points
   - "Change subject line" → Modify email subjects
   - "More professional" → Adjust language and tone

Return ONLY the JSON object with the updated "automations" array. No other text.`;
  } else {
    userPrompt = `Practice Name: "${organisationName}"
Practice Type: ${organisationType}

User Request: "${userIdea}"

Based on the user's request, generate an appropriate number of automation templates and groups.

REQUIREMENTS:
1. Analyze the user's request and create the RIGHT number of groups that makes sense
   - Simple request (e.g., "birthday email") → 1 group with 1-2 automations
   - Specific request (e.g., "follow-up emails") → 1-2 groups with 3-5 automations
   - Broad request (e.g., "patient communication suite") → 3-5 groups with 10-15 automations
2. Group related automations logically (e.g., all follow-ups together, all reminders together)
3. Mix Email and WhatsApp appropriately (Email for longer content, WhatsApp for quick messages)
4. Use placeholders like {{name}}, {{practice name}}, {{phone number}}, {{booking link}}, etc.
5. Make content professional, warm, and actionable
6. For Email: Always include meaningful subject lines
7. For WhatsApp: Keep messages concise and friendly
8. Ensure content is plain text (no HTML tags)
9. Be creative but practical - generate what the user actually needs, not more or less

Return ONLY the JSON object with "automations" array. No other text.`;
  }

  const responseText = await chat({
    prompt: userPrompt,
    systemPrompt,
    temperature: 0.7,
    maxTokens: 3000,
  });

  let automations;
  try {
    const parsed = JSON.parse(responseText);
    automations = Array.isArray(parsed) ? parsed : (parsed.automations || parsed.templates || []);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Response was:', responseText);
    throw new Error('Failed to parse AI response. Please try again.');
  }

  if (!Array.isArray(automations) || automations.length === 0) {
    throw new Error('AI did not generate any automations. Please try rephrasing your request.');
  }

  automations = automations.map((auto, index) => {
    let normalizedType = 'Email';
    if (auto.type === 'WhatsApp' || auto.type === 'whatsapp' || auto.type === 'Whatsapp') {
      normalizedType = 'WhatsApp';
    } else if (auto.type === 'Email' || auto.type === 'email') {
      normalizedType = 'Email';
    }

    const resolvedName = String(auto.name || `Automation ${index + 1}`).trim();
    return {
      groupName: String(auto.groupName || 'General Communications').trim(),
      type: normalizedType,
      name: resolvedName,
      subject: normalizedType === 'Email'
        ? String(auto.subject || auto.name || 'Message from ' + organisationName).trim()
        : '',
      content: String(auto.content || auto.message || '').trim(),
      trigger: inferTriggerFromName(resolvedName),
    };
  }).filter(auto => {
    if (!auto.content) return false;
    if (!auto.groupName) return false;
    if (!auto.name) return false;
    if (auto.type === 'Email' && !auto.subject) return false;
    return true;
  });

  return automations;
}

export const aiWrapper = {
  chat,
  summarize,
  generateAutomations,
  generateAutoReply,
  getLlmModel,
};

const bookAppointmentTool = {
  name: "book_appointment",
  description: "Book a diary appointment for the customer. Call this only when you have confirmed the patient's name, phone number, and a preferred date/time. Do not guess values.",
  input_schema: {
    type: "object",
    properties: {
      patient_name: { "type": "string" },
      patient_phone: { "type": "string" },
      preferred_date: { "type": "string", description: "YYYY-MM-DD" },
      preferred_time: { "type": "string", description: "HH:MM (24h)" },
      treatment: { "type": "string", description: "Optional treatment interest" },
      notes: { "type": "string", description: "Any other relevant info from the conversation" },
    },
    required: ["patient_name", "patient_phone", "preferred_date", "preferred_time"],
  },
};

export async function generateAutoReplyWithTools({ organisationName, organisationType, message, history = [], autoReplyConfig = {} }) {
  const { services = "", cta = "", outOfScopeMessage = "Thank you so much! Our team will contact you shortly.", ctaScript = "" } = autoReplyConfig;

  const systemPrompt = `You are a warm, friendly, and professional assistant for a practice called "${organisationName}".

Your goal is to respond like a real human team member — not a robot. Your tone should feel natural, reassuring, and conversational, while still being professional and clear.

RESPONSE STYLE:
- Be friendly and conversational, but avoid repeating greetings in every message
- Acknowledge the user's message naturally and directly
- Provide helpful, clear, and relevant information based on their question
- Keep responses concise (typically 2–4 sentences, expand only if needed)
- Use light warmth where appropriate, but avoid overusing emojis
- Only include a call-to-action when it feels natural and relevant to the conversation

IMPORTANT RULES:
1. You have access to a booking tool. When a customer clearly wants to book an appointment AND you have collected all four of: patient name, phone number, preferred date, and preferred time — call the book_appointment tool.
2. Do NOT call the tool until you have ALL four pieces of information: name, phone, date, and time.
3. If information is missing, ask the customer for the missing details before proceeding.
4. Do not provide exact pricing, timelines, or availability unless explicitly given.
5. Avoid sounding repetitive, scripted, or overly generic — vary your phrasing based on the specific user message.
6. Use conversation history to stay consistent and personalized.

SERVICES/PRACTICE INFO: ${services}

MAIN CALL-TO-ACTION:
${cta || 'If you\'d like, I can help you get started or have our team reach out 😊'}

SCOPE HANDLING:
- If the question is clearly outside the scope of the practice, respond politely and guide the user back to relevant services or offer further help
- Do not use a fixed or repetitive sentence; keep the response natural and context-aware
${ctaScript ? `
CTA REPLY SCRIPT:
A lead has replied to or engaged with the call-to-action above. Follow the flow and intent of the script below when guiding the conversation — you do not need to use the exact wording, but the overall direction, steps, and goals should be respected:
${ctaScript}

Apply this script progressively across the conversation. Do not dump all steps into a single reply — move naturally through the flow as the lead responds.` : ""}`;

  const client = await initializeAnthropicClient();
  const llmModel = getLlmModel();

  const messages = [];
  if (history.length > 0) {
    for (const msg of history) {
      messages.push({ role: msg.role || "user", content: msg.content });
    }
  }
  messages.push({ role: "user", content: message });

  const response = await client.messages.create({
    model: llmModel,
    messages,
    tools: [bookAppointmentTool],
    tool_choice: { type: "auto" },
    system: systemPrompt,
    temperature: 0.4,
    max_tokens: 700,
  });

  const stopReason = response.stop_reason;
  const content = response.content;

  if (stopReason === "tool_use") {
    const toolBlock = content.find((b) => b.type === "tool_use");
    if (toolBlock) {
      return {
        reply: null,
        toolCall: {
          name: toolBlock.name,
          input: toolBlock.input,
        },
      };
    }
  }

  const replyText = content.find((b) => b.type === "text")?.text?.trim() || "";
  return { reply: replyText, toolCall: null };
}
