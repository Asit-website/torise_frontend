import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Typography, 
  Button, 
  Input 
} from "@material-tailwind/react";
import { Lock, Eye, EyeOff, ArrowLeft, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const ChangePassword = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const newPassword = watch('newPassword');

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 6) strength += 25;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const handleBackToProfile = () => {
    if (user?.role === 'internal_admin' || user?.role === 'super_admin') {
      navigate('/profile');
    } else {
      navigate('/view-profile');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      console.log('ChangePassword: Submitting password change request');
      console.log('ChangePassword: Request data:', { currentPassword: '***', newPassword: '***' });
      console.log('ChangePassword: API base URL:', api.defaults.baseURL);
      console.log('ChangePassword: Full URL:', `${api.defaults.baseURL}/api/auth/change-password`);
      
      const response = await api.put('/api/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      console.log('ChangePassword: Response received:', response.data);
      toast.success('Password changed successfully!');
      reset();
      setPasswordStrength(0);
    } catch (error) {
      console.error('ChangePassword: Password change error:', error);
      console.error('ChangePassword: Error response:', error.response);
      console.error('ChangePassword: Error message:', error.message);
      console.error('ChangePassword: Error config:', error.config);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Password change failed - server timeout. Please check if the backend server is running.');
      } else if (error.message.includes('Network Error')) {
        toast.error('Password change failed - cannot connect to server. Please check if the backend server is running.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to change password');
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="text" 
            size="sm" 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            onClick={handleBackToProfile}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Button>
          <div className="flex-1">
            <Typography variant="h3" color="blue-gray" className="font-bold">
              Change Password
            </Typography>
            <Typography variant="paragraph" color="gray" className="mt-1">
              Update your account password to keep it secure
            </Typography>
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <Typography variant="small" color="blue-gray" className="font-semibold">
                Security Reminder
              </Typography>
              <Typography variant="small" color="blue-gray" className="mt-1">
                Choose a strong password that you haven't used elsewhere. We recommend using a mix of letters, numbers, and symbols.
              </Typography>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <Card className="shadow-xl border-0">
          <CardHeader 
            color="blue" 
            className="relative h-20 bg-gradient-to-r from-blue-600 to-indigo-600"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <Lock className="h-6 w-6 text-white" />
              </div>
              <div>
                <Typography variant="h5" color="white" className="font-bold">
                  Update Your Password
                </Typography>
                <Typography variant="small" color="white" className="opacity-90">
                  Enter your current password and choose a new one
                </Typography>
              </div>
            </div>
          </CardHeader>
          
          <CardBody className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Password */}
              <div className="space-y-2">
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  Current Password
                </Typography>
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-[100px]" }}
                    {...register('currentPassword', {
                      required: 'Current password is required'
                    })}
                    error={!!errors.currentPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <Typography variant="small">{errors.currentPassword.message}</Typography>
                  </div>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  New Password
                </Typography>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-[100px]" }}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters'
                      }
                    })}
                    error={!!errors.newPassword}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Typography variant="small" color="gray" className="font-medium">
                        Password Strength
                      </Typography>
                      <Typography variant="small" color="gray">
                        {getPasswordStrengthText()}
                      </Typography>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {errors.newPassword && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <Typography variant="small">{errors.newPassword.message}</Typography>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Typography variant="small" color="blue-gray" className="font-semibold">
                  Confirm New Password
                </Typography>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    className="!border !border-gray-300 bg-white text-gray-900 shadow-lg shadow-gray-900/5 ring-4 ring-transparent placeholder:text-gray-500 focus:!border-blue-500 focus:!border-t-blue-500 focus:ring-blue-500/20 !h-12"
                    labelProps={{
                      className: "hidden",
                    }}
                    containerProps={{ className: "min-w-[100px]" }}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === newPassword || 'Passwords do not match'
                    })}
                    error={!!errors.confirmPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="h-4 w-4" />
                    <Typography variant="small">{errors.confirmPassword.message}</Typography>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
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
                      <span>Changing Password...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3">
                      <CheckCircle className="h-5 w-5" />
                      <span>Change Password</span>
                    </div>
                  )}
                </Button>
                <Button 
                  variant="outlined" 
                  color="gray"
                  onClick={handleBackToProfile}
                  size="lg"
                  className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-300 transform hover:scale-105 h-12 text-base font-semibold shadow-md hover:shadow-lg"
                >
                  <span>Cancel</span>
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Additional Security Tips */}
        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardBody className="p-6">
            <Typography variant="h6" color="green-gray" className="font-bold mb-3">
              Password Security Tips
            </Typography>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <Typography variant="small" color="green-gray">
                  Use at least 8 characters for better security
                </Typography>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <Typography variant="small" color="green-gray">
                  Include uppercase and lowercase letters
                </Typography>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <Typography variant="small" color="green-gray">
                  Add numbers and special characters
                </Typography>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <Typography variant="small" color="green-gray">
                  Avoid using personal information
                </Typography>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
