export const CRM_FEATURE_ACCESS_DEFAULTS = Object.freeze({
  meta: true,
  whatsapp: true,
  chatbot: true,
});

export const useCrmFeatureAccess = () => {
  const { user } = useUser();

  const currentOrganisation = computed(() => {
    const currentOrgId = Number(user.value?.currentLoggedInOrgId || 0);
    const userOrgs = Array.isArray(user.value?.userOrganisations) ? user.value.userOrganisations : [];
    const match = userOrgs.find((entry) => Number(entry?.organisationId || entry?.organisation?.id || 0) === currentOrgId);
    return match?.organisation || null;
  });

  const crmFeatureAccess = computed(() => ({
    ...CRM_FEATURE_ACCESS_DEFAULTS,
    ...(user.value?.crmFeatureAccess && typeof user.value.crmFeatureAccess === 'object' ? user.value.crmFeatureAccess : {}),
    ...(currentOrganisation.value?.crmFeatureAccess && typeof currentOrganisation.value.crmFeatureAccess === 'object' ? currentOrganisation.value.crmFeatureAccess : {}),
    ...(currentOrganisation.value?.automationPlaceholders?.crmFeatureAccess && typeof currentOrganisation.value.automationPlaceholders.crmFeatureAccess === 'object' ? currentOrganisation.value.automationPlaceholders.crmFeatureAccess : {}),
  }));

  const isMetaEnabled = computed(() => crmFeatureAccess.value.meta !== false);
  const isWhatsAppEnabled = computed(() => crmFeatureAccess.value.whatsapp !== false);
  const isChatbotEnabled = computed(() => crmFeatureAccess.value.chatbot !== false);

  return {
    currentOrganisation,
    crmFeatureAccess,
    isMetaEnabled,
    isWhatsAppEnabled,
    isChatbotEnabled,
  };
};
