import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Lock, User, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/Shared';
import { validatePassword, validateEmail, sanitizeInput } from '../../lib/security';

export function SignUp() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('forms:validation.required');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('forms:validation.min_length', { count: 2 });
    }

    if (!formData.email.trim()) {
      newErrors.email = t('forms:validation.required');
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.reason || t('forms:validation.email');
      }
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('forms:validation.required');
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = t('forms:validation.min_length', { count: 2 });
    }

    if (!formData.password) {
      newErrors.password = t('forms:validation.required');
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password = passwordValidation.feedback[0] || t('errors:weak_password');
        setPasswordFeedback(passwordValidation.feedback);
      } else {
        setPasswordFeedback([]);
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('errors:password_mismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await signUp(
        formData.email.toLowerCase().trim(),
        formData.password,
        sanitizeInput(formData.name),
        sanitizeInput(formData.companyName)
      );
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
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12 bg-gradient-to-br from-[#1E3A5F] via-[#2A567F] to-[#2E86AB] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />

        <img src="/logo.png" alt="FeedSolve" className="h-9 brightness-0 invert relative z-10" />

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Start collecting<br />feedback today.
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Set up your first feedback board in minutes. No credit card required to get started.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              'Unlimited submissions on the free plan',
              'Real-time analytics & reporting',
              'Team collaboration built-in',
              'Multi-language support',
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/80">
                <span className="w-5 h-5 rounded-full bg-[#27AE60]/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3 h-3 text-[#2ECC71]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-xs relative z-10">© {new Date().getFullYear()} FeedSolve. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F7FA] overflow-y-auto">
        <div className="lg:hidden mb-8">
          <img src="/logo.png" alt="FeedSolve" className="h-9 mx-auto" />
        </div>

        <div className="w-full max-w-sm fade-in">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">{t('forms:signup.create_account')}</h1>
            <p className="text-sm text-[#6B7B8D]">{t('forms:signup.subtitle')}</p>
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
              label={t('forms:signup.full_name')}
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              leftIcon={<User size={15} />}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
            />
            <Input
              label={t('forms:signup.email')}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              leftIcon={<Mail size={15} />}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={errors.email}
            />
            <Input
              label={t('forms:signup.company_name')}
              type="text"
              placeholder="Acme Inc."
              autoComplete="organization"
              leftIcon={<Building2 size={15} />}
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              error={errors.companyName}
            />
            <Input
              label={t('forms:signup.password')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={15} />}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              helperText={t('forms:signup.password_hint')}
            />
            {passwordFeedback.length > 0 && (
              <div className="space-y-1">
                {passwordFeedback.map((msg, i) => (
                  <p key={i} className="text-xs text-[#E74C3C] flex items-center gap-1">
                    <span>•</span> {msg}
                  </p>
                ))}
              </div>
            )}
            <Input
              label={t('forms:signup.confirm_password')}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={15} />}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
            />

            <Button type="submit" variant="primary" isLoading={isLoading} className="w-full mt-2" size="lg">
              {t('forms:signup.create_account')}
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7B8D] mt-6">
            {t('forms:signup.have_account')}{' '}
            <Link to="/login" className="text-[#2E86AB] font-medium hover:underline">
              {t('forms:signup.login_link')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
