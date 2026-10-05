import { Link, Outlet, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Bell,
  CircleHelp,
  FileUp,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Users,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { authService } from "@/lib/api/auth-service";
import { chatService } from "@/services/chatService";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/candidates", label: "Candidates", icon: Users },
  { to: "/search", label: "Find candidates", icon: Search },
  { to: "/upload", label: "Upload resumes", icon: FileUp },
  { to: "/chat", label: "Chat", icon: MessageSquare },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function Brand() {
  return (
    <Link
      to="/"
      className="flex items-center gap-0 rounded-lg px-6 py-2.5 transition-opacity hover:opacity-90"
      aria-label="ATS Flow dashboard"
    >
      <img
        src="/logo.png"
        alt="ATS Flow Logo"
        className="size-18 -ml-2 rounded-xl object-contain drop-shadow-xs"
      />
      <span className="flex flex-col items-start text-xl leading-tight font-bold tracking-tight text-foreground font-sans">
        <span>TS</span>
        <span>Flow</span>
      </span>
    </Link>
  );
}

import { useChat } from "@/hooks/useChat";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { unreadCount } = useChat();
  return (
    <nav aria-label="Workspace" className="space-y-1">
      {links.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={onNavigate}
            className={`flex min-h-10 items-center justify-between rounded-md px-3 text-sm transition-colors ${active ? "bg-accent-soft font-medium text-foreground ring-1 ring-accent/20" : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"}`}
          >
            <div className="flex items-center gap-3">
              <Icon size={16} strokeWidth={1.8} aria-hidden="true" />
              {label}
            </div>
            {to === "/chat" && unreadCount > 0 && (
              <span className="flex h-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-medium text-accent-foreground">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarContents({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; role?: string; company?: string; profilePicture?: string | null }>({
    name: "Recruiter",
    role: "recruiter",
    company: "Meridian Studio",
    profilePicture: null,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      authService.getCurrentUser().then((u) => {
        if (u && u.name) {
          setUser({
            name: u.name,
            role: u.role || "recruiter",
            company: u.company || "Meridian Studio",
            profilePicture: u.profilePicture || null,
          });
        }
      });
    }
  }, []);

  const initials = user.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
    : "RC";

  return (
    <div className="flex h-full flex-col px-3 py-4">
      <Brand />
      <div className="mb-2 mt-7 px-3 font-mono text-[9px] uppercase text-muted-foreground">
        Workspace
      </div>
      <SidebarNav {...(onNavigate ? { onNavigate } : {})} />
      <div className="mt-auto pt-6">
        <div className="flex items-center gap-3 border-t border-border px-2 pt-3">
          {user.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={user.name}
              className="size-9 rounded-md object-cover border border-border"
            />
          ) : (
            <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-medium">{user.name}</span>
            <span className="mt-0.5 block truncate text-[11px] text-muted-foreground capitalize">
              {user.role ? user.role.replace(/_/g, " ") : "recruiter"}
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            onClick={() => {
              void authService.logout().then(() => navigate({ to: "/login" }));
            }}
          >
            <LogOut size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceLayout() {
  const [open, setOpen] = useState(false);
  const [userName, setUserName] = useState("Recruiter");
  const [userPicture, setUserPicture] = useState<string | null>(null);
  const [authState, setAuthState] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      if (typeof window === "undefined") return;

      if (!authService.isAuthenticated()) {
        if (isMounted) setAuthState("unauthenticated");
        const targetUrl = window.location.pathname + window.location.search;
        const searchObj: { redirect?: string } = {};
        if (targetUrl && targetUrl !== "/" && targetUrl !== "/login") {
          searchObj.redirect = targetUrl;
        }
        navigate({ to: "/login", search: searchObj });
        return;
      }

      try {
        const u = await authService.getCurrentUser();
        if (isMounted) {
          if (u && u.name) setUserName(u.name);
          if (u && u.profilePicture) setUserPicture(u.profilePicture);
          setAuthState("authenticated");
          // Reconnect chat service to ensure WebSocket establishes if logging in
          chatService.reconnect();
        }
      } catch {
        if (isMounted) {
          authService.logoutLocal();
          setAuthState("unauthenticated");
          const targetUrl = window.location.pathname + window.location.search;
          const searchObj: { redirect?: string } = {};
          if (targetUrl && targetUrl !== "/" && targetUrl !== "/login") {
            searchObj.redirect = targetUrl;
          }
          navigate({ to: "/login", search: searchObj });
        }
      }
    };

    verifyAuth();

    // Re-check authentication when browser popstate (back/forward button) or pageshow (bfcache) triggers
    const handleNavigation = () => {
      if (!authService.isAuthenticated()) {
        authService.logoutLocal();
        setAuthState("unauthenticated");
        navigate({ to: "/login" });
      }
    };

    window.addEventListener("popstate", handleNavigation);
    window.addEventListener("pageshow", handleNavigation);

    return () => {
      isMounted = false;
      window.removeEventListener("popstate", handleNavigation);
      window.removeEventListener("pageshow", handleNavigation);
    };
  }, [pathname, navigate]);

  if (authState === "loading") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
        <div className="flex flex-col items-center gap-2 text-center animate-in fade-in duration-300">
          <div className="flex items-center gap-0">
            <img
              src="/logo.png"
              alt="ATS Flow Logo"
              className="size-18 -ml-2 rounded-2xl object-contain drop-shadow-md"
            />
            <h2 className="flex flex-col items-start text-3xl font-bold leading-tight tracking-tight text-foreground font-sans">
              <span>TS</span>
              <span>Flow</span>
            </h2>
          </div>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin text-foreground" />
              <span>Verifying workspace authorization...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authState === "unauthenticated") {
    return null;
  }

  const headerInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const current = links.find(
    (item) => item.to === pathname || (item.to !== "/" && pathname.startsWith(item.to)),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-border bg-surface/60 backdrop-blur-xl md:block">
        <SidebarContents />
      </aside>
      <div className="min-w-0 md:pl-56">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-lg">
          <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label="Open navigation"
                >
                  <Menu size={18} />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetTitle className="sr-only">Workspace navigation</SheetTitle>
                <SidebarContents onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <div className="relative min-w-0 flex-1 md:max-w-md">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                aria-label="Search candidates"
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    window.location.assign(
                      `/search?q=${encodeURIComponent(event.currentTarget.value)}`,
                    );
                }}
                placeholder="Search candidates, roles, skills…"
                className="h-9 w-full rounded-md border border-border bg-surface/70 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="ml-auto hidden items-center gap-2 lg:flex">
              {/* <span className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground">
                Enterprise Mode
              </span> */}
              {/* <span className="rounded bg-secondary px-2 py-1 font-mono text-[10px] text-muted-foreground">
                JWT Auth Active
              </span> */}
            </div>
            <Button asChild size="sm" className="shrink-0">
              <Link to="/upload">
                <FileUp size={15} /> <span className="hidden sm:inline">New upload</span>
                <span className="sm:hidden">Upload</span>
              </Link>
            </Button>
            <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications">
              <Bell size={16} />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Help" title="Help">
              <CircleHelp size={16} />
            </Button>
            {userPicture ? (
              <img
                src={userPicture}
                alt={userName}
                className="hidden size-8 rounded-md object-cover border border-border sm:block"
              />
            ) : (
              <span className="hidden size-8 place-items-center rounded-md bg-primary text-primary-foreground text-xs font-semibold sm:grid">
                {headerInitials || "RC"}
              </span>
            )}
          </div>
          <div className="border-t border-border px-4 py-2 font-mono text-[9px] uppercase text-muted-foreground md:hidden">
            {current?.label ?? "Workspace"}
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

