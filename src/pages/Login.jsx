import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { Card, CardBody, Button, Typography } from "@material-tailwind/react"
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'

const Login = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await login(data.email, data.password)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="w-full shadow-2xl rounded-2xl border border-gray-100">
          <CardBody className="p-8">
            {/* Brand/Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="bg-blue-600 rounded-full p-3 mb-3 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <Typography variant="h3" color="blue-gray" className="font-bold mb-1 text-center">
                Torise Logins
              </Typography>
              <Typography color="gray" className="text-center text-base opacity-80">
                Welcome back! Please sign in to your  account.
              </Typography>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Email Address
                </Typography>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Mail className="h-5 w-5" />
                  </span>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition placeholder-gray-400 ${errors.email ? 'border-red-400' : ''}`}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.email.message}
                  </Typography>
                )}
              </div>
              {/* Password Field */}
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Password
                </Typography>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`w-full pl-4 pr-12 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition placeholder-gray-400 ${errors.password ? 'border-red-400' : ''}`}
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.password.message}
                  </Typography>
                )}
              </div>
              <Button
                type="submit"
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold tracking-wide shadow-lg rounded-lg py-3 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
              <div className="text-center mt-4">
                <a href="/forgot-password" className="text-blue-600 hover:underline text-sm font-medium">Forgot password?</a>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Login 