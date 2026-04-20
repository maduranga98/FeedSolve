import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../Shared';

export function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-[#D3D1C7] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E3A5F]">FeedSolve</h1>
        </div>

        {user && (
          <div className="flex items-center gap-4">
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
              Logout
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
