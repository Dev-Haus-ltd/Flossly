// composables/useUser.js
export const useUser = () => {
  const user = useState('user', () => null)

  if (process.client && !user.value) {
    const storedUser = localStorage.getItem('user')
    user.value = storedUser ? JSON.parse(storedUser) : null
  }

  // Derived booleans
  const isManager = computed(() => user.value?.roleId === 8 || user.value?.roleId === 1)

  return {
    user,
    isManager
  }
}
