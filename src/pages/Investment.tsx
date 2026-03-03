import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { canAccessFeature } from '../utils/subscription';
import { useAuth } from '../context/AuthContext';

export function Investment() {
  const navigate = useNavigate();
  const { subscriptionState } = useAuth();

  useEffect(() => {
    if (!canAccessFeature(subscriptionState, 'investment')) {
      navigate('/premium');
      return;
    }
  }, [navigate, subscriptionState]);
  return (
    <div className="min-h-screen bg-cream font-body" style={{ backgroundColor: '#FAF9F6' }}>
      <div className="bg-white border-b border-gray-light/30 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
        <button type="button" onClick={() => navigate('/')} className="bg-transparent border-none cursor-pointer p-1">
          <ArrowLeft size={20} color="#722F37" />
        </button>
        <span className="font-display text-base font-bold text-burgundy-dark">Potentiel investissement</span>
        <div className="w-8" />
      </div>
      <div className="max-w-lg mx-auto px-6 py-12 text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(46, 125, 50, 0.1)' }}>
          <TrendingUp size={40} color="#2E7D32" />
        </div>
        <h1 className="font-display text-2xl font-bold mb-3" style={{ color: '#2C1810' }}>Fonctionnalité à venir</h1>
        <p className="text-sm mb-8" style={{ color: '#6B5D56' }}>
          Analysez si un vin a un potentiel de valorisation. Cette fonctionnalité Pro arrive bientôt.
        </p>
        <button type="button" onClick={() => navigate('/')} className="bg-burgundy-dark text-white px-8 py-3 rounded-full font-semibold text-sm border-none cursor-pointer hover:opacity-90 transition-opacity">
          Retour à l&apos;accueil
        </button>
      </div>
    </div>
  );
}
