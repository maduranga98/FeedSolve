import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, Home, Search } from 'lucide-react';
import { Button } from '../components/Shared';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[var(--c-sf1f5f8)] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-[var(--c-sebf5fb)] rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-[var(--c-t2e86ab)]" />
        </div>

        <h1 className="text-6xl font-bold text-[var(--c-t1e3a5f)] mb-2">404</h1>
        <h2 className="text-xl font-semibold text-[var(--c-t1e3a5f)] mb-3">Page not found</h2>
        <p className="text-[var(--c-t6b7b8d)] mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button
            variant="primary"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2">
              <Home size={16} />
              Dashboard
            </Button>
          </Link>
        </div>

        <div className="border-t border-[var(--c-be8ecf0)] pt-6">
          <p className="text-sm text-[var(--c-t9aabbf)] mb-3">Looking for something specific?</p>
          <div className="flex flex-col gap-2 text-sm">
            <Link to="/track" className="flex items-center justify-center gap-2 text-[var(--c-t2e86ab)] hover:underline">
              <Search size={14} />
              Track a submission
            </Link>
            <Link to="/dashboard" className="text-[var(--c-t2e86ab)] hover:underline">
              View your boards
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
