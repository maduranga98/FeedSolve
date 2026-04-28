import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Mail, Lock, User, Building2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button, Input } from "../../components/Shared";
import {
  validatePassword,
  validateEmail,
  sanitizeInput,
} from "../../lib/security";
function AppleIcon({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function SignUp() {
  const navigate = useNavigate();
  const { signUp, loginWithGoogle, loginWithApple } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Sign Up | FeedSolve";
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    companyName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(
    null,
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("forms:validation.required");
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t("forms:validation.min_length", { count: 2 });
    }

    if (!formData.email.trim()) {
      newErrors.email = t("forms:validation.required");
    } else {
      const emailValidation = validateEmail(formData.email);
      if (!emailValidation.valid) {
        newErrors.email = emailValidation.reason || t("forms:validation.email");
      }
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = t("forms:validation.required");
    } else if (formData.companyName.trim().length < 2) {
      newErrors.companyName = t("forms:validation.min_length", { count: 2 });
    }

    if (!formData.password) {
      newErrors.password = t("forms:validation.required");
    } else {
      const passwordValidation = validatePassword(formData.password);
      if (!passwordValidation.valid) {
        newErrors.password =
          passwordValidation.feedback[0] || t("errors:weak_password");
        setPasswordFeedback(passwordValidation.feedback);
      } else {
        setPasswordFeedback([]);
      }
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t("errors:password_mismatch");
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
        sanitizeInput(formData.companyName),
      );
      navigate("/dashboard");
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : t("errors:something_went_wrong"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setSocialLoading("google");
    setErrors({});
    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : t("errors:something_went_wrong"),
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAppleSignUp = async () => {
    setSocialLoading("apple");
    setErrors({});
    try {
      await loginWithApple();
      navigate("/dashboard");
    } catch (error) {
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : t("errors:something_went_wrong"),
      });
    } finally {
      setSocialLoading(null);
    }
  };

  const anyLoading = isLoading || socialLoading !== null;

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12 bg-gradient-to-br from-[#1E3A5F] via-[#2A567F] to-[#2E86AB] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />

        <div className="flex items-center gap-3 relative z-10">
          <img
            src="/logo.png"
            alt="FeedSolve"
            className="h-8 w-8 brightness-0 invert"
          />
          <span className="text-2xl font-bold">FeedSolve</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-snug mb-4">
            Start collecting
            <br />
            feedback today.
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Set up your first feedback board in minutes. No credit card required
            to get started.
          </p>

          <ul className="mt-8 space-y-3">
            {[
              "Unlimited submissions on the free plan",
              "Real-time analytics & reporting",
              "Team collaboration built-in",
              "Multi-language support",
            ].map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-white/80"
              >
                <span className="w-5 h-5 rounded-full bg-[#27AE60]/30 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-3 h-3 text-[#2ECC71]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-white/40 text-xs relative z-10">
          © {new Date().getFullYear()} FeedSolve. All rights reserved.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F7FA] overflow-y-auto">
        <div className="lg:hidden mb-8 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="FeedSolve" className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1E3A5F]">FeedSolve</span>
        </div>

        <div className="w-full max-w-sm fade-in">
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">
              {t("forms:signup.create_account")}
            </h1>
            <p className="text-sm text-[#6B7B8D]">
              {t("forms:signup.subtitle")}
            </p>
          </div>

          {errors.submit && (
            <div className="mb-5 p-3.5 bg-[#FEF0EF] border border-[#F5C6C2] rounded-lg flex items-start gap-2.5">
              <svg
                className="w-4 h-4 text-[#E74C3C] mt-0.5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-[#C0392B]">{errors.submit}</p>
            </div>
          )}

          {/* Social sign-up */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={anyLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#E8ECF0] rounded-xl bg-white hover:bg-[#F8FAFB] text-sm font-medium text-[#1E3A5F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {socialLoading === "google" ? (
                <span className="w-4 h-4 border-2 border-[#6B7B8D] border-t-transparent rounded-full animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Google
            </button>
            <button
              type="button"
              onClick={handleAppleSignUp}
              disabled={anyLoading}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-[#1E3A5F] rounded-xl bg-[#1E3A5F] hover:bg-[#163056] text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {socialLoading === "apple" ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <AppleIcon size={24} />
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
              <span className="px-3 bg-[#F4F7FA] text-[#9AABBF] font-medium">
                or create an account with email
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t("forms:signup.full_name")}
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              leftIcon={<User size={15} />}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              error={errors.name}
            />
            <Input
              label={t("forms:signup.email")}
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              leftIcon={<Mail size={15} />}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />
            <Input
              label={t("forms:signup.company_name")}
              type="text"
              placeholder="Acme Inc."
              autoComplete="organization"
              leftIcon={<Building2 size={15} />}
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              error={errors.companyName}
            />
            <Input
              label={t("forms:signup.password")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={15} />}
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              helperText={t("forms:signup.password_hint")}
            />
            {passwordFeedback.length > 0 && (
              <div className="space-y-1">
                {passwordFeedback.map((msg, i) => (
                  <p
                    key={i}
                    className="text-xs text-[#E74C3C] flex items-center gap-1"
                  >
                    <span>•</span> {msg}
                  </p>
                ))}
              </div>
            )}
            <Input
              label={t("forms:signup.confirm_password")}
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock size={15} />}
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              error={errors.confirmPassword}
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={anyLoading}
              className="w-full mt-2"
              size="lg"
            >
              {t("forms:signup.create_account")}
            </Button>
          </form>

          <p className="text-center text-sm text-[#6B7B8D] mt-6">
            {t("forms:signup.have_account")}{" "}
            <Link
              to="/login"
              className="text-[#2E86AB] font-medium hover:underline"
            >
              {t("forms:signup.login_link")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
