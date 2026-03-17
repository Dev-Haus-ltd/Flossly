import { ChatbotConfig, User, DiaryPatient, DiaryAppointment, OrganisationTreatment, CrmLead, CrmLeadAssignee, CrmLeadCommunication, Role, UserOrganisation } from "../models";
import { CONTACT_METHODS } from "../models/crm/leadCommunications";
import { readBody } from "h3";
import { createError } from "h3";
import { Op } from "sequelize";
import { success, error } from "../utils/response";
import { parseJsonBody } from "../utils/body";
import { sendNotificationToMultipleUsers } from "../utils/fcmNotification";

// Keep the old success/error for existing functions
const successOld = (data) => ({ code: 1, data });
const errorOld = (statusCode, message) => ({ code: 0, error: message, statusCode });

// Helper to validate botId and get organizationId
const validateBotId = async (botId) => {
  if (!botId) {
    return { valid: false, error: "botId is required" };
  }
  
  const chatbotConfig = await ChatbotConfig.findOne({
    where: { botId }
  });
  
  if (!chatbotConfig) {
    return { valid: false, error: "Invalid botId" };
  }
  
  return { 
    valid: true, 
    organizationId: chatbotConfig.organizationId 
  };
};

// Helper functions for date/time parsing (from diary.js)
const resolveTimeMode = () => {
  const publicMode = process.env.NUXT_PUBLIC_CLINIC_TIME_MODE;
  const serverMode = process.env.CLINIC_TIME_MODE;
  return String(publicMode || serverMode || 'agnostic').toLowerCase();
};
const TIME_MODE = resolveTimeMode();
const USE_TZ_AGNOSTIC = TIME_MODE === 'agnostic';
const parseDateParts = (dateStr) => {
  if (typeof dateStr !== 'string') return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
};
const buildUtcDate = ({ year, month, day }, hour = 0, minute = 0, second = 0, ms = 0) =>
  new Date(Date.UTC(year, month - 1, day, hour, minute, second, ms));
const parseLocalDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  if (!USE_TZ_AGNOSTIC) {
    const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
    return new Date(`${dateStr}T${t}`);
  }
  const dateParts = parseDateParts(dateStr);
  if (!dateParts) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const segments = t.split(':').map((n) => Number(n));
  if (segments.length < 2 || segments.some((n) => Number.isNaN(n))) return null;
  const [hour, minute, second = 0] = segments;
  return buildUtcDate(dateParts, hour, minute, second);
};
const setClinicHours = (dateObj, hour, minute = 0, second = 0, ms = 0) => {
  if (USE_TZ_AGNOSTIC) dateObj.setUTCHours(hour, minute, second, ms);
  else dateObj.setHours(hour, minute, second, ms);
};
const getUtcRangeForDate = (dateStr) => {
  if (!USE_TZ_AGNOSTIC) {
    const day = new Date(dateStr);
    if (Number.isNaN(day.valueOf())) return null;
    const start = new Date(day); start.setHours(0, 0, 0, 0);
    const end = new Date(day); end.setHours(23, 59, 59, 999);
    return { start, end };
  }
  const parts = parseDateParts(dateStr);
  if (!parts) return null;
  return {
    start: buildUtcDate(parts, 0, 0, 0, 0),
    end: buildUtcDate(parts, 23, 59, 59, 999),
  };
};

