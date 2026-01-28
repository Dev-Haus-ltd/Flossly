export const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}')
    } catch {}
  }
  return {}
}

export const getCurrentUserName = () => {
  const user = getStoredUser()
  const name = user?.fullName || user?.name || user?.displayName
  if (name && String(name).trim()) return String(name).trim()
  const email = user?.email || user?.username
  if (email && String(email).trim()) return String(email).trim()
  return 'Custom'
}
