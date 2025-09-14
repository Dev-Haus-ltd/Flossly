// composables/useUser.js
export const useUser = () => {
    const user = useState('user', () => null)
  
    if (process.client && !user.value) {
      user.value = JSON.parse(localStorage.getItem('user') || '{}')
    }
  
    return user
  }
  