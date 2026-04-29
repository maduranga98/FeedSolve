import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { Lock, User } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { createUser, getInvitationByCode, acceptInvitation } from '../../lib/firestore';
import { Button, Input, LoadingSpinner } from '../../components/Shared';
import { validatePassword, sanitizeInput } from '../../lib/security';
import { getFirebaseErrorMessage } from '../../lib/firebase-errors';
import type { TeamInvitation } from '../../types';

export function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code') ?? '';

  const [invitation, setInvitation] = useState<TeamInvitation | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [inviteError, setInviteError] = useState('');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.title = 'Accept Invitation | FeedSolve';
  }, []);

  useEffect(() => {
    if (!code) {
      setInviteError('Invalid or missing invitation link.');
      setLoadingInvite(false);
      return;
    }
    getInvitationByCode(code)
      .then((inv) => {
        if (!inv) {
          setInviteError('This invitation link is invalid or has already been used.');
        } else if (inv.status !== 'pending') {
          setInviteError('This invitation has already been accepted or has expired.');
        } else {
          setInvitation(inv);
        }
      })
      .catch(() => setInviteError('Failed to load invitation. Please try again.'))
      .finally(() => setLoadingInvite(false));
  }, [code]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters.';
    }
    const pwdCheck = validatePassword(password);
    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (!pwdCheck.valid) {
      newErrors.password = pwdCheck.feedback[0] || 'Password is too weak.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation || !validate()) return;
    setIsSubmitting(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, invitation.email, password);
      await createUser(result.user.uid, invitation.email, sanitizeInput(name), invitation.companyId, invitation.role as import('../../types').UserRole);
      await acceptInvitation(invitation.id);
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: getFirebaseErrorMessage(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-12 bg-gradient-to-br from-[#1E3A5F] via-[#2A567F] to-[#2E86AB] text-white relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5" />
        <div className="flex items-center gap-3 relative z-10">
          <img src="/logo.png" alt="FeedSolve" className="h-8 w-8 brightness-0 invert" />
          <span className="text-2xl font-bold">FeedSolve</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold leading-snug mb-4">
            You've been invited<br />to collaborate.
          </h2>
          <p className="text-white/70 text-base leading-relaxed">
            Create your account to join your team on FeedSolve and start collaborating on feedback.
          </p>
        </div>
        <p className="text-white/40 text-xs relative z-10">
          © {new Date().getFullYear()} FeedSolve. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#F4F7FA] overflow-y-auto">
        <div className="lg:hidden mb-8 flex items-center justify-center gap-2">
          <img src="/logo.png" alt="FeedSolve" className="h-8 w-8" />
          <span className="text-xl font-bold text-[#1E3A5F]">FeedSolve</span>
        </div>

        <div className="w-full max-w-sm fade-in">
          {loadingInvite ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : inviteError ? (
            <div className="text-center">
              <div className="mb-4 p-4 bg-[#FEF0EF] border border-[#F5C6C2] rounded-lg">
                <p className="text-sm text-[#C0392B]">{inviteError}</p>
              </div>
              <Link to="/login" className="text-sm text-[#2E86AB] font-medium hover:underline">
                Go to login
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <h1 className="text-2xl font-bold text-[#1E3A5F] mb-1">Accept your invitation</h1>
                <p className="text-sm text-[#6B7B8D]">
                  You were invited as <strong>{invitation!.role}</strong>. Create a password to get started.
                </p>
              </div>

              {errors.submit && (
                <div className="mb-5 p-3.5 bg-[#FEF0EF] border border-[#F5C6C2] rounded-lg">
                  <p className="text-sm text-[#C0392B]">{errors.submit}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1E3A5F] mb-1">Email</label>
                  <input
                    type="email"
                    value={invitation!.email}
                    disabled
                    className="w-full px-3 py-2.5 border border-[#E8ECF0] rounded-xl bg-[#EAEFF4] text-[#6B7B8D] text-sm cursor-not-allowed"
                  />
                </div>
                <Input
                  label="Full name"
                  type="text"
                  placeholder="John Doe"
                  autoComplete="name"
                  leftIcon={<User size={15} />}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock size={15} />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  leftIcon={<Lock size={15} />}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                />
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  disabled={isSubmitting}
                  className="w-full mt-2"
                  size="lg"
                >
                  Create account & join team
                </Button>
              </form>

              <p className="text-center text-sm text-[#6B7B8D] mt-6">
                Already have an account?{' '}
                <Link to="/login" className="text-[#2E86AB] font-medium hover:underline">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