export const saveChatbotConfig = async (event) => {
  const loggedUser = event.context.user;
  const body = await readBody(event);
  
  try {
    const { 
      botId,
      userId,
      organizationId,
      name,
      companyName,
      avatar,
      openingMessages,
      appointmentGreeting,
      privacyPolicyUrl,
      companyOwnerEmail,
      companyPhone,
      companyWebsite,
      webhookUrl,
      gmailBrochureUrl,
      gmailCallbackUrl,
      themeColor,
      position,
      sideSpacing,
      bottomSpacing,
      showDesktop,
      showMobile,
      googleCalendarConnected,
      calendarStatus,
      appointmentFlow,
      treatmentFlow,
      callbackFlow,
      environment
    } = body;

    // Validate required fields
    if (!name) {
      throw createError({ message: "Bot name is required" });
    }

    // Check if chatbot config already exists for this organization
    const existingConfig = await ChatbotConfig.findOne({
      where: { organizationId: loggedUser.orgId }
    });

    let chatbotConfig;

    if (existingConfig) {
      // Update existing configuration
      await existingConfig.update({
        botId: botId || existingConfig.botId,
        userId: userId || loggedUser.id,
        organizationId: organizationId || loggedUser.orgId,
        name: name || existingConfig.name,
        companyName: companyName || existingConfig.companyName,
        avatar: avatar || existingConfig.avatar,
        openingMessages: openingMessages || existingConfig.openingMessages,
        appointmentGreeting: appointmentGreeting || existingConfig.appointmentGreeting,
        privacyPolicyUrl: privacyPolicyUrl || existingConfig.privacyPolicyUrl,
        companyOwnerEmail: companyOwnerEmail || existingConfig.companyOwnerEmail,
        companyPhone: companyPhone || existingConfig.companyPhone,
        companyWebsite: companyWebsite || existingConfig.companyWebsite,
        webhookUrl: webhookUrl || existingConfig.webhookUrl,
        gmailBrochureUrl: gmailBrochureUrl || existingConfig.gmailBrochureUrl,
        gmailCallbackUrl: gmailCallbackUrl || existingConfig.gmailCallbackUrl,
        themeColor: themeColor || existingConfig.themeColor,
        position: position || existingConfig.position,
        sideSpacing: sideSpacing !== undefined ? sideSpacing : existingConfig.sideSpacing,
        bottomSpacing: bottomSpacing !== undefined ? bottomSpacing : existingConfig.bottomSpacing,
        showDesktop: showDesktop !== undefined ? showDesktop : existingConfig.showDesktop,
        showMobile: showMobile !== undefined ? showMobile : existingConfig.showMobile,
        googleCalendarConnected: googleCalendarConnected !== undefined ? googleCalendarConnected : existingConfig.googleCalendarConnected,
        calendarStatus: calendarStatus || existingConfig.calendarStatus,
        appointmentFlow: appointmentFlow || existingConfig.appointmentFlow,
        treatmentFlow: treatmentFlow || existingConfig.treatmentFlow,
        callbackFlow: callbackFlow || existingConfig.callbackFlow,
        environment: environment || existingConfig.environment
      });
      chatbotConfig = existingConfig;
    } else {
      // Create new configuration
      chatbotConfig = await ChatbotConfig.create({
        botId: botId || require('crypto').randomUUID(),
        userId: userId || loggedUser.id,
        organizationId: organizationId || loggedUser.orgId,
        name: name,
        companyName: companyName || "",
        avatar: avatar || null,
        openingMessages: openingMessages || [],
        appointmentGreeting: appointmentGreeting || "",
        privacyPolicyUrl: privacyPolicyUrl || "",
        companyOwnerEmail: companyOwnerEmail || "",
        companyPhone: companyPhone || "",
        companyWebsite: companyWebsite || "",
        webhookUrl: webhookUrl || "",
        gmailBrochureUrl: gmailBrochureUrl || "",
        gmailCallbackUrl: gmailCallbackUrl || "",
        themeColor: themeColor || "#3B82F6",
        position: position || "right",
        sideSpacing: sideSpacing !== undefined ? sideSpacing : 25,
        bottomSpacing: bottomSpacing !== undefined ? bottomSpacing : 25,
        showDesktop: showDesktop !== undefined ? showDesktop : true,
        showMobile: showMobile !== undefined ? showMobile : true,
        googleCalendarConnected: googleCalendarConnected !== undefined ? googleCalendarConnected : false,
        calendarStatus: calendarStatus || null,
        appointmentFlow: appointmentFlow || null,
        treatmentFlow: treatmentFlow || null,
        callbackFlow: callbackFlow || null,
        environment: environment || 'development'
      });
    }

    return successOld(chatbotConfig);
  } catch (err) {
    console.log(err.message);
    return errorOld(500, err.message);
  }
};

