import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileRouter = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // Admin users go to edit profile, others go to view profile
      if (user.role === 'internal_admin' || user.role === 'super_admin') {
        navigate('/profile');
      } else {
        navigate('/view-profile');
      }
    }
  }, [user, navigate]);

  return null; // This component doesn't render anything
};

export default ProfileRouter;
