// Shared token rendering for automation and bulk emails
// Supports both bracket and mustache-style tokens for compatibility.

export function buildLeadContext({ lead = {}, org = {}, userName = 'Team' } = {}) {
  const formatDayMonth = (date) => {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
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
    const motheringSunday = new Date(Date.UTC(
      easter.getUTCFullYear(),
      easter.getUTCMonth(),
      easter.getUTCDate() - 21
    ));
    return formatDayMonth(motheringSunday);
  };
  const name = lead?.name || lead?.fullName || lead?.email || 'there';
  const firstName = (name || '').split(' ')[0] || 'there';
  const email = lead?.email || '';
  const yourName = userName || 'Team';
  const infoParts = [];
  if (lead?.email) infoParts.push(lead.email);
  if (lead?.telephone) infoParts.push(lead.telephone);
  const treatment = typeof lead?.treatment === 'object' ? (lead?.treatment?.name || '') : (lead?.treatment || '');
  if (treatment) infoParts.push(treatment);
  if (lead?.location) infoParts.push(lead.location);
  const info = infoParts.join(' • ');

  const placeholders = org?.automationPlaceholders || {};
  const practiceName = org?.name || '';
  const phone =
    org?.phone ||
    org?.phoneNumber ||
    org?.telephone ||
    org?.contactPhone ||
    org?.contact ||
    org?.contactNumber ||
    '';
  const website =
    placeholders?.website ||
    placeholders?.practiceWebsite ||
    org?.website ||
    org?.site ||
    org?.web ||
    '';
  const orgEmail = org?.email || org?.contactEmail || '';
  const address = org?.address || org?.location || '';
  const street = org?.streetAddress || org?.addressLine1 || '';
  const cityStateZip = org?.cityStateZip || org?.city || '';
  const officeHours = org?.officeHours || org?.hours || '';
  const coordinator =
    org?.treatmentCoordinator ||
    org?.coordinatorName ||
    org?.ownerName ||
    '';
  const principalDentist =
    placeholders?.principalDentistName ||
    org?.ownerName ||
    org?.principalDentist ||
    '';
  const location = org?.city || org?.location || '';

  const resolvePlaceholder = (key) => {
    const raw = placeholders?.[key];
    return raw === undefined || raw === null ? '' : String(raw);
  };

  const mothersDayDate = resolvePlaceholder('mothersDayDate') || ukMothersDayDate();

  const monthNameFromDob = (() => {
    const raw = lead?.dob || lead?.dateOfBirth || lead?.birthDate;
    if (!raw) return '';
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return '';
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return months[date.getUTCMonth()] || '';
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
    bookingLink: resolvePlaceholder('bookingLink'),
    diaryBookingLink: resolvePlaceholder('diaryBookingLink'),
    promoX: resolvePlaceholder('promoX'),
    promoY: resolvePlaceholder('promoY'),
    promoZ: resolvePlaceholder('promoZ'),
    promoHigherAmount: resolvePlaceholder('promoHigherAmount'),
    promoDate: resolvePlaceholder('promoDate'),
    promoTime: resolvePlaceholder('promoTime'),
    promoDateTime: resolvePlaceholder('promoDateTime'),
    promoMonth: resolvePlaceholder('promoMonth') || monthNameFromDob,
    promoDayTime: resolvePlaceholder('promoDayTime'),
    promoDaysTimes: resolvePlaceholder('promoDaysTimes'),
    futureDate: resolvePlaceholder('futureDate'),
    dateRange: resolvePlaceholder('dateRange'),
    specificDate: resolvePlaceholder('specificDate'),
    mothersDayDate,
    parkingDetails: resolvePlaceholder('parkingDetails'),
    publicTransportDetails: resolvePlaceholder('publicTransportDetails'),
    localCharity: resolvePlaceholder('localCharity'),
    localBusiness1: resolvePlaceholder('localBusiness1'),
    localBusiness2: resolvePlaceholder('localBusiness2'),
    localBusiness3: resolvePlaceholder('localBusiness3'),
  };
}

export function renderTokens(input, ctx = {}, options = {}) {
  let str = input || '';
  const format = options?.format || 'text';
  const websiteUrl = ctx.website || 'https://flossly.ai/';
  const websiteLabel = ctx.website ? ctx.website : 'Flossly';
  const websiteReplacement =
    format === 'html'
      ? `<a href="${websiteUrl}" target="_blank" rel="noopener">${websiteLabel}</a>`
      : `${websiteLabel} (${websiteUrl})`;
  const replaceIfValue = (token, value) => {
    if (value === undefined || value === null || value === '') return;
    str = str.replaceAll(token, value);
  };

  str = str
    .replaceAll('{{name}}', ctx.name || '')
    .replaceAll('{{firstName}}', ctx.firstName || '')
    .replaceAll('{{email}}', ctx.email || '')
    .replaceAll('{{yourName}}', ctx.yourName || '')
    .replaceAll('{{info}}', ctx.info || '')
    .replaceAll('[Patient Name]', ctx.name || '')
    .replaceAll('[Name]', ctx.name || '')
    .replaceAll('[First Name]', ctx.firstName || '')
    .replaceAll('[Email]', ctx.email || '')
    .replaceAll('[Your Name]', ctx.yourName || '')
    .replaceAll('[Patient Info]', ctx.info || '')
    .replaceAll('[Practice Name]', ctx.practiceName || '')
    .replaceAll('[Phone Number]', ctx.phone || '')
    .replaceAll('[Website]', websiteReplacement)
    .replaceAll('[Email]', ctx.orgEmail || ctx.email || '')
    .replaceAll('[Address]', ctx.address || '')
    .replaceAll('[Street Address]', ctx.street || '')
    .replaceAll('[City, State ZIP Code]', ctx.cityStateZip || '')
    .replaceAll('[Days and Times]', ctx.officeHours || '')
    
    .replaceAll('[Treatment Coordinator Name]', ctx.coordinator || '')
    .replaceAll('[Practice Owner/Principal Dentist]', ctx.principalDentist || '')
    .replaceAll('[Location]', ctx.location || '')
    .replaceAll('[Booking Link]', ctx.bookingLink || '')
    .replaceAll('[Diary Booking Link]', ctx.diaryBookingLink || '')
    .replaceAll('[on-site/nearby/street parking details]', ctx.parkingDetails || '')
    .replaceAll('[public transportation details if applicable]', ctx.publicTransportDetails || '')
    .replaceAll('[Local Charity]', ctx.localCharity || '')
    .replaceAll('[Local Business 1]', ctx.localBusiness1 || '')
    .replaceAll('[Local Business 2]', ctx.localBusiness2 || '')
    .replaceAll('[Local Business 3]', ctx.localBusiness3 || '');

  replaceIfValue('[Days/Times]', ctx.promoDaysTimes);
  replaceIfValue('[Day/Time]', ctx.promoDayTime);
  replaceIfValue('[Date]', ctx.promoDate);
  replaceIfValue('[Time]', ctx.promoTime);
  replaceIfValue('[Date/Time]', ctx.promoDateTime);
  replaceIfValue('[Month]', ctx.promoMonth);
  replaceIfValue('[Future Date]', ctx.futureDate);
  replaceIfValue('[future date]', ctx.futureDate);
  replaceIfValue('[Date Range]', ctx.dateRange);
  replaceIfValue('[Date range]', ctx.dateRange);
  replaceIfValue('[Specific Date]', ctx.specificDate);
  replaceIfValue("[Mother's Day date]", ctx.mothersDayDate);
  replaceIfValue('[X]', ctx.promoX);
  replaceIfValue('[Y]', ctx.promoY);
  replaceIfValue('[Z]', ctx.promoZ);
  replaceIfValue('[higher amount]', ctx.promoHigherAmount);
  replaceIfValue('[Higher amount]', ctx.promoHigherAmount);

  return str;
}
