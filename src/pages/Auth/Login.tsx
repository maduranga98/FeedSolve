import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/Shared';

export function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
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
      setErrors({
        submit: error instanceof Error ? error.message : t('errors:something_went_wrong'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-8">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="FeedSolve" className="h-12 mx-auto mb-4" />
          <p className="text-[#6B7B8D]">{t('forms:login.subtitle')}</p>
        </div>

        {errors.submit && (
          <div className="mb-4 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
            <p className="text-sm text-[#E74C3C]">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('forms:login.email')}
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />

          <Input
            label={t('forms:login.password')}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full"
          >
            {t('forms:login.sign_in')}
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7B8D] mt-6">
          {t('forms:login.no_account')}{' '}
          <Link to="/signup" className="text-[#2E86AB] hover:underline">
            {t('forms:login.signup_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
