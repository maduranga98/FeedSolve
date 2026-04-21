import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, BarChart3, CreditCard, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Shared';
import { LanguageSwitcher } from '../Language/LanguageSwitcher';

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-[#D3D1C7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F] cursor-pointer" onClick={() => navigate('/dashboard')}>
            FeedSolve
          </h1>

          {user && (
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate('/dashboard')}
                className={`text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'text-[#1E3A5F]'
                    : 'text-[#6B7B8D] hover:text-[#1E3A5F]'
                }`}
              >
                {t('common.dashboard')}
              </button>
              <button
                onClick={() => navigate('/templates')}
                className={`text-sm font-medium ${
                  isActive('/templates') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                {t('templates.title')}
              </button>
              <button
                onClick={() => navigate('/board/create')}
                className={`text-sm font-medium ${
                  isActive('/board/create') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                {t('boards.templates.create_from_template')}
              </button>
              <button
                onClick={() => navigate('/team')}
                className={`text-sm font-medium flex items-center gap-2 ${
                  isActive('/team') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                <Users size={16} />
                {t('common.team')}
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className={`text-sm font-medium flex items-center gap-2 ${
                  isActive('/analytics') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                <BarChart3 size={16} />
                {t('common.analytics')}
              </button>
              <button
                onClick={() => navigate('/billing')}
                className={`text-sm font-medium flex items-center gap-2 ${
                  isActive('/billing') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                <CreditCard size={16} />
                {t('common.billing')}
              </button>
              <button
                onClick={() => navigate('/integrations')}
                className={`text-sm font-medium flex items-center gap-2 ${
                  isActive('/integrations') ? 'text-[#1E3A5F]' : 'text-[#6B7B8D]'
                } hover:text-[#1E3A5F]`}
              >
                <Zap size={16} />
                Integrations
              </button>
            </div>
          )}
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-sm">
              <p className="font-medium text-[#1E3A5F]">{user.name}</p>
              <p className="text-[#6B7B8D]">{user.email}</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={16} />
              {t('common.logout')}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
