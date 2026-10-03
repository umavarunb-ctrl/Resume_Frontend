import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Mail, RotateCcw } from "lucide-react";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { authService } from "@/lib/api/auth-service";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && authService.isAuthenticated()) {
      throw redirect({
        to: "/",
      });
    }
  },
  head: () => ({
    meta: [
      { title: "Forgot Password | ATS flow" },
      { name: "description", content: "Reset your ATS flow recruiter workspace password." },
      { property: "og:title", content: "Forgot Password | ATS flow" },
      { property: "og:description", content: "Reset your ATS flow recruiter workspace password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      // Simulate API call for forgot password
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setSuccess(true);
      toast.success("Password reset instructions sent to your email.");
    } catch {
      setError("Failed to send reset email. Please verify your address and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      toast.success(`Reset link resent to ${email}`);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout
      heading={success ? "Check your inbox" : "Reset your password"}
      subheading={
        success
          ? "We've dispatched recovery instructions to your registered email."
          : "Enter your email address and we'll send you a link to reset your account password."
      }
      switchPrompt={
        !success
          ? {
              text: "Remember your password?",
              linkText: "Sign In",
              linkTo: "/login",
            }
          : undefined
      }
      termsText="Need help recovering your account? Contact our enterprise support team."
    >
      {success ? (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20 p-5 text-center space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                Instructions Dispatched
              </h3>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-xs mx-auto">
                We sent a secure password reset link to{" "}
                <span className="font-semibold text-neutral-900 dark:text-neutral-200">
                  {email}
                </span>
                . The link will expire in 60 minutes.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => navigate({ to: "/login" })}
              className="w-full h-11 rounded-xl bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-medium text-sm transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Return to Sign In</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="w-full h-10 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-background hover:bg-neutral-50 dark:hover:bg-neutral-900 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} className={isResending ? "animate-spin" : ""} />
              <span>{isResending ? "Resending link..." : "Resend reset email"}</span>
            </button>
          </div>
        </div>
      ) : (
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

          {/* Email field */}
          <div className="space-y-1.5">
            <label
              htmlFor="forgot-email"
              className="block text-xs font-medium text-neutral-800 dark:text-neutral-200"
            >
              Registered email address
            </label>
            <div className="relative">
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="hello@johncoe.com"
                className="flex h-11 w-full rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 pl-3.5 pr-10 text-sm text-foreground transition-all duration-150 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 focus:border-neutral-400 focus:bg-background dark:focus:bg-neutral-900 focus:ring-2 focus:ring-neutral-950/10 dark:focus:ring-neutral-100/10 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Mail
                size={16}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
              />
            </div>
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
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
