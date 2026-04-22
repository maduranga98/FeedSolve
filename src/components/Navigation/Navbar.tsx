import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Users,
  BarChart3,
  CreditCard,
  Zap,
  LayoutDashboard,
  LayoutTemplate,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { Button } from "../Shared";
import { LanguageSwitcher } from "../Language/LanguageSwitcher";

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  useSubscription();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const navItems: NavItem[] = [
    { path: '/dashboard',   label: t('dashboard'),                           icon: <LayoutDashboard size={15} /> },
    { path: '/submissions', label: 'Submissions',                            icon: <Inbox size={15} /> },
    { path: '/templates',   label: t('boards:templates.title'),              icon: <LayoutTemplate size={15} /> },
    { path: '/team',        label: t('team'),                                icon: <Users size={15} /> },
    { path: '/analytics',   label: t('analytics'),                          icon: <BarChart3 size={15} /> },
    { path: '/billing',     label: t('billing'),                             icon: <CreditCard size={15} /> },
    { path: '/integrations',label: t('integrations'),                       icon: <Zap size={15} /> },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  return (
    <nav className="bg-white border-b border-[#E8ECF0] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <div className="flex items-center gap-8">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 flex-shrink-0 focus:outline-none"
            >
              <img src="/logo.png" alt={"FeedSolve"} className="h-7" />
              <span className="hidden sm:inline text-sm font-semibold text-[#1E3A5F]">
                FeedSolve
              </span>
            </button>

            {/* Nav links */}
            {user && (
              <div className="hidden md:flex items-center">
                {navItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`relative flex items-center gap-1.5 px-3 py-1 mx-0.5 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none
                        ${
                          active
                            ? "text-[#2E86AB] bg-[#EBF5FB]"
                            : "text-[#6B7B8D] hover:text-[#1E3A5F] hover:bg-[#F4F7FA]"
                        }`}
                    >
                      <span
                        className={active ? "text-[#2E86AB]" : "text-[#9AABBF]"}
                      >
                        {item.icon}
                      </span>
                      {item.label}
                      {active && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#2E86AB] rounded-full -mb-[9px]" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side */}
          {user && (
            <div className="flex items-center gap-3">
              <LanguageSwitcher />

              {/* User avatar + info */}
              <div className="flex items-center gap-2.5 pl-3 border-l border-[#E8ECF0]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#1E3A5F] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {initials}
                </div>
                <div className="hidden sm:block text-left min-w-0">
                  <p className="text-sm font-semibold text-[#1E3A5F] leading-tight truncate max-w-[120px]">
                    {user.name}
                  </p>
                  <p className="text-xs text-[#9AABBF] truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="ml-1 text-[#6B7B8D] hover:text-[#E74C3C]"
                  title={t("logout")}
                >
                  <LogOut size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
