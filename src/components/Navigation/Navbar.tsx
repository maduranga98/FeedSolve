import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Users,
  BarChart3,
  CreditCard,
  Zap,
  LayoutDashboard,
  LayoutTemplate,
  Inbox,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { Button } from "../Shared";
import { LanguageSwitcher } from "../Language/LanguageSwitcher";

type NavItem = {
  path: string;
  label: string;
  icon: ReactNode;
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
    {
      path: "/dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard size={15} />,
    },
    { path: "/submissions", label: "Submissions", icon: <Inbox size={15} /> },
    {
      path: "/templates",
      label: t("boards:templates.title"),
      icon: <LayoutTemplate size={15} />,
    },
    { path: "/team", label: t("team"), icon: <Users size={15} /> },
    { path: "/analytics", label: t("analytics"), icon: <BarChart3 size={15} /> },
    { path: "/billing", label: t("billing"), icon: <CreditCard size={15} /> },
    { path: "/integrations", label: t("integrations"), icon: <Zap size={15} /> },
  ];

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  useEffect(() => {
    const previousPaddingLeft = document.body.style.paddingLeft;
    document.body.style.paddingLeft = "17rem";

    return () => {
      document.body.style.paddingLeft = previousPaddingLeft;
    };
  }, []);

  return (
    <nav className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-[#E8ECF0] z-50 shadow-sm px-4 py-5 flex flex-col">
      <div className="mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img src="/logo.png" alt={"FeedSolve"} className="h-7" />
          <span className="text-sm font-semibold text-[#1E3A5F]">FeedSolve</span>
        </button>
      </div>

      {user && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`relative w-full inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 focus:outline-none text-left
                    ${
                      active
                        ? "text-[#2E86AB] bg-[#EBF5FB]"
                        : "text-[#6B7B8D] hover:text-[#1E3A5F] hover:bg-[#F4F7FA]"
                    }`}
                >
                  <span className={active ? "text-[#2E86AB]" : "text-[#9AABBF]"}>
                    {item.icon}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {user && (
        <div className="pt-4 border-t border-[#E8ECF0] space-y-3">
          <LanguageSwitcher />
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2E86AB] to-[#1E3A5F] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            <div className="text-left min-w-0">
              <p className="text-sm font-semibold text-[#1E3A5F] leading-tight truncate max-w-[130px]">
                {user.name}
              </p>
              <p className="text-xs text-[#9AABBF] truncate max-w-[130px]">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="ml-auto text-[#6B7B8D] hover:text-[#E74C3C]"
              title={t("logout")}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}
