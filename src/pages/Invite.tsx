import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export function Invite() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      navigate(`/auth?referral=${encodeURIComponent(code)}`, { replace: true });
    } else {
      navigate('/auth', { replace: true });
    }
  }, [code, navigate]);

  return null;
}
