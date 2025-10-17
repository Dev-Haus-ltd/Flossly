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
      managerId, 
      messages, 
      prompt, 
      color, 
      avatar, 
      welcomeMessage,
      isActive 
    } = body;

    // Validate required fields
    if (!managerId) {
      throw createError({ message: "Manager ID is required" });
    }

    // Verify manager exists and belongs to the same organization
    const manager = await User.findOne({
      where: { 
        id: managerId,
        // Add organization validation if needed
      }
    });

    if (!manager) {
      throw createError({ message: "Manager not found" });
    }

    // Check if chatbot config already exists for this organization
    const existingConfig = await ChatbotConfig.findOne({
      where: { organisationId: loggedUser.orgId }
    });

    let chatbotConfig;

    if (existingConfig) {
      // Update existing configuration
      await existingConfig.update({
        managerId,
        messages: messages || existingConfig.messages,
        prompt: prompt || existingConfig.prompt,
        color: color || existingConfig.color,
        avatar: avatar || existingConfig.avatar,
        welcomeMessage: welcomeMessage || existingConfig.welcomeMessage,
        isActive: isActive !== undefined ? isActive : existingConfig.isActive
      });
      chatbotConfig = existingConfig;
    } else {
      // Create new configuration
      chatbotConfig = await ChatbotConfig.create({
        organisationId: loggedUser.orgId,
        managerId,
        messages: messages || [],
        prompt: prompt || "",
        color: color || "#007bff",
        avatar: avatar || "",
        welcomeMessage: welcomeMessage || "Hello! How can I help you today?",
        isActive: isActive !== undefined ? isActive : true
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
      where: { organisationId: loggedUser.orgId },
      include: [
        {
          model: User,
          as: "manager",
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
