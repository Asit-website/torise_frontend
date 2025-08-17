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
    
    // Set token in headers immediately
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    
    // Try to get user from localStorage first
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser)
        setUser(user)
        console.log('User loaded from localStorage:', user.email);
      } catch (error) {
        console.log('Failed to parse stored user');
      }
    }
    
    // Check auth status immediately
    checkAuthStatus()
  }, [initialized])

  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      
      // Add minimum loading time of 2 seconds for better UX
      const startTime = Date.now();
      
      // Skip health check to reduce latency
      const response = await api.get('/api/auth/me', { timeout: 5000 })
      console.log('Auth response:', response.data);
      
      if (response.data && response.data.user) {
        setUser(response.data.user)
        console.log('User authenticated successfully:', response.data.user.email);
      } else {
        console.log('Invalid response format');
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
      }
      
      // Ensure minimum 2 second loading time
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 2000; // 2 seconds
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
      
    } catch (error) {
      console.error('Auth check error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        code: error.code
      });
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Auth error - removing token');
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        delete api.defaults.headers.common['Authorization']
      } else if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
        console.log('Network error - keeping token and user state');
        // Keep token and user state for network errors
        // This prevents unnecessary logout on network issues
        // Don't change user state, keep it as is
      } else {
        console.log('Other error - keeping token and user state');
        // Keep token and user state for other errors
        // Don't change user state, keep it as is
      }
      
      // Ensure minimum 2 second loading time even for errors
      const elapsedTime = Date.now() - startTime;
      const minLoadingTime = 2000; // 2 seconds
      if (elapsedTime < minLoadingTime) {
        await new Promise(resolve => setTimeout(resolve, minLoadingTime - elapsedTime));
      }
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token, user } = response.data
      
      // Store token and user immediately
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
      
      console.log('Login successful, user set:', user.email);
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      console.error('Login error:', error);
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
      localStorage.setItem('user', JSON.stringify(user))
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
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    toast.success('Logged out successfully')
    navigate('/')
  }

  const updateProfile = async (profileData) => {
    try {
      console.log('AuthContext: Starting profile update with:', profileData);
      console.log('AuthContext: Making API call to /api/auth/me');
      console.log('AuthContext: Request data:', profileData);
      console.log('AuthContext: Request headers:', api.defaults.headers);
      console.log('AuthContext: Full API URL:', api.defaults.baseURL + '/api/auth/me');
      console.log('AuthContext: Token from localStorage:', localStorage.getItem('token'));
      
      // Try with a shorter timeout first
      const response = await api.put('/api/auth/me', profileData, { timeout: 5000 })
      console.log('AuthContext: API response received:', response);
      
      const updatedUser = response.data.user
      
      // Update both state and localStorage
      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))
      
      console.log('Profile updated successfully:', updatedUser);
      return { success: true }
    } catch (error) {
      console.error('AuthContext: Profile update error:', error);
      console.error('AuthContext: Error response:', error.response);
      console.error('AuthContext: Error message:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        return { 
          success: false, 
          message: 'Profile update failed - server timeout. Please check if the backend server is running on port 5000.' 
        };
      }
      
      if (error.message.includes('Network Error')) {
        return { 
          success: false, 
          message: 'Profile update failed - cannot connect to server. Please check if the backend server is running.' 
        };
      }
      
      return { 
        success: false, 
        message: error.response?.data?.message || error.message || 'Profile update failed' 
      };
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