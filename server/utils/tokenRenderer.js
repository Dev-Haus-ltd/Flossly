// Shared token rendering for automation and bulk emails
// Supports both bracket and mustache-style tokens for compatibility.

export function buildLeadContext({ lead = {}, userName = 'Team' } = {}) {
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
  return { name, firstName, email, yourName, info };
}

export function renderTokens(input, ctx = {}) {
  const str = input || '';
  return str
    .replaceAll('{{name}}', ctx.name || '')
    .replaceAll('{{firstName}}', ctx.firstName || '')
    .replaceAll('{{email}}', ctx.email || '')
    .replaceAll('{{yourName}}', ctx.yourName || '')
    .replaceAll('{{info}}', ctx.info || '')
    .replaceAll('[Patient Name]', ctx.name || '')
    .replaceAll('[First Name]', ctx.firstName || '')
    .replaceAll('[Email]', ctx.email || '')
    .replaceAll('[Your Name]', ctx.yourName || '')
    .replaceAll('[Patient Info]', ctx.info || '');
}

