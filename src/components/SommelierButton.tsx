import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export function SommelierButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ['/sommelier', '/onboarding', '/auth', '/', '/privacy', '/profile', '/scan', '/home', '/cave'];
  if (hiddenPaths.some(p => location.pathname === p || location.pathname.startsWith(p + '/'))) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/sommelier')}
      className="fixed right-4 z-40 w-12 h-12 rounded-full bg-burgundy-dark flex items-center justify-center border-none cursor-pointer shadow-[0_8px_32px_rgba(114,47,55,0.4)]"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 90px)' }}
    >
      <span className="text-2xl">🍷</span>
    </motion.button>
  );
}
