import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (initialized) return; // Prevent multiple calls
    
    const token = localStorage.getItem('token')
    console.log('AuthContext useEffect - Token exists:', !!token);
    if (!token) {
      setUser(null)
      setLoading(false)
      setInitialized(true)
      return
    }
    
    // First check if backend is running
    const checkBackendHealth = async () => {
      try {
        await api.get('/api/health', { timeout: 3000 })
        console.log('Backend is running, proceeding with auth check');
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        checkAuthStatus()
      } catch (error) {
        console.error('Backend health check failed:', error);
        setLoading(false)
        setInitialized(true)
      }
    }
    
    checkBackendHealth()
  }, [initialized])

  const checkAuthStatus = async () => {
    const maxRetries = 3;
    let retryCount = 0;
    
    const attemptAuth = async () => {
      try {
        console.log(`Checking auth status... (attempt ${retryCount + 1}/${maxRetries})`);
        const response = await api.get('/api/auth/me', { timeout: 30000 })
        console.log('Auth response:', response.data);
        setUser(response.data.user)
        return true;
      } catch (error) {
        console.error(`Auth check error (attempt ${retryCount + 1}):`, error);
        console.error(`Error details:`, {
          code: error.code,
          message: error.message,
          status: error.response?.status,
          data: error.response?.data
        });
        
        if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
          console.log('Connection timeout - will retry');
          console.log('Timeout details:', {
            code: error.code,
            message: error.message,
            config: error.config
          });
          // Don't remove token on timeout, just retry
          return false;
        }
        
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log('Auth error - removing token');
          setUser(null)
          localStorage.removeItem('token')
          delete api.defaults.headers.common['Authorization']
          return true; // Don't retry on auth errors
        }
        
        // For other errors, don't remove token, just retry
        console.log('Other error - will retry');
        return false;
      }
    };
    
    while (retryCount < maxRetries) {
      const success = await attemptAuth();
      if (success) break;
      
      retryCount++;
      if (retryCount < maxRetries) {
        console.log(`Retrying in 2 seconds... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    setLoading(false)
    setInitialized(true)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      toast.success('Registration successful!')
      navigate('/dashboard')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/auth/me', profileData)
      setUser(response.data.user)
      toast.success('Profile updated successfully!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 