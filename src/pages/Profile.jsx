import { useState } from 'react'
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
import { User, Save, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      bio: user?.bio || ''
    }
  })

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const result = await updateProfile(data)
      if (result.success) {
        toast.success('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/dashboard">
          <Button variant="text" size="sm" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <Typography variant="h3" color="blue-gray">
          Edit Profile
        </Typography>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader color="blue" className="relative h-16">
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-white" />
                <Typography variant="h6" color="white">
                  Personal Information
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                      First Name
                    </Typography>
                    <Input
                      type="text"
                      placeholder="First name"
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
                    Bio
                  </Typography>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    {...register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio cannot exceed 500 characters'
                      }
                    })}
                    error={!!errors.bio}
                    rows={4}
                  />
                  {errors.bio && (
                    <Typography variant="small" color="red" className="mt-1">
                      {errors.bio.message}
                    </Typography>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    color="blue"
                    className="flex items-center gap-2"
                    disabled={loading}
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    color="gray"
                    onClick={() => window.location.reload()}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>

        {/* Profile Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader color="green" className="relative h-16">
              <Typography variant="h6" color="white">
                Account Summary
              </Typography>
            </CardHeader>
            <CardBody className="space-y-4">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Username
                </Typography>
                <Typography variant="paragraph">
                  @{user?.username}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Email
                </Typography>
                <Typography variant="paragraph">
                  {user?.email}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Role
                </Typography>
                <Typography variant="paragraph" className="capitalize">
                  {user?.role}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Member Since
                </Typography>
                <Typography variant="paragraph">
                  {new Date(user?.createdAt).toLocaleDateString()}
                </Typography>
              </div>
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Status
                </Typography>
                <Typography 
                  variant="paragraph" 
                  className={user?.isActive ? "text-green-500" : "text-red-500"}
                >
                  {user?.isActive ? "Active" : "Inactive"}
                </Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader color="orange" className="relative h-16">
              <Typography variant="h6" color="white">
                Quick Actions
              </Typography>
            </CardHeader>
            <CardBody className="space-y-3">
              <Button
                variant="text"
                color="blue"
                size="sm"
                className="w-full justify-start"
              >
                Change Password
              </Button>
              <Button
                variant="text"
                color="blue"
                size="sm"
                className="w-full justify-start"
              >
                Update Email
              </Button>
              <Button
                variant="text"
                color="red"
                size="sm"
                className="w-full justify-start"
              >
                Delete Account
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Profile 