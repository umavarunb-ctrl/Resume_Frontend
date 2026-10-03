import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Download,
  FileText,
  MapPin,
  Mail,
  Phone,
  BriefcaseBusiness,
  GraduationCap,
  MessageSquare,
  ExternalLink,
  UserX,
  Sparkles,
  FolderOpen,
  Calendar,
  Trophy,
  Award,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { candidateQueryKeys, candidateService } from "@/lib/api/candidate-service";
import { formatUploaded, SkillList } from "@/components/candidates/candidate-parts";
import { ResumeViewerDialog } from "@/components/candidates/resume-viewer-dialog";
import { useChat } from "@/hooks/useChat";
import config from "@/lib/config";

export const Route = createFileRoute("/_workspace/candidates/$id")({
  loader: async ({ context, params }) => {
    return context.queryClient.ensureQueryData({
      queryKey: candidateQueryKeys.detail(params.id),
      queryFn: () => candidateService.getCandidate(params.id),
    });
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Candidate Profile"} | Archivum` },
      {
        name: "description",
        content: `Candidate profile and resume details for ${loaderData?.name ?? "a candidate"}.`,
      },
      { property: "og:title", content: `${loaderData?.name ?? "Candidate"} | Archivum` },
      {
        property: "og:description",
        content: `Profile and experience details for ${loaderData?.name ?? "a candidate"}.`,
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CandidateProfilePage,
});

function CandidateProfilePage() {
  const { id } = Route.useParams();
  const { data: candidate, isLoading } = useQuery({
    queryKey: candidateQueryKeys.detail(id),
    queryFn: () => candidateService.getCandidate(id),
  });
  const [showResume, setShowResume] = useState(false);
  const { createOrGetCandidateDiscussion } = useChat();
  const navigate = useNavigate();

  const handleDiscussInternally = async () => {
    if (!candidate) return;
    const conv = await createOrGetCandidateDiscussion(candidate.id, candidate.name);
    navigate({ to: "/chat", search: { c: conv.id } });
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Loading candidate profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-secondary">
          <UserX size={24} className="text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Candidate Not Found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No profile found for ID <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">{id}</code>.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild variant="default">
            <Link to="/candidates">View All Candidates</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">Find Candidates</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top action bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/candidates">
            <ArrowLeft size={15} className="mr-1" /> Back to candidates
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2 justify-end">
          <Button
            onClick={handleDiscussInternally}
            variant="secondary"
            className="bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary border border-primary/20 shadow-sm"
          >
            <MessageSquare size={15} className="mr-1.5" /> Discuss Internally
          </Button>
          <Button onClick={() => setShowResume(true)} variant="outline">
            <FileText size={15} className="mr-1.5" /> View original PDF
          </Button>
          <Button onClick={() => setShowResume(true)}>
            <Download size={15} className="mr-1.5" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Main Resume Card */}
      <div className="mx-auto w-full max-w-[850px] overflow-hidden rounded-xl bg-card text-card-foreground shadow-md ring-1 ring-border sm:p-12 p-6 md:p-14">
        {/* Resume Header */}
        <header className="mb-8 text-center border-b border-border pb-8">
          <h1 className="text-3xl font-serif font-bold tracking-tight md:text-4xl text-foreground">
            {candidate.name}
          </h1>
          <p className="mt-2 text-lg font-medium text-muted-foreground">
            {candidate.currentRole}
            {candidate.experienceYears > 0 && (
              <>
                <span className="mx-1.5 opacity-50">•</span>
                {candidate.experienceYears}+ Years Experience
              </>
            )}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Mail size={14} /> {candidate.email}
              </a>
            )}
            {candidate.phone && (
              <a
                href={`tel:${candidate.phone}`}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <Phone size={14} /> {candidate.phone}
              </a>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {candidate.location}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex size-1.5 rounded-full bg-emerald-500" />
              Available: {candidate.availability}
            </span>
          </div>
        </header>

        {/* Resume Content */}
        <div className="space-y-8">
          {/* Summary */}
          {candidate.summary && (
            <section>
              <h2 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                Professional Summary
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{candidate.summary}</p>
            </section>
          )}

          {/* Key Achievements & Honors (Top-level) */}
          {candidate.achievements && candidate.achievements.length > 0 && (
            <section>
              <h2 className="mb-4 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1 flex items-center gap-2">
                <Trophy size={14} className="text-amber-500" />
                Key Achievements & Honors
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {candidate.achievements.map((achievement, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-lg border border-border/70 bg-surface/50 shadow-2xs"
                  >
                    <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5">
                      <Trophy size={14} />
                    </div>
                    <p className="text-xs leading-relaxed font-medium text-foreground">{achievement}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-8 md:grid-cols-[1fr_260px]">
            <div className="space-y-8">
              {/* Experience */}
              {candidate.experience && candidate.experience.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1 flex items-center gap-2">
                    <BriefcaseBusiness size={14} />
                    Experience
                  </h2>
                  <div className="space-y-6">
                    {candidate.experience.map((item, index) => (
                      <div key={`${item.company}-${item.title}-${index}`} className="group/exp">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                          <div>
                            <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.company && (
                                <p className="font-medium text-muted-foreground text-sm flex items-center gap-1">
                                  <Building2 size={13} className="text-muted-foreground/70" />
                                  {item.company}
                                </p>
                              )}
                              {item.location && (
                                <span className="text-xs text-muted-foreground/80 flex items-center gap-1">
                                  • <MapPin size={11} /> {item.location}
                                </span>
                              )}
                            </div>
                          </div>
                          {item.period && (
                            <div className="mt-1 sm:mt-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary/80 border border-border/70 text-xs font-medium text-foreground whitespace-nowrap shrink-0">
                              <Calendar size={12} className="text-primary" />
                              <span>{item.period}</span>
                            </div>
                          )}
                        </div>

                        {/* Responsibilities & Highlights */}
                        {item.highlights && item.highlights.length > 0 && (
                          <ul className="mt-3 list-disc space-y-1.5 pl-4 text-sm text-muted-foreground marker:text-muted-foreground/50">
                            {item.highlights.map((highlight, idx) => (
                              <li key={idx} className="leading-relaxed pl-1">
                                {highlight}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Experience Key Achievements */}
                        {item.achievements && item.achievements.length > 0 && (
                          <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/5 dark:bg-amber-500/10 p-3">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1.5">
                              <Trophy size={13} className="text-amber-500 shrink-0" />
                              <span>Key Achievements & Impact</span>
                            </div>
                            <ul className="space-y-1 pl-1 text-xs text-foreground/90">
                              {item.achievements.map((ach, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 font-bold mt-0.5">•</span>
                                  <span>{ach}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Projects */}
              {candidate.projects && candidate.projects.length > 0 && (
                <section>
                  <h2 className="mb-4 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                    Projects
                  </h2>
                  <div className="space-y-5">
                    {candidate.projects.map((project, index) => (
                      <div key={`${project.name}-${index}`}>
                        <h3 className="text-base font-semibold">{project.name}</h3>
                        {project.description && (
                          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            {project.description}
                          </p>
                        )}
                        {project.stack && project.stack.length > 0 && (
                          <div className="mt-2.5">
                            <SkillList skills={project.stack} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              {/* Skills */}
              {candidate.skills && candidate.skills.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                    Skills
                  </h2>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.skills.map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="rounded-md font-medium px-2 py-0.5"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </section>
              )}

              {/* Education */}
              {candidate.education && candidate.education.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                    Education
                  </h2>
                  <div className="space-y-4">
                    {candidate.education.map((education, idx) => (
                      <div key={idx}>
                        <h3 className="text-sm font-semibold">{education.degree}</h3>
                        {education.school && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{education.school}</p>
                        )}
                        {education.period && (
                          <p className="mt-0.5 text-xs font-medium text-muted-foreground/80">
                            {education.period}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications */}
              {candidate.certifications && candidate.certifications.length > 0 && (
                <section>
                  <h2 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                    Certifications
                  </h2>
                  <ul className="space-y-3">
                    {candidate.certifications.map((cert, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <BriefcaseBusiness size={14} className="mt-0.5 shrink-0 text-accent" />
                        <div>
                          <span className="font-semibold text-foreground">{cert.name}</span>
                          {(cert.provider || cert.date) && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {cert.provider} {cert.provider && cert.date ? "•" : ""} {cert.date}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Additional Details */}
              <section>
                <h2 className="mb-3 text-xs font-mono font-semibold uppercase tracking-wider text-accent border-b border-border pb-1">
                  Metadata
                </h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Archived: {formatUploaded(candidate.uploadedAt)}</p>
                  <p className="truncate">
                    ID: <span className="font-mono">{candidate.id}</span>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      {/* PDF Viewer Dialog */}
      {showResume && (
        <ResumeViewerDialog candidate={candidate} onClose={() => setShowResume(false)} />
      )}
    </div>
  );
}
