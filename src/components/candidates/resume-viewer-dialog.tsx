import { useEffect, useState } from "react";
import { X, ExternalLink, Download, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { candidateService } from "@/lib/api/candidate-service";
import type { Candidate } from "@/types/candidate";

interface ResumeViewerDialogProps {
  candidate: Candidate;
  onClose: () => void;
}

export function ResumeViewerDialog({ candidate, onClose }: ResumeViewerDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchUrl = async () => {
      try {
        // Try to fetch via uploadId first if available, otherwise candidate ID
        let fetchedUrl: string | undefined;
        if (candidate.uploadId) {
          fetchedUrl = await candidateService.getResumeUrl(candidate.uploadId, true);
        }
        
        // Fallback to old behavior
        if (!fetchedUrl) {
          fetchedUrl = await candidateService.getResumeUrl(candidate.id, false);
        }

        // Also check if candidate object has a direct resumeUrl
        if (!fetchedUrl && candidate.resumeUrl) {
          fetchedUrl = candidate.resumeUrl;
        }

        if (isMounted) {
          if (fetchedUrl) {
            setUrl(fetchedUrl);
          } else {
            setError("No resume document found for this candidate.");
          }
          setLoading(false);
        }
      } catch (e) {
        if (isMounted) {
          setError("Failed to load resume. Please try again later.");
          setLoading(false);
        }
      }
    };

    fetchUrl();

    return () => {
      isMounted = false;
    };
  }, [candidate.id, candidate.uploadId, candidate.resumeUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-dialog-title"
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl flex-col h-[85vh] overflow-hidden rounded-xl border border-border bg-background shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-surface/50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded bg-primary/10 text-primary">
              <FileText size={18} />
            </div>
            <div>
              <h2 id="resume-dialog-title" className="text-sm font-semibold">
                {candidate.name}
              </h2>
              <p className="text-xs text-muted-foreground">Resume Document</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {url && (
              <>
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                  <a href={url} download={`${candidate.name.replace(/\s+/g, "_")}_Resume.pdf`}>
                    <Download size={14} className="mr-2" />
                    Download
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                  <a href={url} target="_blank" rel="noreferrer">
                    <ExternalLink size={14} className="mr-2" />
                    Open in new tab
                  </a>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close resume dialog"
              onClick={onClose}
              className="ml-2 hover:bg-accent/10"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden bg-muted/30 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 size={32} className="animate-spin text-primary mb-4" />
              <p className="text-sm font-medium text-muted-foreground">Fetching secure document URL...</p>
            </div>
          )}

          {!loading && error && (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <div className="grid size-16 place-items-center rounded-full bg-accent/10 text-accent mb-4">
                <FileText size={24} />
              </div>
              <p className="text-base font-semibold">{error}</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                The resume might not have been uploaded yet, or the temporary link has expired.
              </p>
            </div>
          )}

          {!loading && url && (
            <iframe
              src={`${url}#toolbar=0`}
              title={`${candidate.name}'s Resume`}
              className="h-full w-full border-0"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </div>
  );
}
