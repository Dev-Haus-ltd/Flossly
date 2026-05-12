import {
  Organisation,
  OrganisationSmtp,
} from "../models";
import nodemailer from "nodemailer";
import { success, error } from "../utils/response";
import { readBody } from "h3";

export const getSmtpSettings = async (event) => {
  try {
    const loggedUser = event.context.user;
    const orgId = loggedUser.orgId;

    const smtpConfig = await OrganisationSmtp.findOne({
      where: { organisationId: orgId, status: "Active" },
      attributes: ["id", "host", "port", "secure", "username", "fromEmail", "fromName", "status"],
    });

    return {
      code: 0,
      data: smtpConfig || null,
    };
  } catch (err) {
    console.error("Error fetching SMTP settings:", err);
    return { code: 1, error: "Failed to fetch SMTP settings" };
  }
};

export const saveSmtpSettings = async (event) => {
  try {
    const loggedUser = event.context.user;
    const orgId = loggedUser.orgId;
    const body = await readBody(event);

    const { host, port, secure, username, password, fromEmail, fromName } = body;

    if (!host || !port || !username || !password) {
      return { code: 1, error: "Host, port, username, and password are required" };
    }

    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return { code: 1, error: "Invalid port number" };
    }

    const existingConfig = await OrganisationSmtp.findOne({
      where: { organisationId: orgId },
    });

    if (existingConfig) {
      existingConfig.host = host;
      existingConfig.port = parsedPort;
      existingConfig.secure = secure || false;
      existingConfig.username = username;
      existingConfig.password = password;
      existingConfig.fromEmail = fromEmail || username;
      existingConfig.fromName = fromName || null;
      existingConfig.status = "Active";
      await existingConfig.save();

      return {
        code: 0,
        data: { id: existingConfig.id, message: "SMTP settings updated successfully" },
      };
    } else {
      const newConfig = await OrganisationSmtp.create({
        organisationId: orgId,
        host,
        port: parsedPort,
        secure: secure || false,
        username,
        password,
        fromEmail: fromEmail || username,
        fromName: fromName || null,
        status: "Active",
      });

      return {
        code: 0,
        data: { id: newConfig.id, message: "SMTP settings saved successfully" },
      };
    }
  } catch (err) {
    console.error("Error saving SMTP settings:", err);
    return { code: 1, error: "Failed to save SMTP settings" };
  }
};

export const testSmtpConnection = async (event) => {
  try {
    const body = await readBody(event);
    const { host, port, secure, username, password } = body;

    if (!host || !port || !username || !password) {
      return { code: 1, error: "Host, port, username, and password are required" };
    }

    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      return { code: 1, error: "Invalid port number" };
    }

    const transporter = nodemailer.createTransport({
      host,
      port: parsedPort,
      secure: secure || false,
      auth: {
        user: username,
        pass: password,
      },
    });

    await transporter.verify();

    return {
      code: 0,
      data: { message: "SMTP connection successful" },
    };
  } catch (err) {
    console.error("Error testing SMTP connection:", err);
    return { code: 1, error: `SMTP connection failed: ${err.message}` };
  }
};

export const deleteSmtpSettings = async (event) => {
  try {
    const loggedUser = event.context.user;
    const orgId = loggedUser.orgId;

    const smtpConfig = await OrganisationSmtp.findOne({
      where: { organisationId: orgId },
    });

    if (!smtpConfig) {
      return { code: 1, error: "No SMTP configuration found" };
    }

    await smtpConfig.destroy();

    return {
      code: 0,
      data: { message: "SMTP configuration deleted successfully" },
    };
  } catch (err) {
    console.error("Error deleting SMTP settings:", err);
    return { code: 1, error: "Failed to delete SMTP settings" };
  }
};
