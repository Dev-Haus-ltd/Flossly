export const isDefaultAutomationGroup = (group, defaultGroupKeySet, defaultAutomationKeySet) => {
  if (!group) return false
  if (group.source === 'default') return true
  if (defaultGroupKeySet?.has?.(group.key)) return true
  const keys = Array.isArray(group.templateKeys) ? group.templateKeys : []
  return keys.length > 0 && keys.every((key) => defaultAutomationKeySet?.has?.(key))
}

export const resolveAutomationGroupAuthor = (group, options = {}) => {
  const { isDefaultGroup = () => false, fallbackName = 'Custom' } = options
  if (!group) return 'System'
  if (isDefaultGroup(group)) return 'System'
  const candidates = [
    group.createdByName,
    group.createdByFullName,
    group.createdByEmail,
    group.createdByUserName,
    group.createdBy?.fullName,
    group.createdBy?.name,
    group.createdBy?.email,
    group.createdByUser?.fullName,
    group.createdByUser?.name,
    group.createdByUser?.email,
    group.ownerName,
    group.owner?.fullName,
    group.owner?.name,
    group.owner?.email,
    group.userName,
    group.user?.fullName,
    group.user?.name,
    group.user?.email,
  ].map((value) => (typeof value === 'string' ? value.trim() : '')).find(Boolean)
  return candidates || fallbackName
}
