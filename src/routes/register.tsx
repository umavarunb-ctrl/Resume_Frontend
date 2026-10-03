import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Check, Loader2, AlertCircle, Eye, EyeOff } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/lib/api/auth-service";
import { toast } from "sonner";

export const Route = createFileRoute("/register")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && authService.isAuthenticated()) {
      throw redirect({
        to: "/",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Sign Up | ATS flow" },
      { name: "description", content: "Create your ATS flow recruiter workspace account." },
      { property: "og:title", content: "Sign Up | ATS flow" },
      { property: "og:description", content: "Create your ATS flow recruiter workspace account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validPassword = password.length >= 8;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validPassword) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await authService.register(name, company, email, password);
      toast.success("Account created successfully! Welcome to ATS flow.");
      // Navigate to workspace dashboard upon successful registration
      navigate({ to: "/" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during registration. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      heading="Sign up for an account"
      subheading="Get started with ATS flow to manage candidate resumes and AI search."
      switchPrompt={{
        text: "Already have an account?",
        linkText: "Sign In",
        linkTo: "/login",
      }}
      termsText="By clicking on sign up, you agree to our Terms of Service and Privacy Policy"
    >
      <form onSubmit={submit} className="space-y-3.5">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3.5 text-xs text-destructive animate-in fade-in duration-200"
          >
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span className="leading-relaxed font-medium">{error}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-name"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Full name
          </label>
          <input
            id="register-name"
            type="text"
            autoComplete="name"
            required
            disabled={isLoading}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Manu Arora"
            className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-3.5 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Company Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-company"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Company name
          </label>
          <input
            id="register-company"
            type="text"
            autoComplete="organization"
            required
            disabled={isLoading}
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            placeholder="Acme Corp"
            className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-3.5 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-email"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Email address
          </label>
          <input
            id="register-email"
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

        {/* Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-password"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              minLength={8}
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

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label
            htmlFor="register-confirm"
            className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
          >
            Confirm password
          </label>
          <div className="relative">
            <input
              id="register-confirm"
              type={showConfirmation ? "text" : "password"}
              autoComplete="new-password"
              required
              disabled={isLoading}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              placeholder="••••••••"
              className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 pl-3.5 pr-10 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              onClick={() => setShowConfirmation(!showConfirmation)}
              disabled={isLoading}
              aria-label={showConfirmation ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors p-1"
            >
              {showConfirmation ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Password Requirement Hint */}
        <div className="flex items-center gap-1.5 text-xs">
          <span
            className={`flex size-4 items-center justify-center rounded-full transition-colors ${
              validPassword
                ? "bg-emerald-500 text-white dark:bg-emerald-600"
                : "bg-neutral-200 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500"
            }`}
          >
            <Check size={11} strokeWidth={3} />
          </span>
          <span
            className={`transition-colors ${
              validPassword
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-neutral-500 dark:text-neutral-400"
            }`}
          >
            At least 8 characters
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-medium text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Sign Up</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
