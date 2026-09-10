import { useCallback, useEffect, useState, type ReactNode } from "react";
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
  Settings,
  ShieldAlert,
  Bell,
  Lock,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import { useTemplates } from "../../hooks/useTemplates";
import { hasPermission } from "../../lib/rbac";
import { Button } from "../Shared";
import { LanguageSwitcher } from "../Language/LanguageSwitcher";
import { ThemeToggle } from "../Shared/ThemeToggle";

type NavItem = {
  path: string;
  label: string;
  icon: ReactNode;
  locked?: boolean;
  lockedMessage?: string;
};

const navButtonBase =
  "relative w-full inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-2xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-bc0694a)] text-left";

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const { subscription } = useSubscription();
  const { templates } = useTemplates();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  /*
   * Navigating away — the browser back button included — must never leave the
   * drawer up. Adjusting during render rather than in an effect avoids a frame
   * where the drawer is still painted over the new page.
   */
  const [renderedPath, setRenderedPath] = useState(location.pathname);
  if (renderedPath !== location.pathname) {
    setRenderedPath(location.pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  const handleLogout = async () => {
    closeDrawer();
    await logout();
    navigate("/login");
  };

  const go = (path: string) => {
    closeDrawer();
    navigate(path);
  };

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === path
      : location.pathname.startsWith(path);

  const escalationLocked = !["growth", "business"].includes(subscription?.tier ?? "free");

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
    { path: "/reply-templates", label: t("nav.reply_templates"), icon: <FileText size={15} /> },
    {
      path: "/dashboard/settings/escalation-rules",
      label: t("nav.escalation_rules"),
      icon: <ShieldAlert size={15} />,
      permission: "company:update",
      locked: escalationLocked,
      lockedMessage: t("nav.escalation_locked"),
    },
    {
      path: "/notifications",
      label: t("nav.notifications"),
      icon: <Bell size={15} />,
      permission: "company:update",
    },
    { path: "/analytics", label: t("nav.analytics"), icon: <BarChart3 size={15} />, permission: "analytics:read" },
    { path: "/branding", label: t("branding"), icon: <Paintbrush size={15} /> },
    { path: "/team", label: t("team"), icon: <Users size={15} />, permission: "team:read" },
    { path: "/billing", label: t("billing"), icon: <CreditCard size={15} />, permission: "billing:read" },
    { path: "/audit-logs", label: t("audit_logs"), icon: <ClipboardList size={15} />, permission: "audit:read" },
    { path: "/settings", label: t("nav.settings"), icon: <Settings size={15} />, permission: "company:update" },
  ];

  const helpNavItem: NavItem = {
    path: "/help",
    label: t("nav.help_support"),
    icon: <HelpCircle size={15} />,
  };

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

  /*
   * The inset that keeps page content clear of the fixed chrome lives in
   * index.css so it can differ per breakpoint; the class is all this needs
   * to toggle.
   */
  useEffect(() => {
    document.body.classList.add("fs-has-sidebar");
    return () => document.body.classList.remove("fs-has-sidebar");
  }, []);

  useEffect(() => {
    document.body.classList.toggle("fs-drawer-open", drawerOpen);
    return () => document.body.classList.remove("fs-drawer-open");
  }, [drawerOpen]);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  const renderNavButton = (item: NavItem) => {
    const active = isActive(item.path);
    return (
      <button
        key={item.path}
        onClick={() => go(item.path)}
        aria-current={active ? "page" : undefined}
        className={`${navButtonBase} ${
          active
            ? "text-[var(--c-tc0694a)] bg-[var(--c-sf5e6df)]"
            : "text-[var(--c-t78716c)] hover:text-[var(--c-t1c1917)] hover:bg-[var(--c-sf0eae5)]"
        }`}
      >
        <span className={active ? "text-[var(--c-tc0694a)]" : "text-[var(--c-ta89890)]"}>
          {item.icon}
        </span>
        <span className="truncate">{item.label}</span>
        {item.locked && (
          <span className="ms-auto text-[var(--c-td4860f)]" title={item.lockedMessage}>
            <Lock size={13} />
          </span>
        )}
        {item.path === "/reply-templates" && templates.length > 0 && (
          <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[var(--c-sf5e6df)] text-[var(--c-tc0694a)]">
            {templates.length}
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Mobile top bar — replaces the sidebar below `lg`. */}
      <header className="lg:hidden fixed inset-x-0 top-0 z-40 h-14 flex items-center gap-2 px-4 bg-[var(--c-sffffff)] border-b border-[var(--c-be0d6cf)] shadow-sm">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label={t("nav.open_menu", "Open menu")}
          aria-expanded={drawerOpen}
          className="-ms-2 p-2 rounded-xl text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-bc0694a)]"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 min-w-0 focus:outline-none"
        >
          <img src="/logo.png" alt="FeedSolve" className="h-6 w-auto" />
          <span className="text-sm font-semibold text-[var(--c-t1c1917)] truncate">
            FeedSolve
          </span>
        </button>
        <div className="ms-auto flex items-center gap-1">
          <ThemeToggle />
        </div>
      </header>

      {/* Scrim — only rendered while the drawer is up. */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      <nav
        aria-label={t("nav.primary", "Primary")}
        className={`fixed inset-y-0 start-0 z-50 w-[17rem] max-w-[85vw] bg-[var(--c-sffffff)] border-e border-[var(--c-be0d6cf)] shadow-sm px-4 py-5 flex flex-col
          transform transition-transform duration-200 ease-out will-change-transform
          lg:translate-x-0 lg:transition-none
          ${drawerOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"}`}
      >
        <div className="mb-6 flex items-center gap-2">
          <button
            onClick={() => go("/dashboard")}
            className="flex items-center gap-2 min-w-0 focus:outline-none"
          >
            <img src="/logo.png" alt="FeedSolve" className="h-7 w-auto" />
            <span className="text-sm font-semibold text-[var(--c-t1c1917)] truncate">
              FeedSolve
            </span>
          </button>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label={t("nav.close_menu", "Close menu")}
            className="lg:hidden ms-auto -me-2 p-2 rounded-xl text-[var(--c-t78716c)] hover:bg-[var(--c-sf0eae5)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-bc0694a)]"
          >
            <X size={18} />
          </button>
        </div>

        {user && (
          <div className="flex-1 overflow-y-auto -mx-1 px-1">
            <div className="flex flex-col gap-1.5">{navItems.map(renderNavButton)}</div>
          </div>
        )}

        {user && (
          <div className="pt-3 mt-2 border-t border-[var(--c-be0d6cf)]">
            {renderNavButton(helpNavItem)}
          </div>
        )}

        {user && (
          <div className="pt-4 border-t border-[var(--c-be0d6cf)] space-y-3">
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle className="ms-auto hidden lg:inline-flex" />
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--c-sc0694a)] to-[var(--c-s1c1917)] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {initials}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--c-t1c1917)] leading-tight truncate">
                  {user.name}
                </p>
                <p className="text-xs text-[var(--c-ta89890)] truncate">{user.email}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ms-auto flex-shrink-0 text-[var(--c-t78716c)] hover:text-[var(--c-tc0392b)]"
                title={t("logout")}
              >
                <LogOut size={16} />
              </Button>
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