export const getChatbotConfig = async (event) => {
  const loggedUser = event.context.user;
  
  try {
    const chatbotConfig = await ChatbotConfig.findOne({
      where: { organizationId: loggedUser.orgId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "photo"]
        }
      ]
    });

    if (!chatbotConfig) {
      return successOld(null);
    }

    return successOld(chatbotConfig);
  } catch (err) {
    console.log(err.message);
    return errorOld(500, err.message);
  }
};

// Public API: Create appointment via chatbot (no authentication required)
export const createAppointmentViaChatbot = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? parseJsonBody(body) : body;
    
    // Validate botId
    const botValidation = await validateBotId(payload.botId);
    if (!botValidation.valid) {
      return error(400, botValidation.error);
    }
    
    const organisationId = botValidation.organizationId;
    
    // Validate required fields
    const required = ['date', 'time', 'duration'];
    for (const k of required) {
      if (!payload?.[k]) {
        return error(400, `${k} is required`);
      }
    }
    
    // Auto-select dentist with lowest bookings for the given date
    let selectedDentistId = null;
    
    // Get all active dentists for the organization
    const users = await User.findAll({
      attributes: ['id', 'fullName', 'email', 'photo', 'roleId'],
      where: { status: 'Active' },
      include: [
        { model: Role, as: 'role', attributes: ['title'] },
        { model: UserOrganisation, as: 'userOrganisations', attributes: [], where: { organisationId: Number(organisationId) } },
      ],
    });
    
    // Filter to only dentists
    const dentists = users.filter(u => 
      u.roleId === 5 || (u.role?.title || '').toLowerCase().includes('dentist')
    );
    
    if (dentists.length === 0) {
      return error(404, 'No active dentists found for this organization');
    }
    
    // Get date range for counting appointments
    const dateRange = getUtcRangeForDate(payload.date);
    if (!dateRange) {
      return error(400, 'Invalid date format');
    }
    
    // Count appointments for each dentist on the given date
    const dentistCounts = await Promise.all(
      dentists.map(async (dentist) => {
        const count = await DiaryAppointment.count({
          where: {
            organisationId: Number(organisationId),
            dentistId: dentist.id,
            startTime: { [Op.between]: [dateRange.start, dateRange.end] },
            status: { [Op.ne]: 'Cancelled' }
          }
        });
        return { dentist, count };
      })
    );
    
    // Select dentist with lowest appointment count
    dentistCounts.sort((a, b) => a.count - b.count);
    selectedDentistId = dentistCounts[0].dentist.id;
    
    console.log('[Chatbot API] Auto-selected dentist:', {
      dentistId: selectedDentistId,
      dentistName: dentistCounts[0].dentist.fullName,
      appointmentCount: dentistCounts[0].count,
      date: payload.date
    });
    
    // Handle patient creation if patientName is provided but patientId is not
    let patientId = payload.patientId || null;
    if (!patientId && payload.patientName) {
      const [firstName, ...rest] = String(payload.patientName).split(' ');
      const lastName = rest.join(' ') || '-';
      console.log('[Chatbot API] Creating patient from patientName:', {
        patientName: payload.patientName,
        firstName,
        lastName,
        organisationId: Number(organisationId)
      });
      const patient = await DiaryPatient.create({ 
        organisationId: Number(organisationId), 
        firstName, 
        lastName 
      });
      console.log('[Chatbot API] Patient created:', {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName
      });
      patientId = patient.id;
    }
    
    // If patientId is provided but patient doesn't exist, return error
    if (patientId) {
      const existingPatient = await DiaryPatient.findOne({
        where: { id: patientId, organisationId: Number(organisationId) }
      });
      if (!existingPatient) {
        return error(404, 'Patient not found');
      }
    }
    
    // Normalize incoming date & time (local) and compute end
    const start = parseLocalDateTime(payload.date, payload.time);
    if (!start || isNaN(start.getTime())) {
      return error(400, 'Invalid date/time');
    }
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + Number(payload.duration || 10));
    
    // Working hours validation (09:00–17:00 local)
      const workStart = new Date(start);
      setClinicHours(workStart, 9, 0, 0, 0);
      const workEnd = new Date(start);
      setClinicHours(workEnd, 17, 0, 0, 0);
    if (start < workStart) {
      return error(400, 'Appointment must start at or after 09:00');
    }
    if (end > workEnd) {
      return error(400, 'Appointment must end by 17:00');
    }
    
    // Overlap validation for dentist and patient
    const overlapWindow = {
      [Op.and]: [
        { startTime: { [Op.lt]: end } },
        { endTime: { [Op.gt]: start } }
      ]
    };
    const orgClause = { organisationId: Number(organisationId) };
    const notCancelled = { status: { [Op.ne]: 'Cancelled' } };
    
    const dentistOverlap = await DiaryAppointment.count({
      where: {
        ...orgClause,
        ...overlapWindow,
        ...notCancelled,
        dentistId: Number(selectedDentistId)
      }
    });
    if (dentistOverlap > 0) {
      return error(409, 'Dentist already has an appointment at this time');
    }
    
    if (patientId) {
      const patientOverlap = await DiaryAppointment.count({
        where: {
          ...orgClause,
          ...overlapWindow,
          ...notCancelled,
          patientId: Number(patientId)
        }
      });
      if (patientOverlap > 0) {
        return error(409, 'Patient already has an appointment at this time');
      }
    }
    
    // Handle treatment and amount
    let amount = 0;
    let treatmentId = null;
    let treatmentName = payload.treatmentName || null;
    const incomingOrgTreatmentId = payload.treatmentId ? Number(payload.treatmentId) : null;
    
    if (incomingOrgTreatmentId) {
      const treatment = await OrganisationTreatment.findOne({
        where: {
          id: incomingOrgTreatmentId,
          organisationId: Number(organisationId)
        }
      });
      if (treatment) {
        amount = Number(treatment.price ?? 0);
        if (!treatmentName) {
          treatmentName = treatment.name;
        }
      }
    }
    
    // If amount provided explicitly, prefer it
    if (payload.amount !== undefined && payload.amount !== null && 
        String(payload.amount).trim() !== '' && !isNaN(Number(payload.amount))) {
      amount = Number(payload.amount);
    }
    
    // Create appointment
    console.log('[Chatbot API] Creating appointment with data:', {
      organisationId: Number(organisationId),
      patientId,
      dentistId: Number(selectedDentistId),
      treatmentId: treatmentId,
      treatmentName,
      status: payload.status || 'Pending',
      startTime: start,
      endTime: end,
      notes: payload.notes || null,
      amount: amount || 0,
    });
    
    const created = await DiaryAppointment.create({
      organisationId: Number(organisationId),
      patientId,
      dentistId: Number(selectedDentistId),
      treatmentId: treatmentId,
      treatmentName,
      status: payload.status || 'Pending',
      startTime: start,
      endTime: end,
      notes: payload.notes || null,
      amount: amount || 0,
    });
    
    console.log('[Chatbot API] Appointment created successfully:', {
      id: created.id,
      organisationId: created.organisationId,
      dentistId: created.dentistId,
      patientId: created.patientId,
    });
    
    // Verify the appointment was actually saved
    const verifyAppointment = await DiaryAppointment.findByPk(created.id);
    if (!verifyAppointment) {
      console.error('[Chatbot API] ERROR: Appointment was created but cannot be found in database!');
      return error(500, 'Appointment creation failed - record not found after creation');
    }
    
    return success({
      id: created.id,
      organisationId: created.organisationId,
      patientId: created.patientId,
      dentistId: created.dentistId,
      treatmentId: created.treatmentId,
      treatmentName: created.treatmentName,
      status: created.status,
      startTime: created.startTime,
      endTime: created.endTime,
      notes: created.notes,
      amount: created.amount,
    });
  } catch (e) {
    // If it's already an error response, re-throw it
    if (e.statusCode) {
      throw e;
    }
    console.error('[Chatbot API] Error creating appointment:', e);
    console.error('[Chatbot API] Error details:', {
      message: e?.message,
      data: e?.data,
      original: e?.original,
      stack: e?.stack,
    });
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error';
    return error(500, msg);
  }
};

