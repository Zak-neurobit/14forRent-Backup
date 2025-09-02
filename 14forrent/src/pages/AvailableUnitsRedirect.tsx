
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AvailableUnitsRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/available-units', { replace: true });
  }, [navigate]);

  return null;
};

export default AvailableUnitsRedirect;
