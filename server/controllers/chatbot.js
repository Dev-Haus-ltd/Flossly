import { ChatbotConfig, User, DiaryPatient, DiaryAppointment, OrganisationTreatment, CrmLead, CrmLeadAssignee, CrmLeadCommunication } from "../models";
import { CONTACT_METHODS } from "../models/crm/leadCommunications";
import { readBody } from "h3";
import { createError } from "h3";
import { Op } from "sequelize";
import { success, error } from "../utils/response";

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
const pad2 = (n) => String(n).padStart(2, '0');
const parseLocalDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const t = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  return new Date(`${dateStr}T${t}`);
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
      callbackFlow
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
        callbackFlow: callbackFlow || existingConfig.callbackFlow
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
        callbackFlow: callbackFlow || null
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

// Public API: Create patient via chatbot (no authentication required)
export const createPatientViaChatbot = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Validate botId
    const botValidation = await validateBotId(payload.botId);
    if (!botValidation.valid) {
      return error(400, botValidation.error);
    }
    
    const organisationId = botValidation.organizationId;
    
    // Validate required fields
    const required = ['firstName', 'lastName'];
    for (const k of required) {
      if (!payload?.[k]) {
        return error(400, `${k} is required`);
      }
    }
    
    // Create patient
    const data = {
      organisationId: Number(organisationId),
      title: payload.title || null,
      sex: payload.sex || null,
      firstName: payload.firstName,
      lastName: payload.lastName,
      address1: payload.address1 || null,
      postcode: payload.postcode || null,
      dob: payload.dob || null,
      mobile: payload.mobile || null,
      email: payload.email || null,
      marketingConsent: payload.marketingConsent || null,
      receiveSms: payload.receiveSms === true || payload.receiveSms === 'Yes',
      receiveEmail: payload.receiveEmail === true || payload.receiveEmail === 'Yes',
      paymentPlan: payload.paymentPlan || null,
      defaultDentistId: payload.dentistId || null,
      recallMethod: payload.recallMethod || null,
      recallInterval: payload.recallInterval || null,
    };
    
    const created = await DiaryPatient.create(data);
    return success(created);
  } catch (e) {
    // If it's already an error response, re-throw it
    if (e.statusCode) {
      throw e;
    }
    const msg = e?.message || e?.data?.message || e?.original?.detail || 'Internal server error';
    return error(500, msg);
  }
};

// Public API: Create appointment via chatbot (no authentication required)
export const createAppointmentViaChatbot = async (event) => {
  try {
    const body = await readBody(event);
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    
    // Validate botId
    const botValidation = await validateBotId(payload.botId);
    if (!botValidation.valid) {
      return error(400, botValidation.error);
    }
    
    const organisationId = botValidation.organizationId;
    
    // Validate required fields
    const required = ['dentistId', 'date', 'time', 'duration'];
    for (const k of required) {
      if (!payload?.[k]) {
        return error(400, `${k} is required`);
      }
    }
    
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
    workStart.setHours(9, 0, 0, 0);
    const workEnd = new Date(start);
    workEnd.setHours(17, 0, 0, 0);
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
        dentistId: Number(payload.dentistId)
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
        amount = Number(treatment.amount || 0);
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
      dentistId: Number(payload.dentistId),
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
      dentistId: Number(payload.dentistId),
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
    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    
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
    
    // Shape treatment in response
    created.setDataValue('treatment', { id: null, name: created.treatment || '' });
    
    // Handle assignees if provided
    const assignedUsers = Array.isArray(payload.assigned) ? payload.assigned : [];
    if (assignedUsers.length) {
      const rows = assignedUsers
        .map((u) => (u && u.id ? { organisationId: Number(organisationId), leadId: created.id, userId: Number(u.id) } : null))
        .filter(Boolean);
      if (rows.length) {
        await CrmLeadAssignee.bulkCreate(rows, { ignoreDuplicates: true });
        // Shape response
        const users = await User.findAll({ 
          where: { id: rows.map((r) => r.userId) }, 
          attributes: ['id', 'fullName', 'email'] 
        });
        created.setDataValue('assigned', users.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email })));
      }
    } else {
      created.setDataValue('assigned', []);
    }
    
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
