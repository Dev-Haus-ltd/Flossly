// composables/useUser.js
export const useUser = () => {
  const user = useState('user', () => {
    if (process.client) {
      const storedUser = localStorage.getItem('user')
      return storedUser ? JSON.parse(storedUser) : null
    }
    return null
  })

  const isManager = computed(() => [1, 8].includes(user.value?.roleId))

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
    setUser
  }
}
