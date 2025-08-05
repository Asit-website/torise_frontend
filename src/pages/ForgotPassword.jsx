import { useState } from 'react';
import { Card, CardBody, Button, Typography } from '@material-tailwind/react';
import { Mail, Lock } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError('Something went wrong. Please try again.');
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
                Forgot Password
              </Typography>
              <Typography color="gray" className="text-center text-base opacity-80">
                Enter your registered email to receive a password reset link.
              </Typography>
            </div>
            {success ? (
              <div className="text-center py-8">
                <Typography color="green" className="font-semibold mb-2">
                  If that email exists, a reset link has been sent!
                </Typography>
                <Typography color="gray">
                  Please check your inbox (and spam folder).
                </Typography>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="w-full pl-11 pr-4 py-3 rounded-lg border border-gray-300 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base transition placeholder-gray-400"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                {error && <Typography color="red" className="text-center">{error}</Typography>}
                <Button
                  type="submit"
                  className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold tracking-wide shadow-lg rounded-lg py-3 transition-colors duration-200"
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword; 