// Public API: Create lead via chatbot (no authentication required)
export const createLeadViaChatbot = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? parseJsonBody(body) : body;
    
    // Validate botId
    const botValidation = await validateBotId(payload.botId);
    if (!botValidation.valid) {
      return error(400, botValidation.error);
    }
    
    const organisationId = botValidation.organizationId;
    
    // Validate required fields
    const required = ['name', 'email', 'telephone'];
    for (const k of required) {
      if (!payload?.[k]) {
        return error(400, `${k} is required`);
      }
    }
    
    console.log('[Chatbot API] Creating lead with data:', {
      organisationId: Number(organisationId),
      name: payload.name,
      email: payload.email,
      telephone: payload.telephone,
    });
    
    // Prepare lead data
    const data = {
      organisationId: Number(organisationId),
      alert: payload.alert || null,
      name: payload.name,
      email: payload.email,
      telephone: payload.telephone,
      inquiryDate: payload.inquiryDate ? new Date(payload.inquiryDate) : new Date(),
      dob: payload.dob ? new Date(payload.dob) : null,
      occupation: payload.occupation || null,
      location: payload.location || null,
      leadSource: payload.leadSource?.name || payload.leadSource || 'Chatbot',
      leadStatus: payload.leadStatus || 'New',
      treatment: payload.treatment?.name || payload.treatment || null,
      followUpDate: payload.followUpDate ? new Date(payload.followUpDate) : null,
      comments: payload.comments || null,
      rawData: payload.rawData || null,
    };
    
    const created = await CrmLead.create(data);
    
    console.log('[Chatbot API] Lead created successfully:', {
      id: created.id,
      organisationId: created.organisationId,
      name: created.name,
      email: created.email,
    });
    
    // Send notification to org users about new chatbot lead
    try {
      console.log('[Chatbot API] Processing lead notification:', { leadId: created.id, orgId: organisationId })
      const orgUsers = await UserOrganisation.findAll({
        where: {
          organisationId: Number(organisationId),
          status: 'Active',
        },
        attributes: ['userId'],
      })
      const userIds = [...new Set(orgUsers.map((u) => u.userId).filter(Boolean))]
      console.log('[Chatbot API] Found org users for notification:', { userIdsCount: userIds.length, userIds })
      if (userIds.length) {
        await sendNotificationToMultipleUsers({
          userIds,
          title: 'New Chatbot Lead',
          body: created.name || created.email || 'A new lead was received from chatbot',
          type: 'lead_created',
          referenceType: 'lead',
          referenceId: created.id,
          data: {
            leadId: String(created.id),
            leadName: created.name || created.email,
            leadSource: 'Chatbot',
            url: `/crm/leads?leadId=${created.id}`,
          },
          priority: 'high',
        })
        console.log('[Chatbot API] Lead notification sent successfully')
      } else {
        console.log('[Chatbot API] No org users found for notification')
      }
    } catch (notifyErr) {
      console.error('[Chatbot API] Lead notification failed:', notifyErr?.message, notifyErr?.stack)
    }
    
    // Shape treatment in response
    created.setDataValue('treatment', { id: null, name: created.treatment || '' });
    
   
    
    // Handle contact method if provided
    if (payload.contactMethod && CONTACT_METHODS.includes(payload.contactMethod)) {
      await CrmLeadCommunication.create({
        organisationId: Number(organisationId),
        leadId: created.id,
        preferredContactMethod: payload.contactMethod
      });
      created.setDataValue('preferredContact', payload.contactMethod);
    }
    
    return success(created);
  } catch (e) {
    // If it's already an error response, re-throw it
    if (e.statusCode) {
      throw e;
    }
    console.error('[Chatbot API] Error creating lead:', e);
    console.error('[Chatbot API] Error details:', {
      message: e?.message,
      data: e?.data,
      original: e?.original,
      stack: e?.stack,
    });
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error';
    return error(500, msg);
  }
};
