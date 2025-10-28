import { ChatbotConfig, User } from "../models";
import { readBody } from "h3";
import { createError } from "h3";

const success = (data) => ({ code: 1, data });
const error = (statusCode, message) => ({ code: 0, error: message, statusCode });

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

    return success(chatbotConfig);
  } catch (err) {
    console.log(err.message);
    return error(500, err.message);
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
      return success(null);
    }

    return success(chatbotConfig);
  } catch (err) {
    console.log(err.message);
    return error(500, err.message);
  }
};
