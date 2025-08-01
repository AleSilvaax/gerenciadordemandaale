
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Configure: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/settings', { replace: true });
  }, [navigate]);

  return null;
};

export default Configure;
