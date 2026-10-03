import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
  heading: string;
  subheading?: string | undefined;
  switchPrompt?:
  | {
    text: string;
    linkText: string;
    linkTo: string;
  }
  | undefined;
  termsText?: string | undefined;
}

export function AuthLayout({
  children,
  heading,
  subheading,
  switchPrompt,
  termsText = "By clicking continue, you agree to our Terms of Service and Privacy Policy",
}: AuthLayoutProps) {
  // Curated high quality avatars for the testimonial stack
  const avatars = [
    {
      src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      alt: "Sarah - VP of Talent",
    },
    {
      src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
      alt: "Alex - Tech Recruiter",
    },
    {
      src: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
      alt: "Elena - Head of People",
    },
    {
      src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
      alt: "Marcus - Recruiting Lead",
    },
    {
      src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
      alt: "Priya - Talent Partner",
    },
    {
      src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80",
      alt: "David - Senior Recruiter",
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:grid lg:grid-cols-2">
      {/* Left Column: Form Area */}
      <div className="flex min-h-screen flex-col justify-between p-6 sm:p-10 lg:p-14 xl:p-16">
        {/* Brand Header */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0">
          <Link
            to="/"
            className="group inline-flex items-center gap-3 transition-all hover:opacity-90"
            aria-label="ATS Flow Home"
          >
            <img
              src="/logo.png"
              alt="ATS Flow Logo"
              className="size-11 sm:size-12 rounded-xl object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
            />
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-neutral-950 dark:text-white font-sans">
              ATS Flow
            </span>
          </Link>
        </div>

        {/* Main Content Form */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 my-auto py-8">
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-neutral-950 dark:text-neutral-50">
              {heading}
            </h1>
            {subheading && (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {subheading}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}

          {/* Switch link */}
          {switchPrompt && (
            <p className="mt-5 text-center text-sm text-neutral-600 dark:text-neutral-400">
              {switchPrompt.text}{" "}
              <Link
                to={switchPrompt.linkTo}
                className="font-semibold text-neutral-950 dark:text-white hover:underline transition-colors"
              >
                {switchPrompt.linkText}
              </Link>
            </p>
          )}

          {/* Legal / Terms */}
          {termsText && (
            <p className="mt-6 text-center text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
              {termsText}
            </p>
          )}
        </div>

        {/* Footer info (Desktop & Mobile) */}
        <div className="w-full max-w-[420px] mx-auto lg:mx-0 pt-4 text-xs text-neutral-400 dark:text-neutral-600 flex items-center justify-between">
          <span>© {new Date().getFullYear()} ATS Flow Inc.</span>
          <span className="inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ATS Flow v2.4
          </span>
        </div>
      </div>

      {/* Right Column: Aceternity-inspired Showcase Panel */}
      <div className="hidden lg:flex relative flex-col items-center justify-center p-12 border-l border-dashed border-neutral-200 dark:border-neutral-800 bg-neutral-50/40 dark:bg-neutral-900/30 overflow-hidden">
        {/* Subtle dot matrix grid background */}
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.18] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Ambient subtle glow gradient */}
        <div className="absolute -top-32 -right-32 size-96 rounded-full bg-neutral-200/40 dark:bg-neutral-800/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-neutral-300/30 dark:bg-neutral-800/30 blur-3xl pointer-events-none" />

        {/* Main Center Card / Testimonial Box */}
        <div className="relative z-10 max-w-md text-center flex flex-col items-center space-y-5">
          {/* Overlapping Avatar Stack */}
          <div className="flex items-center justify-center -space-x-2.5">
            {avatars.map((avatar, idx) => (
              <img
                key={idx}
                src={avatar.src}
                alt={avatar.alt}
                className="size-11 rounded-full object-cover ring-2 ring-background shadow-sm transition-transform hover:scale-110 hover:z-20 cursor-pointer duration-200"
              />
            ))}
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              People love us
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal max-w-sm">
              ATS Flow is loved by thousands of people across the world, be part
              of the community and join us.
            </p>
          </div>

          {/* Feature Highlights Pills */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full text-left">
            <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-background/80 backdrop-blur-sm p-3 shadow-xs">
              <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                <Zap className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Fast candidate indexing
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Instant AI resume parsing
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 bg-background/80 backdrop-blur-sm p-3 shadow-xs">
              <div className="flex size-7 items-center justify-center rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100">
                <ShieldCheck className="size-3.5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">
                  Enterprise Security
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  Strict JWT & role protection
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
