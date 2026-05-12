import { readBody } from "h3";
import { success, error } from "../../utils/response";
import { Organisation } from "../../models";

export default defineEventHandler(async (event) => {
  const method = event.method;

  if (method === "GET") {
    try {
      const { orgId } = event.context.user || {};
      if (!orgId) return error(401, "Unauthenticated");

      const org = await Organisation.findOne({
        where: { id: orgId },
        attributes: ["autoReplyEnabled", "autoReplyConfig", "whatsappAutoReplyEnabled"],
      });

      return success({
        autoReplyEnabled: org?.autoReplyEnabled ?? false,
        autoReplyConfig: org?.autoReplyConfig ?? null,
        whatsappAutoReplyEnabled: org?.whatsappAutoReplyEnabled ?? false,
      });
    } catch (err) {
      return error(500, err.message || "Failed to load auto-reply settings");
    }
  }

  if (method === "PUT" || method === "POST") {
    try {
      const { orgId } = event.context.user || {};
      if (!orgId) return error(401, "Unauthenticated");

      const body = await readBody(event);
      const { autoReplyEnabled, autoReplyConfig, whatsappAutoReplyEnabled } = body || {};

      const org = await Organisation.findOne({ where: { id: orgId } });
      if (!org) return error(404, "Organisation not found");

      if (typeof autoReplyEnabled === "boolean") {
        if (autoReplyEnabled) {
          const cfg = autoReplyConfig !== undefined ? autoReplyConfig : org.autoReplyConfig;
          if (!cfg?.services?.trim() || !cfg?.cta?.trim()) {
            return error(400, "Auto-reply requires services and CTA to be configured");
          }
          org.autoReplyConfig = cfg;
        }
        org.autoReplyEnabled = autoReplyEnabled;
      }

      if (typeof whatsappAutoReplyEnabled === "boolean") {
        if (whatsappAutoReplyEnabled) {
          const cfg = autoReplyConfig !== undefined ? autoReplyConfig : org.autoReplyConfig;
          if (!cfg?.services?.trim() || !cfg?.cta?.trim()) {
            return error(400, "Auto-reply requires services and CTA to be configured");
          }
          org.autoReplyConfig = cfg;
        }
        org.whatsappAutoReplyEnabled = whatsappAutoReplyEnabled;
      }

      if (autoReplyConfig !== undefined) {
        org.autoReplyConfig = autoReplyConfig;
      }

      await org.save();

      return success({
        autoReplyEnabled: org.autoReplyEnabled,
        autoReplyConfig: org.autoReplyConfig,
        whatsappAutoReplyEnabled: org.whatsappAutoReplyEnabled,
      });
    } catch (err) {
      return error(500, err.message || "Failed to update auto-reply settings");
    }
  }

  return error(405, "Method not allowed");
});