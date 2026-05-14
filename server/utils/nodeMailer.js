import nodemailer from "nodemailer";
import { OrganisationSmtp, Organisation, User, UserOrganisation } from "../models";

const transporterCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const defaultTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "helloflossly@gmail.com",
    pass: "qlas kuac dshz bszg",
  },
});

async function getOrgTransporter(orgId) {
  if (!orgId) return defaultTransporter;

  const cached = transporterCache.get(orgId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.transporter;
  }

  const smtpConfig = await OrganisationSmtp.findOne({
    where: { organisationId: orgId, status: "Active" },
  });

  if (!smtpConfig) {
    return defaultTransporter;
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
    return defaultTransporter;
  }
}

function getFromAddress(orgId) {
  const cached = transporterCache.get(orgId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    const name = cached.fromName;
    const email = cached.fromEmail;
    return name ? `${name} <${email}>` : email;
  }
  return "Flossly <helloflossly@gmail.com>";
}

function isCustomSmtp(orgId) {
  const cached = transporterCache.get(orgId);
  return !!(cached && Date.now() - cached.timestamp < CACHE_TTL);
}

export async function getOrgEmailIdentity(orgId) {
  if (isCustomSmtp(orgId)) {
    return { from: getFromAddress(orgId), replyTo: undefined };
  }

  const org = await Organisation.findByPk(orgId, { attributes: ['id', 'name'] });
  const owner = await User.findOne({
    include: [{ model: UserOrganisation, as: 'userOrganisations',
      where: { organisationId: orgId, status: 'Active' } }],
    order: [['id', 'ASC']],
    attributes: ['email'],
  });

  const practiceName = org?.name || 'Your Practice';
  return {
    from: `"${practiceName}" <helloflossly@gmail.com>`,
    replyTo: owner?.email || undefined,
  };
}

export { getOrgTransporter, getFromAddress, isCustomSmtp, defaultTransporter };
