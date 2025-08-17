import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Typography, 
  Button, 
  Badge
} from "@material-tailwind/react";
import { User, Lock, Mail, Calendar, Shield, ArrowLeft, Edit } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const ViewProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Redirect admin users to edit profile
  useEffect(() => {
    if (user && ['internal_admin', 'super_admin'].includes(user.role)) {
      navigate('/profile');
    }
  }, [user, navigate]);

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'internal_admin': 'Internal Admin',
      'super_admin': 'Super Admin',
      'client_admin': 'Client Admin',
      'client_manager': 'Client Manager',
      'client_viewer': 'Client Viewer',
      'business_manager': 'Business Manager',
      'campaign_manager': 'Campaign Manager',
      'support_agent': 'Support Agent'
    };
    return roleNames[role] || role;
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'green',
      'disabled': 'red',
      'invited': 'yellow'
    };
    return colors[status] || 'gray';
  };

  const handleChangePassword = () => {
    navigate('/change-password');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleBackToProfile = () => {
    // Go back to the appropriate profile page based on role
    if (user?.role === 'internal_admin' || user?.role === 'super_admin') {
      navigate('/profile');
    } else {
      navigate('/view-profile');
    }
  };

  const handleEditProfile = () => {
    // Only allow admins to edit profile
    if (user?.role === 'internal_admin' || user?.role === 'super_admin') {
      navigate('/profile');
    } else {
      toast.error('You do not have permission to edit profile');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
          <Typography variant="h3" color="blue-gray" className="font-bold">
            View Profile
          </Typography>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          {/* <Button
            variant="outlined"
            color="blue"
            size="sm"
            className="flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 transform hover:scale-105 h-10 px-4 font-semibold shadow-sm hover:shadow-md"
            onClick={handleChangePassword}
          >
            <Lock className="h-4 w-4" />
            <span>Change Password</span>
          </Button> */}
          
          {(user?.role === 'internal_admin' || user?.role === 'super_admin') && (
            <Button
              color="blue"
              size="sm"
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 h-10 px-4 font-semibold"
              onClick={handleEditProfile}
            >
              <Edit className="h-4 w-4" />
              <span>Edit Profile</span>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader color="blue" className="relative h-16 flex items-center">
              <div className="flex items-center gap-3 px-6">
                <User className="h-6 w-6 text-white" />
                <Typography variant="h6" color="white" className="font-bold">
                  Personal Information
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    First Name
                  </Typography>
                  <Typography variant="paragraph" className="font-medium">
                    {user?.firstName || 'Not provided'}
                  </Typography>
                </div>

                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Last Name
                  </Typography>
                  <Typography variant="paragraph" className="font-medium">
                    {user?.lastName || 'Not provided'}
                  </Typography>
                </div>

                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Email Address
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <Typography variant="paragraph" className="font-medium">
                      {user?.email}
                    </Typography>
                  </div>
                </div>

                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Role
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-gray-500" />
                    <Typography variant="paragraph" className="font-medium capitalize">
                      {getRoleDisplayName(user?.role)}
                    </Typography>
                  </div>
                </div>

                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Status
                  </Typography>
                  <Badge color={getStatusColor(user?.status)}>
                    {user?.status?.charAt(0).toUpperCase() + user?.status?.slice(1)}
                  </Badge>
                </div>

                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Member Since
                  </Typography>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <Typography variant="paragraph" className="font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Bio Section */}
              {user?.bio && (
                <div>
                  <Typography variant="small" color="gray" className="font-medium mb-2">
                    Bio
                  </Typography>
                  <Typography variant="paragraph" className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {user.bio}
                  </Typography>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Client Information (if applicable) */}
          {user?.client_id && (
            <Card className="mt-6">
              <CardHeader color="green" className="relative h-16 flex items-center">
                <div className="flex items-center gap-3 px-6">
                  <Typography variant="h6" color="white" className="font-bold">
                    Client Information
                  </Typography>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                <Typography variant="paragraph" className="font-medium">
                  Client ID: {user.client_id}
                </Typography>
                <Typography variant="small" color="gray" className="mt-2">
                  This user is associated with a client account
                </Typography>
              </CardBody>
            </Card>
          )}

          {/* Application SIDs (if applicable) */}
          {user?.application_sid && user.application_sid.length > 0 && (
            <Card className="mt-6">
              <CardHeader color="purple" className="relative h-16 flex items-center">
                <div className="flex items-center gap-3 px-6">
                  <Typography variant="h6" color="black" className="font-bold text-lg">
                    Application SIDs
                  </Typography>
                </div>
              </CardHeader>
              <CardBody className="p-6">
                <div className="space-y-4">
                  {user.application_sid.map((sid, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <Typography variant="small" color="gray" className="font-medium mb-2">
                        Application SID #{index + 1}
                      </Typography>
                      <Typography variant="paragraph" className="font-mono text-gray-700 break-all bg-white p-3 rounded border">
                        {sid || 'No SID available'}
                      </Typography>
                    </div>
                  ))}
                </div>
                {user.application_sid.length === 0 && (
                  <div className="text-center py-8">
                    <Typography variant="paragraph" color="gray" className="italic">
                      No Application SIDs available
                    </Typography>
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </div>

        {/* Profile Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader color="green" className="relative h-16 flex items-center">
              <div className="flex items-center gap-3 px-6">
                <Typography variant="h6" color="white" className="font-bold">
                  Account Summary
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-4">
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  User ID
                </Typography>
                <Typography variant="paragraph" className="font-mono text-sm">
                  {user?._id || 'N/A'}
                </Typography>
              </div>
              
              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Last Login
                </Typography>
                <Typography variant="paragraph">
                  {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
                </Typography>
              </div>

              <div>
                <Typography variant="small" color="gray" className="font-medium">
                  Account Type
                </Typography>
                <Typography variant="paragraph" className="capitalize">
                  {user?.role?.includes('admin') ? 'Administrator' : 'User'}
                </Typography>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader color="orange" className="relative h-16 flex items-center">
              <div className="flex items-center gap-3 px-6">
                <Typography variant="h6" color="white" className="font-bold">
                  Quick Actions
                </Typography>
              </div>
            </CardHeader>
            <CardBody className="p-6 space-y-3">
              <Button
                variant="text"
                color="blue"
                size="lg"
                className="w-full justify-center hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 h-14 text-base font-semibold shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-300 bg-blue-50/50"
                onClick={handleChangePassword}
              >
                <div className="flex items-center justify-center gap-3">
                  <Lock className="h-6 w-6" />
                  <span>Change Password</span>
                </div>
              </Button>
              
              {(user?.role === 'internal_admin' || user?.role === 'super_admin') && (
                <Button
                  variant="text"
                  color="blue"
                  size="lg"
                  className="w-full justify-center hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 h-14 text-base font-semibold shadow-sm hover:shadow-md border border-blue-200 hover:border-blue-300 bg-blue-50/50"
                  onClick={handleEditProfile}
                >
                  <div className="flex items-center justify-center gap-3">
                    <Edit className="h-6 w-6" />
                    <span>Edit Profile</span>
                  </div>
                </Button>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
