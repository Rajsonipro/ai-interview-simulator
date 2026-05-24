import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session_token, setSessionToken] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const savedSessionToken = localStorage.getItem('session_token')
      const savedUser = localStorage.getItem('user')
      if (savedSessionToken && savedUser) {
        const parsedUser = JSON.parse(savedUser);
        if (typeof parsedUser !== 'object' || parsedUser === null) {
          throw new Error('Invalid user data');
        }
        setSessionToken(savedSessionToken)
        setUser(parsedUser)
      }
    } catch (err) {
      console.error('Error loading auth data:', err)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }, [])

  const login = (sessionTokenValue, userData) => {
    setSessionToken(sessionTokenValue)
    setUser(userData)
    localStorage.setItem('session_token', sessionTokenValue)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    setSessionToken(null)
    setUser(null)
    localStorage.removeItem('session_token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, session_token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
