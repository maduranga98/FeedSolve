import { useEffect, type ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Users,
  BarChart3,
  CreditCard,
  LayoutDashboard,
  LayoutTemplate,
  Inbox,
  Paintbrush,
  ClipboardList,
  FileText,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { useTemplates } from "../../hooks/useTemplates";
import { hasPermission } from "../../lib/rbac";
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
  const { templates } = useTemplates();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const allNavItems: Array<NavItem & { permission?: Parameters<typeof hasPermission>[1] }> = [
    {
      path: "/dashboard",
      label: t("dashboard"),
      icon: <LayoutDashboard size={15} />,
    },
    { path: "/submissions", label: t("submissions"), icon: <Inbox size={15} />, permission: "submissions:read" },
    {
      path: "/templates",
      label: t("boards:templates.title"),
      icon: <LayoutTemplate size={15} />,
    },
    { path: "/team", label: t("team"), icon: <Users size={15} />, permission: "team:read" },
    { path: "/analytics", label: t("analytics"), icon: <BarChart3 size={15} />, permission: "analytics:read" },
    { path: "/billing", label: t("billing"), icon: <CreditCard size={15} />, permission: "billing:read" },
    { path: "/branding", label: t("branding"), icon: <Paintbrush size={15} /> },
    { path: "/audit-logs", label: t("audit_logs"), icon: <ClipboardList size={15} />, permission: "audit:read" },
    { path: "/reply-templates", label: "Reply Templates", icon: <FileText size={15} /> },
  ];

  const navItems = allNavItems.filter((item) => {
    if (!user) return false;
    const normalizedRole = user.role.toLowerCase();
    if (normalizedRole === "owner" || normalizedRole === "admin") return true;
    if (!item.permission) return false;
    return hasPermission(user.role, item.permission);
  });

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
                  {item.path === '/reply-templates' && templates.length > 0 && (
                    <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#EBF5FB] text-[#2E86AB]">
                      {templates.length}
                    </span>
                  )}
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
