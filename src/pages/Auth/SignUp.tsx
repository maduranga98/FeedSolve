import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
          <p className="text-[#6B7B8D]">{t('forms:signup.subtitle')}</p>
        </div>

        {errors.submit && (
          <div className="mb-4 p-4 bg-[#FFE5E5] border border-[#E74C3C] rounded-lg">
            <p className="text-sm text-[#E74C3C]">{errors.submit}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('forms:signup.full_name')}
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            error={errors.name}
          />

          <Input
            label={t('forms:signup.email')}
            type="email"
            placeholder="you@company.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            error={errors.email}
          />

          <Input
            label={t('forms:signup.company_name')}
            type="text"
            placeholder="Your Company"
            value={formData.companyName}
            onChange={(e) =>
              setFormData({ ...formData, companyName: e.target.value })
            }
            error={errors.companyName}
          />

          <Input
            label={t('forms:signup.password')}
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            error={errors.password}
            helperText={t('forms:signup.password_hint')}
          />
          {passwordFeedback.length > 0 && (
            <div className="text-sm text-[#E74C3C]">
              {passwordFeedback.map((msg, i) => (
                <div key={i}>• {msg}</div>
              ))}
            </div>
          )}

          <Input
            label={t('forms:signup.confirm_password')}
            type="password"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            error={errors.confirmPassword}
          />

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full"
          >
            {t('forms:signup.create_account')}
          </Button>
        </form>

        <p className="text-center text-sm text-[#6B7B8D] mt-6">
          {t('forms:signup.have_account')}{' '}
          <Link to="/login" className="text-[#2E86AB] hover:underline">
            {t('forms:signup.login_link')}
          </Link>
        </p>
      </div>
    </div>
  );
}
