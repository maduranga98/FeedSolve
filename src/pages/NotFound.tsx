import { Link } from 'react-router-dom';
import { Button } from '../components/Shared';

export function NotFound() {
  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#1E3A5F] mb-4">404</h1>
        <p className="text-xl text-[#6B7B8D] mb-8">Page not found</p>
        <Link to="/">
          <Button variant="primary">Go Home</Button>
        </Link>
      </div>
    </div>
  );
}
