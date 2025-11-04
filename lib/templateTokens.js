export function buildRecipientContext({ lead = null, user = null, many = false } = {}) {
  // many=true means multiple selection; use generic values
  const name = many ? 'User' : (lead?.name || lead?.fullName || lead?.email || 'User');
  const firstName = many ? 'User' : ((name || '').split(' ')[0] || 'User');
  const email = many ? '' : (lead?.email || '');
  const yourName = user?.fullName || user?.name || 'Team';
  const infoParts = [];
  // Gather compact info string from common fields
  if (!many) {
    if (lead?.email) infoParts.push(lead.email);
    if (lead?.telephone) infoParts.push(lead.telephone);
    const treatment = typeof lead?.treatment === 'object' ? (lead?.treatment?.name || '') : (lead?.treatment || '');
    if (treatment) infoParts.push(treatment);
    if (lead?.location) infoParts.push(lead.location);
  }
  const info = infoParts.join(' • ');
  return { name, firstName, email, yourName, info };
}

export function renderWithContext(input, ctx = {}) {
  const str = input || '';
  // Support both bracket and mustache tokens used across the app
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

