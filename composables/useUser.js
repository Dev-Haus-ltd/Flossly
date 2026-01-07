// composables/useUser.js
export const useUser = () => {
  const user = useState('user', () => {
    if (process.client) {
      const storedUser = localStorage.getItem('user')
      return storedUser ? JSON.parse(storedUser) : null
    }
    return null
  })

  // Privileged roles: Practice Manager (1), Principal Dentist / Practice Owner (8)
  const PRIVILEGED_ROLE_IDS = [1, 8]

  const isManager = computed(() => PRIVILEGED_ROLE_IDS.includes(user.value?.roleId))

  // Permission to add new workspaces - only for Practice Manager and Principal Dentist / Practice Owner
  const canAddWorkspace = computed(() => PRIVILEGED_ROLE_IDS.includes(user.value?.roleId))

  const setUser = (newUser) => {
    user.value = newUser
    if (process.client) {
      if (newUser) {
        localStorage.setItem('user', JSON.stringify(newUser))
      } else {
        localStorage.removeItem('user')
      }
    }
  }

  return {
    user,
    isManager,
    canAddWorkspace,
    setUser
  }
}
