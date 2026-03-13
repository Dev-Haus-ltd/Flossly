import { applyCrmPlaceholders } from "~/lib/crm/placeholders.js";
import { getLeadDisplayName, getLeadEmail, getLeadPhone } from "~/lib/normalizers/lead.js";

const formatDayMonth = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]}`;
};

const easterSundayUtc = (year) => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
};

const ukMothersDayDate = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const easter = easterSundayUtc(year);
  const motheringSunday = new Date(
    Date.UTC(easter.getUTCFullYear(), easter.getUTCMonth(), easter.getUTCDate() - 21)
  );
  return formatDayMonth(motheringSunday);
};

const valueOrEmpty = (value) => (value === undefined || value === null ? "" : String(value));

export function buildLeadContext({ lead = {}, org = {}, userName = "Team" } = {}) {
  const name = getLeadDisplayName(lead) || "there";
  const firstName = (name || "").split(" ")[0] || "there";
  const email = getLeadEmail(lead) || "";
  const yourName = userName || "Team";

  const infoParts = [];
  if (email) infoParts.push(email);
  const telephone = getLeadPhone(lead);
  if (telephone) infoParts.push(telephone);
  const treatment =
    typeof lead?.treatment === "object" ? lead?.treatment?.name || "" : lead?.treatment || "";
  if (treatment) infoParts.push(treatment);
  if (lead?.location) infoParts.push(String(lead.location));
  const info = infoParts.join(" | ");

  const placeholders = org?.automationPlaceholders || {};
  const practiceName = org?.name || "";
  const phone =
    org?.phone ||
    org?.phoneNumber ||
    org?.telephone ||
    org?.contactPhone ||
    org?.contact ||
    org?.contactNumber ||
    "";
  const website =
    valueOrEmpty(placeholders?.website) ||
    valueOrEmpty(placeholders?.practiceWebsite) ||
    valueOrEmpty(org?.website) ||
    valueOrEmpty(org?.site) ||
    valueOrEmpty(org?.web);
  const orgEmail = org?.email || org?.contactEmail || "";
  const address = org?.address || org?.location || "";
  const street = org?.streetAddress || org?.addressLine1 || "";
  const cityStateZip = org?.cityStateZip || org?.city || "";
  const officeHours = org?.officeHours || org?.hours || "";
  const coordinator = org?.treatmentCoordinator || org?.coordinatorName || org?.ownerName || "";
  const principalDentist = valueOrEmpty(placeholders?.principalDentistName) || org?.ownerName || org?.principalDentist || "";
  const location = org?.city || org?.location || "";
  const mothersDayDate = valueOrEmpty(placeholders?.mothersDayDate) || ukMothersDayDate();

  const monthNameFromDob = (() => {
    const raw = lead?.dob || lead?.dateOfBirth || lead?.birthDate;
    if (!raw) return "";
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString("en-GB", { month: "long" });
  })();

  return {
    name,
    firstName,
    email,
    yourName,
    info,
    practiceName,
    phone,
    website,
    orgEmail,
    address,
    street,
    cityStateZip,
    officeHours,
    coordinator,
    principalDentist,
    location,
    bookingLink: valueOrEmpty(placeholders?.bookingLink),
    diaryBookingLink: valueOrEmpty(placeholders?.diaryBookingLink),
    promoX: valueOrEmpty(placeholders?.promoX),
    promoY: valueOrEmpty(placeholders?.promoY),
    promoZ: valueOrEmpty(placeholders?.promoZ),
    promoHigherAmount: valueOrEmpty(placeholders?.promoHigherAmount),
    promoDate: valueOrEmpty(placeholders?.promoDate),
    promoTime: valueOrEmpty(placeholders?.promoTime),
    promoDateTime: valueOrEmpty(placeholders?.promoDateTime),
    promoMonth: valueOrEmpty(placeholders?.promoMonth) || monthNameFromDob,
    promoDayTime: valueOrEmpty(placeholders?.promoDayTime),
    promoDaysTimes: valueOrEmpty(placeholders?.promoDaysTimes),
    futureDate: valueOrEmpty(placeholders?.futureDate),
    dateRange: valueOrEmpty(placeholders?.dateRange),
    specificDate: valueOrEmpty(placeholders?.specificDate),
    mothersDayDate,
    parkingDetails: valueOrEmpty(placeholders?.parkingDetails),
    publicTransportDetails: valueOrEmpty(placeholders?.publicTransportDetails),
    localCharity: valueOrEmpty(placeholders?.localCharity),
    localBusiness1: valueOrEmpty(placeholders?.localBusiness1),
    localBusiness2: valueOrEmpty(placeholders?.localBusiness2),
    localBusiness3: valueOrEmpty(placeholders?.localBusiness3),
  };
}

export function renderTokens(input, ctx = {}, options = {}) {
  const format = String(options?.format || "text").toLowerCase();
  let output = String(input || "")
    .replaceAll("{{name}}", ctx.name || "")
    .replaceAll("{{firstName}}", ctx.firstName || "")
    .replaceAll("{{email}}", ctx.email || "")
    .replaceAll("{{yourName}}", ctx.yourName || "")
    .replaceAll("{{info}}", ctx.info || "");

  output = applyCrmPlaceholders(output, {
    recipient: {
      name: ctx.name || "",
      firstName: ctx.firstName || "",
      email: ctx.email || "",
      yourName: ctx.yourName || "",
    },
    practiceName: ctx.practiceName || "",
    org: {
      phone: ctx.phone || "",
      website: ctx.website || "",
      email: ctx.orgEmail || "",
      address: ctx.address || "",
      streetAddress: ctx.street || "",
      cityStateZip: ctx.cityStateZip || "",
      officeHours: ctx.officeHours || "",
      ownerName: ctx.principalDentist || "",
      location: ctx.location || "",
      city: ctx.location || "",
      automationPlaceholders: {
        principalDentistName: ctx.principalDentist || "",
        bookingLink: ctx.bookingLink || "",
        diaryBookingLink: ctx.diaryBookingLink || "",
        promoX: ctx.promoX || "",
        promoY: ctx.promoY || "",
        promoZ: ctx.promoZ || "",
        promoHigherAmount: ctx.promoHigherAmount || "",
        promoDate: ctx.promoDate || "",
        promoTime: ctx.promoTime || "",
        promoDateTime: ctx.promoDateTime || "",
        promoMonth: ctx.promoMonth || "",
        promoDayTime: ctx.promoDayTime || "",
        promoDaysTimes: ctx.promoDaysTimes || "",
        futureDate: ctx.futureDate || "",
        dateRange: ctx.dateRange || "",
        specificDate: ctx.specificDate || "",
        mothersDayDate: ctx.mothersDayDate || "",
        parkingDetails: ctx.parkingDetails || "",
        publicTransportDetails: ctx.publicTransportDetails || "",
        localCharity: ctx.localCharity || "",
        localBusiness1: ctx.localBusiness1 || "",
        localBusiness2: ctx.localBusiness2 || "",
        localBusiness3: ctx.localBusiness3 || "",
      },
    },
    format,
  });

  if (format === "text") {
    output = output
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>\s*/gi, "\n\n")
      .replace(/<\/li>\s*/gi, "\n")
      .replace(/<li>\s*/gi, "- ")
      .replace(/<[^>]*>/g, "")
      .trim();
  }

  return output;
}
