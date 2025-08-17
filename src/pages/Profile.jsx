import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Typography, 
  Button, 
  Input, 
  Textarea 
} from "@material-tailwind/react"
import { User, Save, ArrowLeft, Shield, Lock, Mail, Calendar, BadgeCheck, Settings } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  // Redirect non-admin users to view profile
  useEffect(() => {
    if (user && !['internal_admin', 'super_admin'].includes(user.role)) {
      navigate('/view-profile');
    }
  }, [user, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || ''
    }
  })

  // Reset form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || ''
      });
    }
  }, [user, reset]);

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      console.log('Form data:', data);
      console.log('Current user:', user);
      
      // Only send fields that have been changed
      const updateData = {};
      
      if (data.firstName && data.firstName !== user?.firstName) {
        updateData.firstName = data.firstName;
      }
      
      if (data.lastName && data.lastName !== user?.lastName) {
        updateData.lastName = data.lastName;
      }
      
      // Also check for LastName (capital L) in case of form field naming issue
      if (data.LastName && data.LastName !== user?.lastName) {
        updateData.lastName = data.LastName;
      }
     
      if (data.email && data.email !== user?.email) {
        updateData.email = data.email;
      }
      
      console.log('Update data to send:', updateData);
      
      // If no changes, show message
      if (Object.keys(updateData).length === 0) {
        toast.info('No changes to save');
        setLoading(false);
        return;
      }
      
      console.log('About to call updateProfile with:', updateData);
      const result = await updateProfile(updateData)
      console.log('Update result:', result);
     
      if (result.success) {
        toast.success('Profile updated successfully!')
      } else {
        toast.error(result.message || 'Failed to update profile')
        console.error('Profile update failed:', result.message);
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="text" 
            size="sm" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={handleBackToDashboard}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="flex-1">
            <Typography variant="h3" color="blue-gray" className="font-bold">
              Edit Profile
            </Typography>
            <Typography variant="paragraph" color="gray" className="mt-1">
              Manage your account information and settings
            </Typography>
          </div>
        </div>

        {/* Admin Only Notice */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <Typography variant="h6" color="blue-gray" className="font-bold">
                Admin Profile Management
              </Typography>
              <Typography variant="paragraph" color="blue-gray" className="mt-2">
                This page allows administrators to edit their profile information. Regular users can view their profile and change password from the View Profile page.
              </Typography>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0">
              <CardHeader 
                color="blue" 
                className="relative h-24 bg-gradient-to-r from-blue-600 to-indigo-600"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <Typography variant="h5" color="white" className="font-bold">
                      Personal Information
                    </Typography>
                    <Typography variant="small" color="white" className="opacity-90">
                      Update your personal details and contact information
                    </Typography>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        First Name
                      </Typography>
                      <Input
                        type="text"
                        placeholder="Enter your first name"
                        className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                        labelProps={{
                          className: "hidden",
                        }}
                        containerProps={{ className: "min-w-[100px]" }}
                        {...register('firstName')}
                        error={!!errors.firstName}
                      />
                      {errors.firstName && (
                        <Typography variant="small" color="red" className="mt-1">
                          {errors.firstName.message}
                        </Typography>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Typography variant="small" color="blue-gray" className="font-semibold">
                        Last Name
                      </Typography>
                      <Input
                        type="text"
                        placeholder="Enter your last name"
                        className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                        labelProps={{
                          className: "hidden",
                        }}
                        containerProps={{ className: "min-w-[100px]" }}
                        {...register('lastName')}
                        error={!!errors.lastName}
                      />
                      {errors.lastName && (
                        <Typography variant="small" color="red" className="mt-1">
                          {errors.lastName.message}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Typography variant="small" color="blue-gray" className="font-semibold">
                      Email Address
                    </Typography>
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                      labelProps={{
                        className: "hidden",
                      }}
                      containerProps={{ className: "min-w-[100px]" }}
                      {...register('email')}
                      error={!!errors.email}
                    />
                    {errors.email && (
                      <Typography variant="small" color="red" className="mt-1">
                        {errors.email.message}
                      </Typography>
                    )}
                  </div>

                  <div className="flex gap-4 pt-8">
                    <Button
                      type="submit"
                      color="blue"
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 h-12 text-base font-semibold"
                      disabled={loading}
                      size="lg"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving Changes...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <Save className="h-5 w-5" />
                          <span>Save Changes</span>
                        </div>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      color="gray"
                      onClick={() => window.location.reload()}
                      size="lg"
                      className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 h-12 text-base font-semibold shadow-md hover:shadow-lg"
                    >
                      <span>Cancel</span>
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* Profile Summary */}
          <div className="space-y-6">
            {/* Account Summary */}
            <Card className="shadow-xl border-0">
              <CardHeader 
                color="green" 
                className="relative h-20 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <BadgeCheck className="h-6 w-6 text-white" />
                  </div>
                  <Typography variant="h6" color="white" className="font-bold">
                    Account Summary
                  </Typography>
                </div>
              </CardHeader>
              <CardBody className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" color="gray" className="font-medium">
                        User ID
                      </Typography>
                      <Typography variant="paragraph" className="font-mono text-sm font-semibold">
                        {user?._id || 'N/A'}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Mail className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" color="gray" className="font-medium">
                        Email
                      </Typography>
                      <Typography variant="paragraph" className="font-semibold">
                        {user?.email}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Settings className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" color="gray" className="font-medium">
                        Role
                      </Typography>
                      <Typography variant="paragraph" className="font-semibold capitalize">
                        {user?.role}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" color="gray" className="font-medium">
                        Member Since
                      </Typography>
                      <Typography variant="paragraph" className="font-semibold">
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                      </Typography>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BadgeCheck className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <Typography variant="small" color="gray" className="font-medium">
                        Status
                      </Typography>
                      <Typography 
                        variant="paragraph" 
                        className={`font-semibold ${user?.status === 'active' ? "text-green-600" : "text-red-600"}`}
                      >
                        {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1) || 'Unknown'}
                      </Typography>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-xl border-0">
              <CardHeader 
                color="orange" 
                className="relative h-20 bg-gradient-to-r from-orange-500 to-red-500"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <Typography variant="h6" color="white" className="font-bold">
                    Quick Actions
                  </Typography>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                <Link to="/change-password" className="block">
                  <Button
                    variant="text"
                    color="blue"
                    size="lg"
                    className="w-full justify-center hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 h-14 text-base font-semibold shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-300 bg-blue-50/50"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <Lock className="h-6 w-6" />
                      <span>Change Password</span>
                    </div>
                  </Button>
                </Link>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile 