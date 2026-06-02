import nodemailer from "nodemailer";
import { OrganisationSmtp, Organisation, User, UserOrganisation } from "../models";

const transporterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

let defaultTransporterCache = { cacheKey: null, transporter: null };

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "on"].includes(normalized)) return true;
    if (["false", "0", "no", "off"].includes(normalized)) return false;
  }
  return fallback;
}

function getDefaultMailConfig() {
  const config = useRuntimeConfig?.() || {};

  return {
    host: config.MAIL_HOST || "smtp.gmail.com",
    port: Number(config.MAIL_PORT || 587),
    secure: parseBoolean(config.MAIL_SECURE, false),
    user: config.MAIL_USER || "",
    pass: config.MAIL_PASS || "",
    fromEmail: config.MAIL_FROM_EMAIL || config.MAIL_USER || "helloflossly@gmail.com",
    fromName: config.MAIL_FROM_NAME || "Flossly",
  };
}

function getDefaultTransporter() {
  const mailConfig = getDefaultMailConfig();
  const cacheKey = JSON.stringify({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    user: mailConfig.user,
    pass: mailConfig.pass,
  });

  if (defaultTransporterCache.cacheKey === cacheKey && defaultTransporterCache.transporter) {
    return defaultTransporterCache.transporter;
  }

  const transportOptions = {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
  };

  if (mailConfig.user && mailConfig.pass) {
    transportOptions.auth = {
      user: mailConfig.user,
      pass: mailConfig.pass,
    };
  }

  const transporter = nodemailer.createTransport(transportOptions);
  defaultTransporterCache = { cacheKey, transporter };

  return transporter;
}

async function getOrgTransporter(orgId) {
  if (!orgId) return getDefaultTransporter();

  const cached = transporterCache.get(orgId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.transporter;
  }

  const smtpConfig = await OrganisationSmtp.findOne({
    where: { organisationId: orgId, status: "Active" },
  });

  if (!smtpConfig) {
    return getDefaultTransporter();
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure || false,
      auth: {
        user: smtpConfig.username,
        pass: smtpConfig.password,
      },
    });

    await transporter.verify();

    transporterCache.set(orgId, {
      transporter,
      timestamp: Date.now(),
      fromEmail: smtpConfig.fromEmail || smtpConfig.username,
      fromName: smtpConfig.fromName || null,
    });

    return transporter;
  } catch (err) {
    console.error(`Org ${orgId} SMTP verification failed, using default:`, err.message);
    return getDefaultTransporter();
  }
}

function getFromAddress(orgId) {
  const cached = transporterCache.get(orgId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const name = cached.fromName;
    const email = cached.fromEmail;
    return name ? `${name} <${email}>` : email;
  }
  const { fromEmail, fromName } = getDefaultMailConfig();
  return fromName ? `${fromName} <${fromEmail}>` : fromEmail;
}

function isCustomSmtp(orgId) {
  const cached = transporterCache.get(orgId);
  return !!(cached && Date.now() - cached.timestamp < CACHE_TTL);
}

async function getReplyToAddress(orgId) {
  const { fromEmail } = getDefaultMailConfig();

  if (!orgId) {
    return fromEmail;
  }

  const org = await Organisation.findByPk(orgId, { attributes: ['id', 'replyToEmail'] });
  if (org?.replyToEmail) {
    return org.replyToEmail;
  }

  const owner = await User.findOne({
    include: [{ model: UserOrganisation, as: 'userOrganisations',
      where: { organisationId: orgId, status: 'Active' } }],
    order: [['id', 'ASC']],
    attributes: ['email'],
  });

  return owner?.email || fromEmail;
}

export async function getOrgEmailIdentity(orgId) {
  const replyTo = await getReplyToAddress(orgId);

  if (isCustomSmtp(orgId)) {
    return { from: getFromAddress(orgId), replyTo };
  }

  const org = await Organisation.findByPk(orgId, { attributes: ['id', 'name'] });

  const practiceName = org?.name || 'Your Practice';
  const { fromEmail } = getDefaultMailConfig();
  return {
    from: `"${practiceName}" <${fromEmail}>`,
    replyTo,
  };
}

const defaultTransporter = {
  sendMail: (...args) => getDefaultTransporter().sendMail(...args),
  verify: (...args) => getDefaultTransporter().verify(...args),
};

export { getOrgTransporter, getFromAddress, isCustomSmtp, defaultTransporter };
