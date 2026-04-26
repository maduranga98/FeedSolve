import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/Shared';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 814 1000" fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 395.8 38 283.2 38 273.4c0-63.1 24.1-168.2 76.5-237.3C158.6 67.9 224.7 32 290.5 32c66.8 0 109.9 42.8 165.4 42.8 50.7 0 102.3-45.9 168.9-45.9 43.9 0 149.5 3.9 208.5 105.5zm-161.9-170.3c27.9-40.4 48.6-96.7 48.6-153 0-7.8-.6-15.6-1.9-23.4-45.9 1.9-104 30.6-138.8 75.1-28.5 36.1-53.4 92.8-53.4 150.7 0 8.4 1.3 16.8 1.9 19.4 3.2.6 8.4 1.3 13.6 1.3 41.1 0 92.8-27.2 129.9-70.1z"/>
    </svg>
  );
}

export function Login() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

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

  const handleGoogleLogin = async () => {
    setSocialLoading('google');
    setErrors({});
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrors({ submit: error instanceof Error ? error.message : t('errors:something_went_wrong') });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleLogin = async () => {
    setSocialLoading('apple');
    setErrors({});
    try {
      await loginWithApple();
      navigate('/dashboard');
    } catch (error: any) {
      if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
        setErrors({ submit: error instanceof Error ? error.message : t('errors:something_went_wrong') });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const anyLoading = isLoading || socialLoading !== null;

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-[#1E3A5F] via-[#2A567F] to-[#2E86AB] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute top-1/3 right-8 w-40 h-40 rounded-full bg-white/5" />

        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="FeedSolve" className="h-8 w-8 brightness-0 invert" />
          <span className="text-2xl font-bold">FeedSolve</span>
        </div>

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
        <div className="lg:hidden mb-8 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="FeedSolve" className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1E3A5F]">FeedSolve</span>
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

          {/* Social login */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={anyLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E8ECF0] rounded-xl bg-white hover:bg-[#F8FAFB] text-sm font-medium text-[#1E3A5F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {socialLoading === 'google' ? (
                <span className="w-4 h-4 border-2 border-[#6B7B8D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Google
            </button>
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={anyLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#1E3A5F] rounded-xl bg-[#1E3A5F] hover:bg-[#163056] text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {socialLoading === 'apple' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AppleIcon />
              )}
              Apple
            </button>
          </div>

          {/* Divider */}
          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8ECF0]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#F4F7FA] text-[#9AABBF] font-medium">or sign in with email</span>
            </div>
          </div>

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

            <Button type="submit" variant="primary" isLoading={isLoading} disabled={anyLoading} className="w-full mt-2" size="lg">
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
