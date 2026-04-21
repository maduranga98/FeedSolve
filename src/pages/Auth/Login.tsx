import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/Shared';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) {
      newErrors.email = t('forms:validation.required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('forms:validation.email');
    }
    if (!formData.password) newErrors.password = t('forms:validation.required');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : t('errors:something_went_wrong') });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-[#1E3A5F] via-[#2A567F] to-[#2E86AB] text-white relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/5" />

        <img src="/logo.png" alt="FeedSolve" className="h-9 brightness-0 invert relative z-10" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Turn feedback into<br />actionable insights.
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Collect, manage, and resolve customer feedback in one place. Join thousands of teams already using FeedSolve.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { value: '10k+', label: 'Teams' },
              { value: '2M+', label: 'Submissions' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9★', label: 'Rating' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-white/60 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-xs relative z-10">© {new Date().getFullYear()} FeedSolve. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F7FA]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="FeedSolve" className="h-9 mx-auto" />
        </div>

        <div className="w-full max-w-sm fade-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">{t('forms:login.sign_in')}</h1>
            <p className="text-sm text-[#6B7B8D]">{t('forms:login.subtitle')}</p>
          </div>

          {errors.submit && (
            <div className="mb-5 p-3.5 bg-[#FEF0EF] border border-[#F5C6C2] rounded-lg flex items-start gap-2.5">
              <svg className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-[#C0392B]">{errors.submit}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('forms:login.email')}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              leftIcon={<Mail size={15} />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label={t('forms:login.password')}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock size={15} />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
            />

            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-2" size="lg">
              {t('forms:login.sign_in')}
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7B8D] mt-6">
            {t('forms:login.no_account')}{' '}
            <Link to="/signup" className="text-[#2E86AB] font-medium hover:underline">
              {t('forms:login.signup_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
