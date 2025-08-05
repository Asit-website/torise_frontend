import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, Button, Typography } from '@material-tailwind/react';
import { Lock } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-12 px-4">
      <div className="max-w-md w-full">
        <Card className="w-full shadow-2xl rounded-2xl border border-gray-100">
          <CardBody className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="bg-blue-600 rounded-full p-3 mb-3 shadow-lg">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <Typography variant="h4" color="blue-gray" className="font-bold mb-1 text-center">
                Reset Password
              </Typography>
              <Typography color="gray" className="text-center text-base opacity-80">
                Enter your new password below.
              </Typography>
            </div>
            {success ? (
              <div className="text-center py-8">
                <Typography color="green" className="font-semibold mb-2">
                  Password reset successful!
                </Typography>
                <Typography color="gray">
                  Redirecting to login...
                </Typography>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                    New Password
                  </Typography>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition placeholder-gray-400"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                    Confirm Password
                  </Typography>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full pl-4 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition placeholder-gray-400"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <Typography color="red" className="text-center">{error}</Typography>}
                <Button
                  type="submit"
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold tracking-wide shadow-lg rounded-lg py-3 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword; 