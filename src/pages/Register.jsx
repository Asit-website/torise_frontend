import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { 
  Card, 
  CardBody, 
  Typography, 
  Button, 
  Input 
} from "@material-tailwind/react"
import { Eye, EyeOff, Mail, Lock, User, UserCheck } from 'lucide-react'

const Register = () => {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const allowedRoles = [
    { value: 'internal_admin', label: 'Internal Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'client_admin', label: 'Client Admin' },
    { value: 'client_manager', label: 'Client Manager' },
    { value: 'client_viewer', label: 'Client Viewer' },
    { value: 'business_manager', label: 'Business Manager' },
    { value: 'campaign_manager', label: 'Campaign Manager' },
    { value: 'support_agent', label: 'Support Agent' },
  ];

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      // Combine first and last name
      const name = `${data.firstName} ${data.lastName}`.trim();
      const payload = {
        name,
        email: data.email,
        password: data.password,
        role: data.role,
      };
      const result = await registerUser(payload)
      if (result.success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Typography variant="h2" color="blue-gray" className="mb-2">
            Create Account
          </Typography>
          <Typography color="gray" className="font-normal">
            Join us today! Create your account to get started.
          </Typography>
        </div>

        <Card className="w-full">
          <CardBody className="flex flex-col gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                    First Name
                  </Typography>
                  <Input
                    type="text"
                    placeholder="First name"
                    icon={<User className="h-4 w-4" />}
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: {
                        value: 2,
                        message: 'First name must be at least 2 characters'
                      }
                    })}
                    error={!!errors.firstName}
                  />
                  {errors.firstName && (
                    <Typography variant="small" color="red" className="mt-1">
                      {errors.firstName.message}
                    </Typography>
                  )}
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                    Last Name
                  </Typography>
                  <Input
                    type="text"
                    placeholder="Last name"
                    icon={<User className="h-4 w-4" />}
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: {
                        value: 2,
                        message: 'Last name must be at least 2 characters'
                      }
                    })}
                    error={!!errors.lastName}
                  />
                  {errors.lastName && (
                    <Typography variant="small" color="red" className="mt-1">
                      {errors.lastName.message}
                    </Typography>
                  )}
                </div>
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Role
                </Typography>
                <select
                  className="w-full border rounded px-3 py-2"
                  {...register('role', { required: 'Role is required' })}
                  defaultValue=""
                >
                  <option value="" disabled>Select role</option>
                  {allowedRoles.map((role) => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
                {errors.role && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.role.message}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Email Address
                </Typography>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  icon={<Mail className="h-4 w-4" />}
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  error={!!errors.email}
                />
                {errors.email && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.email.message}
                  </Typography>
                )}
              </div>
              <div>
                <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                  Password
                </Typography>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  icon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  }
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  error={!!errors.password}
                />
                {errors.password && (
                  <Typography variant="small" color="red" className="mt-1">
                    {errors.password.message}
                  </Typography>
                )}
              </div>
              <Button
                type="submit"
                className="mt-6"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="text-center">
              <Typography variant="small" color="gray" className="mt-4">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-500 hover:text-blue-600">
                  Sign in
                </Link>
              </Typography>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default Register 