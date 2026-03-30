import { success, error } from '../utils/response'
import { parseJsonBody } from '../utils/body'
import { Organisation } from '../models'
import OpenAI from 'openai'

/**
 * Generate CRM automations using OpenAI GPT-4o based on user's idea
 */
export const generateAutomationsWithAI = async (event) => {
  try {
    const { orgId } = event.context.user || {}
    const body = await readBody(event)
    const payload = typeof body === 'string' ? parseJsonBody(body) : body
    const { idea, followUp, existingAutomations } = payload || {}

    if (!orgId) return error(401, 'Unauthenticated')
    if (!idea || typeof idea !== 'string' || !idea.trim()) {
      return error(400, 'Idea is required')
    }

    // Get organization details for context
    const org = await Organisation.findByPk(Number(orgId), {
      attributes: ['id', 'name', 'type', 'practiceAnniversaryDate']
    })

    if (!org) return error(404, 'Organisation not found')

    // Build context for AI
    const context = {
      organisationName: org.name,
      organisationType: org.type || 'Dental',
      userIdea: idea.trim(),
      followUp: followUp?.trim() || null,
      existingAutomations: existingAutomations || null,
    }

    // Generate automations using OpenAI GPT-4o
    const automations = await generateAutomationsWithOpenAI(context)

    return success({
      automations,
      message: followUp 
        ? `Refined ${automations.length} automations based on your feedback`
        : `Generated ${automations.length} automations based on your idea`,
    })
  } catch (e) {
    console.error('AI automation generation error:', e)
    return error(500, e.message || 'Failed to generate automations')
  }
}

/**
 * Generate automations using OpenAI GPT-4o
 */
