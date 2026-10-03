import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/lib/api/auth-service";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => {
    const redirectVal = search["redirect"];
    if (typeof redirectVal === "string" && redirectVal) {
      return { redirect: redirectVal };
    }
    return {};
  },
  beforeLoad: ({ search }: { search: { redirect?: string } }) => {
    if (typeof window !== "undefined" && authService.isAuthenticated()) {
      throw redirect({
        to: search.redirect || "/dashboard",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign In | ATS flow" },
      { name: "description", content: "Sign in to your ATS flow recruiter workspace." },
      { property: "og:title", content: "Sign In | ATS flow" },
      { property: "og:description", content: "Sign in to your ATS flow recruiter workspace." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.login(email, password);
      toast.success("Welcome back! Signed in successfully.");
      // Navigate to intended target URL or dashboard on successful login
      const destination = search.redirect || "/dashboard";
      if (destination.startsWith("http://") || destination.startsWith("https://")) {
        window.location.href = destination;
      } else {
        navigate({ to: destination });
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Sign in to your account"
      subheading="Welcome back. Enter your credentials to access your talent workspace."
      switchPrompt={{
        text: "Don't have an account?",
        linkText: "Sign Up",
        linkTo: "/register",
      }}
      termsText="By clicking sign in, you agree to our Terms of Service and Privacy Policy"
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in duration-200"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="login-email"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            disabled={isLoading}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="hello@johncoe.com"
            className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-3.5 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="login-password"
              className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isLoading}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 pl-3.5 pr-10 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              disabled={isLoading}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded border-neutral-300 dark:border-neutral-700 accent-neutral-950 dark:accent-white focus:ring-neutral-950/20"
            />
            Remember me on this device
          </label>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-medium text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
