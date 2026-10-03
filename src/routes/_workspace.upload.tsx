import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileUp,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCw,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { uploadService } from "@/lib/api/upload-service";
import { candidateQueryKeys } from "@/lib/api/candidate-service";
import { toast } from "sonner";

export const Route = createFileRoute("/_workspace/upload")({
  head: () => ({
    meta: [
      { title: "Upload Resumes | Archivum" },
      { name: "description", content: "Upload PDF resumes to parse and add candidate profiles." },
      { property: "og:title", content: "Upload Resumes | Archivum" },
      { property: "og:description", content: "Upload PDF resumes to parse and add candidate profiles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: UploadPage,
});

type UploadStatus = "idle" | "uploading" | "success" | "error";

interface SelectedFile {
  id: string;
  file: File;
  status: UploadStatus;
  errorMessage?: string | undefined;
  candidateId?: string | undefined;
  candidateName?: string | undefined;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [fileError, setFileError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const queryClient = useQueryClient();

  const addFiles = (incoming: FileList | File[]) => {
    const all = Array.from(incoming);
    const accepted = all.filter(
      (file) =>
        file.type === "application/pdf" ||
        (file.type === "" && file.name.toLowerCase().endsWith(".pdf")),
    );

    setFileError(
      accepted.length === all.length
        ? ""
        : "Some files were skipped. Please upload digitally generated PDF resumes.",
    );

    setFiles((current) => {
      const next = accepted.filter(
        (file) =>
          !current.some(
            (item) =>
              item.file.name === file.name &&
              item.file.size === file.size &&
              item.file.lastModified === file.lastModified,
          ),
      );

      return [
        ...current,
        ...next.map((file, index) => ({
          id: `${file.name}-${file.lastModified}-${current.length + index}`,
          file,
          status: "idle" as UploadStatus,
          errorMessage: undefined,
          candidateId: undefined,
          candidateName: undefined,
        })),
      ];
    });
  };

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.currentTarget.files) addFiles(event.currentTarget.files);
    event.currentTarget.value = "";
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const uploadSingleFile = async (item: SelectedFile) => {
    setFiles((current) =>
      current.map((f) =>
        f.id === item.id ? { ...f, status: "uploading", errorMessage: undefined } : f,
      ),
    );

    try {
      const response = await uploadService.uploadResume(item.file);
      const candidateId =
        response["candidate_id"] || response["id"] || response["candidate"]?.id || undefined;
      const candidateName =
        response["candidate"]?.name || response["name"] || response["filename"] || item.file.name;

      setFiles((current) =>
        current.map((f) =>
          f.id === item.id
            ? {
              ...f,
              status: "success",
              candidateId: candidateId ? String(candidateId) : undefined,
              candidateName: candidateName ? String(candidateName) : undefined,
              errorMessage: undefined,
            }
            : f,
        ),
      );

      // Invalidate candidates cache so the updated candidate list is immediately visible
      queryClient.invalidateQueries({ queryKey: candidateQueryKeys.all });
      toast.success(`"${item.file.name}" parsed & uploaded successfully!`);
      return true;
    } catch (err: any) {
      const message = err?.message || "Failed to upload and parse resume.";
      setFiles((current) =>
        current.map((f) =>
          f.id === item.id ? { ...f, status: "error", errorMessage: message } : f,
        ),
      );
      toast.error(`Error uploading "${item.file.name}": ${message}`);
      return false;
    }
  };

  const handleUploadAll = async () => {
    const pending = files.filter((f) => f.status === "idle" || f.status === "error");
    if (pending.length === 0) return;

    setIsUploadingAll(true);
    setFiles((current) =>
      current.map((f) =>
        pending.some((p) => p.id === f.id)
          ? { ...f, status: "uploading", errorMessage: undefined }
          : f
      )
    );

    try {
      const response = await uploadService.uploadMultipleResumes(pending.map(p => p.file));

      setFiles((current) =>
        current.map((f) => {
          const pendingItem = pending.find(p => p.id === f.id);
          if (!pendingItem) return f;

          const index = pending.indexOf(pendingItem);
          const res = response[index];

          if (res) {
            const candidateId = res["id"] || res["candidate_id"] || res["candidate"]?.id;
            const candidateName = res["candidate"]?.name || res["full_name"] || res["name"];

            return {
              ...f,
              status: "success",
              candidateId: candidateId ? String(candidateId) : undefined,
              candidateName: candidateName ? String(candidateName) : undefined,
            };
          }
          return f;
        })
      );
      toast.success(`${pending.length} resumes parsed & uploaded successfully!`);
      queryClient.invalidateQueries({ queryKey: candidateQueryKeys.all });
    } catch (err: any) {
      const message = err?.message || "Failed to upload resumes in batch.";
      setFiles((current) =>
        current.map((f) =>
          pending.some((p) => p.id === f.id)
            ? { ...f, status: "error", errorMessage: message }
            : f
        )
      );
      toast.error(`Batch upload failed: ${message}`);
    } finally {
      setIsUploadingAll(false);
    }
  };

  const pendingCount = files.filter((f) => f.status === "idle" || f.status === "error").length;
  const successCount = files.filter((f) => f.status === "success").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-accent">Resume intake</p>
          <h1 className="mt-1 text-2xl font-semibold">Upload Resumes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload PDF resumes to extract skills, experience, and parse candidate records to your ledger.
          </p>
        </div>
        {successCount > 0 && (
          <Link
            to="/candidates"
            className="inline-flex items-center gap-1.5 self-start text-xs font-medium text-accent hover:underline sm:self-center"
          >
            <span>View candidates database</span>
            <ArrowRight size={13} />
          </Link>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        onChange={onChange}
        className="sr-only"
        aria-label="Choose PDF resumes"
      />

      {/* Drag & Drop Zone */}
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
        }}
        onDrop={onDrop}
        className={`group relative grid min-h-64 place-items-center rounded-lg border-2 border-dashed px-5 py-10 text-center transition-all ${dragging
            ? "border-accent bg-accent/10 shadow-inner"
            : "border-border/80 bg-surface/40 hover:border-accent/50 hover:bg-surface/60"
          }`}
      >
        <div className="max-w-md">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-secondary text-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <FileUp size={22} aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold">Upload PDF Resumes</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Drag &amp; drop candidate PDFs here, or click to browse files from your computer.
          </p>
          <Button
            type="button"
            className="mt-4 cursor-pointer gap-2"
            onClick={() => inputRef.current?.click()}
          >
            <FileUp size={15} />
            <span>Choose PDF files</span>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            PDF files only · Up to 20MB per file
          </p>
        </div>
      </div>

      {fileError && (
        <p
          role="alert"
          className="rounded-md border-l-2 border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {fileError}
        </p>
      )}

      {/* Selected Files List */}
      {files.length > 0 && (
        <section aria-labelledby="selected-files-title" className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 id="selected-files-title" className="text-sm font-semibold">
                Selected Files ({files.length})
              </h2>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                {pendingCount > 0 && <span>{pendingCount} ready</span>}
                {successCount > 0 && (
                  <span className="text-emerald-500 font-medium">
                    {successCount} uploaded
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-destructive font-medium">
                    {errorCount} failed
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiles([])}
                disabled={isUploadingAll}
              >
                Clear all
              </Button>
              {pendingCount > 0 && (
                <Button
                  size="sm"
                  onClick={handleUploadAll}
                  disabled={isUploadingAll}
                  className="gap-1.5"
                >
                  {isUploadingAll ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>Upload All ({pendingCount})</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <ul className="divide-y divide-border">
            {files.map((item) => {
              const { id, file, status, errorMessage, candidateId } = item;
              const isUploading = status === "uploading";

              return (
                <li key={id} className="flex min-w-0 flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-foreground">
                      <FileText size={16} aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{file.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatSize(file.size)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    {/* Status badges */}
                    {status === "idle" && (
                      <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                        Ready
                      </span>
                    )}
                    {status === "uploading" && (
                      <span className="inline-flex items-center gap-1.5 rounded bg-accent/10 px-2 py-0.5 font-mono text-[11px] text-accent">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Parsing &amp; uploading...</span>
                      </span>
                    )}
                    {status === "success" && (
                      <div className="inline-flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-500">
                          <CheckCircle2 size={12} />
                          <span>Uploaded</span>
                        </span>
                        {candidateId && (
                          <Link
                            to="/candidates/$id"
                            params={{ id: candidateId }}
                            className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-0.5"
                          >
                            <span>View</span>
                            <ArrowRight size={11} />
                          </Link>
                        )}
                      </div>
                    )}
                    {status === "error" && (
                      <div className="flex items-center gap-1.5 text-xs text-destructive">
                        <AlertCircle size={13} />
                        <span className="max-w-[180px] truncate" title={errorMessage}>
                          {errorMessage || "Failed"}
                        </span>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      {status === "idle" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs"
                          disabled={isUploadingAll}
                          onClick={() => uploadSingleFile(item)}
                        >
                          Upload
                        </Button>
                      )}
                      {status === "error" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1 text-xs text-destructive hover:text-destructive"
                          disabled={isUploadingAll}
                          onClick={() => uploadSingleFile(item)}
                        >
                          <RotateCw size={12} />
                          <span>Retry</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        aria-label={`Remove ${file.name}`}
                        disabled={isUploading}
                        onClick={() => setFiles((current) => current.filter((f) => f.id !== id))}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
