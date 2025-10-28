import {
  saveChatbotConfig,
  getChatbotConfig,
} from "~/server/controllers/chatbot";

export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, "name");
  
  switch (path) {
    case "save":
      return await saveChatbotConfig(event);
    case "get":
      return await getChatbotConfig(event);
    default:
      return { code: 0, error: "Not found" };
  }
});