async function generateAutomationsWithOpenAI(context) {
  const { organisationName, organisationType, userIdea, followUp, existingAutomations } = context
  
  // Check if API key is configured using runtime config
  const config = useRuntimeConfig()
  const apiKey = config.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.')
  }

  const openai = new OpenAI({ apiKey })

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
}`

    let userPrompt = ''
    
    if (followUp && existingAutomations) {
      // Follow-up request: Modify existing automations based on user feedback
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

Return ONLY the JSON object with the updated "automations" array. No other text.`
    } else {
      // Initial request: Generate new automations
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

Return ONLY the JSON object with "automations" array. No other text.`
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0].message.content.trim()
    
    // Parse the response
    let automations
    try {
      const parsed = JSON.parse(responseText)
      // Handle if OpenAI wraps it in an object
      automations = Array.isArray(parsed) ? parsed : (parsed.automations || parsed.templates || [])
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError)
      console.error('Response was:', responseText)
      throw new Error('Failed to parse AI response. Please try again.')
    }

    // Validate the structure
    if (!Array.isArray(automations) || automations.length === 0) {
      throw new Error('AI did not generate any automations. Please try rephrasing your request.')
    }

    // Validate and normalize automations
    automations = automations.map((auto, index) => {
      // Strictly enforce type to be exactly "Email" or "WhatsApp"
      let normalizedType = 'Email' // Default
      if (auto.type === 'WhatsApp' || auto.type === 'whatsapp' || auto.type === 'Whatsapp') {
        normalizedType = 'WhatsApp'
      } else if (auto.type === 'Email' || auto.type === 'email') {
        normalizedType = 'Email'
      }

      return {
        groupName: String(auto.groupName || 'General Communications').trim(),
        type: normalizedType,
        name: String(auto.name || `Automation ${index + 1}`).trim(),
        subject: normalizedType === 'Email' 
          ? String(auto.subject || auto.name || 'Message from ' + organisationName).trim() 
          : '', // WhatsApp should not have subject
        content: String(auto.content || auto.message || '').trim()
      }
    }).filter(auto => {
      // Remove invalid entries
      if (!auto.content) return false
      if (!auto.groupName) return false
      if (!auto.name) return false
      if (auto.type === 'Email' && !auto.subject) return false
      return true
    })

    // Ensure we have multiple groups
    const uniqueGroups = [...new Set(automations.map(a => a.groupName))]
    console.log(`Generated ${automations.length} automations across ${uniqueGroups.length} groups:`, uniqueGroups)

    return automations
}

/**
 * Mock automation generator - FOR DEVELOPMENT/TESTING ONLY
 * This function is no longer used in production
 */
/*
function generateMockAutomations(context) {
  const { organisationName, organisationType, userIdea } = context
  const ideaLower = userIdea.toLowerCase()

  // Always generate multiple groups
  const automations = []

  // Group 1: Follow-up emails pattern
  if (ideaLower.includes('follow') || ideaLower.includes('after') || ideaLower.includes('treatment')) {
    automations.push({
      groupName: 'Post Treatment Follow-up',
      type: 'Email',
      name: '24 Hour Check-in',
      subject: 'How are you feeling after your visit?',
      content: `Hi {{name}},\n\nWe hope you're feeling great after your recent visit to {{practice name}}!\n\nWe'd love to hear how you're doing. If you have any concerns or questions, please don't hesitate to reach out to us at {{phone number}}.\n\nBest regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'Post Treatment Follow-up',
      type: 'Email',
      name: '3 Day Follow-up',
      subject: 'Quick check-in from your visit',
      content: `Hello {{name}},\n\nIt's been a few days since your appointment at {{practice name}}. We wanted to check in and see how everything is going.\n\nIf you have any questions or concerns, we're here to help at {{phone number}}!\n\nWarm regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'Post Treatment Follow-up',
      type: 'WhatsApp',
      name: 'Quick Follow-up',
      content: `Hi {{first name}}! Just checking in after your visit to {{practice name}}. How are you feeling? 😊`
    })
  }

  // Group 2: Welcome/New patient pattern
  if (ideaLower.includes('welcome') || ideaLower.includes('new patient') || ideaLower.includes('new lead')) {
    automations.push({
      groupName: 'New Patient Welcome',
      type: 'Email',
      name: 'Welcome Email',
      subject: 'Welcome to {{practice name}}!',
      content: `Hi {{name}},\n\nThank you for choosing {{practice name}}! We're thrilled to welcome you to our practice.\n\nWe're committed to providing you with the best possible care and service. If you have any questions before your first visit, please feel free to contact us at {{phone number}} or visit {{website}}.\n\nLooking forward to meeting you!\n\nWarm regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'New Patient Welcome',
      type: 'Email',
      name: 'First Visit Preparation',
      subject: 'Getting ready for your first visit',
      content: `Hello {{name}},\n\nWe wanted to help you prepare for your first appointment at {{practice name}}.\n\nPlease bring:\n- Your ID\n- Insurance information (if applicable)\n- Any relevant medical records\n\nOur address: {{address}}\nOffice hours: {{days and times}}\n\nWe can't wait to see you!\n\nBest regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'New Patient Welcome',
      type: 'WhatsApp',
      name: 'Welcome Message',
      content: `Welcome to {{practice name}}, {{first name}}! 🎉 We're excited to have you. If you have any questions, call us at {{phone number}}!`
    })
  }

  // Group 3: Birthday/celebration pattern
  if (ideaLower.includes('birthday') || ideaLower.includes('celebration')) {
    automations.push({
      groupName: 'Birthday Celebrations',
      type: 'Email',
      name: 'Birthday Greeting',
      subject: 'Happy Birthday from {{practice name}}! 🎉',
      content: `Happy Birthday {{name}}! 🎂\n\nEveryone at {{practice name}} wants to wish you a wonderful day filled with joy and happiness!\n\nAs a special birthday gift during {{month}}, we'd like to offer you a complimentary consultation on your next visit.\n\nHere's to a fantastic year ahead!\n\nCheers,\n{{your name}} and the team`
    })

    automations.push({
      groupName: 'Birthday Celebrations',
      type: 'WhatsApp',
      name: 'Birthday Wish',
      content: `Happy Birthday {{first name}}! 🎉🎂 Wishing you an amazing day from all of us at {{practice name}}!`
    })
  }

  // Group 4: Appointment reminder pattern
  if (ideaLower.includes('reminder') || ideaLower.includes('appointment')) {
    automations.push({
      groupName: 'Appointment Reminders',
      type: 'Email',
      name: '1 Day Reminder',
      subject: 'Reminder: Your appointment at {{practice name}}',
      content: `Hi {{name}},\n\nThis is a friendly reminder about your appointment at {{practice name}} on {{date}} at {{time}}.\n\nLocation: {{address}}\n\nIf you need to reschedule or have any questions, please call us at {{phone number}} as soon as possible.\n\nSee you soon!\n\nBest regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'Appointment Reminders',
      type: 'WhatsApp',
      name: 'Quick Reminder',
      content: `Hi {{first name}}! Quick reminder about your appointment at {{practice name}} on {{date / time}}. See you soon! 😊`
    })

    automations.push({
      groupName: 'Appointment Reminders',
      type: 'Email',
      name: 'Booking Confirmation',
      subject: 'Appointment confirmed at {{practice name}}',
      content: `Dear {{name}},\n\nYour appointment has been confirmed!\n\nDate & Time: {{date / time}}\nLocation: {{address}}\n\nNeed to reschedule? Click here: {{booking link}}\nOr call us: {{phone number}}\n\nWe look forward to seeing you!\n\nBest regards,\n{{your name}}`
    })
  }

  // Group 5: Review/feedback pattern
  if (ideaLower.includes('review') || ideaLower.includes('feedback') || ideaLower.includes('testimonial')) {
    automations.push({
      groupName: 'Review Requests',
      type: 'Email',
      name: 'Review Request',
      subject: "We'd love your feedback!",
      content: `Dear {{name}},\n\nThank you for visiting {{practice name}}. Your experience matters to us!\n\nWould you mind taking a moment to share your feedback? Your review helps us improve and helps others discover our practice.\n\nVisit: {{website}}\n\nThank you for your support!\n\nGratefully,\n{{your name}}`
    })

    automations.push({
      groupName: 'Review Requests',
      type: 'WhatsApp',
      name: 'Quick Feedback Request',
      content: `Hi {{first name}}! We'd love to hear about your experience at {{practice name}}. Would you mind sharing a quick review? 🌟`
    })
  }

  // Group 6: Special offers/promotions pattern
  if (ideaLower.includes('offer') || ideaLower.includes('promotion') || ideaLower.includes('discount') || ideaLower.includes('seasonal')) {
    automations.push({
      groupName: 'Seasonal Promotions',
      type: 'Email',
      name: 'Monthly Special Offer',
      subject: 'Exclusive {{month}} offer just for you!',
      content: `Hi {{name}},\n\nWe have a special offer this month at {{practice name}} that we wanted to share with you!\n\nGet {{X}}% off when you book before {{date}}!\n\nContact us at {{phone number}} or visit {{booking link}} to learn more about this limited-time opportunity.\n\nBest regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'Seasonal Promotions',
      type: 'Email',
      name: 'Black Friday Special',
      subject: 'Special Black Friday Offer from {{practice name}}',
      content: `Dear {{name}},\n\nDon't miss our exclusive Black Friday offer!\n\nSave {{X}}% on selected treatments when you book during {{date range}}.\n\nCall us today: {{phone number}}\nBook online: {{booking link}}\n\nLimited spots available!\n\nBest wishes,\n{{your name}}`
    })
  }

  // Always provide some default automations if none matched or to supplement
  if (automations.length < 3) {
    automations.push({
      groupName: 'General Communications',
      type: 'Email',
      name: 'Thank You Email',
      subject: 'Thank you from {{practice name}}',
      content: `Hi {{name}},\n\nThank you for your interest in {{practice name}}. We appreciate you reaching out to us!\n\nIf you have any questions, please don't hesitate to contact us at {{phone number}} or visit {{website}}.\n\nBest regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'General Communications',
      type: 'Email',
      name: 'General Follow-up',
      subject: 'Following up with you',
      content: `Hello {{name}},\n\nWe wanted to follow up with you regarding your inquiry at {{practice name}}.\n\nIs there anything we can help you with? Feel free to reach out to us at {{phone number}}.\n\nWarm regards,\n{{your name}}`
    })

    automations.push({
      groupName: 'General Communications',
      type: 'WhatsApp',
      name: 'Quick Check-in',
      content: `Hi {{first name}}! This is {{your name}} from {{practice name}}. Just checking if you have any questions. We're here to help! 😊`
    })
  }

  return automations
}
*/
