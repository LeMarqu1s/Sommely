import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

export function SommelierButton() {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ['/sommelier', '/onboarding'];
  if (hiddenPaths.includes(location.pathname)) return null;

  return (
    <motion.button
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', delay: 0.5 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => navigate('/sommelier')}
      className="fixed bottom-24 right-5 z-40 w-14 h-14 rounded-full bg-burgundy-dark flex items-center justify-center border-none cursor-pointer shadow-[0_8px_32px_rgba(114,47,55,0.4)]"
    >
      <span className="text-2xl">🍷</span>
    </motion.button>
  );
}
